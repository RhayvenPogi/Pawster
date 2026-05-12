import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/vet_clinic.dart';
import 'database_service.dart';
import 'location_service.dart';

/// Controls how the clinic list is ordered.
enum SortMode { nearest, highestRated }

/// Central state manager for clinics, location, search, and sort.
/// Consumed by the UI via [Consumer<ClinicProvider>] or [context.watch].
class ClinicProvider extends ChangeNotifier {
  List<VetClinic> _allClinics      = [];
  List<VetClinic> _filteredClinics = [];

  Position? _userPosition;
  bool      _isLoadingLocation = false;
  bool      _isLoadingClinics  = false;
  String?   _locationError;
  String?   _dbError;
  SortMode  _sortMode    = SortMode.nearest;
  String    _searchQuery = '';
  VetClinic? _selectedClinic;

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  List<VetClinic> get clinics           => _filteredClinics;
  Position?       get userPosition      => _userPosition;
  bool            get isLoadingLocation => _isLoadingLocation;
  bool            get isLoadingClinics  => _isLoadingClinics;
  String?         get locationError     => _locationError;
  String?         get dbError           => _dbError;
  SortMode        get sortMode          => _sortMode;
  String          get searchQuery       => _searchQuery;
  VetClinic?      get selectedClinic    => _selectedClinic;

  /// Returns the clinic with the smallest [distanceKm], or null if unknown.
  VetClinic? get nearestClinic {
    final withDistance = _filteredClinics
        .where((c) => c.distanceKm != null)
        .toList()
      ..sort((a, b) => a.distanceKm!.compareTo(b.distanceKm!));
    return withDistance.isEmpty ? null : withDistance.first;
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  /// Use when the caller already has a [Position] (e.g. from a splash screen).
  Future<void> initWithPosition(Position position) async {
    _userPosition = position;
    await loadClinicsFromDb();
  }

  /// Full init: load clinics then fetch GPS position.
  Future<void> init() async {
    await loadClinicsFromDb();
    await fetchUserLocation();
  }

  // ---------------------------------------------------------------------------
  // Database operations
  // ---------------------------------------------------------------------------

  /// Fetches all clinics from SQLite, recalculates distances, and re-filters.
  Future<void> loadClinicsFromDb() async {
    _isLoadingClinics = true;
    _dbError = null;
    notifyListeners();
    try {
      _allClinics = await DatabaseService.getAllClinics();
      _applyDistances();
      _applyFilters();
    } catch (e) {
      _dbError = 'Failed to load clinics: $e';
      notifyListeners();
    } finally {
      _isLoadingClinics = false;
      notifyListeners();
    }
  }

  /// Inserts [clinic] into the DB and adds it to the in-memory list.
  /// Returns true on success.
  Future<bool> addClinic(VetClinic clinic) async {
    try {
      final id       = await DatabaseService.insertClinic(clinic);
      final inserted = clinic.copyWith(id: id);
      _allClinics.add(inserted);
      _applyDistances();
      _applyFilters();
      return true;
    } catch (e) {
      _dbError = 'Failed to add clinic: $e';
      notifyListeners();
      return false;
    }
  }

  /// Persists changes to [clinic] and updates the in-memory list.
  /// Returns true on success.
  Future<bool> updateClinic(VetClinic clinic) async {
    try {
      await DatabaseService.updateClinic(clinic);
      final idx = _allClinics.indexWhere((c) => c.id == clinic.id);
      if (idx != -1) _allClinics[idx] = clinic;
      _applyDistances();
      _applyFilters();
      return true;
    } catch (e) {
      _dbError = 'Failed to update clinic: $e';
      notifyListeners();
      return false;
    }
  }

  /// Removes the clinic with the given [id] from the DB and the in-memory list.
  /// Clears [selectedClinic] if it was the deleted one.
  /// Returns true on success.
  Future<bool> deleteClinic(int id) async {
    try {
      await DatabaseService.deleteClinic(id);
      _allClinics.removeWhere((c) => c.id == id);
      if (_selectedClinic?.id == id) _selectedClinic = null;
      _applyFilters();
      return true;
    } catch (e) {
      _dbError = 'Failed to delete clinic: $e';
      notifyListeners();
      return false;
    }
  }

  /// Wipes the DB and reseeds it with the default clinic data.
  Future<void> resetToDefaults() async {
    await DatabaseService.resetDatabase();
    await loadClinicsFromDb();
  }

  // ---------------------------------------------------------------------------
  // Selection & error helpers
  // ---------------------------------------------------------------------------

  /// Marks [clinic] as selected (highlights it on the map and in the list).
  void selectClinic(VetClinic? clinic) {
    _selectedClinic = clinic;
    notifyListeners();
  }

  /// Clears any location or database error messages.
  void clearErrors() {
    _locationError = null;
    _dbError       = null;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Search & sort
  // ---------------------------------------------------------------------------

  /// Filters the visible list to clinics whose name contains [query].
  void setSearchQuery(String query) {
    _searchQuery = query;
    _applyFilters();
  }

  /// Switches between nearest-first and highest-rated-first ordering.
  void setSortMode(SortMode mode) {
    _sortMode = mode;
    _applyFilters();
  }

  /// Applies the current search query and sort mode to [_allClinics]
  /// and stores the result in [_filteredClinics].
  void _applyFilters() {
    List<VetClinic> result = List.from(_allClinics);

    // Name search (case-insensitive)
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result.where((c) => c.name.toLowerCase().contains(q)).toList();
    }

    // Sort
    if (_sortMode == SortMode.nearest) {
      result.sort((a, b) {
        // Push clinics without a distance to the end
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm!.compareTo(b.distanceKm!);
      });
    } else {
      result.sort((a, b) => b.rating.compareTo(a.rating));
    }

    _filteredClinics = result;
    notifyListeners();
  }

  /// Calculates and caches [VetClinic.distanceKm] for every clinic
  /// based on the current [_userPosition]. No-op if position is unknown.
  void _applyDistances() {
    if (_userPosition == null) return;
    for (final clinic in _allClinics) {
      clinic.distanceKm = LocationService.calculateDistanceKm(
        _userPosition!.latitude,
        _userPosition!.longitude,
        clinic.latitude,
        clinic.longitude,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Location
  // ---------------------------------------------------------------------------

  /// Requests GPS permission, gets the current position, and refreshes distances.
  Future<void> fetchUserLocation() async {
    _isLoadingLocation = true;
    _locationError     = null;
    notifyListeners();

    final permStatus = await LocationService.checkAndRequestPermission();

    if (permStatus == LocationPermissionStatus.permanentlyDenied) {
      _locationError     = 'Location permission is permanently denied. Please enable it in Settings.';
      _isLoadingLocation = false;
      notifyListeners();
      return;
    }

    if (permStatus == LocationPermissionStatus.denied) {
      _locationError     = 'Location permission denied. Distance cannot be shown.';
      _isLoadingLocation = false;
      notifyListeners();
      return;
    }

    final position = await LocationService.getCurrentPosition();

    if (position == null) {
      _locationError     = 'Could not get your location. Please ensure location services are enabled.';
      _isLoadingLocation = false;
      notifyListeners();
      return;
    }

    _userPosition      = position;
    _isLoadingLocation = false;
    _applyDistances();
    _applyFilters(); // also calls notifyListeners
  }
}