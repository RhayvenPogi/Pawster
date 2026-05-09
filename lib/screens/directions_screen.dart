// lib/screens/directions_screen.dart
// Live tracking + OSRM routing + Philippine transport fare estimates
// Fare rates effective March 19, 2026 (LTFRB)

import 'dart:math';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/vet_clinic.dart';
import '../utils/app_theme.dart';

class DirectionsScreen extends StatefulWidget {
  final VetClinic clinic;
  final Position currentPosition;

  const DirectionsScreen({
    super.key,
    required this.clinic,
    required this.currentPosition,
  });

  @override
  State<DirectionsScreen> createState() => _DirectionsScreenState();
}

class _DirectionsScreenState extends State<DirectionsScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  late TabController _tabController;

  // Route data
  List<LatLng> _routePoints = [];
  double _distanceKm  = 0;
  double _durationMin = 0;
  bool _isLoadingRoute = true;
  String? _routeError;

  // Live tracking
  StreamSubscription<Position>? _positionStream;
  Position? _currentPosition;
  LatLng? _animatedUserLatLng;
  bool _isTracking = false;
  bool _followUser  = true;

  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() => _tabIndex = _tabController.index);
    });
    _currentPosition = widget.currentPosition;
    _animatedUserLatLng = LatLng(
      widget.currentPosition.latitude,
      widget.currentPosition.longitude,
    );
    _getRouteFromOSRM(widget.currentPosition);
    _startTracking();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  // ── Live location tracking ─────────────────────────────────────────────────

  void _startTracking() {
    setState(() => _isTracking = true);
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((position) {
      if (!mounted) return;
      setState(() {
        _currentPosition = position;
        _animatedUserLatLng = LatLng(position.latitude, position.longitude);
      });

      if (_followUser && mounted) {
        _mapController.move(
          LatLng(position.latitude, position.longitude),
          _mapController.camera.zoom,
        );
      }

      final prev = _routePoints.isNotEmpty ? _routePoints.first : null;
      if (prev != null) {
        final moved = _haversineKm(
          prev.latitude, prev.longitude,
          position.latitude, position.longitude,
        );
        if (moved > 0.05) _getRouteFromOSRM(position);
      }
    }, onError: (_) => setState(() => _isTracking = false));
  }

  // ── OSRM routing ───────────────────────────────────────────────────────────

  Future<void> _getRouteFromOSRM(Position from) async {
    final origin = '${from.longitude},${from.latitude}';
    final dest   = '${widget.clinic.longitude},${widget.clinic.latitude}';
    final url =
        'https://router.project-osrm.org/route/v1/driving/$origin;$dest'
        '?overview=full&geometries=geojson';

    try {
      final response =
      await http.get(Uri.parse(url)).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && (data['routes'] as List).isNotEmpty) {
          final route  = data['routes'][0];
          final coords = route['geometry']['coordinates'] as List;
          final points = coords
              .map<LatLng>((c) => LatLng(c[1] as double, c[0] as double))
              .toList();
          final distKm = (route['distance'] as num) / 1000;
          final durMin = (route['duration'] as num) / 60;

          if (mounted) {
            final wasLoading = _isLoadingRoute;
            setState(() {
              _routePoints    = points;
              _distanceKm     = distKm;
              _durationMin    = durMin;
              _isLoadingRoute = false;
              _routeError     = null;
            });
            if (wasLoading && points.isNotEmpty) {
              _mapController.fitCamera(
                CameraFit.bounds(
                  bounds: LatLngBounds.fromPoints(points),
                  padding: const EdgeInsets.all(60),
                ),
              );
            }
          }
          return;
        }
      }
    } catch (_) {}

    _setFallbackRoute(from);
  }

  void _setFallbackRoute(Position from) {
    final origin = LatLng(from.latitude, from.longitude);
    final dest   = LatLng(widget.clinic.latitude, widget.clinic.longitude);
    final points = <LatLng>[origin];
    final latStep = (dest.latitude  - origin.latitude)  / 5;
    final lngStep = (dest.longitude - origin.longitude) / 5;
    for (int i = 1; i <= 4; i++) {
      points.add(LatLng(
        origin.latitude  + latStep * i,
        origin.longitude + lngStep * i,
      ));
    }
    points.add(dest);
    final d = _haversineKm(
      origin.latitude, origin.longitude, dest.latitude, dest.longitude,
    );
    if (mounted) {
      setState(() {
        _routePoints    = points;
        _distanceKm     = d;
        _durationMin    = d / 40 * 60;
        _isLoadingRoute = false;
        _routeError     = 'Using straight-line estimate (OSRM unavailable)';
      });
    }
  }

  // ── Haversine ──────────────────────────────────────────────────────────────

  double _haversineKm(double la1, double lo1, double la2, double lo2) {
    const R   = 6371.0;
    final dLat = (la2 - la1) * pi / 180;
    final dLon = (lo2 - lo1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(la1 * pi / 180) * cos(la2 * pi / 180) *
            sin(dLon / 2) * sin(dLon / 2);
    return R * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  // ── Fare helpers (LTFRB, Mar 19 2026) ─────────────────────────────────────

  String _jeepney(double d) {
    final min = d <= 4 ? 14.0 : 14.0 + (d - 4) * 2.00;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.10).toStringAsFixed(2)}';
  }

  String _tricycle(double d) {
    final min = d <= 2 ? 20.0 : 20.0 + (d - 2) * 3.00;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.20).toStringAsFixed(2)}';
  }

  String _busOrdinary(double d) {
    final min = d <= 5 ? 20.0 : 20.0 + (d - 5) * 1.85;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.08).toStringAsFixed(2)}';
  }

  String _busAircon(double d) {
    final min = d <= 5 ? 50.0 : 50.0 + (d - 5) * 2.20;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.08).toStringAsFixed(2)}';
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final pos        = _currentPosition ?? widget.currentPosition;
    final userLatLng = LatLng(pos.latitude, pos.longitude);
    final destLatLng = LatLng(widget.clinic.latitude, widget.clinic.longitude);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.clinic.name, overflow: TextOverflow.ellipsis),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _isTracking
                            ? const Color(0xFF69F0AE)
                            : AppTheme.danger,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      _isTracking ? 'Live' : 'Off',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          labelStyle:
          const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.map_rounded, size: 18), text: 'Map'),
            Tab(
              icon: Icon(Icons.directions_bus_rounded, size: 18),
              text: 'Fares',
            ),
          ],
        ),
      ),
      body: _tabIndex == 0
          ? _buildMapTab(userLatLng, destLatLng)
          : _buildFaresTab(),
    );
  }

  // ── Map Tab ────────────────────────────────────────────────────────────────

  Widget _buildMapTab(LatLng userLatLng, LatLng destLatLng) {
    final markerLatLng = _animatedUserLatLng ?? userLatLng;

    return Stack(
      children: [
        Column(
          children: [
            // Fallback warning banner
            if (_routeError != null)
              Container(
                padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                color: AppTheme.accentTint,
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: AppTheme.accent, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _routeError!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Info bar
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: AppTheme.primaryTint,
              child: Row(
                children: [
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.straighten_rounded,
                      iconColor: AppTheme.secondary,
                      label: _isLoadingRoute
                          ? '—'
                          : '${_distanceKm.toStringAsFixed(1)} km',
                      sublabel: 'Distance',
                    ),
                  ),
                  Container(width: 1, height: 32, color: AppTheme.surface),
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.timer_rounded,
                      iconColor: AppTheme.accent,
                      label: _isLoadingRoute
                          ? '—'
                          : '${_durationMin.toStringAsFixed(0)} min',
                      sublabel: 'Drive time',
                    ),
                  ),
                  Container(width: 1, height: 32, color: AppTheme.surface),
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.directions_bus_rounded,
                      iconColor: AppTheme.primary,
                      label: _isLoadingRoute
                          ? '—'
                          : _jeepney(_distanceKm).split(' –').first,
                      sublabel: 'Jeepney est.',
                    ),
                  ),
                ],
              ),
            ),

            // Map
            Expanded(
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: userLatLng,
                  initialZoom: 13,
                  onPositionChanged: (_, hasGesture) {
                    if (hasGesture) setState(() => _followUser = false);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.example.pawaywan',
                  ),
                  if (_routePoints.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: _routePoints,
                          color: AppTheme.secondary,
                          strokeWidth: 5,
                        ),
                      ],
                    ),
                  MarkerLayer(
                    markers: [
                      // Animated user marker
                      Marker(
                        point: markerLatLng,
                        width: 56,
                        height: 56,
                        child: _AnimatedUserMarker(
                          color: AppTheme.secondary,
                        ),
                      ),
                      // Destination marker
                      _buildMarker(
                        destLatLng,
                        AppTheme.primary,
                        Icons.local_hospital_rounded,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),

        // FABs
        Positioned(
          right: 16,
          bottom: 16,
          child: Column(
            children: [
              FloatingActionButton.small(
                heroTag: 'follow',
                onPressed: () {
                  setState(() => _followUser = true);
                  _mapController.move(markerLatLng, 15);
                },
                backgroundColor:
                _followUser ? AppTheme.primary : AppTheme.cardBg,
                child: Icon(
                  Icons.my_location_rounded,
                  color: _followUser ? Colors.white : AppTheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              FloatingActionButton.small(
                heroTag: 'fit',
                onPressed: () {
                  setState(() => _followUser = false);
                  if (_routePoints.isNotEmpty) {
                    _mapController.fitCamera(
                      CameraFit.bounds(
                        bounds: LatLngBounds.fromPoints(_routePoints),
                        padding: const EdgeInsets.all(60),
                      ),
                    );
                  }
                },
                backgroundColor: AppTheme.cardBg,
                child: const Icon(Icons.fit_screen_rounded,
                    color: AppTheme.secondary),
              ),
            ],
          ),
        ),

        // Loading overlay
        if (_isLoadingRoute)
          Positioned.fill(
            child: Container(
              color: Colors.black26,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg,
                    borderRadius:
                    BorderRadius.circular(AppTheme.radiusLg),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: AppTheme.primary),
                      SizedBox(height: 14),
                      Text(
                        'Getting route...',
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Marker _buildMarker(LatLng point, Color color, IconData icon) {
    return Marker(
      point: point,
      width: 46,
      height: 46,
      child: Container(
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.45), blurRadius: 10),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  // ── Fares Tab ──────────────────────────────────────────────────────────────

  Widget _buildFaresTab() {
    final d = _distanceKm;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primary,
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius:
                    BorderRadius.circular(AppTheme.radiusMd),
                  ),
                  child: const Icon(Icons.directions_bus_rounded,
                      color: Colors.white, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.clinic.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _isLoadingRoute
                            ? 'Calculating...'
                            : '${d.toStringAsFixed(1)} km  ·  ${_durationMin.toStringAsFixed(0)} min drive',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          const Text(
            'Estimated fare',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'LTFRB standard rates · min – max range',
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 14),

          _FareCard(
            icon: Icons.airport_shuttle_rounded,
            iconColor: AppTheme.accent,
            iconBg: AppTheme.accentTint,
            name: 'Jeepney',
            fare: _isLoadingRoute ? '—' : _jeepney(d),
            details: d <= 4
                ? 'Min fare covers first 4 km'
                : '₱14 base + ₱2.00/km after 4 km',
            tip: 'Cheapest option for most trips',
          ),
          _FareCard(
            icon: Icons.electric_rickshaw_rounded,
            iconColor: AppTheme.primary,
            iconBg: AppTheme.primaryTint,
            name: 'Tricycle',
            fare: _isLoadingRoute ? '—' : _tricycle(d),
            details: d <= 2
                ? 'Min fare covers first 2 km'
                : '₱20 base + ₱3.00/km after 2 km',
            tip: 'Best for short / last-mile trips',
          ),
          _FareCard(
            icon: Icons.directions_bus_rounded,
            iconColor: AppTheme.secondary,
            iconBg: AppTheme.secondaryTint,
            name: 'Bus — ordinary',
            fare: _isLoadingRoute ? '—' : _busOrdinary(d),
            details: d <= 5
                ? 'Min fare covers first 5 km'
                : '₱20 base + ₱1.85/km after 5 km',
            tip: 'Non-aircon, lower fare',
          ),
          _FareCard(
            icon: Icons.directions_bus_filled_rounded,
            iconColor: const Color(0xFF6D4C9F),
            iconBg: const Color(0xFFF0EAF9),
            name: 'Bus — aircon / big bus',
            fare: _isLoadingRoute ? '—' : _busAircon(d),
            details: d <= 5
                ? 'Min fare covers first 5 km'
                : '₱50 base + ₱2.20/km after 5 km',
            tip: 'P2P, provincial, or aircon routes',
          ),

          const SizedBox(height: 16),

          // Disclaimer
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.primaryTint,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              border: Border.all(color: AppTheme.surface),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline_rounded,
                    size: 16, color: AppTheme.primary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Fares are estimates based on LTFRB standard rates. '
                        'Ranges reflect typical variance by route, operator, and '
                        'surcharges. Actual fares may differ. Updates live as you move.',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

// ── Animated user marker ───────────────────────────────────────────────────────

class _AnimatedUserMarker extends StatefulWidget {
  final Color color;
  const _AnimatedUserMarker({required this.color});

  @override
  State<_AnimatedUserMarker> createState() => _AnimatedUserMarkerState();
}

class _AnimatedUserMarkerState extends State<_AnimatedUserMarker>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _pulseAnim,
      builder: (_, __) => Stack(
        alignment: Alignment.center,
        children: [
          // Outer pulsing ring
          Opacity(
            opacity: 1.0 - _pulseAnim.value,
            child: Transform.scale(
              scale: 0.6 + _pulseAnim.value * 0.8,
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.color.withOpacity(0.25),
                ),
              ),
            ),
          ),
          // Inner accent ring
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.color.withOpacity(0.15),
              border: Border.all(
                color: widget.color.withOpacity(0.4),
                width: 1.5,
              ),
            ),
          ),
          // Core dot
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: widget.color.withOpacity(0.5),
                  blurRadius: 8,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: const Icon(
              Icons.navigation_rounded,
              color: Colors.white,
              size: 12,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Widgets ────────────────────────────────────────────────────────────────────

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String sublabel;

  const _InfoTile({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.sublabel,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: iconColor, size: 18),
        const SizedBox(height: 3),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        Text(
          sublabel,
          style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
        ),
      ],
    );
  }
}

class _FareCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String name;
  final String fare;
  final String details;
  final String tip;

  const _FareCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.name,
    required this.fare,
    required this.details,
    required this.tip,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.cardBg,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(color: AppTheme.borderLight),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(AppTheme.radiusSm),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  details,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
                Text(
                  tip,
                  style: TextStyle(
                    fontSize: 11,
                    color: iconColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            fare,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: iconColor,
            ),
          ),
        ],
      ),
    );
  }
}