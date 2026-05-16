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
const _primary        = Color(0xFF388E3C);  // Brand green
const _primaryTint    = Color(0xFFE8F4E2);  // Light green backgrounds
const _secondary      = Color(0xFF1976D2);  // Blue (route line, links)
const _secondaryTint  = Color(0xFFE3F0FC);  // Light blue backgrounds
const _accent         = Color(0xFFF57C00);  // Orange (warnings, highlights)
const _accentTint     = Color(0xFFFFF3E0);  // Light orange backgrounds
const _background     = Color(0xFFF5F9F3);  // Page background
const _cardBg         = Color(0xFFFFFFFF);  // Card surfaces
const _surface        = Color(0xFFC8E6C9);  // Mid-green (dividers, handles)
const _borderLight    = Color(0xFFE0E0E0);  // Neutral borders
const _textPrimary    = Color(0xFF1B2B1C);  // Headings
const _textSecondary  = Color(0xFF5A7A5C);  // Body text
const _danger         = Color(0xFFE53935);  // Errors / offline indicator
const _radiusSm       = 10.0;              // Small card radius
const _radiusMd       = 12.0;              // Standard radius
const _radiusLg       = 16.0;              // Large radius


// =============================================================================
// DIRECTIONS SCREEN
// =============================================================================
/// Displays a turn-by-turn directions view from the user's current position
/// to a destination [VetClinic].
///
/// The screen has two tabs:
/// - **Map** — live-tracked FlutterMap with OSRM polyline route and an
///   animated user marker.
/// - **Fares** — scrollable breakdown of LTFRB transport fare estimates.
///
/// [currentPosition] should be the most recent GPS fix obtained by the caller
/// (typically HomeScreen) before pushing this route, so the map has an
/// immediate starting point while the first OSRM call is in flight.
// =============================================================================
class DirectionsScreen extends StatefulWidget {
  /// The veterinary clinic the user is navigating to.
  final VetClinic clinic;


