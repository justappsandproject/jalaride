import { Stack } from 'expo-router';

export default function DriverAuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A1628' } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="pending" />
    </Stack>
  );
}
