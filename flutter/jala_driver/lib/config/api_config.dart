/// Canonical API configuration — single source of truth for mobile apps.
class ApiConfig {
  /// Production Render API (do not typo: onrender.com not onender.com).
  static const String productionBaseUrl = 'https://jala-ride-api.onrender.com';

  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_URL');
    if (fromEnv.isEmpty) return productionBaseUrl;
    final sanitized = sanitizeUrl(fromEnv);
    if (!_isAllowedHost(sanitized)) return productionBaseUrl;
    return sanitized;
  }

  static bool _isAllowedHost(String url) {
    try {
      final host = Uri.parse(url).host.toLowerCase();
      return host == 'jala-ride-api.onrender.com' ||
          host == 'localhost' ||
          host == '127.0.0.1' ||
          host == '10.0.2.2';
    } catch (_) {
      return false;
    }
  }

  static String sanitizeUrl(String raw) {
    var url = raw.trim();
    url = url.replaceAll(',', '.');
    url = url.replaceAll('onender.com', 'onrender.com');
    url = url.replaceAll('jala-ride,onrender', 'jala-ride-api.onrender');
    url = url.replaceAll('jala-ride.onrender', 'jala-ride-api.onrender');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://$url';
    }
    while (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }
    return url;
  }

  static Uri uri(String path, [Map<String, String>? query]) {
    final base = Uri.parse('$baseUrl$path');
    if (query == null || query.isEmpty) return base;
    return base.replace(queryParameters: query);
  }
}
