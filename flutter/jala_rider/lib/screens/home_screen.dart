import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import 'active_ride_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.token});

  final String token;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const _categories = [
    ('Economy', 'from ₦300'),
    ('Comfort', 'from ₦500'),
    ('XL', 'from ₦700'),
    ('Moto', 'from ₦150'),
  ];

  String? _name;

  @override
  void initState() {
    super.initState();
    Session.loadName().then((n) => setState(() => _name = n));
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Good day 👋', style: TextStyle(color: Brand.textSecondary)),
          Text('Hi ${_name ?? 'Rider'}', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          const Text('Where to?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          _searchBar(context),
          const SizedBox(height: 24),
          const Text('Choose a ride', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _categories
                .map((c) => SizedBox(
                      width: (MediaQuery.of(context).size.width - 50) / 2,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.$1, style: const TextStyle(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text(c.$2, style: const TextStyle(color: Brand.accent, fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 24),
          const Text('Recent destinations', style: TextStyle(fontWeight: FontWeight.w700)),
          ...['Wuse Market', 'Maitama', 'Garki'].map(_recentRow),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ActiveRideScreen()),
            ),
            icon: const Icon(Icons.directions_car, color: Brand.accent),
            label: const Text('View active ride card (demo)', style: TextStyle(color: Brand.accent)),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Brand.accent.withValues(alpha: 0.5)),
              padding: const EdgeInsets.all(16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _searchBar(BuildContext context) {
    return InkWell(
      onTap: () => _bookRide(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Brand.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: const Row(
          children: [
            Icon(Icons.search, color: Brand.textSecondary),
            SizedBox(width: 12),
            Text('Search destination…', style: TextStyle(color: Brand.textSecondary, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  Widget _recentRow(String place) {
    return Card(
      margin: const EdgeInsets.only(top: 8),
      child: ListTile(
        leading: const Text('📍'),
        title: Text(place),
        onTap: () => _bookRide(context, dest: place),
      ),
    );
  }

  Future<void> _bookRide(BuildContext context, {String? dest}) async {
    final api = ApiClient(token: widget.token);
    try {
      await api.createRide(
        originLat: 9.0765,
        originLng: 7.3986,
        destLat: 9.0579,
        destLng: 7.4951,
        originLabel: 'Current location',
        destLabel: dest ?? 'Destination',
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ride requested!'), backgroundColor: Brand.success),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Brand.error),
        );
      }
    }
  }
}
