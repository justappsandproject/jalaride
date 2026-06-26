import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '@/store/hooks';
import { useCancelRideMutation, useMyRidesQuery } from '@/store/jalaRideApi';

type RideRow = {
  id: string;
  status: string;
  fareEstimate?: number | null;
  createdAt?: string;
};

export default function TripsScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const { data, refetch, isFetching } = useMyRidesQuery(undefined, { skip: !token });
  const [cancelRide] = useCancelRideMutation();

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Sign in on the Account tab to see your trips.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={(data as RideRow[] | undefined) ?? []}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={styles.muted}>No rides yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.status}>{item.status}</Text>
          <Text style={styles.meta}>Est. {item.fareEstimate != null ? `$${item.fareEstimate}` : '—'}</Text>
          {item.status === 'REQUESTED' || item.status === 'MATCHED' ? (
            <Text style={styles.link} onPress={() => cancelRide(item.id)}>
              Cancel
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', padding: 24 },
  muted: { color: '#64748b', textAlign: 'center' },
  row: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  status: { fontWeight: '600', fontSize: 16 },
  meta: { marginTop: 4, color: '#475569' },
  link: { marginTop: 8, color: '#dc2626', fontWeight: '600' },
});
