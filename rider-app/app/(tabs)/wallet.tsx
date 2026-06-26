import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

const TRANSACTIONS = [
  { id: '1', type: 'deposit', label: 'Wallet top-up', amount: 5000 },
  { id: '2', type: 'trip', label: 'Trip to Maitama', amount: -1850 },
  { id: '3', type: 'refund', label: 'Trip refund', amount: 500 },
];

export default function WalletScreen() {
  const balance = 3650;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Wallet Balance</Text>
      <Text style={styles.balance}>₦{balance.toLocaleString()}</Text>
      <Pressable style={styles.addBtn}>
        <Text style={styles.addBtnText}>Add Money via Paystack</Text>
      </Pressable>

      <Text style={styles.section}>Transaction History</Text>
      {TRANSACTIONS.map((tx) => (
        <View key={tx.id} style={styles.row}>
          <View>
            <Text style={styles.txLabel}>{tx.label}</Text>
            <Text style={styles.txType}>{tx.type}</Text>
          </View>
          <Text style={[styles.txAmount, tx.amount > 0 ? styles.credit : styles.debit]}>
            {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: 20 },
  label: { color: Brand.textSecondary, fontSize: 14 },
  balance: { marginTop: 8, fontSize: 40, fontWeight: '800', color: Brand.accent },
  addBtn: {
    marginTop: 20,
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  section: { marginTop: 32, color: Brand.textPrimary, fontWeight: '700', fontSize: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 14,
    backgroundColor: Brand.surface,
    borderRadius: 10,
  },
  txLabel: { color: Brand.textPrimary, fontWeight: '600' },
  txType: { color: Brand.textSecondary, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  txAmount: { fontWeight: '700', fontSize: 16 },
  credit: { color: Brand.success },
  debit: { color: Brand.error },
});
