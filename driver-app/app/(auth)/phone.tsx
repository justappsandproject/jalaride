import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function DriverPhoneScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Registration</Text>
      <Text style={styles.sub}>Phone + OTP + NIN + documents required</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/(auth)/pending' as never)}>
        <Text style={styles.btnText}>Continue to Document Upload</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.textPrimary },
  sub: { marginTop: 8, color: Brand.textSecondary },
  btn: { marginTop: 32, backgroundColor: Brand.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
