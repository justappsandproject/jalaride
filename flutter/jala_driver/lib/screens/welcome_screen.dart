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
            colors: [Color(0xFF0d4024), Brand.background],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    _Logo(),
                    SizedBox(width: 12),
                    Text('Jala Ride Driver', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
                const Spacer(),
                const Text('Drive with\nPurpose.', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w800)),
                const SizedBox(height: 16),
                const Text(
                  'Government fleet vehicles, DSS & police clearance, transparent weekly remittance.',
                  style: TextStyle(color: Brand.textSecondary, fontSize: 16, height: 1.5),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(onPressed: onGetStarted, child: const Text('Start Registration')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  const _Logo();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 48,
      height: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: Brand.primary, borderRadius: BorderRadius.circular(14)),
      child: const Text('JR', style: TextStyle(fontWeight: FontWeight.bold, color: Brand.accent)),
    );
  }
}
