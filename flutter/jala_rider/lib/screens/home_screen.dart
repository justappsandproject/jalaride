import 'dart:async';
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
  DirectionsQuote? _quote;
  double _searchRadiusKm = 2;
  List<Map<String, dynamic>> _nearbyDrivers = [];
  Timer? _nearbyTimer;
  GoogleMapController? _mapController;

  PlacesService get _places => PlacesService(token: widget.token);
  ApiClient get _api => ApiClient(token: widget.token);

  static const _radiusOptions = [2.0, 4.0, 6.0, 10.0];

  @override
  void initState() {
    super.initState();
    Session.loadName().then((n) => setState(() => _name = n));
    _loadLocation();
    _nearbyTimer = Timer.periodic(const Duration(seconds: 8), (_) => _refreshNearbyDrivers());
  }

  @override
  void dispose() {
    _nearbyTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
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
        await _refreshNearbyDrivers();
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
      await _refreshNearbyDrivers();
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(pos, 14));
    } catch (_) {
      setState(() {
        _current = const LatLng(9.0765, 7.3986);
        _origin = _current;
      });
      await _refreshNearbyDrivers();
    }
  }

  Future<void> _refreshNearbyDrivers() async {
    final origin = _origin ?? _current;
    if (origin == null) return;
    try {
      final res = await _api.nearbyDrivers(
        lat: origin.latitude,
        lng: origin.longitude,
        radiusKm: _searchRadiusKm,
      );
      final list = res['drivers'];
      if (!mounted) return;
      setState(() {
        _nearbyDrivers = list is List
            ? list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
            : [];
      });
    } catch (_) {}
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
    if (isOrigin) await _refreshNearbyDrivers();
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

  int? _executiveFare() {
    final fares = _quote?.fares;
    if (fares == null) return null;
    for (final f in fares) {
      final cat = f['category']?.toString();
      if (cat == 'EXECUTIVE' || cat == 'ECONOMY' || cat == 'VERIFIED' || cat == 'FLEET') {
        return (f['fare'] as num?)?.toInt();
      }
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
      final fare = _executiveFare()?.toDouble();
      final res = await _api.createRide(
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: dest.latitude,
        destLng: dest.longitude,
        originLabel: _originLabel,
        destLabel: _destLabel,
        category: 'EXECUTIVE',
        distanceKm: _quote?.distanceKm,
        durationMin: _quote?.durationMin,
        fareEstimate: fare,
        polyline: _quote?.polyline,
        searchRadiusKm: _searchRadiusKm,
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

  Set<Marker> get _markers {
    final origin = _origin ?? _current ?? const LatLng(9.0765, 7.3986);
    final markers = <Marker>{
      Marker(markerId: const MarkerId('me'), position: origin),
      if (_dest != null)
        Marker(
          markerId: const MarkerId('dest'),
          position: _dest!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        ),
    };
    for (final d in _nearbyDrivers) {
      final lat = (d['lat'] as num?)?.toDouble();
      final lng = (d['lng'] as num?)?.toDouble();
      final id = d['id']?.toString() ?? '$lat-$lng';
      if (lat == null || lng == null) continue;
      markers.add(
        Marker(
          markerId: MarkerId('driver-$id'),
          position: LatLng(lat, lng),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: InfoWindow(
            title: d['name']?.toString() ?? 'Driver',
            snippet: '${(d['distanceKm'] as num?)?.toStringAsFixed(1) ?? '?'} km away',
          ),
        ),
      );
    }
    return markers;
  }

  Set<Circle> get _circles {
    final origin = _origin ?? _current;
    if (origin == null) return {};
    return {
      Circle(
        circleId: const CircleId('search'),
        center: origin,
        radius: _searchRadiusKm * 1000,
        fillColor: Tokens.green500.withValues(alpha: 0.08),
        strokeColor: Tokens.green500.withValues(alpha: 0.45),
        strokeWidth: 2,
      ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final origin = _origin ?? _current ?? const LatLng(9.0765, 7.3986);
    final mapHeight = MediaQuery.of(context).size.height * 0.4;
    final fare = _executiveFare();
    final driverCount = _nearbyDrivers.length;

    return Column(
      children: [
        SizedBox(
          height: mapHeight,
          child: Stack(
            children: [
              GoogleMap(
                initialCameraPosition: CameraPosition(target: origin, zoom: 14),
                myLocationEnabled: true,
                zoomControlsEnabled: false,
                markers: _markers,
                circles: _circles,
                onMapCreated: (c) => _mapController = c,
              ),
              Positioned(
                left: 12,
                right: 12,
                top: 12,
                child: Material(
                  color: Tokens.bgSurface.withValues(alpha: 0.94),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    child: Row(
                      children: [
                        const Icon(Icons.local_taxi, color: Tokens.green500, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            driverCount == 0
                                ? 'No drivers within ${_searchRadiusKm.toStringAsFixed(0)} km'
                                : '$driverCount driver${driverCount == 1 ? '' : 's'} within ${_searchRadiusKm.toStringAsFixed(0)} km',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                        ),
                        TextButton(
                          onPressed: _refreshNearbyDrivers,
                          child: const Text('Refresh'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
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
              const Text('Search radius', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _radiusOptions.map((r) {
                  final selected = _searchRadiusKm == r;
                  return ChoiceChip(
                    label: Text('${r.toStringAsFixed(0)} km'),
                    selected: selected,
                    selectedColor: Tokens.green100,
                    onSelected: (_) async {
                      setState(() => _searchRadiusKm = r);
                      await _refreshNearbyDrivers();
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              const Text('Ride type', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              AppCard(
                color: Tokens.green100,
                child: Row(
                  children: [
                    const Icon(Icons.airport_shuttle_outlined, color: Tokens.green500),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Jala Executive', style: TextStyle(fontWeight: FontWeight.w700)),
                          Text(
                            'Premium verified ride',
                            style: TextStyle(color: Tokens.textSecondary, fontSize: 13),
                          ),
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
              const SizedBox(height: 12),
              AppButton(
                label: _booking ? 'Requesting…' : 'Confirm Jala Executive',
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
