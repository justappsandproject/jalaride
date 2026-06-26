import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function ConfirmBookingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm your ride</Text>
      <View style={styles.card}>
        <Text style={styles.route}>Wuse Market → Maitama</Text>
        <Text style={styles.meta}>Economy · ~4.2 km · 15 mins</Text>
        <Text style={styles.fare}>₦1,850</Text>
      </View>
      <Text style={styles.paymentLabel}>Payment method</Text>
      {['Card', 'Wallet', 'Cash'].map((m) => (
        <Pressable key={m} style={styles.paymentOption}>
          <Text style={styles.paymentText}>{m}</Text>
        </Pressable>
      ))}
      <Pressable style={styles.bookBtn} onPress={() => router.push('/booking/active' as never)}>
        <Text style={styles.bookBtnText}>Book Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: Brand.textPrimary },
  card: {
    marginTop: 20,
    padding: 20,
    backgroundColor: Brand.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.primary + '44',
  },
  route: { color: Brand.textPrimary, fontSize: 16, fontWeight: '600' },
  meta: { marginTop: 8, color: Brand.textSecondary },
  fare: { marginTop: 16, fontSize: 32, fontWeight: '800', color: Brand.accent },
  paymentLabel: { marginTop: 24, color: Brand.textSecondary, fontSize: 12, textTransform: 'uppercase' },
  paymentOption: {
    marginTop: 8,
    padding: 14,
    backgroundColor: Brand.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  paymentText: { color: Brand.textPrimary },
  bookBtn: {
    marginTop: 32,
    backgroundColor: Brand.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
