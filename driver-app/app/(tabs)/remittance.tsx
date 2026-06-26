import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import { calculateWeeklyRemittance, formatNaira } from '@/lib/finance';

const VEHICLE = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2022,
  plate: 'JA-234-ABA',
  purchasePrice: 10_000_000,
  annualRate: 40,
  years: 4,
};

const weekly = calculateWeeklyRemittance(VEHICLE.purchasePrice, VEHICLE.annualRate, VEHICLE.years);

export default function RemittanceScreen() {
  const annualInterest = VEHICLE.purchasePrice * (VEHICLE.annualRate / 100);
  const totalOverPeriod = annualInterest * VEHICLE.years;
  const totalWeeks = VEHICLE.years * 52;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Remittance</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Vehicle</Text>
        <Text style={styles.value}>
          {VEHICLE.make} {VEHICLE.model} {VEHICLE.year} | Plate: {VEHICLE.plate}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Weekly Remittance Due</Text>
        <Text style={styles.weekly}>{formatNaira(weekly)}</Text>
      </View>
      <View style={styles.explainer}>
        <Text style={styles.explainerTitle}>How is my weekly remittance calculated?</Text>
        <Text style={styles.line}>Vehicle Price:        {formatNaira(VEHICLE.purchasePrice)}</Text>
        <Text style={styles.line}>× Annual Rate ({VEHICLE.annualRate}%): {formatNaira(annualInterest)} per year</Text>
        <Text style={styles.line}>× {VEHICLE.years} years:            {formatNaira(totalOverPeriod)} total</Text>
        <Text style={styles.line}>÷ {totalWeeks} weeks:          {formatNaira(weekly)} per week</Text>
        <Text style={styles.formula}>
          Formula: (price × rate% × years) ÷ (years × 52)
        </Text>
      </View>
      <View style={styles.table}>
        <Text style={styles.tableHeader}>Recent Weeks</Text>
        {['Pending', 'Paid', 'Paid'].map((status, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowWeek}>Week {12 - i}</Text>
            <Text style={styles.rowAmount}>{formatNaira(weekly)}</Text>
            <Text style={[styles.rowStatus, status === 'Paid' ? styles.paid : styles.pending]}>
              {status}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: Brand.textPrimary },
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  label: { fontSize: 12, color: Brand.textSecondary, textTransform: 'uppercase' },
  value: { marginTop: 4, color: Brand.textPrimary, fontWeight: '600' },
  weekly: { marginTop: 4, fontSize: 28, fontWeight: '800', color: Brand.accent },
  explainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Brand.primary + '22',
    borderWidth: 1,
    borderColor: Brand.primary,
  },
  explainerTitle: { fontWeight: '700', color: Brand.textPrimary, marginBottom: 12 },
  line: { color: Brand.textSecondary, fontFamily: 'monospace', fontSize: 12, marginTop: 4 },
  formula: { marginTop: 12, fontSize: 11, color: Brand.accent, fontStyle: 'italic' },
  table: { marginTop: 20 },
  tableHeader: { fontWeight: '700', color: Brand.textPrimary, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowWeek: { color: Brand.textSecondary },
  rowAmount: { color: Brand.textPrimary, fontWeight: '600' },
  rowStatus: { fontWeight: '600' },
  paid: { color: Brand.success },
  pending: { color: Brand.textSecondary },
});
