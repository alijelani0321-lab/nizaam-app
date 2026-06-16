import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f172a' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-order" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="udhaar" options={{ headerShown: false }} />
        <Stack.Screen name="vendors" options={{ headerShown: false }} />
        <Stack.Screen name="karigar" options={{ headerShown: false }} />
        <Stack.Screen name="returns" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
