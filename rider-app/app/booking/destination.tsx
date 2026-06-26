import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function DestinationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you going?</Text>
      <Pressable style={styles.place} onPress={() => router.push('/booking/confirm' as never)}>
        <Text style={styles.placeIcon}>📍</Text>
        <Text style={styles.placeText}>Maitama, Abuja</Text>
      </Pressable>
      <Pressable style={styles.place} onPress={() => router.push('/booking/confirm' as never)}>
        <Text style={styles.placeIcon}>📍</Text>
        <Text style={styles.placeText}>Wuse Market</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: Brand.textPrimary },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: Brand.surface,
    borderRadius: 12,
  },
  placeIcon: { marginRight: 12, fontSize: 18 },
  placeText: { color: Brand.textPrimary, fontSize: 16 },
});
