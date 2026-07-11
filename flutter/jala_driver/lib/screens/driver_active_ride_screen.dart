import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/safety_bar.dart';

class DriverActiveRideScreen extends StatefulWidget {
  const DriverActiveRideScreen({super.key, required this.token});

  final String token;

  @override
  State<DriverActiveRideScreen> createState() => _DriverActiveRideScreenState();
}

class _DriverActiveRideScreenState extends State<DriverActiveRideScreen> {
  Map<String, dynamic>? _ride;
  Timer? _poll;
  String? _revealedPin;

  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 4), (_) => _load());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final ride = await ApiClient(token: widget.token).activeRide();
      if (mounted) setState(() => _ride = ride);
    } catch (_) {}
  }

  Future<void> _action(Future<Map<String, dynamic>> Function() fn) async {
    try {
      final res = await fn();
      if (res['pickupPin'] != null) {
        setState(() => _revealedPin = res['pickupPin'] as String);
      }
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final ride = _ride;
    if (ride == null) {
      return const Scaffold(body: Center(child: Text('No active trip')));
    }
    final api = ApiClient(token: widget.token);
    final id = ride['id'] as String;
    final status = ride['status'] as String? ?? '';
    final origin = LatLng((ride['originLat'] as num).toDouble(), (ride['originLng'] as num).toDouble());
    final dest = LatLng((ride['destLat'] as num).toDouble(), (ride['destLng'] as num).toDouble());
    final pin = _revealedPin ?? ride['pickupPinPlain'] as String?;

    return Scaffold(
      appBar: AppBar(title: Text('Trip · $status')),
      body: Column(
        children: [
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(target: origin, zoom: 13),
              myLocationEnabled: true,
              markers: {
                Marker(markerId: const MarkerId('pickup'), position: origin),
                Marker(markerId: const MarkerId('drop'), position: dest),
              },
              polylines: {Polyline(polylineId: const PolylineId('r'), points: [origin, dest], color: Brand.accent, width: 4)},
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Rider: ${ride['rider']?['name'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('₦${ride['fareEstimate'] ?? '—'}', style: const TextStyle(color: Brand.accent, fontSize: 20)),
                if (pin != null) Text('Pickup PIN: $pin', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                if (status == 'MATCHED')
                  ElevatedButton(onPressed: () => _action(() => api.enRoute(id)), child: const Text('Start navigation')),
                if (status == 'DRIVER_EN_ROUTE' || status == 'MATCHED')
                  ElevatedButton(onPressed: () => _action(() => api.arrived(id)), child: const Text('I have arrived')),
                if (status == 'ARRIVED')
                  ElevatedButton(onPressed: () => _action(() => api.confirmPin(id)), child: const Text('Confirm PIN with rider')),
                if (status == 'PIN_CONFIRMED')
                  ElevatedButton(onPressed: () => _action(() => api.startRide(id)), child: const Text('Start ride')),
                if (status == 'IN_PROGRESS')
                  ElevatedButton(onPressed: () => _action(() => api.completeRide(id)), child: const Text('Complete ride')),
                const SizedBox(height: 8),
                SafetyBar(token: widget.token, rideId: id),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

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
              const Icon(Icons.hourglass_top, size: 64, color: Brand.accent),
              const SizedBox(height: 24),
              const Text('Awaiting approval', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Text(
                'Your documents are being reviewed by Jala Ride admin. NIN, DSS, and police clearance will be verified.',
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
