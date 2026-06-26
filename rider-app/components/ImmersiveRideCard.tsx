import {
  ImageBackground,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Brand } from '@/constants/brand';

export type ActiveTripData = {
  driverName: string;
  driverPhoto: string;
  rating: number;
  totalTrips: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  plateNumber: string;
  dssCleared: boolean;
  policeCleared: boolean;
  ninVerified: boolean;
  eta: string;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedFare: number;
  shareToken: string;
  status: string;
};

type Props = {
  trip: ActiveTripData;
  onCall?: () => void;
  onSOS?: () => void;
};

export function ImmersiveRideCard({ trip, onCall, onSOS }: Props) {
  async function onShare() {
    const webUrl = `https://jalaride.ng/track/${trip.shareToken}`;
    const deepLink = `jalaride://trip/share/${trip.shareToken}`;
    await Share.share({
      message: `Track my Jala Ride trip: ${webUrl}`,
      url: deepLink,
      title: 'Share my ride',
    });
  }

  const statusLabel: Record<string, string> = {
    driver_assigned: 'Driver assigned',
    driver_en_route: 'Driver is on the way',
    arrived: 'Your driver has arrived!',
    in_progress: 'Trip in progress',
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: trip.driverPhoto }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />
      <View style={styles.topBar}>
        <Pressable style={styles.sosBtn} onPress={onSOS ?? (() => Linking.openURL('tel:112'))}>
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
        <Pressable style={styles.shareBtn} onPress={onShare}>
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.driverName}>{trip.driverName.toUpperCase()}</Text>
        <Text style={styles.meta}>
          ★ {trip.rating.toFixed(1)} | {trip.totalTrips.toLocaleString()} trips
        </Text>
        <Text style={styles.vehicle}>
          🚗 {trip.vehicleMake} {trip.vehicleModel} {trip.vehicleYear} — {trip.vehicleColor}
        </Text>
        <Text style={styles.plate}>Plate: {trip.plateNumber}</Text>
        <View style={styles.badges}>
          <Text style={styles.badge}>{trip.dssCleared ? 'DSS ✅' : 'DSS ⏳'}</Text>
          <Text style={styles.badge}>{trip.policeCleared ? 'Police ✅' : 'Police ⏳'}</Text>
          <Text style={styles.badge}>{trip.ninVerified ? 'NIN ✅' : 'NIN ⏳'}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={onCall}>
            <Text style={styles.actionText}>📞 Call Driver</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionText}>💬 Message</Text>
          </Pressable>
        </View>
        <Text style={styles.eta}>ETA: {trip.eta}</Text>
        <View style={styles.divider} />
        <Text style={styles.address}>📍 {trip.pickupAddress}</Text>
        <Text style={styles.address}>🏁 {trip.dropoffAddress}</Text>
        <Text style={styles.fare}>Est. fare: {`₦${trip.estimatedFare.toLocaleString()}`}</Text>
        <Text style={styles.status}>{statusLabel[trip.status] ?? trip.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,22,40,0.35)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(10,22,40,0.88)',
  },
  topBar: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  sosBtn: {
    backgroundColor: Brand.error,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sosText: { color: '#fff', fontWeight: '700' },
  shareBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareText: { color: '#fff', fontWeight: '600' },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
  },
  driverName: { fontSize: 22, fontWeight: '800', color: Brand.textPrimary },
  meta: { marginTop: 4, color: Brand.accent, fontWeight: '600' },
  vehicle: { marginTop: 12, color: Brand.textPrimary, fontSize: 15 },
  plate: { marginTop: 4, color: Brand.textSecondary },
  badges: { flexDirection: 'row', gap: 12, marginTop: 12 },
  badge: { color: Brand.success, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    backgroundColor: Brand.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
  eta: { marginTop: 16, fontSize: 18, fontWeight: '700', color: Brand.accent },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  address: { color: Brand.textSecondary, marginTop: 4, lineHeight: 20 },
  fare: { marginTop: 12, fontSize: 18, fontWeight: '700', color: Brand.textPrimary },
  status: { marginTop: 8, color: Brand.accent, fontWeight: '600' },
});
