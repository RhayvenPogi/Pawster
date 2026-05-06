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
  double _distanceKm = 0;
  double _durationMin = 0;
  bool _isLoadingRoute = true;
  String? _routeError;

  // Live tracking
  StreamSubscription<Position>? _positionStream;
  Position? _currentPosition;
  bool _isTracking = false;
  bool _followUser = true;

  // Tab: map or fares
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() => _tabIndex = _tabController.index);
    });
    _currentPosition = widget.currentPosition;
    _getRouteFromOSRM(widget.currentPosition);
    _startTracking();
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  // ── Live location tracking ───────────────────────────────────────────────────

  void _startTracking() {
    setState(() => _isTracking = true);
    _positionStream =
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 10, // update every 10 metres moved
          ),
        ).listen((position) {
          if (!mounted) return;
          setState(() => _currentPosition = position);

          // Move map camera if following is on
          if (_followUser && mounted) {
            _mapController.move(
              LatLng(position.latitude, position.longitude),
              _mapController.camera.zoom,
            );
          }

          // Recalculate route every ~50m
          final prev = _routePoints.isNotEmpty ? _routePoints.first : null;
          if (prev != null) {
            final moved = _haversineKm(
              prev.latitude,
              prev.longitude,
              position.latitude,
              position.longitude,
            );
            if (moved > 0.05) {
              _getRouteFromOSRM(position);
            }
          }
        }, onError: (_) => setState(() => _isTracking = false));
  }

  // ── OSRM routing ─────────────────────────────────────────────────────────────

  Future<void> _getRouteFromOSRM(Position from) async {
    final origin = '${from.longitude},${from.latitude}';
    final dest = '${widget.clinic.longitude},${widget.clinic.latitude}';
    final url =
        'https://router.project-osrm.org/route/v1/driving/$origin;$dest'
        '?overview=full&geometries=geojson';

    try {
      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null && (data['routes'] as List).isNotEmpty) {
          final route = data['routes'][0];
          final coords = route['geometry']['coordinates'] as List;
          final points = coords
              .map<LatLng>((c) => LatLng(c[1] as double, c[0] as double))
              .toList();

          final distKm = (route['distance'] as num) / 1000;
          final durMin = (route['duration'] as num) / 60;

          if (mounted) {
            final wasLoading = _isLoadingRoute;
            setState(() {
              _routePoints = points;
              _distanceKm = distKm;
              _durationMin = durMin;
              _isLoadingRoute = false;
              _routeError = null;
            });

            // Fit map bounds on first load
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

    // Fallback to straight line
    _setFallbackRoute(from);
  }

  void _setFallbackRoute(Position from) {
    final origin = LatLng(from.latitude, from.longitude);
    final dest = LatLng(widget.clinic.latitude, widget.clinic.longitude);
    final points = <LatLng>[origin];
    final latStep = (dest.latitude - origin.latitude) / 5;
    final lngStep = (dest.longitude - origin.longitude) / 5;
    for (int i = 1; i <= 4; i++) {
      points.add(
        LatLng(origin.latitude + latStep * i, origin.longitude + lngStep * i),
      );
    }
    points.add(dest);
    final d = _haversineKm(
      origin.latitude,
      origin.longitude,
      dest.latitude,
      dest.longitude,
    );
    if (mounted) {
      setState(() {
        _routePoints = points;
        _distanceKm = d;
        _durationMin = d / 40 * 60;
        _isLoadingRoute = false;
        _routeError = 'Using straight line (OSRM unavailable)';
      });
    }
  }

  // ── Haversine ────────────────────────────────────────────────────────────────

  double _haversineKm(double la1, double lo1, double la2, double lo2) {
    const R = 6371.0;
    final dLat = (la2 - la1) * pi / 180;
    final dLon = (lo2 - lo1) * pi / 180;
    final a =
        sin(dLat / 2) * sin(dLat / 2) +
        cos(la1 * pi / 180) *
            cos(la2 * pi / 180) *
            sin(dLon / 2) *
            sin(dLon / 2);
    return R * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  // ── Fare helpers ─────────────────────────────────────────────────────────────
  //
  // Returns a "₱min – ₱max" range string.
  // Min  = standard rate; Max = min × variance multiplier:
  //        jeepney +10%, tricycle +20%, ordinary bus +8%, aircon bus +8%.
  //
  //   Jeepney (traditional) : ₱14 base / first 4 km, ₱2.00/km after   (Mar 19 2026)
  //   Tricycle              : ₱20 base / first 2 km, ₱3.00/km after
  //   Ordinary bus          : ₱20 base / first 5 km, ₱1.85/km after
  //   Aircon / big bus      : ₱50 base / first 5 km, ₱2.20/km after

  String _jeepney(double d) {
    final min = d <= 4 ? 14.0 : 14.0 + (d - 4) * 2.00;
    final max = min * 1.10;
    return '₱${min.toStringAsFixed(2)} – ₱${max.toStringAsFixed(2)}';
  }

  String _tricycle(double d) {
    final min = d <= 2 ? 20.0 : 20.0 + (d - 2) * 3.00;
    final max = min * 1.20;
    return '₱${min.toStringAsFixed(2)} – ₱${max.toStringAsFixed(2)}';
  }

  /// Ordinary bus — ₱20 base / first 5 km, ₱1.85/km after
  String _busOrdinary(double d) {
    final min = d <= 5 ? 20.0 : 20.0 + (d - 5) * 1.85;
    final max = min * 1.08;
    return '₱${min.toStringAsFixed(2)} – ₱${max.toStringAsFixed(2)}';
  }

  /// Aircon / big bus — ₱50 base / first 5 km, ₱2.20/km after
  String _busAircon(double d) {
    final min = d <= 5 ? 50.0 : 50.0 + (d - 5) * 2.20;
    final max = min * 1.08;
    return '₱${min.toStringAsFixed(2)} – ₱${max.toStringAsFixed(2)}';
  }

  // ── Build ─────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final pos = _currentPosition ?? widget.currentPosition;
    final userLatLng = LatLng(pos.latitude, pos.longitude);
    final destLatLng = LatLng(widget.clinic.latitude, widget.clinic.longitude);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            widget.clinic.name,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            overflow: TextOverflow.ellipsis,
          ),
          backgroundColor: AppTheme.primary,
          foregroundColor: Colors.white,
          actions: [
            // Live tracking indicator
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Center(
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _isTracking ? Colors.greenAccent : Colors.red,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _isTracking ? 'Live' : 'Off',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ],
          bottom: TabBar(
            controller: _tabController,
            indicatorColor: Colors.white,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white60,
            tabs: const [
              Tab(icon: Icon(Icons.map_rounded), text: 'Map'),
              Tab(icon: Icon(Icons.directions_bus_rounded), text: 'Fares'),
            ],
          ),
        ),
        body: _tabIndex == 0
            ? _buildMapTab(userLatLng, destLatLng)
            : _buildFaresTab(),
      ),
    );
  }

  // ── Map Tab ───────────────────────────────────────────────────────────────────

  Widget _buildMapTab(LatLng userLatLng, LatLng destLatLng) {
    return Stack(
      children: [
        Column(
          children: [
            // Error banner
            if (_routeError != null)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                color: Colors.orange.shade100,
                child: Row(
                  children: [
                    const Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.orange,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _routeError!,
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),

            // Info bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              color: Colors.green.shade50,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _InfoTile(
                    icon: Icons.straighten_rounded,
                    color: AppTheme.secondary,
                    label: _isLoadingRoute
                        ? '...'
                        : '${_distanceKm.toStringAsFixed(1)} km',
                    sublabel: 'Distance',
                  ),
                  _InfoTile(
                    icon: Icons.timer_rounded,
                    color: Colors.orange,
                    label: _isLoadingRoute
                        ? '...'
                        : '${_durationMin.toStringAsFixed(0)} min',
                    sublabel: 'Drive time',
                  ),
                  _InfoTile(
                    icon: Icons.directions_bus_rounded,
                    color: AppTheme.primary,
                    // Show just the min part of the range for the compact tile
                    label: _isLoadingRoute
                        ? '...'
                        : _jeepney(_distanceKm).split(' –').first,
                    sublabel: 'Jeepney est.',
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
                      // User marker
                      Marker(
                        point: userLatLng,
                        width: 46,
                        height: 46,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.secondary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.secondary.withOpacity(0.5),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.navigation_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                      // Clinic marker
                      Marker(
                        point: destLatLng,
                        width: 46,
                        height: 46,
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.5),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.local_hospital_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),

        // Follow / re-center FAB
        Positioned(
          right: 16,
          bottom: 16,
          child: Column(
            children: [
              FloatingActionButton.small(
                heroTag: 'follow',
                onPressed: () {
                  setState(() => _followUser = true);
                  _mapController.move(userLatLng, 15);
                },
                backgroundColor: _followUser ? AppTheme.primary : Colors.white,
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
                backgroundColor: Colors.white,
                child: const Icon(
                  Icons.fit_screen_rounded,
                  color: AppTheme.secondary,
                ),
              ),
            ],
          ),
        ),

        // Loading overlay
        if (_isLoadingRoute)
          Positioned.fill(
            child: Container(
              color: Colors.black26,
              child: const Center(
                child: Card(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(color: AppTheme.primary),
                        SizedBox(height: 12),
                        Text('Getting route...'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  // ── Fares Tab ─────────────────────────────────────────────────────────────────

  Widget _buildFaresTab() {
    final d = _distanceKm;
    final clinicName = widget.clinic.name;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppTheme.primary, AppTheme.secondary],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.directions_bus_rounded,
                  color: Colors.white,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Transport to $clinicName',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _isLoadingRoute
                            ? 'Calculating distance...'
                            : 'Distance: ${d.toStringAsFixed(1)} km  •  Drive: ${_durationMin.toStringAsFixed(0)} min',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Estimated Fare (LTFRB Rates)',
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 15,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Based on ${d.toStringAsFixed(1)} km  •  Shows min – max range',
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 12),

          // Fare cards
          _FareCard(
            icon: Icons.airport_shuttle_rounded,
            iconColor: Colors.orange,
            name: 'Jeepney',
            fare: _isLoadingRoute ? '...' : _jeepney(d),
            details: d <= 4
                ? 'Min fare covers first 4 km'
                : '₱14 base + ₱2.00/km after 4 km',
            tip: 'Cheapest option for most trips',
          ),
          _FareCard(
            icon: Icons.electric_rickshaw_rounded,
            iconColor: Colors.green,
            name: 'Tricycle',
            fare: _isLoadingRoute ? '...' : _tricycle(d),
            details: d <= 2
                ? 'Min fare covers first 2 km'
                : '₱20 base + ₱3.00/km after 2 km',
            tip: 'Best for short / last-mile trips',
          ),
          _FareCard(
            icon: Icons.directions_bus_rounded,
            iconColor: Colors.blue,
            name: 'Bus — ordinary',
            fare: _isLoadingRoute ? '...' : _busOrdinary(d),
            details: d <= 5
                ? 'Min fare covers first 5 km'
                : '₱20 base + ₱1.85/km after 5 km',
            tip: 'Non-aircon, lower fare',
          ),
          _FareCard(
            icon: Icons.directions_bus_filled_rounded,
            iconColor: Colors.deepPurple,
            name: 'Bus — aircon / big bus',
            fare: _isLoadingRoute ? '...' : _busAircon(d),
            details: d <= 5
                ? 'Min fare covers first 5 km'
                : '₱50 base + ₱2.20/km after 5 km',
            tip: 'P2P, provincial, or aircon routes',
          ),

          const SizedBox(height: 16),

          // Disclaimer
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline_rounded, size: 16, color: Colors.grey),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Fares are estimates based on LTFRB standard rates. '
                    'Ordinary bus: ₱20 min fare / ₱1.85 per km after 5 km. '
                    'Aircon / big bus: ₱50 min fare / ₱2.20 per km after 5 km. '
                    'Ranges reflect typical variance by route, operator, and '
                    'surcharges. Actual fares may differ. Updates live as you move.',
                    style: TextStyle(fontSize: 11, color: Colors.grey),
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

// ── Widgets ───────────────────────────────────────────────────────────────────

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String sublabel;

  const _InfoTile({
    required this.icon,
    required this.color,
    required this.label,
    required this.sublabel,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
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
  final String name;
  final String fare;
  final String details;
  final String tip;

  const _FareCard({
    required this.icon,
    required this.iconColor,
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 26),
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
          // Fare range — slightly smaller font to fit "₱xx.xx – ₱xx.xx"
          Flexible(
            child: Text(
              fare,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: iconColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
