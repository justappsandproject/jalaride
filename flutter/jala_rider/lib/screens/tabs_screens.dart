import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key, required this.token});

  final String token;

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  List<dynamic> _rides = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = ApiClient(token: widget.token);
      final rides = await api.myRides();
      setState(() => _rides = rides);
    } catch (_) {
      setState(() => _rides = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: Brand.primary));
    if (_rides.isEmpty) {
      return const Center(child: Text('No trips yet', style: TextStyle(color: Brand.textSecondary)));
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: Brand.accent,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _rides.length,
        itemBuilder: (_, i) {
          final r = _rides[i] as Map<String, dynamic>;
          return Card(
            child: ListTile(
              title: Text(r['destLabel']?.toString() ?? 'Trip'),
              subtitle: Text(r['status']?.toString() ?? ''),
              trailing: Text('₦${r['fareEstimate'] ?? '—'}', style: const TextStyle(color: Brand.accent)),
            ),
          );
        },
      ),
    );
  }
}

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Wallet balance', style: TextStyle(color: Brand.textSecondary)),
          const Text('₦0.00', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Brand.accent)),
          const SizedBox(height: 24),
          ElevatedButton(onPressed: () {}, child: const Text('Top up with Paystack')),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: () {}, child: const Text('Transaction history')),
        ],
      ),
    );
  }
}

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FutureBuilder<String?>(
            future: Session.loadName(),
            builder: (_, snap) => Text(
              snap.data ?? 'Rider',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.verified_user, color: Brand.success),
            title: const Text('NIN verification'),
            subtitle: const Text('Complete in onboarding'),
          ),
          const Spacer(),
          OutlinedButton(
            onPressed: onLogout,
            style: OutlinedButton.styleFrom(foregroundColor: Brand.error, side: const BorderSide(color: Brand.error)),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}
