import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.sub}>Sent to {phone ?? '+234...'}</Text>
      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor={Brand.textSecondary}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />
      <Pressable style={styles.btn} onPress={() => router.push('/(auth)/nin')}>
        <Text style={styles.btnText}>Verify</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.textPrimary },
  sub: { marginTop: 8, color: Brand.textSecondary },
  input: {
    marginTop: 32,
    fontSize: 32,
    letterSpacing: 12,
    textAlign: 'center',
    color: Brand.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Brand.primary,
    paddingVertical: 12,
  },
  btn: {
    marginTop: 32,
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
