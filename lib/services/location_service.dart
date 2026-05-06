// lib/services/location_service.dart

import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

class LocationService {
  static Future<LocationPermissionStatus> checkAndRequestPermission() async {
    final status = await Permission.location.status;

    if (status.isGranted) return LocationPermissionStatus.granted;
    if (status.isPermanentlyDenied) {
      return LocationPermissionStatus.permanentlyDenied;
    }

    final result = await Permission.location.request();
    if (result.isGranted) return LocationPermissionStatus.granted;
    if (result.isPermanentlyDenied) {
      return LocationPermissionStatus.permanentlyDenied;
    }
    return LocationPermissionStatus.denied;
  }

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

  static double calculateDistanceKm(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2) / 1000;
  }
}

enum LocationPermissionStatus { granted, denied, permanentlyDenied }
