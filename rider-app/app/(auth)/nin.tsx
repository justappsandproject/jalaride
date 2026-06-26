import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function NinScreen() {
  const [nin, setNin] = useState('');
  const [preview, setPreview] = useState<{ name: string; dob: string } | null>(null);

  async function verify() {
    if (!/^\d{11}$/.test(nin)) {
      Alert.alert('Invalid NIN', 'NIN must be 11 digits');
      return;
    }
    setPreview({ name: 'ADEYEMI JAMES OKONKWO', dob: '1990-05-15' });
  }

  function confirm() {
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your NIN</Text>
      <Text style={styles.sub}>Enter your 11-digit National Identification Number</Text>
      <TextInput
        style={styles.input}
        placeholder="12345678901"
        placeholderTextColor={Brand.textSecondary}
        keyboardType="number-pad"
        maxLength={11}
        value={nin}
        onChangeText={setNin}
      />
      {!preview ? (
        <Pressable style={styles.btn} onPress={verify}>
          <Text style={styles.btnText}>Verify via NIMC</Text>
        </Pressable>
      ) : (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Confirm your identity</Text>
          <Text style={styles.previewName}>{preview.name}</Text>
          <Text style={styles.previewDob}>DOB: {preview.dob}</Text>
          <Pressable style={styles.btn} onPress={confirm}>
            <Text style={styles.btnText}>Confirm & Continue</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', color: Brand.textPrimary },
  sub: { marginTop: 8, color: Brand.textSecondary, lineHeight: 22 },
  input: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: Brand.primary,
    borderRadius: 12,
    padding: 16,
    color: Brand.textPrimary,
    fontSize: 20,
    letterSpacing: 2,
  },
  btn: {
    marginTop: 24,
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  preview: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.accent,
  },
  previewTitle: { color: Brand.textSecondary, fontSize: 12 },
  previewName: { marginTop: 8, fontSize: 18, fontWeight: '700', color: Brand.textPrimary },
  previewDob: { marginTop: 4, color: Brand.textSecondary },
});
