import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { sbSelect, getBusinessId, rupees } from '@/lib/supabaseRest';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', subtle: '#64748b', primary: '#49dfbd', warn: '#fbbf24', error: '#ef4444' };

export default function ReportsScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const bid = await getBusinessId();
    setOrders(await sbSelect(`orders?business_id=eq.${bid}&order=created_at.desc`));
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const today = new Date().toISOString().slice(0,10);
  const thisMonth = new Date().toISOString().slice(0,7);
  const todayOrders = orders.filter(o => o.created_at.startsWith(today));
  const monthOrders = orders.filter(o => o.created_at.startsWith(thisMonth));
  const totalRev = orders.reduce((s,o) => s + Number(o.total), 0);
  const todayRev = todayOrders.reduce((s,o) => s + Number(o.total), 0);
  const monthRev = monthOrders.reduce((s,o) => s + Number(o.total), 0);
  const totalUdhaar = orders.reduce((s,o) => s + Math.max(0, Number(o.total) - Number(o.paid)), 0);
  const codOrders = orders.filter(o => o.payment_method === 'cod').length;
  const retailOrders = orders.filter(o => o.sale_type === 'retail').length;
  const wholesaleOrders = orders.filter(o => o.sale_type === 'wholesale').length;

  const StatCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <View style={s.statCard}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.h1}>📊 Reports</Text>
      {loading ? <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={s.sectionTitle}>REVENUE</Text>
          <View style={s.grid}>
            <StatCard label="Aaj" value={rupees(todayRev)} color={C.primary} />
            <StatCard label="Is Maheene" value={rupees(monthRev)} color={C.primary} />
            <StatCard label="Total" value={rupees(totalRev)} />
            <StatCard label="Udhaar Bahar" value={rupees(totalUdhaar)} color={C.warn} />
          </View>
          <Text style={s.sectionTitle}>ORDERS</Text>
          <View style={s.grid}>
            <StatCard label="Aaj ke Orders" value={String(todayOrders.length)} />
            <StatCard label="Is Maheene" value={String(monthOrders.length)} />
            <StatCard label="Retail" value={String(retailOrders)} />
            <StatCard label="Wholesale" value={String(wholesaleOrders)} />
            <StatCard label="COD" value={String(codOrders)} />
            <StatCard label="Total Orders" value={String(orders.length)} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16, paddingTop: 56 },
  h1: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#64748b', marginBottom: 8, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, width: '47%', borderWidth: 1, borderColor: '#334155' },
  statLabel: { color: '#94a3b8', fontSize: 11 },
  statValue: { color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 4 },
});