import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Brand } from '@/constants/brand';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>JR</Text>
      </View>
      <Text style={styles.title}>Move with Confidence</Text>
      <Text style={styles.sub}>
        Nigeria&apos;s identity-verified ride-hailing platform. Verify your NIN to get started.
      </Text>
      <Link href="/(auth)/phone" asChild>
        <Pressable style={styles.primary}>
          <Text style={styles.primaryText}>I&apos;m a Rider</Text>
        </Pressable>
      </Link>
      <Pressable style={styles.secondary}>
        <Text style={styles.secondaryText}>I&apos;m a Driver — Download Driver App</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.backgroundDark,
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoText: { fontSize: 28, fontWeight: '800', color: Brand.accent },
  title: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: '800',
    color: Brand.textPrimary,
    textAlign: 'center',
  },
  sub: {
    marginTop: 12,
    color: Brand.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primary: {
    marginTop: 32,
    backgroundColor: Brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: Brand.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: { color: Brand.accent, fontWeight: '600' },
});
