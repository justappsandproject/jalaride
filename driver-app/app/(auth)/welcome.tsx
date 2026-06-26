import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function DriverWelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>JR</Text>
      <Text style={styles.title}>Drive with Jala Ride</Text>
      <Text style={styles.sub}>Earn better with government-assigned vehicles</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/(auth)/phone' as never)}>
        <Text style={styles.btnText}>Get Started</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, justifyContent: 'center', padding: 24 },
  logo: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    lineHeight: 72,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    color: Brand.accent,
    backgroundColor: Brand.primary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  title: { marginTop: 24, fontSize: 26, fontWeight: '800', color: Brand.textPrimary, textAlign: 'center' },
  sub: { marginTop: 8, color: Brand.textSecondary, textAlign: 'center' },
  btn: { marginTop: 32, backgroundColor: Brand.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
