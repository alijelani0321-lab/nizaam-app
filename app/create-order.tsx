import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sbInsert, sbSelect, sbUpdate, getBusinessId, rupees } from '@/lib/supabaseRest';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', subtle: '#64748b', primary: '#49dfbd', warn: '#f59e0b', error: '#ef4444' };

type SaleType = 'retail' | 'wholesale';
type PaymentMethod = 'cash' | 'cod' | 'easypaisa' | 'jazzcash' | 'bank' | 'udhaar' | 'mixed';
type OrderSource = 'walk_in' | 'whatsapp' | 'facebook' | 'instagram' | 'tiktok' | 'daraz' | 'website' | 'phone';

interface OrderItem { name: string; qty: number; unitPrice: number; unitCost?: number; fromInventory?: boolean; sku?: string; }
interface InvItem { id: number; name: string; sku: string; stock: number; unit: string; unit_price: number; unit_cost: number; wholesale_price?: number; }

const PAYMENTS: {key: PaymentMethod; label: string}[] = [
  {key:'cash',label:'💵 Cash'},{key:'cod',label:'📦 COD'},{key:'easypaisa',label:'📱 Easypaisa'},
  {key:'jazzcash',label:'📱 JazzCash'},{key:'bank',label:'🏦 Bank'},{key:'udhaar',label:'📒 Udhaar'},{key:'mixed',label:'🔀 Mixed'},
];
const SOURCES: {key: OrderSource; label: string}[] = [
  {key:'walk_in',label:'🚶 Walk-in'},{key:'whatsapp',label:'💬 WhatsApp'},{key:'facebook',label:'📘 Facebook'},
  {key:'instagram',label:'📸 Instagram'},{key:'tiktok',label:'🎵 TikTok'},{key:'daraz',label:'🛒 Daraz'},
  {key:'website',label:'🌐 Website'},{key:'phone',label:'📞 Phone'},
];

