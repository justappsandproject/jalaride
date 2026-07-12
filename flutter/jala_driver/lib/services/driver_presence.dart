import 'dart:async';
import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'api_client.dart';

/// Owns driver online/heartbeat for the whole app session.
/// Survives tab switches; does NOT go offline on background or dispose.
class DriverPresence extends ChangeNotifier with WidgetsBindingObserver {
  DriverPresence({required this.token});

  final String token;
  late final ApiClient _api = ApiClient(token: token);

  bool online = false;
  bool busy = false;
  String? availability;
  Timer? _heartbeat;

  Future<void> start() async {
    WidgetsBinding.instance.addObserver(this);
    await hydrate();
  }

  Future<void> hydrate() async {
    try {
      final data = await _api.driverMe();
      final driver = data['driver'] as Map<String, dynamic>?;
      if (driver == null) return;
      online = driver['isOnline'] == true;
      availability = driver['availability']?.toString();
      notifyListeners();
      if (online) {
        await _tickHeartbeat();
        _ensureHeartbeat();
      }
    } catch (_) {}
  }

  void _ensureHeartbeat() {
    _heartbeat?.cancel();
    if (!online) return;
    _heartbeat = Timer.periodic(const Duration(seconds: 10), (_) => _tickHeartbeat());
  }

  Future<void> _tickHeartbeat() async {
    if (!online) return;
    try {
      final p = await Geolocator.getCurrentPosition();
      await _api.heartbeat(lat: p.latitude, lng: p.longitude);
    } catch (_) {
      // Keep online sticky; miss beats are tolerated by 90s server window
    }
  }

  Future<void> setOnline(bool value) async {
    if (busy) return;
    busy = true;
    notifyListeners();
    try {
      if (value) {
        try {
          final p = await Geolocator.getCurrentPosition();
          await _api.goOnline(lat: p.latitude, lng: p.longitude);
        } catch (_) {
          await _api.goOnline();
        }
        online = true;
        availability = 'ONLINE';
        await _tickHeartbeat();
        _ensureHeartbeat();
      } else {
        await _api.goOffline();
        online = false;
        availability = 'OFFLINE';
        _heartbeat?.cancel();
        _heartbeat = null;
      }
      notifyListeners();
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  /// Call on sign-out only — explicit offline.
  Future<void> goOfflineForLogout() async {
    try {
      if (online) await _api.goOffline();
    } catch (_) {}
    online = false;
    _heartbeat?.cancel();
    _heartbeat = null;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Never auto-offline. On resume, refresh heartbeat immediately.
    if (state == AppLifecycleState.resumed && online) {
      _tickHeartbeat();
      _ensureHeartbeat();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Do NOT call goOffline — sticky until explicit toggle or logout.
    _heartbeat?.cancel();
    super.dispose();
  }
}
