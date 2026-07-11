import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PendingApprovalScreen extends StatelessWidget {
  const PendingApprovalScreen({super.key, required this.onLogout});

  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.verified_user, size: 64, color: Brand.primary),
              const SizedBox(height: 24),
              const Text('Awaiting approval', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text(
                'Your registration is being reviewed.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Brand.textSecondary),
              ),
              const SizedBox(height: 32),
              OutlinedButton(onPressed: onLogout, child: const Text('Sign out')),
            ],
          ),
        ),
      ),
    );
  }
}
