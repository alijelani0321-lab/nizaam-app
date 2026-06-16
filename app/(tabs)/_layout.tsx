import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 9, color: focused ? '#49dfbd' : '#64748b', marginTop: 1 }}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155', height: 60 },
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }} />
      <Tabs.Screen name="inventory" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Stock" focused={focused} /> }} />
      <Tabs.Screen name="orders" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" label="Orders" focused={focused} /> }} />
      <Tabs.Screen name="reports" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Reports" focused={focused} /> }} />
    </Tabs>
  );
}