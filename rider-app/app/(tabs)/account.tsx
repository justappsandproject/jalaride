import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { persistRiderToken } from '@/lib/authStorage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setToken } from '@/store/authSlice';
import { jalaRideApi, useLoginMutation, useRegisterMutation } from '@/store/jalaRideApi';

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [phone, setPhone] = useState('+15550001');
  const [password, setPassword] = useState('password1');
  const [name, setName] = useState('Demo Rider');
  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();

  async function onRegister() {
    try {
      const res = await register({ phone, password, name }).unwrap();
      dispatch(setToken(res.token));
      await persistRiderToken(res.token);
      dispatch(jalaRideApi.util.invalidateTags(['Rides']));
      Alert.alert('Welcome', 'Account created.');
    } catch (e) {
      Alert.alert('Register failed', e instanceof Error ? e.message : 'Error');
    }
  }

  async function onLogin() {
    try {
      const res = await login({ phone, password }).unwrap();
      dispatch(setToken(res.token));
      await persistRiderToken(res.token);
      dispatch(jalaRideApi.util.invalidateTags(['Rides']));
      Alert.alert('Welcome back', res.user.name);
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Error');
    }
  }

  async function onLogout() {
    dispatch(setToken(null));
    await persistRiderToken(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account</Text>
      {token ? (
        <View>
          <Text style={styles.ok}>You are signed in.</Text>
          <Pressable style={styles.outline} onPress={onLogout}>
            <Text style={styles.outlineText}>Log out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} autoCapitalize="none" />
          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={[styles.label, { marginTop: 12 }]}>Display name (register)</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Pressable style={styles.primary} onPress={onRegister} disabled={registering}>
            <Text style={styles.primaryText}>{registering ? '…' : 'Create rider account'}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onLogin} disabled={loggingIn}>
            <Text style={styles.secondaryText}>{loggingIn ? '…' : 'Log in'}</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.hint}>
        On Android emulator use API base http://10.0.2.2:4000 via EXPO_PUBLIC_API_URL in .env
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 12, color: '#64748b' },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  primary: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600' },
  secondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#059669', fontWeight: '600' },
  ok: { color: '#059669', fontWeight: '600', marginBottom: 12 },
  outline: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  outlineText: { color: '#334155', fontWeight: '600' },
  hint: { marginTop: 24, fontSize: 12, color: '#94a3b8', lineHeight: 18 },
});
