import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';

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
      final rides = await ApiClient(token: widget.token).myRides();
      setState(() => _rides = rides);
    } catch (_) {
      setState(() => _rides = []);
    } finally {
      setState(() => _loading = false);
    }
  }

  StatusTone _tone(String? status) {
    switch (status) {
      case 'COMPLETED':
        return StatusTone.success;
      case 'CANCELLED':
        return StatusTone.danger;
      case 'IN_PROGRESS':
      case 'ARRIVED':
        return StatusTone.info;
      default:
        return StatusTone.warning;
    }
  }

  void _openReceipt(Map<String, dynamic> ride) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Trip receipt', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            Text('${ride['originLabel'] ?? 'Pickup'} → ${ride['destLabel'] ?? 'Drop-off'}'),
            const SizedBox(height: 8),
            Text('Status: ${ride['status']}', style: const TextStyle(color: Tokens.textSecondary)),
            Text('Fare: ₦${ride['fareFinal'] ?? ride['fareEstimate'] ?? '—'}',
                style: const TextStyle(color: Tokens.gold500, fontWeight: FontWeight.w700, fontSize: 18)),
            const SizedBox(height: 20),
            AppButton(
              label: 'Download PDF',
              variant: AppButtonVariant.secondary,
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('PDF export coming soon')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            SkeletonBox(height: 80, width: double.infinity, radius: 16),
            SizedBox(height: 12),
            SkeletonBox(height: 80, width: double.infinity, radius: 16),
          ],
        ),
      );
    }
    if (_rides.isEmpty) {
      return const EmptyState(
        icon: Icons.history,
        headline: 'No trips yet',
        subtext: 'Your completed and cancelled rides will appear here.',
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      color: Tokens.green500,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _rides.length,
        itemBuilder: (_, i) {
          final r = _rides[i] as Map<String, dynamic>;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              onTap: () => _openReceipt(r),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r['destLabel']?.toString() ?? 'Trip', style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text(
                          '${r['originLabel'] ?? 'Pickup'} → ${r['destLabel'] ?? 'Drop-off'}',
                          style: const TextStyle(color: Tokens.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 8),
                        StatusPill(label: r['status']?.toString() ?? '—', tone: _tone(r['status']?.toString())),
                      ],
                    ),
                  ),
                  Text(
                    '₦${r['fareEstimate'] ?? '—'}',
                    style: const TextStyle(color: Tokens.gold500, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
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
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Tokens.radiusCard),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Tokens.gold500.withValues(alpha: 0.85),
                Tokens.bgSurface,
              ],
            ),
            border: Border.all(color: Tokens.gold500.withValues(alpha: 0.4)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Wallet balance', style: TextStyle(color: Tokens.bgBase, fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Text('₦0.00', style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Tokens.bgBase)),
              SizedBox(height: 4),
              Text('Sample balance — not live funds', style: TextStyle(color: Tokens.bgBase, fontSize: 12)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppButton(
          label: 'Top up with Paystack',
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Paystack top-up coming soon')),
            );
          },
        ),
        const SizedBox(height: 10),
        AppButton(
          label: 'Transaction history',
          variant: AppButtonVariant.secondary,
          onPressed: () {},
        ),
        const SizedBox(height: 24),
        const Text('Recent activity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        ...[
          ('Sample top-up', '+₦5,000', true),
          ('Sample trip fare', '-₦1,850', false),
          ('Sample refund', '+₦300', true),
        ].map(
          (t) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              child: Row(
                children: [
                  Icon(
                    t.$3 ? Icons.south_west : Icons.north_east,
                    color: t.$3 ? Tokens.green500 : Tokens.red500,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t.$1, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Text('Sample transaction', style: TextStyle(color: Tokens.textTertiary, fontSize: 12)),
                      ],
                    ),
                  ),
                  Text(
                    t.$2,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      color: t.$3 ? Tokens.green500 : Tokens.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  void _comingSoon(BuildContext context, String title) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(title)),
          body: EmptyState(
            icon: Icons.construction_outlined,
            headline: 'Coming soon',
            subtext: '$title will be available in a future update.',
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        FutureBuilder<String?>(
          future: Session.loadName(),
          builder: (_, snap) {
            final name = snap.data ?? 'Rider';
            return AppCard(
              elevated: true,
              child: Row(
                children: [
                  AppAvatar(name: name, size: 64, verified: true),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        const Text('Rider account', style: TextStyle(color: Tokens.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 12),
        AppCard(
          color: Tokens.green100,
          child: const Row(
            children: [
              Icon(Icons.verified_user, color: Tokens.green500),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('NIN verified', style: TextStyle(fontWeight: FontWeight.w700, color: Tokens.green500)),
                    Text(
                      'Identity checked via NIMC during onboarding',
                      style: TextStyle(color: Tokens.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          child: Column(
            children: [
              SectionRow(
                icon: Icons.payment_outlined,
                title: 'Payment methods',
                onTap: () => _comingSoon(context, 'Payment methods'),
              ),
              const Divider(height: 1, color: Tokens.borderSubtle),
              SectionRow(
                icon: Icons.support_agent_outlined,
                title: 'Support',
                onTap: () => _comingSoon(context, 'Support'),
              ),
              const Divider(height: 1, color: Tokens.borderSubtle),
              SectionRow(
                icon: Icons.settings_outlined,
                title: 'Settings',
                onTap: () => _comingSoon(context, 'Settings'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        AppCard(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
          child: SectionRow(
            icon: Icons.logout,
            title: 'Sign out',
            destructive: true,
            onTap: onLogout,
          ),
        ),
      ],
    );
  }
}
