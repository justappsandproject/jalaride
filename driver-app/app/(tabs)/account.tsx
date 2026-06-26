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

import { persistDriverToken } from '@/lib/authStorage';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setToken } from '@/store/authSlice';
import {
  jalaRideApi,
  useAddVehicleMutation,
  useLoginMutation,
  useRegisterMutation,
} from '@/store/jalaRideApi';

export default function DriverAccountScreen() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const [phone, setPhone] = useState('+15550002');
  const [password, setPassword] = useState('password1');
  const [name, setName] = useState('Demo Driver');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Prius');
  const [plate, setPlate] = useState('TRV-001');
  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const [addVehicle, { isLoading: addingV }] = useAddVehicleMutation();

  async function onRegister() {
    try {
      const res = await register({ phone, password, name }).unwrap();
      dispatch(setToken(res.token));
      await persistDriverToken(res.token);
      await addVehicle({ make, model, plate }).unwrap();
      Alert.alert('Driver created', 'Ask an admin to approve your profile before taking jobs.');
    } catch (e) {
      Alert.alert('Register failed', e instanceof Error ? e.message : 'Error');
    }
  }

  async function onLogin() {
    try {
      const res = await login({ phone, password }).unwrap();
      dispatch(setToken(res.token));
      await persistDriverToken(res.token);
      dispatch(jalaRideApi.util.invalidateTags(['Jobs', 'Driver']));
      Alert.alert('Welcome', `${res.user.name} — status: ${res.user.driverStatus ?? 'n/a'}`);
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Error');
    }
  }

  async function onLogout() {
    dispatch(setToken(null));
    await persistDriverToken(null);
  }

  async function onAddVehicle() {
    try {
      await addVehicle({ make, model, plate }).unwrap();
      Alert.alert('Vehicle saved');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Driver account</Text>
      {token ? (
        <View>
          <Text style={styles.ok}>Signed in</Text>
          <Text style={[styles.label, { marginTop: 16 }]}>Vehicle</Text>
          <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Make" />
          <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Model" />
          <TextInput style={styles.input} value={plate} onChangeText={setPlate} placeholder="Plate" />
          <Pressable style={styles.secondary} onPress={onAddVehicle} disabled={addingV}>
            <Text style={styles.secondaryText}>{addingV ? '…' : 'Save vehicle'}</Text>
          </Pressable>
          <Pressable style={[styles.outline, { marginTop: 16 }]} onPress={onLogout}>
            <Text style={styles.outlineText}>Log out</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          <Text style={[styles.label, { marginTop: 12 }]}>Display name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Pressable style={styles.primary} onPress={onRegister} disabled={registering}>
            <Text style={styles.primaryText}>{registering ? '…' : 'Register driver + vehicle'}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onLogin} disabled={loggingIn}>
            <Text style={styles.secondaryText}>{loggingIn ? '…' : 'Log in'}</Text>
          </Pressable>
        </View>
      )}
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
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600' },
  secondary: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#2563eb', fontWeight: '600' },
  ok: { color: '#2563eb', fontWeight: '600' },
  outline: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#94a3b8',
  },
  outlineText: { color: '#334155', fontWeight: '600' },
});
