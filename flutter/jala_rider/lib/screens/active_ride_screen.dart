import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ActiveRideScreen extends StatelessWidget {
  const ActiveRideScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF1a3a5c), Brand.background],
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _pill('SOS', Brand.error),
                        const SizedBox(width: 8),
                        _pill('Share', Colors.white24),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
                  decoration: BoxDecoration(
                    color: Brand.background.withValues(alpha: 0.92),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('CHIOMA ADEBAYO', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                      const Text('★ 4.9 | 1,240 trips', style: TextStyle(color: Brand.accent, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      const Text('🚗 Toyota Corolla 2021 — Silver'),
                      const Text('Plate: JA-234-ABA', style: TextStyle(color: Brand.textSecondary)),
                      const SizedBox(height: 12),
                      const Wrap(
                        spacing: 12,
                        children: [
                          Text('DSS ✅', style: TextStyle(color: Brand.success, fontWeight: FontWeight.w600)),
                          Text('Police ✅', style: TextStyle(color: Brand.success, fontWeight: FontWeight.w600)),
                          Text('NIN ✅', style: TextStyle(color: Brand.success, fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: ElevatedButton(onPressed: () {}, child: const Text('📞 Call'))),
                          const SizedBox(width: 10),
                          Expanded(child: ElevatedButton(onPressed: () {}, child: const Text('💬 Message'))),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text('ETA: 3 min', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Brand.accent)),
                      const Divider(height: 32, color: Colors.white12),
                      const Text('📍 Wuse Market, Abuja', style: TextStyle(color: Brand.textSecondary)),
                      const Text('🏁 Maitama District', style: TextStyle(color: Brand.textSecondary)),
                      const SizedBox(height: 12),
                      const Text('Est. fare: ₦1,850', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      const Text('Driver is on the way', style: TextStyle(color: Brand.accent, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            top: 8,
            left: 8,
            child: SafeArea(
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pill(String label, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
    );
  }
}
