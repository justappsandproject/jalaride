import 'dart:convert';
import 'package:http/http.dart' as http;

const apiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://jala-ride-api.onrender.com',
);

class ApiClient {
  ApiClient({this.token});

  String? token;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await http.post(
      Uri.parse('$apiBaseUrl/v1/auth/login'),
      headers: _headers,
      body: jsonEncode({'phone': phone, 'password': password}),
    );
    return _decode(res);
  }

  Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    required String name,
    String role = 'RIDER',
  }) async {
    final res = await http.post(
      Uri.parse('$apiBaseUrl/v1/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'phone': phone,
        'password': password,
        'name': name,
        'role': role,
      }),
    );
    return _decode(res);
  }

  Future<List<dynamic>> myRides() async {
    final res = await http.get(
      Uri.parse('$apiBaseUrl/v1/rides/mine'),
      headers: _headers,
    );
    final data = _decode(res);
    final rides = data['rides'];
    if (rides is List) return rides;
    return [];
  }

  Future<Map<String, dynamic>> createRide({
    required double originLat,
    required double originLng,
    required double destLat,
    required double destLng,
    String? originLabel,
    String? destLabel,
  }) async {
    final res = await http.post(
      Uri.parse('$apiBaseUrl/v1/rides'),
      headers: _headers,
      body: jsonEncode({
        'originLat': originLat,
        'originLng': originLng,
        'destLat': destLat,
        'destLng': destLng,
        if (originLabel != null) 'originLabel': originLabel,
        if (destLabel != null) 'destLabel': destLabel,
      }),
    );
    return _decode(res);
  }

  Map<String, dynamic> _decode(http.Response res) {
    final body = res.body.isEmpty ? <String, dynamic>{} : jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg = body is Map ? (body['message'] ?? body['error'] ?? res.body) : res.body;
      throw Exception(msg.toString());
    }
    return body is Map<String, dynamic> ? body : {'data': body};
  }
}
