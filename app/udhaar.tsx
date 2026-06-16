import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Modal, Linking, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { sbSelect, sbInsert, sbUpdate, getBusinessId, rupees } from '@/lib/supabaseRest';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', subtle: '#64748b', primary: '#49dfbd', warn: '#fbbf24', error: '#ef4444' };
interface Cust { id: number; name: string; phone: string | null; current_udhaar: number; city: string | null; }

export default function UdhaarScreen() {
  const [list, setList] = useState<Cust[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Cust | null>(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'receive' | 'add'>('receive');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const bid = await getBusinessId();
    const rows = await sbSelect<Cust>(`customers?business_id=eq.${bid}&current_udhaar=gt.0&order=current_udhaar.desc&select=id,name,phone,current_udhaar,city`);
    setList(rows); setLoading(false); setRefreshing(false);
  };
  useEffect(() => { void load(); }, []);
  const total = list.reduce((s, c) => s + Number(c.current_udhaar || 0), 0);

  const whatsappReminder = (c: Cust) => {
    if (!c.phone) { Alert.alert('Phone nahi', c.name + ' ka number nahi hai'); return; }
    const num = c.phone.replace(/[^0-9]/g, '').replace(/^0/, '92');
    const msg = `Assalam o Alaikum ${c.name} sahab!\n\nAap ka baqaya ${rupees(c.current_udhaar)} hai. Jald adaigi farmayein.\n\nShukriya 🙏`;
    Linking.openURL(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
  };

  const submit = async () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) { Alert.alert('Amount', 'Sahi amount likhein'); return; }
    setSaving(true);
    const bid = await getBusinessId();
    const isReceive = mode === 'receive';
    const newBalance = isReceive ? Math.max(0, Number(selected.current_udhaar) - amt) : Number(selected.current_udhaar) + amt;
    await sbInsert('udhaar_entries', { business_id: bid, customer_id: selected.id, type: isReceive ? 'payment_received' : 'sale_credit', amount: amt });
    await sbUpdate('customers', `id=eq.${selected.id}`, { current_udhaar: newBalance });
    setSaving(false); setSelected(null); setAmount(''); void load();
  };

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>←</Text></TouchableOpacity>
        <Text style={s.h1}>Udhaar</Text>
      </View>
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>Total Udhaar Bahar</Text>
        <Text style={s.totalValue}>{rupees(total)}</Text>
        <Text style={s.totalSub}>{list.length} customers</Text>
      </View>
      {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={C.primary} />} contentContainerStyle={{ paddingBottom: 40 }}>
          {list.map(c => (
            <View key={c.id} style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{c.name}</Text>
                <Text style={s.meta}>{[c.phone, c.city].filter(Boolean).join(' · ') || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.amount}>{rupees(c.current_udhaar)}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity style={s.miniBtn} onPress={() => { setSelected(c); setMode('receive'); }}><Text style={s.miniBtnText}>💵 Wasool</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.miniBtn, { borderColor: '#25D366' }]} onPress={() => whatsappReminder(c)}><Text style={[s.miniBtnText, { color: '#25D366' }]}>💬 Reminder</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          {list.length === 0 && <Text style={s.empty}>Koi udhaar nahi — sab clear! 🎉</Text>}
        </ScrollView>
      )}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.h2}>{selected?.name}</Text>
          <Text style={s.meta}>Baqaya: {rupees(selected?.current_udhaar || 0)}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
            <TouchableOpacity style={[s.modeBtn, mode === 'receive' && s.modeActive]} onPress={() => setMode('receive')}><Text style={[s.modeText, mode === 'receive' && { color: C.bg }]}>💵 Wasool</Text></TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, mode === 'add' && s.modeActive]} onPress={() => setMode('add')}><Text style={[s.modeText, mode === 'add' && { color: C.bg }]}>➕ Aur Udhaar</Text></TouchableOpacity>
          </View>
          <TextInput style={s.input} placeholder="Amount (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={submit}>
            {saving ? <ActivityIndicator color={C.bg} /> : <Text style={s.saveBtnText}>✓ Save</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={() => setSelected(null)}><Text style={{ color: C.muted }}>Cancel</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg,padding:16,paddingTop:56},
  headerRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14},
  back:{color:C.muted,fontSize:22}, h1:{fontSize:22,fontWeight:'800',color:C.text},
  h2:{fontSize:18,fontWeight:'700',color:C.text},
  totalCard:{backgroundColor:C.card,borderRadius:14,padding:16,marginBottom:14,borderWidth:1,borderColor:C.warn+'44'},
  totalLabel:{color:C.muted,fontSize:12}, totalValue:{color:C.warn,fontSize:26,fontWeight:'800',marginTop:2},
  totalSub:{color:C.subtle,fontSize:11,marginTop:2},
  row:{flexDirection:'row',backgroundColor:C.card,borderRadius:12,padding:14,marginBottom:8,alignItems:'center'},
  name:{color:C.text,fontWeight:'700',fontSize:14}, meta:{color:C.subtle,fontSize:11,marginTop:2},
  amount:{color:C.warn,fontWeight:'800',fontSize:15},
  miniBtn:{borderWidth:1,borderColor:C.primary,borderRadius:7,paddingHorizontal:8,paddingVertical:4},
  miniBtnText:{color:C.primary,fontSize:10,fontWeight:'700'},
  empty:{color:C.subtle,textAlign:'center',padding:30},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:24},
  modal:{backgroundColor:C.bg,borderRadius:16,padding:20,borderWidth:1,borderColor:C.border},
  modeBtn:{flex:1,borderWidth:1,borderColor:C.border,borderRadius:10,paddingVertical:10,alignItems:'center'},
  modeActive:{backgroundColor:C.primary,borderColor:C.primary},
  modeText:{color:C.muted,fontSize:12,fontWeight:'700'},
  input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:10,padding:12,color:C.text,marginBottom:10},
  saveBtn:{backgroundColor:C.primary,borderRadius:10,paddingVertical:14,alignItems:'center'},
  saveBtnText:{color:C.bg,fontWeight:'800'},
});