import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:provider/provider.dart';
import '../models/vet_clinic.dart';
import '../services/clinic_provider.dart';

// Colors used across this file
const Color _primary   = Color(0xFF388E3C); // nearest clinic marker
const Color _secondary = Color(0xFF1976D2); // top-rated marker + user dot

/// Interactive map that plots the user's position and all clinic markers.
/// Nearest clinic uses [_primary]; top-rated clinics use [_secondary].
/// Tapping a marker fires [onMarkerTapped].
class ClinicMapWidget extends StatelessWidget {
  final MapController mapController;
  final void Function(VetClinic clinic) onMarkerTapped;

  const ClinicMapWidget({
    super.key,
    required this.mapController,
    required this.onMarkerTapped,
  });

  // Default map centre — La Union, Philippines
  static const LatLng laUnionCenter = LatLng(16.6157, 120.3188);

  @override
  Widget build(BuildContext context) {
    return Consumer<ClinicProvider>(
      builder: (context, provider, _) {
        return FlutterMap(
          mapController: mapController,
          options: const MapOptions(
            initialCenter: laUnionCenter,
            initialZoom: 11.0,
            minZoom: 8,
            maxZoom: 18,
          ),
          children: [
            // OpenStreetMap tile layer
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.pawnagaywan.vetclinic_locator',
              maxNativeZoom: 19,
            ),

            // Animated blue dot for the user's current position
            if (provider.userPosition != null)
              MarkerLayer(
                markers: [
                  Marker(
                    point: LatLng(
                      provider.userPosition!.latitude,
                      provider.userPosition!.longitude,
                    ),
                    width: 48,
                    height: 48,
                    child: _UserLocationMarker(),
                  ),
                ],
              ),

            // One pin per clinic; selected pin is enlarged
            MarkerLayer(
              markers: provider.clinics.map((clinic) {
                final isNearest  = provider.nearestClinic == clinic;
                final isSelected = provider.selectedClinic == clinic;
                return Marker(
                  point: LatLng(clinic.latitude, clinic.longitude),
                  width: isSelected ? 60 : 48,
                  height: isSelected ? 60 : 48,
                  child: GestureDetector(
                    onTap: () => onMarkerTapped(clinic),
                    child: _ClinicMarker(
                      isNearest: isNearest,
                      isTopRated: clinic.isTopRated,
                      isSelected: isSelected,
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Private sub-widgets
// ---------------------------------------------------------------------------

/// Pulsing blue dot that marks the user's GPS position.
class _UserLocationMarker extends StatefulWidget {
  @override
  State<_UserLocationMarker> createState() => _UserLocationMarkerState();
}

class _UserLocationMarkerState extends State<_UserLocationMarker>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    // Scale the outer ring between 60 % and 100 % to create a pulse effect
    _animation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (_, _) => Stack(
        alignment: Alignment.center,
        children: [
          // Pulsing outer ring
          Container(
            width: 48 * _animation.value,
            height: 48 * _animation.value,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _secondary.withOpacity(0.2),
            ),
          ),
          // Solid inner dot
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _secondary,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: _secondary.withOpacity(0.5),
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Map pin for a clinic.
/// Colour priority: top-rated (blue) > nearest (green) > default (green).
/// Selected pins scale up via [AnimatedScale].
class _ClinicMarker extends StatelessWidget {
  final bool isNearest;
  final bool isTopRated;
  final bool isSelected;

  const _ClinicMarker({
    required this.isNearest,
    required this.isTopRated,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    // Top-rated takes colour priority over nearest
    final color = isTopRated ? _secondary : _primary;

    return AnimatedScale(
      scale: isSelected ? 1.2 : 1.0,
      duration: const Duration(milliseconds: 200),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Circular icon head
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: isSelected ? 3 : 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.5),
                  blurRadius: isSelected ? 12 : 6,
                  spreadRadius: isSelected ? 3 : 1,
                ),
              ],
            ),
            child: const Icon(
              Icons.local_hospital_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          // Triangular pin tip
          CustomPaint(
            painter: _PinTipPainter(color: color),
            size: const Size(12, 6),
          ),
        ],
      ),
    );
  }
}

/// Draws the downward-pointing triangle that forms the pin tip.
class _PinTipPainter extends CustomPainter {
  final Color color;

  _PinTipPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}