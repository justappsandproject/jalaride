import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../services/api_client.dart';
import '../services/places_service.dart';
import '../services/session.dart';
import '../theme/tokens.dart';
import '../widgets/design/design.dart';
import 'active_ride_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.token});

  final String token;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  LatLng? _current;
  LatLng? _origin;
  LatLng? _dest;
  String _originLabel = 'Current location';
  String _destLabel = '';
  String? _name;
  bool _booking = false;
  bool _quoting = false;
  String _rideType = 'ECONOMY';
  DirectionsQuote? _quote;

  PlacesService get _places => PlacesService(token: widget.token);

  static const _rideTypes = [
    ('ECONOMY', 'Economy', 'Affordable everyday', Icons.directions_car_outlined),
    ('VERIFIED', 'Jala Verified', 'NIN-checked drivers', Icons.verified_outlined),
    ('FLEET', 'Gov Fleet', 'Government vehicles', Icons.airport_shuttle_outlined),
  ];

  @override
  void initState() {
    super.initState();
    Session.loadName().then((n) => setState(() => _name = n));
    _loadLocation();
  }

  Future<void> _loadLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() {
          _current = const LatLng(9.0765, 7.3986);
          _origin = _current;
        });
        return;
      }
      final p = await Geolocator.getCurrentPosition();
      final pos = LatLng(p.latitude, p.longitude);
      String label = 'Current location';
      try {
        label = await _places.reverse(p.latitude, p.longitude);
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _current = pos;
        _origin = pos;
        _originLabel = label;
      });
    } catch (_) {
      setState(() {
        _current = const LatLng(9.0765, 7.3986);
        _origin = _current;
      });
    }
  }

  Future<void> _pickPlace({required bool isOrigin}) async {
    final result = await showModalBottomSheet<PlaceDetails>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Tokens.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _PlacePickerSheet(
        title: isOrigin ? 'Pickup' : 'Where to?',
        places: _places,
      ),
    );
    if (result == null) return;
    setState(() {
      if (isOrigin) {
        _origin = LatLng(result.lat, result.lng);
        _originLabel = result.label;
      } else {
        _dest = LatLng(result.lat, result.lng);
        _destLabel = result.label;
      }
    });
    await _refreshQuote();
  }

  Future<void> _refreshQuote() async {
    final o = _origin ?? _current;
    final d = _dest;
    if (o == null || d == null) return;
    setState(() => _quoting = true);
    try {
      final q = await _places.directions(
        originLat: o.latitude,
        originLng: o.longitude,
        destLat: d.latitude,
        destLng: d.longitude,
      );
      if (mounted) setState(() => _quote = q);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _quoting = false);
    }
  }

  int? _fareFor(String category) {
    final fares = _quote?.fares;
    if (fares == null) return null;
    for (final f in fares) {
      if (f['category'] == category) return (f['fare'] as num?)?.toInt();
    }
    return null;
  }

  Future<void> _bookRide() async {
    if (_destLabel.isEmpty || _dest == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please choose a destination'), backgroundColor: Tokens.red500),
      );
      return;
    }
    final origin = _origin ?? _current ?? const LatLng(9.0765, 7.3986);
    final dest = _dest!;
    setState(() => _booking = true);
    try {
      final api = ApiClient(token: widget.token);
      final fare = _fareFor(_rideType)?.toDouble();
      final res = await api.createRide(
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: dest.latitude,
        destLng: dest.longitude,
        originLabel: _originLabel,
        destLabel: _destLabel,
        category: _rideType,
        distanceKm: _quote?.distanceKm,
        durationMin: _quote?.durationMin,
        fareEstimate: fare,
        polyline: _quote?.polyline,
      );
      final ride = res['ride'] as Map<String, dynamic>?;
      if (mounted && ride != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ActiveRideScreen(token: widget.token, rideId: ride['id'] as String?),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Tokens.red500),
        );
      }
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final origin = _origin ?? _current ?? const LatLng(9.0765, 7.3986);
    final mapHeight = MediaQuery.of(context).size.height * 0.38;

    return Column(
      children: [
        SizedBox(
          height: mapHeight,
          child: GoogleMap(
            initialCameraPosition: CameraPosition(target: origin, zoom: 14),
            myLocationEnabled: true,
            zoomControlsEnabled: false,
            markers: {
              Marker(markerId: const MarkerId('me'), position: origin),
              if (_dest != null)
                Marker(
                  markerId: const MarkerId('dest'),
                  position: _dest!,
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
                ),
            },
            onMapCreated: (_) {},
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Text('Hi ${_name ?? 'Rider'}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              AppCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.radio_button_checked, color: Tokens.green500, size: 20),
                      title: Text(_originLabel, maxLines: 1, overflow: TextOverflow.ellipsis),
                      subtitle: const Text('From', style: TextStyle(fontSize: 12)),
                      onTap: () => _pickPlace(isOrigin: true),
                    ),
                    const Divider(height: 1, color: Tokens.borderSubtle),
                    ListTile(
                      leading: const Icon(Icons.location_on, color: Tokens.gold500, size: 20),
                      title: Text(
                        _destLabel.isEmpty ? 'Where to?' : _destLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: _destLabel.isEmpty ? Tokens.textSecondary : Tokens.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: const Text('To', style: TextStyle(fontSize: 12)),
                      onTap: () => _pickPlace(isOrigin: false),
                    ),
                  ],
                ),
              ),
              if (_quoting) ...[
                const SizedBox(height: 12),
                const LinearProgressIndicator(color: Tokens.green500, minHeight: 2),
              ] else if (_quote != null) ...[
                const SizedBox(height: 8),
                Text(
                  '${_quote!.distanceKm.toStringAsFixed(1)} km · ${_quote!.durationMin.round()} min',
                  style: const TextStyle(color: Tokens.textSecondary, fontSize: 13),
                ),
              ],
              const SizedBox(height: 16),
              const Text('Choose a ride', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              ..._rideTypes.map((t) {
                final selected = _rideType == t.$1;
                final fare = _fareFor(t.$1);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    color: selected ? Tokens.green100 : null,
                    onTap: () => setState(() => _rideType = t.$1),
                    child: Row(
                      children: [
                        Icon(t.$4, color: selected ? Tokens.green500 : Tokens.textSecondary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(t.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                              Text(t.$3, style: const TextStyle(color: Tokens.textSecondary, fontSize: 13)),
                            ],
                          ),
                        ),
                        Text(
                          fare != null ? '₦$fare' : '—',
                          style: const TextStyle(color: Tokens.gold500, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
              AppButton(
                label: _booking ? 'Requesting…' : 'Confirm ride',
                loading: _booking,
                onPressed: _booking ? null : _bookRide,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PlacePickerSheet extends StatefulWidget {
  const _PlacePickerSheet({required this.title, required this.places});

  final String title;
  final PlacesService places;

  @override
  State<_PlacePickerSheet> createState() => _PlacePickerSheetState();
}

class _PlacePickerSheetState extends State<_PlacePickerSheet> {
  final _controller = TextEditingController();
  List<PlacePrediction> _preds = [];
  bool _loading = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onChanged(String v) async {
    if (v.trim().length < 2) {
      setState(() => _preds = []);
      return;
    }
    setState(() => _loading = true);
    try {
      final list = await widget.places.autocomplete(v);
      if (mounted) setState(() => _preds = list);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _select(PlacePrediction p) async {
    HapticFeedback.selectionClick();
    final details = await widget.places.details(p.placeId);
    if (details != null && mounted) Navigator.pop(context, details);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            autofocus: true,
            decoration: const InputDecoration(
              labelText: 'Search address',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: _onChanged,
          ),
          if (_loading) const LinearProgressIndicator(minHeight: 2, color: Tokens.green500),
          const SizedBox(height: 8),
          SizedBox(
            height: 220,
            child: ListView.builder(
              itemCount: _preds.length,
              itemBuilder: (_, i) {
                final p = _preds[i];
                return ListTile(
                  leading: const Icon(Icons.place_outlined),
                  title: Text(p.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                  onTap: () => _select(p),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
