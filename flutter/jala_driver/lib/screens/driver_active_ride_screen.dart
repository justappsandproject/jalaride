import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/safety_bar.dart';

const _driverRatingTags = [
  'Polite',
  'Ready on time',
  'Clear directions',
  'Respectful',
];

class DriverActiveRideScreen extends StatefulWidget {
  const DriverActiveRideScreen({super.key, required this.token});

  final String token;

  @override
  State<DriverActiveRideScreen> createState() => _DriverActiveRideScreenState();
}

class _DriverActiveRideScreenState extends State<DriverActiveRideScreen> {
  Map<String, dynamic>? _ride;
  Timer? _poll;
  Timer? _waitTicker;
  final _pinController = TextEditingController();
  bool _ratingShown = false;
  bool _allowPop = false;
  bool _confirmingPayment = false;
  int? _waitSeconds;

  @override
  void initState() {
    super.initState();
    _load();
    _poll = Timer.periodic(const Duration(seconds: 4), (_) => _load());
    _waitTicker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _waitSeconds != null && _waitSeconds! > 0) {
        setState(() => _waitSeconds = _waitSeconds! - 1);
      }
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _waitTicker?.cancel();
    _pinController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final api = ApiClient(token: widget.token);
      Map<String, dynamic>? ride = await api.activeRide();
      // Keep completed unpaid trips on screen even if /active briefly misses them
      final currentId = _ride?['id'] as String?;
      if (ride == null && currentId != null && _ride?['status'] == 'COMPLETED') {
        try {
          ride = await api.getRide(currentId);
        } catch (_) {}
      }
      if (!mounted) return;
      if (ride != null) {
        setState(() {
          _ride = ride;
          if (ride?['waitSecondsLeft'] is num) {
            _waitSeconds = (ride?['waitSecondsLeft'] as num).toInt();
          } else if (ride?['status'] != 'ARRIVED') {
            _waitSeconds = null;
          }
        });
      }
      final status = ride?['status'] as String?;
      final payment = ride?['paymentSummary'] as Map<String, dynamic>?;
      if (status == 'COMPLETED' &&
          payment?['status'] == 'CAPTURED' &&
          !_ratingShown) {
        _ratingShown = true;
        WidgetsBinding.instance.addPostFrameCallback((_) => _showRatingSheet());
      }
    } catch (_) {}
  }

  Future<void> _confirmPaymentReceived() async {
    final id = _ride?['id'] as String?;
    if (id == null || _confirmingPayment) return;
    setState(() => _confirmingPayment = true);
    try {
      final res = await ApiClient(token: widget.token).confirmPayment(id);
      final updated = res['ride'] as Map<String, dynamic>?;
      if (!mounted) return;
      if (updated != null) {
        setState(() => _ride = updated);
      } else {
        await _load();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message']?.toString() ?? 'Payment confirmed')),
        );
      }
      final payment = _ride?['paymentSummary'] as Map<String, dynamic>?;
      if (payment?['status'] == 'CAPTURED' && !_ratingShown) {
        _ratingShown = true;
        WidgetsBinding.instance.addPostFrameCallback((_) => _showRatingSheet());
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _confirmingPayment = false);
    }
  }

  Future<void> _action(Future<Map<String, dynamic>> Function() fn) async {
    try {
      await fn();
      await _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _startNavigation(String id, double lat, double lng) async {
    await _action(() => ApiClient(token: widget.token).enRoute(id));
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving',
    );
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open Google Maps')),
      );
    }
  }

  Future<void> _arrived(String id) async {
    await _action(() => ApiClient(token: widget.token).arrived(id));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rider notified — 5 minute wait started')),
      );
    }
  }

  Future<void> _handleBack() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Trip still active')),
    );
    final minimize = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Minimize active trip?'),
        content: const Text('The trip will continue. This does not cancel it.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Stay')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Minimize')),
        ],
      ),
    );
    if (minimize == true && mounted) {
      setState(() => _allowPop = true);
      Navigator.pop(context);
    }
  }

  Future<void> _verifyPin() async {
    final id = _ride?['id'] as String?;
    if (id == null) return;
    final pin = _pinController.text.trim();
    if (pin.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the 4-digit rider PIN')),
      );
      return;
    }
    try {
      await ApiClient(token: widget.token).verifyPin(id, pin: pin);
      _pinController.clear();
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('PIN verified — you can start the ride')),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _showRatingSheet() async {
    if (!mounted) return;
    var score = 5;
    final selectedTags = <String>{};

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Brand.surface,
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
              const Text('Rate your rider', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final star = i + 1;
                  return IconButton(
                    onPressed: () => setSheet(() => score = star),
                    icon: Icon(
                      star <= score ? Icons.star : Icons.star_border,
                      color: Brand.accent,
                      size: 36,
                    ),
                  );
                }),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _driverRatingTags.map((tag) {
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
              ElevatedButton(
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
                child: const Text('Submit rating'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _showPinEntry(String status) =>
      const {'ARRIVED', 'MATCHED', 'DRIVER_EN_ROUTE'}.contains(status);

  @override
  Widget build(BuildContext context) {
    final ride = _ride;
    if (ride == null) {
      return const Scaffold(body: Center(child: Text('No active trip')));
    }
    final api = ApiClient(token: widget.token);
    final id = ride['id'] as String;
    final status = ride['status'] as String? ?? '';
    final payment = ride['paymentSummary'] as Map<String, dynamic>?;
    final paymentStatus = payment?['status']?.toString() ?? 'AWAITING_PAYMENT';
    final active = const {
          'MATCHED',
          'DRIVER_EN_ROUTE',
          'ARRIVED',
          'PIN_CONFIRMED',
          'IN_PROGRESS',
        }.contains(status) ||
        (status == 'COMPLETED' && paymentStatus != 'CAPTURED');
    final origin = LatLng((ride['originLat'] as num).toDouble(), (ride['originLng'] as num).toDouble());
    final dest = LatLng((ride['destLat'] as num).toDouble(), (ride['destLng'] as num).toDouble());

    return PopScope(
      canPop: _allowPop || !active,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && active) _handleBack();
      },
      child: Scaffold(
        appBar: AppBar(title: Text('Trip · $status')),
        bottomNavigationBar: active || status == 'COMPLETED'
            ? SafeArea(
                minimum: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: SafetyBar(token: widget.token, rideId: id),
              )
            : null,
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
          ConstrainedBox(
            constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * .46),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Rider: ${ride['rider']?['name'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.bold)),
                Text('₦${ride['fareEstimate'] ?? '—'}', style: const TextStyle(color: Brand.accent, fontSize: 20)),
                const SizedBox(height: 8),
                if (status == 'ARRIVED' && _waitSeconds != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Brand.accent.withValues(alpha: .12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Rider wait time: ${(_waitSeconds! ~/ 60).toString().padLeft(2, '0')}:${(_waitSeconds! % 60).toString().padLeft(2, '0')}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                if (status == 'ARRIVED') const SizedBox(height: 8),
                if (status == 'MATCHED')
                  ElevatedButton(
                    onPressed: () => _startNavigation(id, origin.latitude, origin.longitude),
                    child: const Text('Start navigation'),
                  ),
                if (status == 'DRIVER_EN_ROUTE' || status == 'MATCHED')
                  ElevatedButton(onPressed: () => _arrived(id), child: const Text('I have arrived')),
                if (_showPinEntry(status)) ...[
                  const SizedBox(height: 12),
                  const Text('Enter rider pickup PIN', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _pinController,
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      hintText: '4-digit PIN',
                      counterText: '',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton(onPressed: _verifyPin, child: const Text('Verify PIN')),
                ],
                if (status == 'PIN_CONFIRMED')
                  ElevatedButton(onPressed: () => _action(() => api.startRide(id)), child: const Text('Start ride')),
                if (status == 'IN_PROGRESS')
                  ElevatedButton(onPressed: () => _action(() => api.completeRide(id)), child: const Text('Complete ride')),
                if (status == 'COMPLETED') ...[
                  const SizedBox(height: 8),
                  const Text('Trip completed', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(
                    'Fare: ₦${ride['fareFinal'] ?? ride['fareEstimate'] ?? '—'}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Brand.accent, fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  if (paymentStatus == 'CAPTURED') ...[
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle, color: Colors.green),
                        SizedBox(width: 8),
                        Text('Payment received', style: TextStyle(fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(onPressed: _showRatingSheet, child: const Text('Rate your rider')),
                  ] else ...[
                    Text(
                      paymentStatus == 'AWAITING_CONFIRMATION'
                          ? 'Rider selected ${payment?['method'] ?? 'payment'}. Confirm when you have received it.'
                          : 'Confirm when you have received payment from the rider.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Brand.textSecondary, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _confirmingPayment ? null : _confirmPaymentReceived,
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(52),
                        backgroundColor: Brand.accent,
                        foregroundColor: Brand.background,
                      ),
                      child: _confirmingPayment
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Confirm payment received', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ],
                ],
              ],
            ),
          ),
          ),
        ],
      ),
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
