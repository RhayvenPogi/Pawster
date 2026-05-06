// lib/widgets/clinic_map_widget.dart

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:provider/provider.dart';
import '../models/vet_clinic.dart';
import '../services/clinic_provider.dart';
import '../utils/app_theme.dart';

class ClinicMapWidget extends StatelessWidget {
  final MapController mapController;
  final void Function(VetClinic clinic) onMarkerTapped;

  const ClinicMapWidget({
    super.key,
    required this.mapController,
    required this.onMarkerTapped,
  });

  // Center of La Union, Philippines
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
            // OSM Tile Layer
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.example.vetclinic_locator',
              maxNativeZoom: 19,
            ),

            // User location marker
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

            // Clinic markers
            MarkerLayer(
              markers: provider.clinics.map((clinic) {
                final isNearest = provider.nearestClinic == clinic;
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

class _UserLocationMarker extends StatefulWidget {
  @override
  State<_UserLocationMarker> createState() => _UserLocationMarkerState();
}

class _UserLocationMarkerState extends State<_UserLocationMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _animation = Tween<double>(
      begin: 0.6,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
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
          Container(
            width: 48 * _animation.value,
            height: 48 * _animation.value,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.secondary.withOpacity(0.2),
            ),
          ),
          Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.secondary,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.secondary.withOpacity(0.5),
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
    Color color = AppTheme.primary;
    if (isNearest) color = AppTheme.nearestBadge;
    if (isTopRated) color = AppTheme.topRatedBadge;

    return AnimatedScale(
      scale: isSelected ? 1.2 : 1.0,
      duration: const Duration(milliseconds: 200),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
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
          // Pin tip
          CustomPaint(
            painter: _PinTipPainter(color: color),
            size: const Size(12, 6),
          ),
        ],
      ),
    );
  }
}

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
