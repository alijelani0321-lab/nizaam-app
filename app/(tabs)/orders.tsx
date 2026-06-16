import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { sbSelect, getBusinessId, rupees } from '@/lib/supabaseRest';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', subtle: '#64748b', primary: '#49dfbd', warn: '#fbbf24', error: '#ef4444' };

interface Order { id: number; receipt_number: string; total: number; paid: number; status: string; order_source: string; payment_method: string; customer_snapshot: any; created_at: string; sale_type: string; }

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const bid = await getBusinessId();
    setOrders(await sbSelect<Order>(`orders?business_id=eq.${bid}&order=created_at.desc&limit=100`));
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { void load(); }, []);

  const totalToday = orders.filter(o => o.created_at.startsWith(new Date().toISOString().slice(0,10))).reduce((s,o) => s + Number(o.total), 0);

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.h1}>🧾 Orders</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/create-order')}><Text style={s.addBtnText}>+ New</Text></TouchableOpacity>
      </View>
      <View style={s.todayCard}>
        <Text style={s.todayLabel}>Aaj ki total sale</Text>
        <Text style={s.todayValue}>{rupees(totalToday)}</Text>
      </View>
      {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={C.primary} />} contentContainerStyle={{ paddingBottom: 40 }}>
          {orders.map(o => {
            const due = Number(o.total) - Number(o.paid);
            const cust = o.customer_snapshot || {};
            return (
              <View key={o.id} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rcpt}>{o.receipt_number} · {o.sale_type?.toUpperCase()}</Text>
                  <Text style={s.name}>{cust.name || 'Customer'}</Text>
                  <Text style={s.meta}>{o.order_source} · {o.payment_method} · {new Date(o.created_at).toLocaleDateString('en-PK')}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.total}>{rupees(o.total)}</Text>
                  {due > 0 && <Text style={s.due}>baqaya {rupees(due)}</Text>}
                  <Text style={[s.status, o.status === 'completed' && { color: C.primary }]}>{o.status}</Text>
                </View>
              </View>
            );
          })}
          {orders.length === 0 && <Text style={s.empty}>Koi order nahi — upar "+ New" se banayein</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16, paddingTop: 56 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  h1: { fontSize: 22, fontWeight: '800', color: C.text },
  addBtn: { backgroundColor: C.primary, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: C.bg, fontWeight: '800', fontSize: 13 },
  todayCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.primary + '44' },
  todayLabel: { color: C.muted, fontSize: 12 },
  todayValue: { color: C.primary, fontSize: 26, fontWeight: '800', marginTop: 2 },
  row: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8 },
  rcpt: { color: C.subtle, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  name: { color: C.text, fontWeight: '700', fontSize: 14, marginTop: 2 },
  meta: { color: C.subtle, fontSize: 11, marginTop: 2 },
  total: { color: C.text, fontWeight: '800', fontSize: 14 },
  due: { color: C.warn, fontSize: 11, fontWeight: '700' },
  status: { color: C.muted, fontSize: 10, marginTop: 2 },
  empty: { color: C.subtle, textAlign: 'center', padding: 30 },
});