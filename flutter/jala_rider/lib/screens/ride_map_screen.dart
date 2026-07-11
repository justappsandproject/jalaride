import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class RideMapScreen extends StatefulWidget {
  const RideMapScreen({
    super.key,
    required this.onDestinationPicked,
    this.initialDest,
  });

  final void Function(LatLng dest, String label) onDestinationPicked;
  final LatLng? initialDest;

  @override
  State<RideMapScreen> createState() => _RideMapScreenState();
}

class _RideMapScreenState extends State<RideMapScreen> {
  GoogleMapController? _map;
  LatLng? _current;
  LatLng? _dest;
  bool _loading = true;

  static const _abuja = LatLng(9.0765, 7.3986);

  @override
  void initState() {
    super.initState();
    _dest = widget.initialDest;
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() { _current = _abuja; _loading = false; });
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _current = LatLng(pos.latitude, pos.longitude);
        _loading = false;
      });
      _map?.animateCamera(CameraUpdate.newLatLngZoom(_current!, 14));
    } catch (_) {
      setState(() { _current = _abuja; _loading = false; });
    }
  }

  Set<Marker> get _markers => {
        if (_current != null)
          Marker(markerId: const MarkerId('me'), position: _current!, infoWindow: const InfoWindow(title: 'You')),
        if (_dest != null)
          Marker(markerId: const MarkerId('dest'), position: _dest!, icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen), infoWindow: const InfoWindow(title: 'Destination')),
      };

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final center = _current ?? _abuja;
    return Scaffold(
      appBar: AppBar(title: const Text('Pick destination')),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: center, zoom: 14),
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            markers: _markers,
            onMapCreated: (c) => _map = c,
            onTap: (latLng) => setState(() => _dest = latLng),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: ElevatedButton(
              onPressed: _dest == null
                  ? null
                  : () => widget.onDestinationPicked(_dest!, 'Selected on map'),
              child: const Text('Confirm destination'),
            ),
          ),
        ],
      ),
    );
  }
}
