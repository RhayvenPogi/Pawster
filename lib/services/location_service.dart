import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

/// Thin wrapper around [Geolocator] and [permission_handler] that handles
/// permission checks, position fetching, and distance calculations.
class LocationService {
  // ---------------------------------------------------------------------------
  // Permission
  // ---------------------------------------------------------------------------

  /// Checks the current location permission and requests it if not yet decided.
  /// Returns a [LocationPermissionStatus] that the caller can act on.
  static Future<LocationPermissionStatus> checkAndRequestPermission() async {
    final status = await Permission.location.status;

    if (status.isGranted)           return LocationPermissionStatus.granted;
    if (status.isPermanentlyDenied) return LocationPermissionStatus.permanentlyDenied;

    // Not yet decided — prompt the user
    final result = await Permission.location.request();
    if (result.isGranted)           return LocationPermissionStatus.granted;
    if (result.isPermanentlyDenied) return LocationPermissionStatus.permanentlyDenied;
    return LocationPermissionStatus.denied;
  }

  // ---------------------------------------------------------------------------
  // Position
  // ---------------------------------------------------------------------------

  /// Returns the device's current [Position] at high accuracy,
  /// or null if location services are disabled or an error occurs.
  static Future<Position?> getCurrentPosition() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Distance
  // ---------------------------------------------------------------------------

  /// Returns the straight-line distance in kilometres between two coordinates.
  static double calculateDistanceKm(
      double lat1,
      double lng1,
      double lat2,
      double lng2,
      ) {
    // Geolocator returns metres; divide by 1000 to convert to kilometres
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2) / 1000;
  }
}

/// Result of a location permission check/request.
enum LocationPermissionStatus { granted, denied, permanentlyDenied }