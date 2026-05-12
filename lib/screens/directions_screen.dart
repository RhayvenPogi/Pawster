// lib/screens/directions_screen.dart
// =============================================================================
// DIRECTIONS SCREEN — Live GPS tracking + OSRM routing + Philippine fare estimates
// =============================================================================
// Features:
//   • Real-time user location stream via Geolocator
//   • OSRM (Open Source Routing Machine) driving directions
//   • Fallback straight-line route when OSRM is unavailable
//   • Animated pulsing user marker on map
//   • Transport fare estimates based on LTFRB rates (effective March 19, 2026)
//   • Two-tab layout: Map view and Fare breakdown
// =============================================================================

import 'dart:math';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/vet_clinic.dart';

// ── Inline colour constants (previously AppTheme) ─────────────────────────────
// Replicated here to keep the screen self-contained.

const _primary        = Color(0xFF388E3C);   // Brand green
const _primaryTint    = Color(0xFFE8F4E2);     // Light green backgrounds
const _secondary      = Color(0xFF1976D2);     // Blue (route line, links)
const _secondaryTint  = Color(0xFFE3F0FC);     // Light blue backgrounds
const _accent         = Color(0xFFF57C00);      // Orange (warnings, highlights)
const _accentTint     = Color(0xFFFFF3E0);      // Light orange backgrounds
const _background     = Color(0xFFF5F9F3);      // Page background
const _cardBg         = Color(0xFFFFFFFF);      // Card surfaces
const _surface        = Color(0xFFC8E6C9);      // Mid-green (dividers, handles)
const _borderLight    = Color(0xFFE0E0E0);      // Neutral borders
const _textPrimary    = Color(0xFF1B2B1C);      // Headings
const _textSecondary  = Color(0xFF5A7A5C);      // Body text
const _danger         = Color(0xFFE53935);      // Errors / offline indicator
const _radiusSm       = 10.0;                   // Small card radius
const _radiusMd       = 12.0;                   // Standard radius
const _radiusLg       = 16.0;                   // Large radius

// =============================================================================
// DIRECTIONS SCREEN — StatefulWidget receiving clinic and starting position
// =============================================================================
class DirectionsScreen extends StatefulWidget {
  final VetClinic clinic;           // Destination veterinary clinic
  final Position currentPosition;   // User's GPS position when screen opened

  const DirectionsScreen({
    super.key,
    required this.clinic,
    required this.currentPosition,
  });

  @override
  State<DirectionsScreen> createState() => _DirectionsScreenState();
}

