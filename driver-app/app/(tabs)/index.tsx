import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TripRequestModal } from '@/components/TripRequestModal';
import { Brand } from '@/constants/brand';
import { useAppSelector } from '@/store/hooks';
import {
  useAcceptRideMutation,
  useAvailableRidesQuery,
  useGoOfflineMutation,
  useGoOnlineMutation,
} from '@/store/jalaRideApi';

type RideRow = { id: string; fareEstimate?: number | null; rider?: { name?: string } };

const DEMO_REQUEST = {
  id: 'demo-trip',
  riderName: 'Chioma A.',
  pickup: 'Wuse Market, Abuja',
  distance: '1.2 km',
  fare: 1850,
};

export default function DriverHomeScreen() {
  const token = useAppSelector((s) => s.auth.token);
  const [online, setOnline] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<typeof DEMO_REQUEST | null>(null);
  const { data, refetch, isFetching } = useAvailableRidesQuery(undefined, { skip: !token || !online });
  const [goOnline, { isLoading: goingOn }] = useGoOnlineMutation();
  const [goOffline, { isLoading: goingOff }] = useGoOfflineMutation();
  const [acceptRide, { isLoading: accepting }] = useAcceptRideMutation();

  const onRefresh = useCallback(() => void refetch(), [refetch]);

  function simulateRequest() {
    setPendingRequest(DEMO_REQUEST);
  }

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Complete registration to start driving.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Brand.backgroundDark }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.earningsLabel}>Earnings today</Text>
          <Text style={styles.earnings}>₦12,400</Text>
        </View>
        <View style={styles.vehicleBadge}>
          <Text style={styles.vehicleText}>JA-234-ABA</Text>
          <Text style={styles.vehicleSub}>Toyota Corolla</Text>
        </View>
      </View>

      <Pressable
        style={[styles.toggle, online ? styles.toggleOn : styles.toggleOff]}
        onPress={async () => {
          try {
            if (online) {
              await goOffline().unwrap();
              setOnline(false);
              setPendingRequest(null);
            } else {
              await goOnline().unwrap();
              setOnline(true);
              setTimeout(simulateRequest, 2000);
            }
          } catch (e) {
            Alert.alert('Error', String(e));
          }
        }}
        disabled={goingOn || goingOff}
      >
        {goingOn || goingOff ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.toggleText}>{online ? 'GO OFFLINE' : 'GO ONLINE'}</Text>
        )}
      </Pressable>

      {online && (
        <FlatList
          data={(data as RideRow[] | undefined) ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.muted}>Waiting for ride requests…</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Ride {item.id.slice(0, 6)}…</Text>
              <Text style={styles.meta}>Rider: {item.rider?.name ?? '—'}</Text>
              <Text style={styles.meta}>
                Est. fare: {item.fareEstimate != null ? `₦${item.fareEstimate}` : '—'}
              </Text>
              <Pressable
                style={styles.accept}
                disabled={accepting}
                onPress={() => setPendingRequest({
                  id: item.id,
                  riderName: item.rider?.name ?? 'Rider',
                  pickup: 'Pickup location',
                  distance: '2 km',
                  fare: item.fareEstimate ?? 0,
                })}
              >
                <Text style={styles.acceptText}>Review Request</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <TripRequestModal
        request={pendingRequest}
        onAccept={async (id) => {
          try {
            if (id !== 'demo-trip') await acceptRide(id).unwrap();
            setPendingRequest(null);
            Alert.alert('Accepted', 'Navigate to pickup.');
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
          }
        }}
        onDecline={() => setPendingRequest(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Brand.backgroundDark },
  muted: { color: Brand.textSecondary, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  earningsLabel: { color: Brand.textSecondary, fontSize: 12 },
  earnings: { color: Brand.accent, fontSize: 28, fontWeight: '800' },
  vehicleBadge: {
    backgroundColor: Brand.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.primary + '44',
  },
  vehicleText: { color: Brand.textPrimary, fontWeight: '700' },
  vehicleSub: { color: Brand.textSecondary, fontSize: 12 },
  toggle: {
    margin: 20,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  toggleOn: { backgroundColor: Brand.error },
  toggleOff: { backgroundColor: Brand.primary },
  toggleText: { color: '#fff', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  cardTitle: { fontWeight: '700', fontSize: 16, color: Brand.textPrimary },
  meta: { marginTop: 4, color: Brand.textSecondary },
  accept: {
    marginTop: 12,
    backgroundColor: Brand.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700' },
});
