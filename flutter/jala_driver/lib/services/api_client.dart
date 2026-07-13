import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiClient {
  ApiClient({this.token});

  String? token;

  static const _timeout = Duration(seconds: 90);
  static const _maxAttempts = 3;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> login(String phone, String password) async {
    return _decode(await _post(ApiConfig.uri('/v1/auth/login'), {
      'phone': phone,
      'password': password,
    }));
  }

  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    required String name,
  }) async {
    return _decode(await _post(ApiConfig.uri('/v1/auth/register'), {
      'phone': phone,
      'password': password,
      'name': name,
      'role': 'DRIVER',
    }));
  }

  Future<Map<String, dynamic>> me() async {
    return _decode(await _get(ApiConfig.uri('/v1/auth/me')));
  }

  Future<Map<String, dynamic>> verifyNin(String nin) async {
    return _decode(await _post(ApiConfig.uri('/v1/nimc/verify'), {'nin': nin}));
  }

  Future<Map<String, dynamic>> saveProfile({
    required String nin,
    required String name,
    required String dob,
    required String address,
    required String phone,
    String? email,
  }) async {
    return _decode(await _post(ApiConfig.uri('/v1/onboarding/profile'), {
      'nin': nin,
      'name': name,
      'dob': dob,
      'address': address,
      'phone': phone,
      'email': email ?? '',
    }));
  }

  Future<Map<String, dynamic>> uploadDocument({
    required String docType,
    required String fileData,
  }) async {
    return _decode(await _post(ApiConfig.uri('/v1/onboarding/document'), {
      'docType': docType,
      'fileData': fileData,
    }));
  }

  Future<Map<String, dynamic>> submitOnboarding() async {
    return _decode(await _post(ApiConfig.uri('/v1/onboarding/submit'), {}));
  }

  Future<Map<String, dynamic>> onboardingStatus() async {
    return _decode(await _get(ApiConfig.uri('/v1/onboarding/status')));
  }

  Future<void> goOnline({double? lat, double? lng, double? heading}) async {
    await _post(ApiConfig.uri('/v1/driver/online'), {
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (heading != null) 'heading': heading,
    });
  }

  Future<void> goOffline() async {
    await _post(ApiConfig.uri('/v1/driver/offline'), {});
  }

  Future<Map<String, dynamic>> driverMe() async {
    return _decode(await _get(ApiConfig.uri('/v1/driver/me')));
  }

  Future<void> heartbeat({
    required double lat,
    required double lng,
    double? heading,
  }) async {
    await _post(ApiConfig.uri('/v1/driver/heartbeat'), {
      'lat': lat,
      'lng': lng,
      if (heading != null) 'heading': heading,
    });
  }

  Future<List<dynamic>> pendingOffers() async {
    final data = _decode(await _get(ApiConfig.uri('/v1/driver/offers')));
    final offers = data['offers'];
    if (offers is List) return offers;
    return [];
  }

  Future<Map<String, dynamic>> acceptOffer(String offerId) async {
    return _decode(await _post(ApiConfig.uri('/v1/driver/offers/$offerId/accept'), {}));
  }

  Future<void> declineOffer(String offerId) async {
    await _post(ApiConfig.uri('/v1/driver/offers/$offerId/decline'), {});
  }

  Future<List<dynamic>> availableRides() async {
    final data = _decode(await _get(ApiConfig.uri('/v1/rides/available')));
    final offers = data['offers'];
    if (offers is List && offers.isNotEmpty) return offers;
    final rides = data['rides'];
    if (rides is List) return rides;
    return [];
  }

  Future<Map<String, dynamic>?> activeRide() async {
    final data = _decode(await _get(ApiConfig.uri('/v1/rides/active')));
    return data['ride'] as Map<String, dynamic>?;
  }

  Future<Map<String, dynamic>> getRide(String id) async {
    final data = _decode(await _get(ApiConfig.uri('/v1/rides/$id')));
    return data['ride'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> confirmPayment(String rideId, {String? method}) async =>
      _decode(await _post(ApiConfig.uri('/v1/rides/$rideId/confirm-payment'), {
        if (method != null) 'method': method,
      }));

  Future<Map<String, dynamic>> acceptRide(String id) async {
    return _decode(await _post(ApiConfig.uri('/v1/rides/$id/accept'), {}));
  }

  Future<Map<String, dynamic>> enRoute(String id) async {
    return _decode(await _post(ApiConfig.uri('/v1/rides/$id/en-route'), {}));
  }

  Future<Map<String, dynamic>> arrived(String id) async {
    return _decode(await _post(ApiConfig.uri('/v1/rides/$id/arrived'), {}));
  }

  Future<Map<String, dynamic>> confirmPin(String id) async {
    return _decode(await _post(ApiConfig.uri('/v1/rides/$id/confirm-pin'), {}));
  }

  Future<Map<String, dynamic>> startRide(String id) async {
    return _decode(await _post(ApiConfig.uri('/v1/rides/$id/start'), {}));
  }

  Future<Map<String, dynamic>> completeRide(String id) async {
    return _decode(await _post(ApiConfig.uri('/v1/rides/$id/complete'), {}));
  }

  Future<Map<String, dynamic>> verifyPin(String rideId, {String? pin}) async =>
      _decode(await _post(ApiConfig.uri('/v1/rides/$rideId/verify-pin'), {
        if (pin != null) 'pin': pin,
      }));

  Future<Map<String, dynamic>> rateRide(String rideId, {required int score, List<String> tags = const [], String? comment}) async =>
      _decode(await _post(ApiConfig.uri('/v1/rides/$rideId/rate'), {
        'score': score,
        'tags': tags,
        if (comment != null) 'comment': comment,
      }));

  Future<List<dynamic>> myRides() async {
    final data = _decode(await _get(ApiConfig.uri('/v1/rides/mine')));
    final rides = data['rides'];
    if (rides is List) return rides;
    return [];
  }

  Future<Map<String, dynamic>> earningsSummary() async =>
      _decode(await _get(ApiConfig.uri('/v1/driver/earnings/summary')));

  Future<Map<String, dynamic>> triggerSos({
    String? rideId,
    double? lat,
    double? lng,
    bool silent = false,
  }) async {
    return _decode(await _post(ApiConfig.uri('/v1/safety/sos'), {
      if (rideId != null) 'rideId': rideId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      'silent': silent,
    }));
  }

  Future<Map<String, dynamic>> uploadRecording({
    String? rideId,
    required bool active,
    String? recordingId,
    String? fileData,
    String? mimeType,
    int? durationSec,
  }) async {
    return _decode(await _post(ApiConfig.uri('/v1/safety/recording'), {
      if (rideId != null) 'rideId': rideId,
      'active': active,
      if (recordingId != null) 'recordingId': recordingId,
      if (fileData != null) 'fileData': fileData,
      if (mimeType != null) 'mimeType': mimeType,
      if (durationSec != null) 'durationSec': durationSec,
    }));
  }

  Future<List<dynamic>> listRecordings(String rideId) async {
    final data = _decode(await _get(ApiConfig.uri('/v1/safety/recordings', {'rideId': rideId})));
    return data['recordings'] is List ? data['recordings'] as List<dynamic> : [];
  }

  Future<http.Response> _get(Uri uri) => _send(() => http.get(uri, headers: _headers));

  Future<http.Response> _post(Uri uri, Map<String, dynamic> body) =>
      _send(() => http.post(uri, headers: _headers, body: jsonEncode(body)));

  Future<http.Response> _send(Future<http.Response> Function() request) async {
    Object? lastError;
    for (var attempt = 1; attempt <= _maxAttempts; attempt++) {
      try {
        return await request().timeout(_timeout);
      } on SocketException catch (e) {
        lastError = e;
      } on http.ClientException catch (e) {
        lastError = e;
      } on TimeoutException catch (e) {
        lastError = e;
      }
      if (attempt < _maxAttempts) {
        await Future<void>.delayed(Duration(seconds: 2 * attempt));
      }
    }
    throw Exception(_networkMessage(lastError));
  }

  String _networkMessage(Object? error) {
    final msg = error?.toString() ?? '';
    if (msg.contains('TimeoutException') || msg.contains('timed out')) {
      return 'Server is waking up (can take up to 90s on first try). Please wait and try again.';
    }
    return 'Cannot reach Jala Ride API at ${ApiConfig.baseUrl}. Check your internet connection and try again.';
  }

  Map<String, dynamic> _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg = body is Map ? (body['message'] ?? body['error'] ?? res.body) : res.body;
      final state = body is Map ? (body['current'] ?? body['status']) : null;
      throw Exception(state == null ? msg.toString() : '$msg (current: $state)');
    }
    return body is Map<String, dynamic> ? body : {'data': body};
  }
}