// =============================================================================
// DIRECTIONS SCREEN STATE
// =============================================================================
// Manages:
//   • OSRM route fetching and polyline rendering
//   • Live GPS stream subscription for real-time tracking
//   • Animated user marker position updates
//   • Tab controller for Map / Fares tabs
//   • Camera follow mode (auto-centre on user)
// =============================================================================
class _DirectionsScreenState extends State<DirectionsScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  late TabController _tabController;

  // Route data populated by OSRM or fallback logic.
  List<LatLng> _routePoints = [];
  double _distanceKm  = 0;    // Total route distance in kilometres
  double _durationMin = 0;    // Estimated driving duration in minutes
  bool _isLoadingRoute = true; // Shows spinner while first route is fetched
  String? _routeError;         // Non-null when OSRM fails and fallback is used

  // Live tracking state.
  StreamSubscription<Position>? _positionStream;
  Position? _currentPosition;     // Latest GPS fix
  LatLng? _animatedUserLatLng;      // Smoothed LatLng for marker animation
  bool _isTracking = false;         // True while position stream is active
  bool _followUser  = true;          // Auto-centre map on user when true

  int _tabIndex = 0;                // Currently selected tab (0 = Map, 1 = Fares)

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    // Two tabs: Map and Fares.
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() => _tabIndex = _tabController.index);
    });

    // Seed initial position from the value passed by HomeScreen.
    _currentPosition = widget.currentPosition;
    _animatedUserLatLng = LatLng(
      widget.currentPosition.latitude,
      widget.currentPosition.longitude,
    );

    // Fetch route immediately, then start listening for GPS updates.
    _getRouteFromOSRM(widget.currentPosition);
    _startTracking();
  }

  @override
  void dispose() {
    // Cancel GPS stream to prevent memory leaks and battery drain.
    _positionStream?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // LIVE LOCATION TRACKING
  // ---------------------------------------------------------------------------

  /// Subscribes to Geolocator's position stream with high accuracy.
  /// Re-fetches the OSRM route whenever the user moves > 50 m from the
  /// previous route origin to keep directions up-to-date.
  void _startTracking() {
    setState(() => _isTracking = true);
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Notify every 10 metres of movement
      ),
    ).listen((position) {
      if (!mounted) return;
      setState(() {
        _currentPosition = position;
        _animatedUserLatLng = LatLng(position.latitude, position.longitude);
      });

      // Auto-pan camera if follow mode is enabled.
      if (_followUser && mounted) {
        _mapController.move(
          LatLng(position.latitude, position.longitude),
          _mapController.camera.zoom,
        );
      }

      // Re-calculate route if user has drifted > 50 m from last origin.
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

  // ---------------------------------------------------------------------------
  // OSRM ROUTING
  // ---------------------------------------------------------------------------

  /// Queries OSRM's public demo server for a driving route between the
  /// user's current position and the destination clinic.
  /// On success: parses GeoJSON geometry, distance, and duration.
  /// On failure: falls back to a straight-line polyline with estimated time.
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
        if (data['routes'] != null &&
            (data['routes'] as List).isNotEmpty) {
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
            // On first successful load, fit camera to show entire route.
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
    } catch (_) {
      // Swallow network/parse errors and proceed to fallback.
    }

    _setFallbackRoute(from);
  }

  /// Generates a 6-point straight-line polyline from origin to destination.
  /// Estimates duration assuming an average speed of 40 km/h.
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
        _durationMin    = d / 40 * 60; // 40 km/h straight-line estimate
        _isLoadingRoute = false;
        _routeError     = 'Using straight-line estimate (OSRM unavailable)';
      });
    }
  }

  // ---------------------------------------------------------------------------
  // HAVERSINE FORMULA
  // ---------------------------------------------------------------------------

  /// Calculates the great-circle distance between two lat/lng points.
  /// Returns distance in kilometres. Used for fallback routing and
  /// triggering re-route thresholds.
  double _haversineKm(double la1, double lo1, double la2, double lo2) {
    const R   = 6371.0; // Earth radius in km
    final dLat = (la2 - la1) * pi / 180;
    final dLon = (lo2 - lo1) * pi / 180;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(la1 * pi / 180) * cos(la2 * pi / 180) *
            sin(dLon / 2) * sin(dLon / 2);
    return R * 2 * atan2(sqrt(a), sqrt(1 - a));
  }

  // ---------------------------------------------------------------------------
  // FARE HELPERS (LTFRB standard rates — effective March 19, 2026)
  // ---------------------------------------------------------------------------

  /// Jeepney fare: ₱14 base for first 4 km, then ₱2.00/km.
  /// Returns a "min – max" string with 10 % upper variance.
  String _jeepney(double d) {
    final min = d <= 4 ? 14.0 : 14.0 + (d - 4) * 2.00;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.10).toStringAsFixed(2)}';
  }

  /// Tricycle fare: ₱20 base for first 2 km, then ₱3.00/km.
  /// Returns a "min – max" string with 20 % upper variance.
  String _tricycle(double d) {
    final min = d <= 2 ? 20.0 : 20.0 + (d - 2) * 3.00;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.20).toStringAsFixed(2)}';
  }

  /// Ordinary (non-aircon) bus: ₱20 base for first 5 km, then ₱1.85/km.
  /// Returns a "min – max" string with 8 % upper variance.
  String _busOrdinary(double d) {
    final min = d <= 5 ? 20.0 : 20.0 + (d - 5) * 1.85;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.08).toStringAsFixed(2)}';
  }

  /// Air-conditioned / big bus: ₱50 base for first 5 km, then ₱2.20/km.
  /// Returns a "min – max" string with 8 % upper variance.
  String _busAircon(double d) {
    final min = d <= 5 ? 50.0 : 50.0 + (d - 5) * 2.20;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.08).toStringAsFixed(2)}';
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final pos        = _currentPosition ?? widget.currentPosition;
    final userLatLng = LatLng(pos.latitude, pos.longitude);
    final destLatLng = LatLng(widget.clinic.latitude, widget.clinic.longitude);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        title: Text(widget.clinic.name, overflow: TextOverflow.ellipsis),
        actions: [
          // Live tracking status pill (green = active, red = error/off).
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Container(
                padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(_radiusSm),
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
                            ? const Color(0xFF69F0AE) // Bright green
                            : _danger,
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
                text: 'Fares'),
          ],
        ),
      ),
      body: _tabIndex == 0
          ? _buildMapTab(userLatLng, destLatLng)
          : _buildFaresTab(),
    );
  }

  // ---------------------------------------------------------------------------
  // MAP TAB
  // ---------------------------------------------------------------------------

  /// Builds the interactive map with route polyline, user marker, destination
  /// marker, info bar, and floating action buttons.
  Widget _buildMapTab(LatLng userLatLng, LatLng destLatLng) {
    final markerLatLng = _animatedUserLatLng ?? userLatLng;

    return Stack(
      children: [
        Column(
          children: [
            // Warning banner shown when OSRM fallback is active.
            if (_routeError != null)
              Container(
                padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                color: _accentTint,
                child: Row(
                  children: [
                    const Icon(Icons.warning_amber_rounded,
                        color: _accent, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _routeError!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: _textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Info bar: distance, duration, jeepney estimate.
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: _primaryTint,
              child: Row(
                children: [
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.straighten_rounded,
                      iconColor: _secondary,
                      label: _isLoadingRoute
                          ? '—'
                          : '${_distanceKm.toStringAsFixed(1)} km',
                      sublabel: 'Distance',
                    ),
                  ),
                  Container(width: 1, height: 32, color: _surface),
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.timer_rounded,
                      iconColor: _accent,
                      label: _isLoadingRoute
                          ? '—'
                          : '${_durationMin.toStringAsFixed(0)} min',
                      sublabel: 'Drive time',
                    ),
                  ),
                  Container(width: 1, height: 32, color: _surface),
                  Expanded(
                    child: _InfoTile(
                      icon: Icons.directions_bus_rounded,
                      iconColor: _primary,
                      label: _isLoadingRoute
                          ? '—'
                          : _jeepney(_distanceKm).split(' –').first,
                      sublabel: 'Jeepney est.',
                    ),
                  ),
                ],
              ),
            ),

            // Map canvas.
            Expanded(
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: userLatLng,
                  initialZoom: 13,
                  // Disable follow mode when user manually pans the map.
                  onPositionChanged: (_, hasGesture) {
                    if (hasGesture) setState(() => _followUser = false);
                  },
                ),
                children: [
                  // OpenStreetMap base tiles.
                  TileLayer(
                    urlTemplate:
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.example.pawaywan',
                  ),
                  // Route polyline (only rendered after OSRM/fallback success).
                  if (_routePoints.isNotEmpty)
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: _routePoints,
                          color: _secondary,
                          strokeWidth: 5,
                        ),
                      ],
                    ),
                  // User and destination markers.
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: markerLatLng,
                        width: 56,
                        height: 56,
                        child:
                        _AnimatedUserMarker(color: _secondary),
                      ),
                      _buildMarker(
                          destLatLng, _primary, Icons.local_hospital_rounded),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),

        // Floating action buttons: re-centre on user, fit route to screen.
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
                backgroundColor: _followUser ? _primary : _cardBg,
                child: Icon(
                  Icons.my_location_rounded,
                  color: _followUser ? Colors.white : _primary,
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
                backgroundColor: _cardBg,
                child: const Icon(Icons.fit_screen_rounded,
                    color: _secondary),
              ),
            ],
          ),
        ),

        // Full-screen loading overlay while first route is being fetched.
        if (_isLoadingRoute)
          Positioned.fill(
            child: Container(
              color: Colors.black26,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: _cardBg,
                    borderRadius: BorderRadius.circular(_radiusLg),
                    border: Border.all(color: _borderLight),
                  ),
                  child: const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: _primary),
                      SizedBox(height: 14),
                      Text(
                        'Getting route...',
                        style: TextStyle(
                          color: _textSecondary,
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

  /// Helper to build a circular destination marker with a white border.
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
            BoxShadow(
                color: color.withOpacity(0.45), blurRadius: 10),
          ],
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // FARES TAB
  // ---------------------------------------------------------------------------

  /// Builds a scrollable list of fare estimate cards for jeepney, tricycle,
  /// ordinary bus, and aircon bus. Includes a disclaimer footer.
  Widget _buildFaresTab() {
    final d = _distanceKm;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header card showing clinic name and route summary.
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _primary,
              borderRadius: BorderRadius.circular(_radiusLg),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(_radiusMd),
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
              color: _textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'LTFRB standard rates · min – max range',
            style: TextStyle(fontSize: 12, color: _textSecondary),
          ),
          const SizedBox(height: 14),

          // Fare estimate cards.
          _FareCard(
            icon: Icons.airport_shuttle_rounded,
            iconColor: _accent,
            iconBg: _accentTint,
            name: 'Jeepney',
            fare: _isLoadingRoute ? '—' : _jeepney(d),
            details: d <= 4
                ? 'Min fare covers first 4 km'
                : '₱14 base + ₱2.00/km after 4 km',
            tip: 'Cheapest option for most trips',
          ),
          _FareCard(
            icon: Icons.electric_rickshaw_rounded,
            iconColor: _primary,
            iconBg: _primaryTint,
            name: 'Tricycle',
            fare: _isLoadingRoute ? '—' : _tricycle(d),
            details: d <= 2
                ? 'Min fare covers first 2 km'
                : '₱20 base + ₱3.00/km after 2 km',
            tip: 'Best for short / last-mile trips',
          ),
          _FareCard(
            icon: Icons.directions_bus_rounded,
            iconColor: _secondary,
            iconBg: _secondaryTint,
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

          // Disclaimer footer.
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _primaryTint,
              borderRadius: BorderRadius.circular(_radiusMd),
              border: Border.all(color: _surface),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.info_outline_rounded, size: 16, color: _primary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Fares are estimates based on LTFRB standard rates. '
                        'Ranges reflect typical variance by route, operator, and '
                        'surcharges. Actual fares may differ. Updates live as you move.',
                    style: TextStyle(
                      fontSize: 11,
                      color: _textSecondary,
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

// =============================================================================
// ANIMATED USER MARKER — Pulsing radar-style dot showing live GPS position
// =============================================================================
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
    // 1.5 s repeating pulse animation.
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
          // Outermost fading ripple ring.
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
          // Middle translucent ring.
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.color.withOpacity(0.15),
              border: Border.all(
                  color: widget.color.withOpacity(0.4), width: 1.5),
            ),
          ),
          // Solid inner dot with navigation arrow icon.
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
            child: const Icon(Icons.navigation_rounded,
                color: Colors.white, size: 12),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// INFO TILE — Small icon + label + sublabel used in the map info bar
// =============================================================================
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
            color: _textPrimary,
          ),
        ),
        Text(sublabel,
            style:
            const TextStyle(fontSize: 10, color: _textSecondary)),
      ],
    );
  }
}

// =============================================================================
// FARE CARD — Row showing transport mode, fare range, and usage tip
// =============================================================================
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
        color: _cardBg,
        borderRadius: BorderRadius.circular(_radiusMd),
        border: Border.all(color: _borderLight),
      ),
      child: Row(
        children: [
          // Mode icon in a coloured rounded square.
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(_radiusSm),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 12),
          // Name, rate formula, and usage tip.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: _textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(details,
                    style: const TextStyle(
                        fontSize: 11, color: _textSecondary)),
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
          // Fare amount right-aligned.
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