  /// The user's GPS position at the moment this screen was opened.
  /// Used as the initial map centre and fallback route origin.
  final Position currentPosition;


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
/// Manages the full lifecycle of the directions experience:
///
/// - Fetches an OSRM driving route on mount and whenever the user moves
///   more than 50 m from the previous route origin.
/// - Falls back to a straight-line polyline with a speed-based duration
///   estimate when OSRM is unreachable.
/// - Subscribes to Geolocator's high-accuracy position stream and updates
///   the animated user marker in real time.
/// - Exposes a camera-follow toggle so the map auto-pans with the user
///   until they manually gesture on the map.
// =============================================================================
class _DirectionsScreenState extends State<DirectionsScreen>
    with TickerProviderStateMixin {
  /// Controls map camera movements (pan, zoom, fit bounds).
  final MapController _mapController = MapController();


  /// Controls switching between the Map and Fares tabs.
  late TabController _tabController;


  // ── Route state ─────────────────────────────────────────────────────────────


  /// Ordered list of coordinates forming the OSRM (or fallback) polyline.
  List<LatLng> _routePoints = [];


  /// Total route length in kilometres returned by OSRM, or Haversine distance
  /// for the fallback straight-line route.
  double _distanceKm = 0;


  /// Estimated driving time in minutes from OSRM, or a 40 km/h straight-line
  /// estimate for the fallback route.
  double _durationMin = 0;


  /// True only while the very first route fetch is in progress.
  /// Triggers the full-screen loading overlay.
  bool _isLoadingRoute = true;


  /// Non-null when OSRM failed and the fallback route is being shown.
  /// Displayed as a warning banner above the map.
  String? _routeError;


  // ── Live tracking state ──────────────────────────────────────────────────────


  /// Active subscription to Geolocator's position stream.
  /// Cancelled in [dispose] to prevent battery drain and memory leaks.
  StreamSubscription<Position>? _positionStream;


  /// Most recent GPS fix received from the position stream.
  Position? _currentPosition;


  /// The LatLng used to position the animated user marker.
  /// Updated on every position event; starts from [widget.currentPosition].
  LatLng? _animatedUserLatLng;


  /// True while the Geolocator stream is active and delivering fixes.
  bool _isTracking = false;


  /// When true, the map camera automatically pans to keep the user centred.
  /// Set to false when the user manually gestures on the map.
  bool _followUser = true;


  /// Index of the currently visible tab (0 = Map, 1 = Fares).
  int _tabIndex = 0;


  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------


  @override
  void initState() {
    super.initState();


    _tabController = TabController(length: 2, vsync: this);
    // Mirror tab index into state so [build] can switch between tab bodies
    // without relying on TabController.index directly.
    _tabController.addListener(() {
      if (mounted) setState(() => _tabIndex = _tabController.index);
    });


    // Seed position from the caller so the map renders immediately.
    _currentPosition = widget.currentPosition;
    _animatedUserLatLng = LatLng(
      widget.currentPosition.latitude,
      widget.currentPosition.longitude,
    );


    // Begin route fetch and GPS subscription concurrently.
    _getRouteFromOSRM(widget.currentPosition);
    _startTracking();
  }


  @override
  void dispose() {
    // Always cancel the stream subscription; leaving it open would continue
    // consuming GPS hardware and battery after the screen is gone.
    _positionStream?.cancel();
    _tabController.dispose();
    super.dispose();
  }


  // ---------------------------------------------------------------------------
  // LIVE LOCATION TRACKING
  // ---------------------------------------------------------------------------


  /// Subscribes to Geolocator's high-accuracy position stream.
  ///
  /// On each fix:
  /// - Updates [_currentPosition] and [_animatedUserLatLng].
  /// - Pans the camera if [_followUser] is true.
  /// - Re-fetches the OSRM route when the user has moved more than 50 m
  ///   from the start of the current route, keeping directions up-to-date.
  ///
  /// [distanceFilter] is set to 10 m to balance responsiveness and battery use.
  void _startTracking() {
    setState(() => _isTracking = true);
    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Fire event every ≥10 m of movement
      ),
    ).listen((position) {
      if (!mounted) return;
      setState(() {
        _currentPosition   = position;
        _animatedUserLatLng = LatLng(position.latitude, position.longitude);
      });


      // Auto-pan to keep the user centred when follow mode is active.
      if (_followUser && mounted) {
        _mapController.move(
          LatLng(position.latitude, position.longitude),
          _mapController.camera.zoom,
        );
      }


      // Re-route if the user has drifted > 50 m from the route's first point.
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


  /// Fetches a driving route from OSRM's public demo server.
  ///
  /// Constructs a `driving` route request with `overview=full` and
  /// `geometries=geojson` so the full polyline is returned. On a successful
  /// 200 response the route's coordinates, distance, and duration are
  /// applied to state and the camera is fitted to the polyline on the first
  /// load. Any network, timeout, or parse error is silently swallowed and
  /// [_setFallbackRoute] is called instead.
  Future<void> _getRouteFromOSRM(Position from) async {
    final origin = '${from.longitude},${from.latitude}';
    final dest   = '${widget.clinic.longitude},${widget.clinic.latitude}';
    final url =
        'https://router.project-osrm.org/route/v1/driving/$origin;$dest'
        '?overview=full&geometries=geojson';


    try {
      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 10));


      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['routes'] != null &&
            (data['routes'] as List).isNotEmpty) {
          final route  = data['routes'][0];
          final coords = route['geometry']['coordinates'] as List;


          // GeoJSON coordinates are [longitude, latitude] — swap to LatLng.
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
            // Fit the camera to the full route only on the very first load;
            // subsequent re-routes should not disrupt the user's view.
            if (wasLoading && points.isNotEmpty) {
              _mapController.fitCamera(
                CameraFit.bounds(
                  bounds: LatLngBounds.fromPoints(points),
                  padding: const EdgeInsets.all(60),
                ),
              );
            }
          }
          return; // Success — skip fallback.
        }
      }
    } catch (_) {
      // Absorb network errors (timeout, no connectivity, JSON parse failure)
      // and fall through to the straight-line fallback below.
    }


    _setFallbackRoute(from);
  }


  /// Generates a 6-point straight-line polyline as a fallback when OSRM fails.
  ///
  /// Intermediate points are evenly interpolated between origin and destination.
  /// Duration is estimated at an average road speed of 40 km/h.
  /// Sets [_routeError] so a warning banner is shown above the map.
  void _setFallbackRoute(Position from) {
    final origin = LatLng(from.latitude, from.longitude);
    final dest   = LatLng(widget.clinic.latitude, widget.clinic.longitude);


    // Build 4 evenly-spaced intermediate points plus origin and destination.
    final points  = <LatLng>[origin];
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
        _durationMin    = d / 40 * 60; // straight-line at 40 km/h
        _isLoadingRoute = false;
        _routeError     = 'Using straight-line estimate (OSRM unavailable)';
      });
    }
  }


  // ---------------------------------------------------------------------------
  // HAVERSINE FORMULA
  // ---------------------------------------------------------------------------


  /// Returns the great-circle distance in kilometres between two geographic
  /// coordinates using the Haversine formula.
  ///
  /// Used in two places:
  /// - [_setFallbackRoute] — to compute the distance for the straight-line route.
  /// - [_startTracking] — to decide whether the user has moved far enough to
  ///   warrant a fresh OSRM request (> 50 m threshold).
  double _haversineKm(double la1, double lo1, double la2, double lo2) {
    const R   = 6371.0; // Mean Earth radius in km
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


  /// Jeepney fare: ₱14 base for the first 4 km, then ₱2.00/km.
  ///
  /// Returns a "min – max" range string where the upper bound adds 10 %
  /// to account for route/operator variance.
  String _jeepney(double d) {
    final min = d <= 4 ? 14.0 : 14.0 + (d - 4) * 2.00;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.10).toStringAsFixed(2)}';
  }


  /// Tricycle fare: ₱20 base for the first 2 km, then ₱3.00/km.
  ///
  /// Returns a "min – max" range string with a 20 % upper variance,
  /// which is wider than jeepney/bus because tricycle fares are less
  /// regulated and vary more by barangay.
  String _tricycle(double d) {
    final min = d <= 2 ? 20.0 : 20.0 + (d - 2) * 3.00;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.20).toStringAsFixed(2)}';
  }


  /// Ordinary (non-aircon) bus: ₱20 base for the first 5 km, then ₱1.85/km.
  ///
  /// Returns a "min – max" range string with an 8 % upper variance.
  String _busOrdinary(double d) {
    final min = d <= 5 ? 20.0 : 20.0 + (d - 5) * 1.85;
    return '₱${min.toStringAsFixed(2)} – ₱${(min * 1.08).toStringAsFixed(2)}';
  }


  /// Air-conditioned / big bus: ₱50 base for the first 5 km, then ₱2.20/km.
  ///
  /// Covers P2P, provincial, and aircon routes.
  /// Returns a "min – max" range string with an 8 % upper variance.
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
          // Tracking status pill: green dot = stream active, red = error/off.
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
                        // Top-rated clinics use blue to match their map marker.
                        color: _isTracking
                            ? (widget.clinic.isTopRated
                            ? _secondary
                            : _primary)
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
      // Swap the entire body between tab bodies rather than using a
      // TabBarView so the map is not rebuilt on every tab switch.
      body: _tabIndex == 0
          ? _buildMapTab(userLatLng, destLatLng)
          : _buildFaresTab(),
    );
  }


  // ---------------------------------------------------------------------------
  // MAP TAB
  // ---------------------------------------------------------------------------


  /// Builds the interactive map tab.
  ///
  /// Layout (top to bottom):
  /// 1. Optional OSRM fallback warning banner.
  /// 2. Info bar — distance, drive time, and jeepney estimate.
  /// 3. [FlutterMap] canvas with OSM tiles, route polyline, and markers.
  ///
  /// Overlaid (floating):
  /// - Re-centre FAB (toggles [_followUser] and snaps camera to user).
  /// - Fit-route FAB (fits camera to the full polyline bounding box).
  /// - Full-screen loading overlay during the first route fetch.
  Widget _buildMapTab(LatLng userLatLng, LatLng destLatLng) {
    // Prefer the smoothed animated position over the raw GPS fix for the marker.
    final markerLatLng = _animatedUserLatLng ?? userLatLng;


    return Stack(
      children: [
        Column(
          children: [
            // ── Fallback warning ─────────────────────────────────────────────
            // Only visible when OSRM is unavailable and a straight-line route
            // is being displayed instead.
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


            // ── Info bar ─────────────────────────────────────────────────────
            // Three equally-spaced tiles showing the most glanceable stats.
            // Shows dashes while the first route is loading.
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
                      // Show only the lower bound of the jeepney range here
                      // to keep the tile compact; the full range is in Fares.
                      label: _isLoadingRoute
                          ? '—'
                          : _jeepney(_distanceKm).split(' –').first,
                      sublabel: 'Jeepney est.',
                    ),
                  ),
                ],
              ),
            ),


            // ── Map canvas ───────────────────────────────────────────────────
            Expanded(
              child: FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: userLatLng,
                  initialZoom: 13,
                  // Disable camera follow when the user manually pans,
                  // so the map doesn't snap back mid-gesture.
                  onPositionChanged: (_, hasGesture) {
                    if (hasGesture) setState(() => _followUser = false);
                  },
                ),
                children: [
                  // OpenStreetMap raster tiles.
                  TileLayer(
                    urlTemplate:
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName:
                    'com.pawnagaywan.vetclinic_locator',
                  ),
                  // Route polyline — hidden until at least one route is ready.
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
                  // User (animated pulse) and clinic (static circle) markers.
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: markerLatLng,
                        width: 56,
                        height: 56,
                        child: _AnimatedUserMarker(color: _secondary),
                      ),
                      _buildMarker(
                        destLatLng,
                        // Top-rated clinics get blue markers to match their
                        // map pin colour elsewhere in the app.
                        widget.clinic.isTopRated ? _secondary : _primary,
                        Icons.local_hospital_rounded,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),


        // ── Floating action buttons ──────────────────────────────────────────
        Positioned(
          right: 16,
          bottom: 16,
          child: Column(
            children: [
              // Re-centre: enables follow mode and snaps camera to user.
              FloatingActionButton.small(
                heroTag: 'follow',
                onPressed: () {
                  setState(() => _followUser = true);
                  _mapController.move(markerLatLng, 15);
                },
                backgroundColor: _followUser ? _primary : _cardBg,
                child: Icon(
                  Icons.my_location_rounded,
                  // Filled = follow active; outlined style via color change.
                  color: _followUser ? Colors.white : _primary,
                ),
              ),
              const SizedBox(height: 8),
              // Fit route: disables follow and zooms to show the full polyline.
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


        // ── Loading overlay ──────────────────────────────────────────────────
        // Covers the entire map while the very first route is being fetched.
        // Subsequent re-routes update silently in the background.
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


  /// Builds a circular map marker with a white border and a drop shadow.
  ///
  /// Used for the destination clinic pin. The [color] should match the
  /// clinic's top-rated status so it is visually consistent with other
  /// screens (blue for top-rated, green otherwise).
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


  // ---------------------------------------------------------------------------
  // FARES TAB
  // ---------------------------------------------------------------------------


  /// Builds the scrollable fare breakdown tab.
  ///
  /// Layout:
  /// 1. Header card — clinic name and route summary (distance + drive time).
  /// 2. Section label and subtitle explaining the rate source.
  /// 3. Four [_FareCard] widgets — jeepney, tricycle, ordinary bus, aircon bus.
  /// 4. Disclaimer footer noting that fares are estimates.
  ///
  /// All fare strings are sourced from the private fare helper methods and
  /// update live as [_distanceKm] changes with the user's position.
  Widget _buildFaresTab() {
    final d = _distanceKm;


    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header card ────────────────────────────────────────────────────
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
                            : '${d.toStringAsFixed(1)} km  ·  '
                            '${_durationMin.toStringAsFixed(0)} min drive',
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


          // ── Fare cards ─────────────────────────────────────────────────────
          // Each card's [details] string conditionally describes either the
          // flat minimum-fare zone or the per-km formula, depending on [d].
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


          // ── Disclaimer footer ──────────────────────────────────────────────
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
// _AnimatedUserMarker
// =============================================================================
/// A three-layer pulsing radar marker indicating the user's live GPS position.
///
/// Layers (outermost to innermost):
/// 1. **Ripple ring** — large, fading circle that expands and contracts on the
///    animation, creating a radar-sweep effect.
/// 2. **Middle ring** — static translucent circle with a subtle border,
///    providing depth between the ripple and the solid dot.
/// 3. **Solid dot** — filled circle with a white border and navigation icon,
///    the precise position indicator.
///
/// The animation is a 1.5 s repeating [Curves.easeInOut] tween that drives
/// both the ripple's [Opacity] and [Transform.scale] simultaneously.
// =============================================================================
class _AnimatedUserMarker extends StatefulWidget {
  /// The brand colour applied to all three layers (tinted for outer rings).
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
    // Repeat indefinitely, reversing to create a continuous pulse.
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
      builder: (_, _) => Stack(
        alignment: Alignment.center,
        children: [
          // Layer 1: outermost ripple — fades out as it expands.
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
          // Layer 2: middle translucent ring (static size, adds visual depth).
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
          // Layer 3: solid inner dot — the precise GPS position indicator.
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
// _InfoTile
// =============================================================================
/// A compact vertical tile showing an icon, a primary [label], and a smaller
/// [sublabel] beneath it.
///
/// Used in the map tab's info bar to display distance, drive time, and the
/// jeepney fare estimate side-by-side in equal-width columns.
// =============================================================================
class _InfoTile extends StatelessWidget {
  /// Icon rendered above the label, coloured with [iconColor].
  final IconData icon;


  /// Colour applied to [icon].
  final Color iconColor;


  /// The main value string (e.g. "2.4 km", "8 min").
  final String label;


  /// Descriptive subtitle beneath [label] (e.g. "Distance", "Drive time").
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
            style: const TextStyle(fontSize: 10, color: _textSecondary)),
      ],
    );
  }
}


// =============================================================================
// _FareCard
// =============================================================================
/// A single fare estimate row card showing a transport mode, its rate formula,
/// a usage tip, and the calculated fare range for the current route distance.
///
/// Layout: coloured icon square | name + details + tip | fare range (right).
///
/// The [fare] string is a pre-formatted "₱min – ₱max" range computed by the
/// parent's private fare helper methods. [details] conditionally shows either
/// the flat-zone description or the per-km formula depending on distance.
// =============================================================================
class _FareCard extends StatelessWidget {
  /// Icon representing the transport mode.
  final IconData icon;


  /// Foreground colour for [icon] and the [fare] text.
  final Color iconColor;


  /// Background colour of the icon's rounded-square container.
  final Color iconBg;


  /// Human-readable transport mode name (e.g. "Jeepney", "Tricycle").
  final String name;


  /// Pre-formatted fare range string (e.g. "₱14.00 – ₱15.40").
  /// Shows "—" while the route is still loading.
  final String fare;


  /// Short description of the applicable rate formula or flat-zone note.
  final String details;


  /// One-line recommendation tip about when to prefer this mode.
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
          // Coloured icon square.
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
          // Name, formula/zone description, and tip stacked vertically.
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
          // Fare range, right-aligned and coloured to match the mode icon.
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



