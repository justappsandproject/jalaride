import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');

  function onContinue() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      Alert.alert('Invalid number', 'Enter a valid Nigerian phone number');
      return;
    }
    router.push({ pathname: '/(auth)/otp', params: { phone: `+234${digits.slice(-10)}` } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your phone</Text>
      <Text style={styles.sub}>We&apos;ll send a 6-digit OTP to verify your number</Text>
      <View style={styles.row}>
        <Text style={styles.prefix}>+234</Text>
        <TextInput
          style={styles.input}
          placeholder="801 234 5678"
          placeholderTextColor={Brand.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
      <Pressable style={styles.btn} onPress={onContinue}>
        <Text style={styles.btnText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.textPrimary },
  sub: { marginTop: 8, color: Brand.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 8 },
  prefix: { color: Brand.accent, fontWeight: '700', fontSize: 18 },
  input: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: Brand.primary,
    color: Brand.textPrimary,
    fontSize: 18,
    paddingVertical: 8,
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
