import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '@/store/hooks';
import { useEarningsQuery } from '@/store/jalaRideApi';

export default function EarningsScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const { data, isLoading, error } = useEarningsQuery(undefined, { skip: !token });

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Sign in to view earnings.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Could not load earnings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Earnings</Text>
      <Text style={styles.sub}>12% platform fee target — demo numbers from completed trips.</Text>
      <View style={styles.grid}>
        <Tile label="Completed trips" value={String(data.totals.completed)} />
        <Tile label="Gross revenue" value={`$${data.totals.revenue.toFixed(2)}`} />
        <Tile label="Est. payout (88%)" value={`$${data.estimatedPayout.toFixed(2)}`} />
      </View>
    </View>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', padding: 24 },
  muted: { color: '#64748b', textAlign: 'center' },
  container: { flex: 1, padding: 20 },
  h1: { fontSize: 22, fontWeight: '700' },
  sub: { marginTop: 8, color: '#64748b', lineHeight: 20 },
  grid: { marginTop: 24, gap: 12 },
  tile: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  value: { marginTop: 6, fontSize: 22, fontWeight: '700' },
});
