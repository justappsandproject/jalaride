import 'dart:async';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/api_client.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';
import 'driver_active_ride_screen.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key, required this.token});

  final String token;

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _online = false;
  bool _busy = false;
  bool _loadingJobs = false;
  List<dynamic> _offers = [];
  Timer? _poll;
  Timer? _heartbeat;
  Timer? _alertSound;
  LatLng _center = const LatLng(9.0765, 7.3986);
  String? _modalOfferId;
  bool _modalOpen = false;

  ApiClient get _api => ApiClient(token: widget.token);

  @override
  void initState() {
    super.initState();
    _loadLocation();
  }

  @override
  void dispose() {
    _poll?.cancel();
    _heartbeat?.cancel();
    _alertSound?.cancel();
    super.dispose();
  }

  Future<void> _loadLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;
      final p = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => _center = LatLng(p.latitude, p.longitude));
    } catch (_) {}
  }

  Future<void> _sendHeartbeat() async {
    try {
      final p = await Geolocator.getCurrentPosition();
      if (mounted) setState(() => _center = LatLng(p.latitude, p.longitude));
      await _api.heartbeat(lat: p.latitude, lng: p.longitude);
    } catch (_) {}
  }

  Future<void> _setOnline(bool value) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      if (!value) {
        await _api.goOffline();
        _poll?.cancel();
        _heartbeat?.cancel();
        _stopAlert();
        setState(() {
          _online = false;
          _offers = [];
        });
      } else {
        await _api.goOnline();
        await _sendHeartbeat();
        setState(() => _online = true);
        await _loadOffers();
        _poll = Timer.periodic(const Duration(seconds: 3), (_) => _loadOffers());
        _heartbeat = Timer.periodic(const Duration(seconds: 10), (_) => _sendHeartbeat());
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Tokens.red500),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _startAlert() {
    if (_alertSound != null) return;
    _alertSound = Timer.periodic(const Duration(milliseconds: 800), (_) {
      SystemSound.play(SystemSoundType.alert);
      HapticFeedback.heavyImpact();
    });
  }

  void _stopAlert() {
    _alertSound?.cancel();
    _alertSound = null;
  }

  Future<void> _loadOffers() async {
    setState(() => _loadingJobs = true);
    try {
      final offers = await _api.pendingOffers();
      if (!mounted) return;
      setState(() => _offers = offers);
      if (offers.isNotEmpty && !_modalOpen) {
        final first = offers.first as Map<String, dynamic>;
        final id = first['id']?.toString();
        if (id != null && id != _modalOfferId) {
          _modalOfferId = id;
          _showOfferModal(first);
        }
      } else if (offers.isEmpty) {
        _stopAlert();
        _modalOfferId = null;
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingJobs = false);
    }
  }

  Future<void> _showOfferModal(Map<String, dynamic> offer) async {
    if (_modalOpen || !mounted) return;
    _modalOpen = true;
    _startAlert();
    final ride = offer['ride'] as Map<String, dynamic>? ?? {};
    final rider = ride['rider'] as Map<String, dynamic>?;
    final expiresAt = DateTime.tryParse(offer['expiresAt']?.toString() ?? '');
    final secondsLeft = expiresAt != null
        ? expiresAt.difference(DateTime.now()).inSeconds.clamp(1, 15)
        : 15;

    final accepted = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _OfferDialog(
        riderName: rider?['name']?.toString() ?? 'Rider',
        fare: ride['fareEstimate'],
        from: ride['originLabel']?.toString() ?? 'Pickup',
        to: ride['destLabel']?.toString() ?? 'Destination',
        seconds: secondsLeft,
        onAccept: () => Navigator.pop(ctx, true),
        onDecline: () => Navigator.pop(ctx, false),
      ),
    );

    _stopAlert();
    _modalOpen = false;
    if (!mounted) return;
    final offerId = offer['id'] as String?;
    if (offerId == null) return;
    if (accepted == true) {
      await _acceptOffer(offerId);
    } else if (accepted == false) {
      try {
        await _api.declineOffer(offerId);
      } catch (_) {}
      await _loadOffers();
    }
  }

  Future<void> _acceptOffer(String offerId) async {
    setState(() => _busy = true);
    try {
      await _api.acceptOffer(offerId);
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => DriverActiveRideScreen(token: widget.token)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Tokens.red500),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _accept(String id) async {
    // Legacy ride-id accept
    setState(() => _busy = true);
    try {
      await _api.acceptRide(id);
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => DriverActiveRideScreen(token: widget.token)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Tokens.red500),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final mapHeight = MediaQuery.of(context).size.height * 0.48;
    return Column(
      children: [
        SizedBox(
          height: mapHeight,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              GoogleMap(
                initialCameraPosition: CameraPosition(target: _center, zoom: 14),
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                markers: {
                  Marker(
                    markerId: const MarkerId('me'),
                    position: _center,
                    icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
                  ),
                },
                onMapCreated: (_) {},
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: -56,
                child: Column(
                  children: [
                    ToggleSwitchCard(
                      online: _online,
                      onChanged: _busy ? (_) {} : _setOnline,
                      subtitle: _busy ? 'Updating…' : (_online ? 'Receiving nearby requests' : 'Go online to get rides'),
                    ),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Expanded(child: StatChip(value: '₦0', label: 'today (sample)', accent: Tokens.gold500)),
                        SizedBox(width: 8),
                        Expanded(child: StatChip(value: '0', label: 'trips today', accent: Tokens.green500)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 72),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
            children: [
              const Text('Ride requests', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              if (!_online)
                const EmptyState(
                  icon: Icons.radar,
                  headline: 'Go online to see requests',
                  subtext: 'Toggle online above to start receiving ride requests near you.',
                )
              else if (_loadingJobs && _offers.isEmpty)
                const Column(
                  children: [
                    SkeletonBox(height: 88, width: double.infinity, radius: 16),
                    SizedBox(height: 12),
                    SkeletonBox(height: 88, width: double.infinity, radius: 16),
                  ],
                )
              else if (_offers.isEmpty)
                const EmptyState(
                  icon: Icons.radar,
                  headline: 'Looking for ride requests near you',
                  subtext: "You'll get an alert the moment a nearby offer is dispatched to you.",
                )
              else
                ..._offers.map((j) {
                  final offer = j as Map<String, dynamic>;
                  final ride = offer['ride'] as Map<String, dynamic>? ?? offer;
                  final rider = ride['rider'] as Map<String, dynamic>?;
                  final offerId = offer['id']?.toString();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppCard(
                      elevated: true,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              AppAvatar(name: rider?['name']?.toString() ?? 'Rider', size: 40, verified: true),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      rider?['name']?.toString() ?? 'Rider',
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    Text(
                                      '₦${ride['fareEstimate'] ?? '—'}',
                                      style: const TextStyle(color: Tokens.gold500, fontWeight: FontWeight.w600),
                                    ),
                                  ],
                                ),
                              ),
                              const StatusPill(label: 'OFFER', tone: StatusTone.warning),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text('From: ${ride['originLabel'] ?? 'Pickup'}', style: const TextStyle(color: Tokens.textSecondary)),
                          Text('To: ${ride['destLabel'] ?? 'Destination'}', style: const TextStyle(color: Tokens.textSecondary)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: AppButton(
                                  label: 'Decline',
                                  variant: AppButtonVariant.secondary,
                                  onPressed: () async {
                                    if (offerId != null) {
                                      try {
                                        await _api.declineOffer(offerId);
                                      } catch (_) {}
                                      await _loadOffers();
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: AppButton(
                                  label: 'Accept',
                                  loading: _busy,
                                  onPressed: () {
                                    if (offerId != null) {
                                      _acceptOffer(offerId);
                                    } else {
                                      _accept(ride['id'] as String);
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ],
    );
  }
}

class _OfferDialog extends StatefulWidget {
  const _OfferDialog({
    required this.riderName,
    required this.fare,
    required this.from,
    required this.to,
    required this.seconds,
    required this.onAccept,
    required this.onDecline,
  });

  final String riderName;
  final Object? fare;
  final String from;
  final String to;
  final int seconds;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  @override
  State<_OfferDialog> createState() => _OfferDialogState();
}

class _OfferDialogState extends State<_OfferDialog> {
  late int _left;
  Timer? _t;

  @override
  void initState() {
    super.initState();
    _left = widget.seconds;
    _t = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_left <= 1) {
        _t?.cancel();
        widget.onDecline();
      } else {
        setState(() => _left--);
      }
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Tokens.bgSurface,
      title: Text('New ride · ${_left}s'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(widget.riderName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
          const SizedBox(height: 8),
          Text('₦${widget.fare ?? '—'}', style: const TextStyle(color: Tokens.gold500, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Text('From: ${widget.from}', style: const TextStyle(color: Tokens.textSecondary)),
          Text('To: ${widget.to}', style: const TextStyle(color: Tokens.textSecondary)),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: _left / widget.seconds,
            color: Tokens.gold500,
            backgroundColor: Tokens.bgSurface2,
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: widget.onDecline, child: const Text('Decline')),
        FilledButton(
          onPressed: widget.onAccept,
          style: FilledButton.styleFrom(backgroundColor: Tokens.gold500, foregroundColor: Colors.black),
          child: const Text('Accept'),
        ),
      ],
    );
  }
}

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key, this.token});

  final String? token;

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  int _segment = 1; // 0 today, 1 week, 2 month
  List<dynamic> _rides = [];
  bool _loading = true;

  static const _sampleBars = [1200.0, 3400.0, 2100.0, 4500.0, 1800.0, 5200.0, 3900.0];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (widget.token == null) {
      setState(() => _loading = false);
      return;
    }
    try {
      final rides = await ApiClient(token: widget.token).myRides();
      if (mounted) setState(() => _rides = rides);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _sampleTotal {
    switch (_segment) {
      case 0:
        return 3900;
      case 2:
        return 48200;
      default:
        return _sampleBars.reduce((a, b) => a + b);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SegmentedButton<int>(
          segments: const [
            ButtonSegment(value: 0, label: Text('Today')),
            ButtonSegment(value: 1, label: Text('Week')),
            ButtonSegment(value: 2, label: Text('Month')),
          ],
          selected: {_segment},
          onSelectionChanged: (s) => setState(() => _segment = s.first),
        ),
        const SizedBox(height: 20),
        Text(
          '₦${_sampleTotal.toStringAsFixed(0)}',
          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Tokens.gold500),
        ),
        const Row(
          children: [
            Icon(Icons.trending_up, size: 16, color: Tokens.green500),
            SizedBox(width: 4),
            Text('+12% vs prior (sample)', style: TextStyle(color: Tokens.textSecondary, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 8),
        const Text('Sample earnings — not live payout data', style: TextStyle(color: Tokens.textTertiary, fontSize: 12)),
        const SizedBox(height: 20),
        AppCard(
          child: SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                borderData: FlBorderData(show: false),
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (v, _) {
                        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        final i = v.toInt();
                        if (i < 0 || i > 6) return const SizedBox.shrink();
                        return Text(days[i], style: const TextStyle(color: Tokens.textTertiary, fontSize: 11));
                      },
                    ),
                  ),
                ),
                barGroups: List.generate(
                  7,
                  (i) => BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: _sampleBars[i],
                        color: Tokens.gold500,
                        width: 14,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text('Trips', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (_loading)
          const SkeletonBox(height: 72, width: double.infinity, radius: 16)
        else if (_rides.isEmpty)
          const EmptyState(
            icon: Icons.payments_outlined,
            headline: 'No completed trips yet',
            subtext: 'Accepted rides will show fare breakdown here.',
          )
        else
          ..._rides.take(20).map((r) {
            final ride = r as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: AppCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(ride['destLabel']?.toString() ?? 'Trip', style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text(
                            '${ride['originLabel'] ?? 'Pickup'} → ${ride['status'] ?? ''}',
                            style: const TextStyle(color: Tokens.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₦${ride['fareEstimate'] ?? ride['fareFinal'] ?? '—'}',
                      style: const TextStyle(color: Tokens.gold500, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}

class RemittanceScreen extends StatelessWidget {
  const RemittanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const remitted = 18500.0;
    const target = 25000.0;
    final progress = remitted / target;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        AppCard(
          elevated: true,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Weekly remittance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              const Text('Sample target — Paystack not wired yet', style: TextStyle(color: Tokens.textTertiary, fontSize: 12)),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 12,
                  backgroundColor: Tokens.bgSurface2,
                  color: Tokens.gold500,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('₦${remitted.toStringAsFixed(0)} / ₦${target.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Text('Due in 3 days (sample)', style: TextStyle(color: Tokens.textSecondary, fontSize: 13)),
                ],
              ),
              const SizedBox(height: 16),
              AppButton(
                label: 'Pay now',
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Paystack wiring coming — not charged')),
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text('Payment history', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        ...[
          ('Sample remittance', '₦25,000', StatusTone.success, 'Paid'),
          ('Sample remittance', '₦25,000', StatusTone.warning, 'Pending'),
          ('Sample remittance', '₦18,500', StatusTone.danger, 'Overdue'),
        ].map(
          (row) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(row.$1, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Text('Sample row', style: TextStyle(color: Tokens.textTertiary, fontSize: 12)),
                      ],
                    ),
                  ),
                  Text(row.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(width: 8),
                  StatusPill(label: row.$4, tone: row.$3),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
