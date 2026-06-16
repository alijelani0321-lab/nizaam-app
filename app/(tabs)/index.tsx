import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#e2e8f0', muted: '#94a3b8', primary: '#49dfbd', warn: '#fbbf24', error: '#ef4444' };

export default function HomeScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.header}>
        <Text style={s.title}>🏪 Nizaam</Text>
        <Text style={s.sub}>Pakistan ka Business Manager</Text>
      </View>

      <TouchableOpacity style={s.mainBtn} onPress={() => router.push('/create-order')}>
        <Text style={s.mainBtnEmoji}>➕</Text>
        <Text style={s.mainBtnText}>NAYA ORDER</Text>
        <Text style={s.mainBtnSub}>Retail · Wholesale · COD</Text>
      </TouchableOpacity>

      <View style={s.grid}>
        {[
          { emoji: '📒', label: 'Udhaar', sub: 'Baqaya wasool', route: '/udhaar' },
          { emoji: '🏭', label: 'Vendors', sub: 'Purchase karo', route: '/vendors' },
          { emoji: '👷', label: 'Karigar', sub: 'Hazri + pay', route: '/karigar' },
          { emoji: '↩️', label: 'Returns', sub: 'RTO track', route: '/returns' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={s.card} onPress={() => router.push(item.route as any)}>
            <Text style={s.cardEmoji}>{item.emoji}</Text>
            <Text style={s.cardLabel}>{item.label}</Text>
            <Text style={s.cardSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.dbCard}>
        <Text style={s.dbTitle}>✅ Database Live</Text>
        <Text style={s.dbSub}>Supabase · Mumbai · 20 tables</Text>
        <Text style={s.dbSub}>Orders · Inventory · Udhaar · Vendors · Karigars · Returns</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 16, paddingTop: 56 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: C.primary },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  mainBtn: { backgroundColor: C.primary, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  mainBtnEmoji: { fontSize: 36, marginBottom: 4 },
  mainBtnText: { fontSize: 22, fontWeight: '800', color: C.bg },
  mainBtnSub: { fontSize: 12, color: C.bg, opacity: 0.7, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 18, width: '47%', borderWidth: 1, borderColor: C.border },
  cardEmoji: { fontSize: 28, marginBottom: 6 },
  cardLabel: { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  dbCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.primary + '44' },
  dbTitle: { color: C.primary, fontWeight: '700', fontSize: 14 },
  dbSub: { color: C.muted, fontSize: 11, marginTop: 3 },
});