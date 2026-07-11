import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';
import '../widgets/safety_bar.dart';

const _riderRatingTags = [
  'Great conversation',
  'Safe driving',
  'Clean vehicle',
  'On time',
  'Professional',
];

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
  bool _ratingShown = false;

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
      if (!mounted) return;
      final prevStatus = _ride?['status'] as String?;
      setState(() => _ride = ride);
      final status = ride?['status'] as String?;
      if (status == 'COMPLETED' && !_ratingShown && prevStatus != 'COMPLETED') {
        _ratingShown = true;
        WidgetsBinding.instance.addPostFrameCallback((_) => _showRatingSheet());
      }
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

  Future<void> _shareTrip() async {
    final id = _ride?['id'] as String?;
    if (id == null) return;
    try {
      final res = await ApiClient(token: widget.token).shareRide(id);
      final url = res['url'] as String?;
      if (url == null || url.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not create share link')),
          );
        }
        return;
      }
      await Clipboard.setData(ClipboardData(text: url));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Share link copied to clipboard')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _showRatingSheet() async {
    if (!mounted) return;
    var score = 5;
    final selectedTags = <String>{};

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(ctx).padding.bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Rate your trip', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final star = i + 1;
                  return IconButton(
                    onPressed: () => setSheet(() => score = star),
                    icon: Icon(
                      star <= score ? Icons.star : Icons.star_border,
                      color: Tokens.gold500,
                      size: 36,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _riderRatingTags.map((tag) {
                  final on = selectedTags.contains(tag);
                  return FilterChip(
                    label: Text(tag),
                    selected: on,
                    onSelected: (_) => setSheet(() {
                      if (on) {
                        selectedTags.remove(tag);
                      } else {
                        selectedTags.add(tag);
                      }
                    }),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
              AppButton(
                label: 'Submit rating',
                onPressed: () async {
                  final id = _ride?['id'] as String?;
                  if (id == null) return;
                  try {
                    await ApiClient(token: widget.token).rateRide(
                      id,
                      score: score,
                      tags: selectedTags.toList(),
                    );
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Thanks for your feedback')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                    }
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
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
      case 'COMPLETED':
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
      case 'COMPLETED':
        return 'Trip completed';
      default:
        return 'Status: $status';
    }
  }

  List<Widget> _trustChips(Map<String, dynamic>? trust) {
    if (trust == null) return [];
    final chips = <Widget>[];
    if (trust['ninVerified'] == true) {
      chips.add(_TrustChip(label: 'NIN verified'));
    }
    if (trust['driverApproved'] == true) {
      chips.add(_TrustChip(label: 'Approved driver'));
    }
    final days = trust['accountTenureDays'];
    if (days is num && days > 0) {
      chips.add(_TrustChip(label: '${days.toInt()} days on Jala'));
    }
    final rating = trust['rating'];
    if (rating is num && rating > 0) {
      chips.add(_TrustChip(label: '${rating.toStringAsFixed(1)} ★'));
    }
    if (chips.isEmpty) return [];
    return [
      const SizedBox(height: 8),
      Wrap(spacing: 6, runSpacing: 6, children: chips),
    ];
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
    final showPin = const {
      'MATCHED',
      'DRIVER_EN_ROUTE',
      'ARRIVED',
      'PIN_CONFIRMED',
    }.contains(status);
    final driver = ride['driver'] as Map<String, dynamic>?;
    final driverUser = driver?['user'] as Map<String, dynamic>?;
    final trust = ride['trust'] as Map<String, dynamic>?;
    final vehicles = driver?['vehicles'] as List?;
    final vehicle = vehicles != null && vehicles.isNotEmpty ? vehicles.first as Map<String, dynamic> : null;
    final driverRating = (trust?['rating'] as num?)?.toDouble() ?? (driver?['rating'] as num?)?.toDouble() ?? 0;

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
                ] else if (status == 'COMPLETED') ...[
                  const Text(
                    'Trip completed',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Fare: ₦${ride['fareFinal'] ?? ride['fareEstimate'] ?? '—'}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Tokens.gold500, fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  AppButton(label: 'Rate your driver', onPressed: _showRatingSheet),
                ] else ...[
                  if (showPin && pin != null) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Tokens.green100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Tokens.green500.withValues(alpha: 0.3)),
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'Your pickup PIN',
                            style: TextStyle(fontWeight: FontWeight.w600, color: Tokens.textSecondary),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            pin,
                            style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, letterSpacing: 8),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Share this PIN with your driver at pickup',
                            style: TextStyle(color: Tokens.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (driverUser != null)
                    AppCard(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          AppAvatar(name: driverUser['name']?.toString(), size: 48, verified: trust?['ninVerified'] == true),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(driverUser['name']?.toString() ?? 'Driver', style: const TextStyle(fontWeight: FontWeight.w700)),
                                if (driverRating > 0) RatingStars(rating: driverRating, size: 14),
                                if (vehicle != null)
                                  Text(
                                    '${vehicle['make'] ?? ''} ${vehicle['model'] ?? ''} · ${vehicle['plate'] ?? ''}',
                                    style: const TextStyle(color: Tokens.textSecondary, fontSize: 12),
                                  ),
                                ..._trustChips(trust),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (driverUser != null) const SizedBox(height: 12),
                  Text(ride['destLabel']?.toString() ?? 'Destination', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text('Fare est. ₦${ride['fareEstimate'] ?? '—'}', style: const TextStyle(color: Tokens.gold500)),
                  if (status == 'ARRIVED') ...[
                    const SizedBox(height: 12),
                    AppButton(label: 'Confirm PIN', onPressed: _confirmPin),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _ActionIcon(icon: Icons.call, label: 'Call', onTap: () => launchUrl(Uri.parse('tel:${driverUser?['phone'] ?? '112'}'))),
                      _ActionIcon(icon: Icons.share_outlined, label: 'Share', onTap: _shareTrip),
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

class _TrustChip extends StatelessWidget {
  const _TrustChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Tokens.green100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Tokens.green500, fontSize: 11, fontWeight: FontWeight.w600),
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
