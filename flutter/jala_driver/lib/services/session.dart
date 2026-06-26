import 'package:shared_preferences/shared_preferences.dart';

class Session {
  static const _tokenKey = 'jala_driver_token';
  static const _nameKey = 'jala_driver_name';

  static Future<void> save(String token, String name) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_tokenKey, token);
    await p.setString(_nameKey, name);
  }

  static Future<String?> loadToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_tokenKey);
  }

  static Future<String?> loadName() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_nameKey);
  }

  static Future<void> clear() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_tokenKey);
    await p.remove(_nameKey);
  }
}
