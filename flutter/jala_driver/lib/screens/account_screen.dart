import 'package:flutter/material.dart';
import '../services/session.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';

class DriverAccountScreen extends StatelessWidget {
  const DriverAccountScreen({super.key, required this.onLogout});

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
            final name = snap.data ?? 'Driver';
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
                        const RatingStars(rating: 4.8),
                        const SizedBox(height: 6),
                        const Text(
                          'Toyota Corolla · JA-234-ABA (sample)',
                          style: TextStyle(color: Tokens.textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Tokens.green100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'NIN verified',
                            style: TextStyle(color: Tokens.green500, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        AppCard(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          child: Column(
            children: [
              SectionRow(
                icon: Icons.folder_shared_outlined,
                title: 'Documents & Compliance',
                onTap: () => _comingSoon(context, 'Documents & Compliance'),
              ),
              const Divider(height: 1, color: Tokens.borderSubtle),
              SectionRow(
                icon: Icons.directions_car_outlined,
                title: 'Vehicle Details',
                onTap: () => _comingSoon(context, 'Vehicle Details'),
              ),
              const Divider(height: 1, color: Tokens.borderSubtle),
              SectionRow(
                icon: Icons.account_balance_outlined,
                title: 'Bank & Payout Info',
                onTap: () => _comingSoon(context, 'Bank & Payout Info'),
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
