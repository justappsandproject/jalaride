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
  }) async {
    final res = await http.post(
      Uri.parse('$apiBaseUrl/v1/auth/register'),
      headers: _headers,
      body: jsonEncode({
        'phone': phone,
        'password': password,
        'name': name,
        'role': 'DRIVER',
      }),
    );
    return _decode(res);
  }

  Future<void> goOnline() async {
    await http.post(Uri.parse('$apiBaseUrl/v1/driver/online'), headers: _headers);
  }

  Future<void> goOffline() async {
    await http.post(Uri.parse('$apiBaseUrl/v1/driver/offline'), headers: _headers);
  }

  Future<List<dynamic>> availableRides() async {
    final res = await http.get(Uri.parse('$apiBaseUrl/v1/rides/available'), headers: _headers);
    final data = _decode(res);
    final rides = data['rides'];
    if (rides is List) return rides;
    return [];
  }

  Future<void> acceptRide(String id) async {
    await http.post(Uri.parse('$apiBaseUrl/v1/rides/$id/accept'), headers: _headers);
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