export default function CreateOrderScreen() {
  const [saleType, setSaleType] = useState<SaleType | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [orderSource, setOrderSource] = useState<OrderSource>('walk_in');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [showInvPicker, setShowInvPicker] = useState(false);
  const [invSearch, setInvSearch] = useState('');
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [dName, setDName] = useState(''); const [dQty, setDQty] = useState('1'); const [dPrice, setDPrice] = useState('');
  const [discount, setDiscount] = useState(''); const [delivery, setDelivery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState(''); const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false); const [savedReceipt, setSavedReceipt] = useState('');

  useEffect(() => {
    getBusinessId().then(bid => sbSelect<InvItem>(`inventory_items?business_id=eq.${bid}&order=name`).then(setInventory));
  }, []);

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.qty * it.unitPrice, 0), [items]);
  const total = useMemo(() => subtotal - (Number(discount)||0) + (Number(delivery)||0), [subtotal, discount, delivery]);

  const filteredInv = useMemo(() => {
    const q = invSearch.toLowerCase();
    return q ? inventory.filter(i => i.name.toLowerCase().includes(q) || (i.sku||'').toLowerCase().includes(q)) : inventory;
  }, [inventory, invSearch]);

  const addFromInv = (inv: InvItem) => {
    const price = saleType === 'wholesale' && inv.wholesale_price ? inv.wholesale_price : inv.unit_price;
    const idx = items.findIndex(it => it.sku === inv.sku && it.fromInventory);
    if (idx >= 0) { const n = [...items]; n[idx] = {...n[idx], qty: n[idx].qty+1}; setItems(n); }
    else setItems([...items, {name: inv.name, sku: inv.sku, qty: 1, unitPrice: price, unitCost: inv.unit_cost, fromInventory: true}]);
  };

  const addDirect = () => {
    if (!dName.trim() || !dPrice.trim()) { Alert.alert('Adhura','Naam aur price likhein'); return; }
    setItems([...items, {name: dName.trim(), qty: Number(dQty)||1, unitPrice: Number(dPrice)||0, fromInventory: false}]);
    setDName(''); setDQty('1'); setDPrice(''); setShowDirectForm(false);
  };

  const onSave = async () => {
    if (!saleType) return;
    if (!customerName.trim()) { Alert.alert('Customer','Naam zaroori hai'); return; }
    if (items.length === 0) { Alert.alert('Items','Kam se kam 1 item add karein'); return; }
    setSaving(true);
    try {
      const bid = await getBusinessId();
      const raw = await AsyncStorage.getItem('nizaam.receiptCounter');
      const counter = raw ? Number(raw)+1 : 1;
      await AsyncStorage.setItem('nizaam.receiptCounter', String(counter));
      const receiptNumber = `${saleType==='wholesale'?'WHL':'INV'}-${String(counter).padStart(4,'0')}`;
      const paid = paymentMethod==='cod'||paymentMethod==='udhaar' ? Number(paidAmount)||0 : Number(paidAmount)||total;
      const due = Math.max(0, total - paid);

      await sbInsert('orders', {
        business_id: bid, receipt_number: receiptNumber, order_source: orderSource,
        items_snapshot: items, customer_snapshot: {name: customerName, phone: customerPhone, address: customerAddress, city: customerCity},
        subtotal, discount: Number(discount)||0, delivery_charges: Number(delivery)||0,
        total, paid, payment_method: paymentMethod,
        status: paymentMethod==='cod' ? 'confirmed' : 'completed', sale_type: saleType,
        delivery_address: customerAddress, delivery_city: customerCity, notes: notes||null,
      });

      // Auto-minus inventory
      for (const it of items.filter(i => i.fromInventory)) {
        const inv = inventory.find(i => i.sku === it.sku);
        if (inv) await sbUpdate('inventory_items', `id=eq.${inv.id}`, {stock: Math.max(0, inv.stock - it.qty)});
      }

      // Udhaar entry
      if (due > 0) {
        // find or create customer
        const custs = await sbSelect(`customers?business_id=eq.${bid}&phone=eq.${customerPhone}&limit=1`);
        let custId = custs[0]?.id;
        if (!custId && customerPhone) {
          const newCust = await sbInsert('customers', {business_id: bid, name: customerName, phone: customerPhone, current_udhaar: due});
          custId = newCust?.id;
        } else if (custId) {
          await sbUpdate('customers', `id=eq.${custId}`, {current_udhaar: (Number(custs[0].current_udhaar)||0)+due});
        }
        if (custId) await sbInsert('udhaar_entries', {business_id: bid, customer_id: custId, type: 'sale_credit', amount: due});
      }

      setSavedReceipt(receiptNumber);
    } catch(e: any) { Alert.alert('Error', e?.message||'Save nahi hua'); }
    finally { setSaving(false); }
  };

  if (!saleType) return (
    <View style={s.container}>
      <Text style={s.h1}>Naya Order</Text>
      <TouchableOpacity style={s.bigBtn} onPress={() => setSaleType('retail')}>
        <Text style={s.bigEmoji}>🛒</Text><Text style={s.bigTitle}>Retail</Text>
        <Text style={s.bigSub}>Walk-in · COD · E-commerce · 1 piece</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.bigBtn} onPress={() => setSaleType('wholesale')}>
        <Text style={s.bigEmoji}>📦</Text><Text style={s.bigTitle}>Wholesale</Text>
        <Text style={s.bigSub}>Bulk · 54+ pieces · Vendor</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}><Text style={s.cancelText}>← Wapas</Text></TouchableOpacity>
    </View>
  );

  if (savedReceipt) return (
    <View style={[s.container, {justifyContent: 'center', alignItems: 'center'}]}>
      <Text style={{fontSize: 60, marginBottom: 16}}>✅</Text>
      <Text style={[s.h1, {textAlign:'center'}]}>Order Save Ho Gaya!</Text>
      <Text style={[s.sub, {textAlign:'center', marginBottom: 24}]}>{savedReceipt} · Total {rupees(total)}</Text>
      <TouchableOpacity style={s.saveBtn} onPress={() => { setSaleType(null); setSavedReceipt(''); setItems([]); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setCustomerCity(''); setDiscount(''); setDelivery(''); setPaidAmount(''); setNotes(''); }}>
        <Text style={s.saveBtnText}>+ New Order</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}><Text style={s.cancelText}>← Home</Text></TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{paddingBottom: 80}}>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => setSaleType(null)}><Text style={s.cancelText}>←</Text></TouchableOpacity>
        <Text style={s.h2}>{saleType==='retail'?'🛒 Retail':'📦 Wholesale'} Order</Text>
      </View>

      <Text style={s.sectionLabel}>Order Source</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
        {SOURCES.map(src => (
          <TouchableOpacity key={src.key} style={[s.chip, orderSource===src.key && s.chipActive]} onPress={() => setOrderSource(src.key)}>
            <Text style={[s.chipText, orderSource===src.key && s.chipTextActive]}>{src.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.sectionLabel}>Customer Detail</Text>
      <TextInput style={s.input} placeholder="Customer Naam *" placeholderTextColor={C.subtle} value={customerName} onChangeText={setCustomerName} />
      <TextInput style={s.input} placeholder="Phone" placeholderTextColor={C.subtle} keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />
      <TextInput style={s.input} placeholder="Address" placeholderTextColor={C.subtle} value={customerAddress} onChangeText={setCustomerAddress} />
      <TextInput style={s.input} placeholder="City" placeholderTextColor={C.subtle} value={customerCity} onChangeText={setCustomerCity} />

      <Text style={s.sectionLabel}>Items</Text>
      <View style={{flexDirection:'row', gap:10, marginBottom:10}}>
        <TouchableOpacity style={s.itemAddBtn} onPress={() => setShowInvPicker(true)}><Text style={s.itemAddBtnText}>📦 Stock Se</Text></TouchableOpacity>
        <TouchableOpacity style={s.itemAddBtn} onPress={() => setShowDirectForm(true)}><Text style={s.itemAddBtnText}>✏️ Direct</Text></TouchableOpacity>
      </View>
      {items.map((it, idx) => (
        <View key={idx} style={s.itemRow}>
          <View style={{flex:1}}>
            <Text style={s.itemName}>{it.name}</Text>
            <Text style={s.itemMeta}>{it.fromInventory?'📦 Inventory':'✏️ Direct'} · Rs {it.unitPrice}/pc</Text>
          </View>
          <View style={s.qtyRow}>
            <TouchableOpacity style={s.qtyBtn} onPress={() => { const n=[...items]; n[idx]={...n[idx],qty:Math.max(1,n[idx].qty-1)}; setItems(n); }}><Text style={s.qtyBtnText}>−</Text></TouchableOpacity>
            <Text style={s.qtyText}>{it.qty}</Text>
            <TouchableOpacity style={s.qtyBtn} onPress={() => { const n=[...items]; n[idx]={...n[idx],qty:n[idx].qty+1}; setItems(n); }}><Text style={s.qtyBtnText}>+</Text></TouchableOpacity>
          </View>
          <View style={{alignItems:'flex-end', minWidth:70}}>
            <Text style={s.itemTotal}>Rs {(it.qty*it.unitPrice).toLocaleString('en-PK')}</Text>
            <TouchableOpacity onPress={() => setItems(items.filter((_,i)=>i!==idx))}><Text style={{color:C.error,fontSize:10}}>Hatao</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {items.length===0 && <Text style={s.empty}>Koi item nahi</Text>}

      <Text style={s.sectionLabel}>Payment</Text>
      <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalValue}>Rs {subtotal.toLocaleString('en-PK')}</Text></View>
      <TextInput style={s.input} placeholder="Discount (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={discount} onChangeText={setDiscount} />
      <TextInput style={s.input} placeholder="Delivery charges (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={delivery} onChangeText={setDelivery} />
      <View style={[s.totalRow, {borderColor:C.primary}]}><Text style={[s.totalLabel,{color:C.primary,fontWeight:'800'}]}>TOTAL</Text><Text style={[s.totalValue,{color:C.primary,fontSize:22}]}>Rs {total.toLocaleString('en-PK')}</Text></View>
      <View style={s.payGrid}>
        {PAYMENTS.map(p => (
          <TouchableOpacity key={p.key} style={[s.payChip, paymentMethod===p.key && s.chipActive]} onPress={() => setPaymentMethod(p.key)}>
            <Text style={[s.chipText, paymentMethod===p.key && s.chipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {(paymentMethod==='udhaar'||paymentMethod==='mixed') && (
        <TextInput style={s.input} placeholder="Cash Abhi Mila (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={paidAmount} onChangeText={setPaidAmount} />
      )}
      <TextInput style={[s.input,{height:60}]} placeholder="Notes (optional)" placeholderTextColor={C.subtle} multiline value={notes} onChangeText={setNotes} />
      <TouchableOpacity style={[s.saveBtn, saving&&{opacity:0.6}]} disabled={saving} onPress={onSave}>
        {saving ? <ActivityIndicator color={C.bg} /> : <Text style={s.saveBtnText}>✓ SAVE ORDER</Text>}
      </TouchableOpacity>

      <Modal visible={showInvPicker} animationType="slide" onRequestClose={() => setShowInvPicker(false)}>
        <View style={s.container}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => setShowInvPicker(false)}><Text style={s.cancelText}>✕ Band</Text></TouchableOpacity>
            <Text style={s.h2}>Stock Se Select</Text>
          </View>
          <TextInput style={s.input} placeholder="🔍 Search" placeholderTextColor={C.subtle} value={invSearch} onChangeText={setInvSearch} />
          <ScrollView>
            {filteredInv.map(inv => {
              const added = items.find(it => it.sku===inv.sku && it.fromInventory);
              return (
                <TouchableOpacity key={inv.id} style={s.itemRow} onPress={() => addFromInv(inv)}>
                  <View style={{flex:1}}>
                    <Text style={s.itemName}>{inv.name}</Text>
                    <Text style={s.itemMeta}>Stock: {inv.stock} {inv.unit} · Rs {inv.unit_price}</Text>
                  </View>
                  <Text style={[s.itemAddBtnText, added&&{color:C.primary}]}>{added?`✓ ${added.qty}`:'+ Add'}</Text>
                </TouchableOpacity>
              );
            })}
            {filteredInv.length===0 && <Text style={s.empty}>Koi item nahi</Text>}
          </ScrollView>
          <TouchableOpacity style={s.saveBtn} onPress={() => setShowInvPicker(false)}><Text style={s.saveBtnText}>Ho Gaya ({items.length})</Text></TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showDirectForm} transparent animationType="slide" onRequestClose={() => setShowDirectForm(false)}>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.h2}>✏️ Direct Item</Text>
          <TextInput style={s.input} placeholder="Item naam *" placeholderTextColor={C.subtle} value={dName} onChangeText={setDName} />
          <View style={{flexDirection:'row',gap:8}}>
            <TextInput style={[s.input,{flex:1}]} placeholder="Qty" placeholderTextColor={C.subtle} keyboardType="numeric" value={dQty} onChangeText={setDQty} />
            <TextInput style={[s.input,{flex:2}]} placeholder="Price (Rs) *" placeholderTextColor={C.subtle} keyboardType="numeric" value={dPrice} onChangeText={setDPrice} />
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={addDirect}><Text style={s.saveBtnText}>+ Add</Text></TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setShowDirectForm(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg,padding:16,paddingTop:56},
  h1:{fontSize:26,fontWeight:'800',color:C.primary,marginBottom:8},
  h2:{fontSize:19,fontWeight:'700',color:C.text,flex:1},
  sub:{fontSize:13,color:C.muted,marginBottom:16},
  headerRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:16},
  sectionLabel:{fontSize:11,fontWeight:'700',letterSpacing:1.2,textTransform:'uppercase',color:C.subtle,marginTop:16,marginBottom:8},
  input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,paddingHorizontal:14,paddingVertical:12,color:C.text,fontSize:14,marginBottom:8},
  chip:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:999,paddingHorizontal:12,paddingVertical:8,marginRight:8},
  chipActive:{backgroundColor:C.primary,borderColor:C.primary},
  chipText:{color:C.muted,fontSize:12,fontWeight:'600'},
  chipTextActive:{color:C.bg},
  payGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},
  payChip:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,paddingHorizontal:12,paddingVertical:10},
  itemAddBtn:{flex:1,backgroundColor:C.card,borderWidth:1,borderColor:C.primary,borderRadius:10,paddingVertical:13,alignItems:'center'},
  itemAddBtnText:{color:C.primary,fontWeight:'700',fontSize:13},
  itemRow:{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:10,padding:12,marginBottom:8,gap:8},
  itemName:{color:C.text,fontWeight:'700',fontSize:14},
  itemMeta:{color:C.subtle,fontSize:11,marginTop:2},
  itemTotal:{color:C.text,fontWeight:'700',fontSize:13},
  qtyRow:{flexDirection:'row',alignItems:'center',gap:6},
  qtyBtn:{width:30,height:30,borderRadius:8,backgroundColor:C.border,justifyContent:'center',alignItems:'center'},
  qtyBtnText:{color:C.text,fontSize:17,fontWeight:'700'},
  qtyText:{color:C.text,fontWeight:'700',minWidth:28,textAlign:'center'},
  totalRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,padding:14,marginBottom:8},
  totalLabel:{color:C.muted,fontSize:14},
  totalValue:{color:C.text,fontSize:17,fontWeight:'800'},
  saveBtn:{backgroundColor:C.primary,borderRadius:12,paddingVertical:16,alignItems:'center',marginTop:16},
  saveBtnText:{color:C.bg,fontWeight:'800',fontSize:15},
  cancelBtn:{paddingVertical:14,alignItems:'center'},
  cancelText:{color:C.muted,fontSize:14},
  empty:{color:C.subtle,textAlign:'center',padding:16,fontSize:13},
  bigBtn:{backgroundColor:C.card,borderRadius:16,padding:24,marginBottom:14,borderWidth:1,borderColor:C.border,alignItems:'center'},
  bigEmoji:{fontSize:44,marginBottom:8},
  bigTitle:{fontSize:22,fontWeight:'800',color:C.text},
  bigSub:{fontSize:12,color:C.muted,marginTop:4,textAlign:'center'},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:20},
  modal:{backgroundColor:C.bg,borderRadius:16,padding:20,borderWidth:1,borderColor:C.border},
});