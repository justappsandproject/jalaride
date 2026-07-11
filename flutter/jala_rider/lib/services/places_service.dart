import 'api_client.dart';

class PlacePrediction {
  PlacePrediction({required this.placeId, required this.description});
  final String placeId;
  final String description;
}

class PlaceDetails {
  PlaceDetails({required this.lat, required this.lng, required this.label});
  final double lat;
  final double lng;
  final String label;
}

class DirectionsQuote {
  DirectionsQuote({
    required this.distanceKm,
    required this.durationMin,
    required this.fares,
    this.polyline,
    this.source = 'haversine',
  });
  final double distanceKm;
  final double durationMin;
  final List<Map<String, dynamic>> fares;
  final String? polyline;
  final String source;
}

class PlacesService {
  PlacesService({this.token});
  final String? token;

  ApiClient get _api => ApiClient(token: token);

  Future<List<PlacePrediction>> autocomplete(String input) async {
    if (input.trim().length < 2) return [];
    final data = await _api.placesAutocomplete(input.trim());
    final list = data['predictions'] as List? ?? [];
    return list
        .map((e) => PlacePrediction(
              placeId: (e as Map)['place_id']?.toString() ?? '',
              description: e['description']?.toString() ?? '',
            ))
        .where((p) => p.placeId.isNotEmpty)
        .toList();
  }

  Future<PlaceDetails?> details(String placeId) async {
    final data = await _api.placesDetails(placeId);
    final lat = data['lat'];
    final lng = data['lng'];
    if (lat is! num || lng is! num) return null;
    return PlaceDetails(
      lat: lat.toDouble(),
      lng: lng.toDouble(),
      label: data['label']?.toString() ?? 'Place',
    );
  }

  Future<String> reverse(double lat, double lng) async {
    final data = await _api.placesReverse(lat, lng);
    return data['label']?.toString() ?? 'Current location';
  }

  Future<DirectionsQuote> directions({
    required double originLat,
    required double originLng,
    required double destLat,
    required double destLng,
  }) async {
    final data = await _api.placesDirections(
      originLat: originLat,
      originLng: originLng,
      destLat: destLat,
      destLng: destLng,
    );
    final fares = (data['fares'] as List? ?? []).cast<Map<String, dynamic>>();
    return DirectionsQuote(
      distanceKm: (data['distanceKm'] as num?)?.toDouble() ?? 0,
      durationMin: (data['durationMin'] as num?)?.toDouble() ?? 0,
      fares: fares,
      polyline: data['polyline']?.toString(),
      source: data['source']?.toString() ?? 'haversine',
    );
  }
}
