/// Deprecated client geocoding — prefer [PlacesService] (server proxy).
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'places_service.dart';

class GeocodingService {
  static Future<LatLng?> addressToLatLng(String address, {String? token}) async {
    final places = PlacesService(token: token);
    final preds = await places.autocomplete(address);
    if (preds.isEmpty) return null;
    final details = await places.details(preds.first.placeId);
    if (details == null) return null;
    return LatLng(details.lat, details.lng);
  }
}
