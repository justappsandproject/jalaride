import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
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
  static const _visibleStatuses = {
    'IN_PROGRESS',
    'PIN_CONFIRMED',
    'ARRIVED',
    'DRIVER_EN_ROUTE',
    'MATCHED',
    'COMPLETED',
  };

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
      setState(() => _rides = rides.where((r) {
        final status = (r as Map<String, dynamic>)['status']?.toString();
        return status != null && _visibleStatuses.contains(status);
      }).toList());
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
    final receiptText = [
      'Jala Ride — Trip receipt',
      '${ride['originLabel'] ?? 'Pickup'} → ${ride['destLabel'] ?? 'Drop-off'}',
      'Status: ${ride['status']}',
      'Fare: ₦${ride['fareFinal'] ?? ride['fareEstimate'] ?? '—'}',
    ].join('\n');

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
              label: 'Copy receipt',
              variant: AppButtonVariant.secondary,
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: receiptText));
                if (ctx.mounted) Navigator.pop(ctx);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Receipt copied to clipboard')),
                  );
                }
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
        subtext: 'Your ongoing and completed trips will appear here.',
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
    return const EmptyState(
      icon: Icons.account_balance_wallet_outlined,
      headline: 'Wallet not available yet',
      subtext:
          'Trip fares are charged per ride. In-app wallet top-ups will appear here when enabled.',
    );
  }
}

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  Future<void> _openSupport(BuildContext context) async {
    final uri = Uri.parse('mailto:support@jalaride.com');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email support@jalaride.com')),
      );
    }
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
                icon: Icons.support_agent_outlined,
                title: 'Support',
                onTap: () => _openSupport(context),
              ),
              const Divider(height: 1, color: Tokens.borderSubtle),
              SectionRow(
                icon: Icons.logout,
                title: 'Sign out',
                destructive: true,
                onTap: onLogout,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
