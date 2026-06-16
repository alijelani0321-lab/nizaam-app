import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { sbSelect, sbInsert, sbUpdate, getBusinessId, rupees } from '@/lib/supabaseRest';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', subtle: '#64748b', primary: '#49dfbd', warn: '#fbbf24', error: '#ef4444' };

interface Item { id: number; name: string; sku: string; category: string; stock: number; unit: string; unit_cost: number; unit_price: number; wholesale_price: number; low_stock_alert: number; }

export default function InventoryScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(''); const [sku, setSku] = useState('');
  const [category, setCategory] = useState(''); const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('piece'); const [cost, setCost] = useState('');
  const [price, setPrice] = useState(''); const [wsPrice, setWsPrice] = useState('');

  const load = async () => {
    const bid = await getBusinessId();
    setItems(await sbSelect<Item>(`inventory_items?business_id=eq.${bid}&order=name`));
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter(i => i.stock <= i.low_stock_alert).length;

  const addItem = async () => {
    if (!name.trim() || !price.trim()) { Alert.alert('Zaroori', 'Naam aur price likhein'); return; }
    setSaving(true);
    const bid = await getBusinessId();
    await sbInsert('inventory_items', { business_id: bid, name: name.trim(), sku: sku.trim() || null, category: category.trim() || null, stock: Number(stock) || 0, unit: unit, unit_cost: Number(cost) || 0, unit_price: Number(price), wholesale_price: Number(wsPrice) || null });
    setSaving(false); setShowAdd(false);
    setName(''); setSku(''); setCategory(''); setStock('0'); setCost(''); setPrice(''); setWsPrice('');
    void load();
  };

  return (
    <View style={s.container}>
      <Text style={s.h1}>📦 Inventory / Stock</Text>
      {lowStock > 0 && <Text style={s.warn}>⚠ {lowStock} items ka stock kam hai!</Text>}
      <TextInput style={s.input} placeholder="🔍 Search..." placeholderTextColor={C.subtle} value={search} onChangeText={setSearch} />
      {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {filtered.map(item => (
            <View key={item.id} style={[s.row, item.stock <= item.low_stock_alert && s.rowLow]}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.meta}>{[item.sku, item.category].filter(Boolean).join(' · ')}</Text>
                <Text style={s.meta}>Cost: {rupees(item.unit_cost)} · Price: {rupees(item.unit_price)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.stock, item.stock <= item.low_stock_alert && { color: C.error }]}>{item.stock} {item.unit}</Text>
              </View>
            </View>
          ))}
          {filtered.length === 0 && <Text style={s.empty}>Koi item nahi — "+ Add" se shuru karein</Text>}
        </ScrollView>
      )}
      <TouchableOpacity style={s.fab} onPress={() => setShowAdd(true)}><Text style={s.fabText}>+ Add Item</Text></TouchableOpacity>
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={s.overlay}><ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}><View style={s.modal}>
          <Text style={s.h2}>Naya Item</Text>
          <TextInput style={s.input} placeholder="Item naam *" placeholderTextColor={C.subtle} value={name} onChangeText={setName} />
          <TextInput style={s.input} placeholder="SKU (optional)" placeholderTextColor={C.subtle} value={sku} onChangeText={setSku} />
          <TextInput style={s.input} placeholder="Category" placeholderTextColor={C.subtle} value={category} onChangeText={setCategory} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Stock" placeholderTextColor={C.subtle} keyboardType="numeric" value={stock} onChangeText={setStock} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Unit (piece/kg)" placeholderTextColor={C.subtle} value={unit} onChangeText={setUnit} />
          </View>
          <TextInput style={s.input} placeholder="Cost price (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={cost} onChangeText={setCost} />
          <TextInput style={s.input} placeholder="Selling price (Rs) *" placeholderTextColor={C.subtle} keyboardType="numeric" value={price} onChangeText={setPrice} />
          <TextInput style={s.input} placeholder="Wholesale price (Rs)" placeholderTextColor={C.subtle} keyboardType="numeric" value={wsPrice} onChangeText={setWsPrice} />
          <TouchableOpacity style={s.saveBtn} disabled={saving} onPress={addItem}>
            {saving ? <ActivityIndicator color={C.bg} /> : <Text style={s.saveBtnText}>✓ Save Item</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={() => setShowAdd(false)}><Text style={{ color: C.muted }}>Cancel</Text></TouchableOpacity>
        </View></ScrollView></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16, paddingTop: 56 },
  h1: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 10 },
  warn: { color: C.warn, fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, marginBottom: 8 },
  row: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  rowLow: { borderColor: C.error + '66' },
  name: { color: C.text, fontWeight: '700', fontSize: 14 },
  meta: { color: C.subtle, fontSize: 11, marginTop: 2 },
  stock: { color: C.primary, fontWeight: '800', fontSize: 15 },
  empty: { color: C.subtle, textAlign: 'center', padding: 30 },
  fab: { backgroundColor: C.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  fabText: { color: C.bg, fontWeight: '800', fontSize: 15 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 24 },
  modal: { backgroundColor: C.bg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  saveBtn: { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: C.bg, fontWeight: '800' },
});