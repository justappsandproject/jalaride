import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';
import '../widgets/safety_bar.dart';

class ActiveRideScreen extends StatefulWidget {
  const ActiveRideScreen({super.key, required this.token, this.rideId});

  final String token;
  final String? rideId;

  @override
  State<ActiveRideScreen> createState() => _ActiveRideScreenState();
}

class _ActiveRideScreenState extends State<ActiveRideScreen> {
  Map<String, dynamic>? _ride;
  Timer? _poll;
  LatLng? _current;

  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 4), (_) => _load());
    _loadLocation();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _loadLocation() async {
    try {
      final p = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => _current = LatLng(p.latitude, p.longitude));
    } catch (_) {}
  }

  Future<void> _load() async {
    try {
      final api = ApiClient(token: widget.token);
      Map<String, dynamic>? ride;
      if (widget.rideId != null) {
        ride = await api.getRide(widget.rideId!);
      } else {
        ride = await api.activeRide();
      }
      if (mounted) setState(() => _ride = ride);
    } catch (_) {}
  }

  Future<void> _confirmPin() async {
    final id = _ride?['id'] as String?;
    if (id == null) return;
    try {
      await ApiClient(token: widget.token).confirmPin(id);
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _confirmSos() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Tokens.bgSurface,
        title: const Text('Trigger SOS?'),
        content: const Text('This will alert Jala Ride safety and dial emergency services (112).'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Tokens.red500),
            child: const Text('Send SOS'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final api = ApiClient(token: widget.token);
    Position? pos;
    try {
      pos = await Geolocator.getCurrentPosition();
    } catch (_) {}
    await api.triggerSos(
      rideId: _ride?['id'] as String?,
      lat: pos?.latitude,
      lng: pos?.longitude,
    );
    await launchUrl(Uri.parse('tel:112'));
  }

  StatusTone _toneFor(String status) {
    switch (status) {
      case 'IN_PROGRESS':
      case 'PIN_CONFIRMED':
      case 'MATCHED':
        return StatusTone.success;
      case 'ARRIVED':
      case 'DRIVER_EN_ROUTE':
        return StatusTone.info;
      case 'CANCELLED':
      case 'NO_DRIVER':
        return StatusTone.danger;
      case 'SEARCHING':
      case 'REQUESTED':
        return StatusTone.warning;
      default:
        return StatusTone.warning;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'SEARCHING':
      case 'REQUESTED':
        return 'Finding a driver…';
      case 'NO_DRIVER':
        return 'No drivers nearby';
      case 'MATCHED':
        return 'Driver matched';
      case 'DRIVER_EN_ROUTE':
        return 'Driver on the way';
      case 'ARRIVED':
        return 'Driver has arrived';
      default:
        return 'Status: $status';
    }
  }

  Future<void> _retry() async {
    final id = _ride?['id'] as String?;
    if (id == null) return;
    try {
      await ApiClient(token: widget.token).retryRide(id);
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _cancel() async {
    final id = _ride?['id'] as String?;
    if (id == null) return;
    try {
      await ApiClient(token: widget.token).cancelRide(id);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ride = _ride;
    if (ride == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: Tokens.green500)),
      );
    }
    final status = ride['status'] as String? ?? '';
    final origin = LatLng((ride['originLat'] as num).toDouble(), (ride['originLng'] as num).toDouble());
    final dest = LatLng((ride['destLat'] as num).toDouble(), (ride['destLng'] as num).toDouble());
    final pin = ride['pickupPinPlain'] as String?;
    final showPin = status == 'ARRIVED' || status == 'PIN_CONFIRMED' || status == 'IN_PROGRESS';
    final driver = ride['driver'] as Map<String, dynamic>?;
    final driverUser = driver?['user'] as Map<String, dynamic>?;
    final vehicles = driver?['vehicles'] as List?;
    final vehicle = vehicles != null && vehicles.isNotEmpty ? vehicles.first as Map<String, dynamic> : null;

    return Scaffold(
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
              child: AppCard(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Live trip', style: TextStyle(fontWeight: FontWeight.w700)),
                          Text(
                            _statusLabel(status),
                            style: const TextStyle(color: Tokens.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    StatusPill(label: status, tone: _toneFor(status)),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(target: origin, zoom: 13),
              markers: {
                Marker(markerId: const MarkerId('o'), position: origin, infoWindow: InfoWindow(title: ride['originLabel']?.toString() ?? 'Pickup')),
                Marker(markerId: const MarkerId('d'), position: dest, infoWindow: InfoWindow(title: ride['destLabel']?.toString() ?? 'Drop-off')),
                if (_current != null) Marker(markerId: const MarkerId('me'), position: _current!),
              },
              polylines: {
                Polyline(polylineId: const PolylineId('route'), points: [origin, dest], color: Tokens.green500, width: 4),
              },
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Tokens.bgSurface,
              border: Border(top: BorderSide(color: Tokens.borderSubtle)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (status == 'SEARCHING' || status == 'REQUESTED') ...[
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: CircularProgressIndicator(color: Tokens.green500),
                    ),
                  ),
                  const Text(
                    'Searching for nearby drivers…',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Fare est. ₦${ride['fareEstimate'] ?? '—'} · ${ride['destLabel'] ?? ''}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Tokens.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    label: 'Cancel search',
                    variant: AppButtonVariant.secondary,
                    onPressed: _cancel,
                  ),
                ] else if (status == 'NO_DRIVER') ...[
                  const Text(
                    'No drivers available right now',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Try again or widen your wait — we expand the search radius each round.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Tokens.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  AppButton(label: 'Try again', onPressed: _retry),
                  const SizedBox(height: 8),
                  AppButton(
                    label: 'Cancel',
                    variant: AppButtonVariant.secondary,
                    onPressed: _cancel,
                  ),
                ] else ...[
                if (driverUser != null)
                  AppCard(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        AppAvatar(name: driverUser['name']?.toString(), size: 48, verified: true),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(driverUser['name']?.toString() ?? 'Driver', style: const TextStyle(fontWeight: FontWeight.w700)),
                              const RatingStars(rating: 4.9, size: 14),
                              if (vehicle != null)
                                Text(
                                  '${vehicle['make'] ?? ''} ${vehicle['model'] ?? ''} · ${vehicle['plate'] ?? ''}',
                                  style: const TextStyle(color: Tokens.textSecondary, fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                if (driverUser != null) const SizedBox(height: 12),
                Text(ride['destLabel']?.toString() ?? 'Destination', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('Fare est. ₦${ride['fareEstimate'] ?? '—'}', style: const TextStyle(color: Tokens.gold500)),
                if (showPin && pin != null) ...[
                  const SizedBox(height: 12),
                  Text('Pickup PIN: $pin', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 4)),
                  const Text('Confirm with your driver', style: TextStyle(color: Tokens.textSecondary)),
                ],
                if (status == 'ARRIVED') ...[
                  const SizedBox(height: 12),
                  AppButton(label: 'Confirm PIN', onPressed: _confirmPin),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    _ActionIcon(icon: Icons.call, label: 'Call', onTap: () => launchUrl(Uri.parse('tel:${driverUser?['phone'] ?? '112'}'))),
                    _ActionIcon(
                      icon: Icons.share_outlined,
                      label: 'Share',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Trip share link coming soon')),
                        );
                      },
                    ),
                    _ActionIcon(icon: Icons.sos, label: 'SOS', color: Tokens.red500, onTap: _confirmSos),
                    _ActionIcon(
                      icon: Icons.mic_none,
                      label: 'Record',
                      onTap: () async {
                        await ApiClient(token: widget.token).toggleRecording(
                          rideId: ride['id'] as String?,
                          active: true,
                        );
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Silent recording started')),
                          );
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SafetyBar(token: widget.token, rideId: ride['id'] as String?),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionIcon extends StatelessWidget {
  const _ActionIcon({required this.icon, required this.label, required this.onTap, this.color});

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            children: [
              Icon(icon, color: color ?? Tokens.blue500, size: 24),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 11, color: color ?? Tokens.textSecondary)),
            ],
          ),
        ),
      ),
    );
  }
}
