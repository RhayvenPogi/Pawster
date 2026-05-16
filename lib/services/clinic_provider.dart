import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../models/vet_clinic.dart';
import '../models/user_review.dart';
import 'database_service.dart';
import 'location_service.dart';

/// Controls how the clinic list is ordered.
enum SortMode { nearest, highestRated }

/// Central state manager for clinics, location, search, sort, and reviews.
class ClinicProvider extends ChangeNotifier {
  List<VetClinic> _allClinics      = [];
  List<VetClinic> _filteredClinics = [];

  Position?  _userPosition;
  bool       _isLoadingLocation = false;
  bool       _isLoadingClinics  = false;
  String?    _locationError;
  String?    _dbError;
  SortMode   _sortMode    = SortMode.nearest;
  String     _searchQuery = '';
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

  Future<void> initWithPosition(Position position) async {
    _userPosition = position;
    await loadClinicsFromDb();
  }

  Future<void> init() async {
    await loadClinicsFromDb();
    await fetchUserLocation();
  }

  // ---------------------------------------------------------------------------
  // Database — clinics
  // ---------------------------------------------------------------------------

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

  Future<void> resetToDefaults() async {
    await DatabaseService.resetDatabase();
    await loadClinicsFromDb();
  }

  // ---------------------------------------------------------------------------
  // Database — reviews
  // ---------------------------------------------------------------------------

  /// Loads reviews for [clinicId] and attaches them to the matching clinic object.
  Future<void> loadReviewsForClinic(int clinicId) async {
    try {
      final reviews = await DatabaseService.getReviewsForClinic(clinicId);
      final idx = _allClinics.indexWhere((c) => c.id == clinicId);
      if (idx != -1) {
        _allClinics[idx] = _allClinics[idx].copyWith(userReviews: reviews);
        _applyFilters();
      }
    } catch (e) {
      _dbError = 'Failed to load reviews: $e';
      notifyListeners();
    }
  }

  /// Inserts a new review then refreshes the parent clinic's review list.
  /// Returns true on success.
  Future<bool> submitReview(UserReview review) async {
    try {
      await DatabaseService.insertReview(review);
      await loadReviewsForClinic(review.clinicId);
      return true;
    } catch (e) {
      _dbError = 'Failed to submit review: $e';
      notifyListeners();
      return false;
    }
  }

  /// Deletes a review then refreshes the parent clinic's review list.
  /// Returns true on success.
  Future<bool> deleteReview(int reviewId, int clinicId) async {
    try {
      await DatabaseService.deleteReview(reviewId);
      await loadReviewsForClinic(clinicId);
      return true;
    } catch (e) {
      _dbError = 'Failed to delete review: $e';
      notifyListeners();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Selection & error helpers
  // ---------------------------------------------------------------------------

  void selectClinic(VetClinic? clinic) {
    _selectedClinic = clinic;
    notifyListeners();
  }

  void clearErrors() {
    _locationError = null;
    _dbError       = null;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Search & sort
  // ---------------------------------------------------------------------------

  void setSearchQuery(String query) {
    _searchQuery = query;
    _applyFilters();
  }

  void setSortMode(SortMode mode) {
    _sortMode = mode;
    _applyFilters();
  }

  void _applyFilters() {
    List<VetClinic> result = List.from(_allClinics);

    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result.where((c) => c.name.toLowerCase().contains(q)).toList();
    }

    if (_sortMode == SortMode.nearest) {
      result.sort((a, b) {
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
    _applyFilters();
  }
}