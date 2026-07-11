import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key, required this.onGetStarted});

  final VoidCallback onGetStarted;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1a1408), Brand.background],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Image.asset('assets/branding/logo-mark.png', height: 48),
                    const SizedBox(width: 12),
                    const Text(
                      'Jala Ride Driver',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Brand.accent),
                    ),
                  ],
                ),
                const Spacer(),
                const Text(
                  'Drive with\nPurpose.',
                  style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800, color: Brand.accent),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Government fleet vehicles, DSS & police clearance, transparent weekly remittance.',
                  style: TextStyle(color: Brand.textSecondary, fontSize: 16, height: 1.5),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onGetStarted,
                    child: const Text('Start Driver Registration'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
