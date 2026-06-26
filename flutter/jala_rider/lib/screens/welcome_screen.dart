import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, required this.onGetStarted});

  final VoidCallback onGetStarted;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF1B6B3A), Brand.background],
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _logo(),
                  const Spacer(),
                  const Text(
                    'Move with\nConfidence.',
                    style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, height: 1.1),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Nigeria\'s identity-verified ride platform. Every driver NIN-verified and clearance-checked.',
                    style: TextStyle(color: Brand.textSecondary, fontSize: 16, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onGetStarted,
                      child: const Text('Get Started'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _logo() {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Brand.primary,
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Text('JR', style: TextStyle(fontWeight: FontWeight.bold, color: Brand.accent, fontSize: 18)),
        ),
        const SizedBox(width: 12),
        const Text('Jala Ride', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
