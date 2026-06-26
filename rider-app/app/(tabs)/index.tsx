import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Brand } from '@/constants/brand';

const CATEGORIES = [
  { id: 'economy', label: 'Economy', price: 'from ₦300' },
  { id: 'comfort', label: 'Comfort', price: 'from ₦500' },
  { id: 'xl', label: 'XL', price: 'from ₦700' },
  { id: 'moto', label: 'Moto', price: 'from ₦150' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Good day 👋</Text>
      <Text style={styles.headline}>Where to?</Text>

      <Pressable style={styles.searchBar} onPress={() => router.push('/booking/destination' as never)}>
        <Text style={styles.searchPlaceholder}>Search destination…</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Choose a ride</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((c) => (
          <Pressable key={c.id} style={styles.categoryCard}>
            <Text style={styles.categoryLabel}>{c.label}</Text>
            <Text style={styles.categoryPrice}>{c.price}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent destinations</Text>
      {['Wuse Market', 'Maitama', 'Garki'].map((place) => (
        <Pressable key={place} style={styles.recentRow}>
          <Text style={styles.recentIcon}>📍</Text>
          <Text style={styles.recentText}>{place}</Text>
        </Pressable>
      ))}

      <Link href="/booking/active" asChild>
        <Pressable style={styles.demoBanner}>
          <Text style={styles.demoText}>View Immersive Ride Card (demo)</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { color: Brand.textSecondary, fontSize: 14 },
  headline: { color: Brand.textPrimary, fontSize: 28, fontWeight: '800', marginTop: 4 },
  searchBar: {
    marginTop: 20,
    backgroundColor: Brand.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchPlaceholder: { color: Brand.textSecondary, fontSize: 16 },
  sectionTitle: { marginTop: 24, color: Brand.textPrimary, fontWeight: '700', fontSize: 16 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  categoryCard: {
    width: '47%',
    backgroundColor: Brand.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.primary + '44',
  },
  categoryLabel: { color: Brand.textPrimary, fontWeight: '700' },
  categoryPrice: { marginTop: 4, color: Brand.accent, fontSize: 12 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: Brand.surface,
    borderRadius: 10,
  },
  recentIcon: { marginRight: 10 },
  recentText: { color: Brand.textPrimary },
  demoBanner: {
    marginTop: 24,
    backgroundColor: Brand.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoText: { color: '#fff', fontWeight: '600' },
});
