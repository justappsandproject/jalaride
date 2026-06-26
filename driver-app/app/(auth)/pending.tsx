import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export default function PendingApprovalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Pending Approval</Text>
      <Text style={styles.body}>
        Your documents have been submitted. Jala Ride will conduct a DSS and Police background check
        before activating your account. This typically takes 3–7 business days.
      </Text>
      <View style={styles.checklist}>
        <Text style={styles.checkItem}>NIN verification</Text>
        <Text style={styles.checkItem}>DSS clearance — pending</Text>
        <Text style={styles.checkItem}>Police clearance — pending</Text>
        <Text style={styles.checkItem}>Document review — pending</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark, padding: 24, justifyContent: 'center' },
  icon: { fontSize: 48, textAlign: 'center' },
  title: { marginTop: 16, fontSize: 24, fontWeight: '800', color: Brand.textPrimary, textAlign: 'center' },
  body: { marginTop: 12, color: Brand.textSecondary, textAlign: 'center', lineHeight: 22 },
  checklist: { marginTop: 24, padding: 16, backgroundColor: Brand.surface, borderRadius: 12 },
  checkItem: { color: Brand.textPrimary, paddingVertical: 6 },
});
