import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type TripRequest = {
  id: string;
  riderName: string;
  pickup: string;
  distance: string;
  fare: number;
};

type Props = {
  request: TripRequest | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
};

export function TripRequestModal({ request, onAccept, onDecline }: Props) {
  const [seconds, setSeconds] = useState(15);

  useEffect(() => {
    if (!request) return;
    setSeconds(15);
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          onDecline(request.id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request, onDecline]);

  if (!request) return null;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.timer, seconds <= 5 && styles.timerUrgent]}>{seconds}s</Text>
          <Text style={styles.title}>New Trip Request</Text>
          <Text style={styles.rider}>{request.riderName}</Text>
          <Text style={styles.pickup}>📍 {request.pickup}</Text>
          <Text style={styles.meta}>{request.distance} away · Est. ₦{request.fare.toLocaleString()}</Text>
          <View style={styles.actions}>
            <Pressable style={styles.decline} onPress={() => onDecline(request.id)}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable style={styles.accept} onPress={() => onAccept(request.id)}>
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  timer: {
    alignSelf: 'center',
    fontSize: 48,
    fontWeight: '800',
    color: Brand.accent,
  },
  timerUrgent: { color: Brand.error },
  title: { textAlign: 'center', color: Brand.textSecondary, marginTop: 8 },
  rider: { textAlign: 'center', fontSize: 22, fontWeight: '700', color: Brand.textPrimary, marginTop: 12 },
  pickup: { textAlign: 'center', color: Brand.textPrimary, marginTop: 8 },
  meta: { textAlign: 'center', color: Brand.textSecondary, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  decline: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.error,
    alignItems: 'center',
  },
  declineText: { color: Brand.error, fontWeight: '700' },
  accept: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Brand.primary,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '700' },
});
