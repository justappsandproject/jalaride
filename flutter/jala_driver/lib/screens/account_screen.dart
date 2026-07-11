import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';

class DriverAccountScreen extends StatefulWidget {
  const DriverAccountScreen({super.key, required this.token, required this.onLogout});

  final String token;
  final VoidCallback onLogout;

  @override
  State<DriverAccountScreen> createState() => _DriverAccountScreenState();
}

class _DriverAccountScreenState extends State<DriverAccountScreen> {
  Map<String, dynamic>? _driver;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final data = await ApiClient(token: widget.token).driverMe();
      if (mounted) setState(() => _driver = data['driver'] as Map<String, dynamic>?);
    } catch (_) {
      if (mounted) setState(() => _driver = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openSupport() async {
    final uri = Uri.parse('mailto:support@jalaride.com');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email support@jalaride.com')),
      );
    }
  }

  String _vehicleLabel() {
    final vehicles = _driver?['vehicles'] as List?;
    if (vehicles == null || vehicles.isEmpty) return 'No vehicle on file';
    final v = vehicles.first as Map<String, dynamic>;
    final make = v['make']?.toString() ?? '';
    final model = v['model']?.toString() ?? '';
    final plate = v['plate']?.toString() ?? '';
    final label = '$make $model'.trim();
    if (label.isEmpty && plate.isEmpty) return 'No vehicle on file';
    if (plate.isEmpty) return label;
    if (label.isEmpty) return plate;
    return '$label · $plate';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            SkeletonBox(height: 120, width: double.infinity, radius: 16),
            SizedBox(height: 12),
            SkeletonBox(height: 56, width: double.infinity, radius: 16),
          ],
        ),
      );
    }

    final user = _driver?['user'] as Map<String, dynamic>?;
    final name = user?['name']?.toString() ?? 'Driver';
    final ninVerified = user?['ninVerified'] == true;
    final rating = (_driver?['rating'] as num?)?.toDouble() ?? 0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppCard(
          elevated: true,
          child: Row(
            children: [
              AppAvatar(name: name, size: 64, verified: ninVerified),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    if (rating > 0) RatingStars(rating: rating),
                    const SizedBox(height: 6),
                    Text(
                      _vehicleLabel(),
                      style: const TextStyle(color: Tokens.textSecondary, fontSize: 13),
                    ),
                    if (ninVerified) ...[
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
                onTap: _openSupport,
              ),
              const Divider(height: 1, color: Tokens.borderSubtle),
              SectionRow(
                icon: Icons.logout,
                title: 'Sign out',
                destructive: true,
                onTap: widget.onLogout,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
