import 'user_review.dart';


/// Single source of truth for the top-rated threshold.
/// Must match _topRatedThreshold in clinic_bottom_sheet.dart,
/// clinic_form_dialog.dart, and clinic_map_widget.dart.
const double kTopRatedThreshold = 4.5;


/// Represents a veterinary clinic, including its location, contact info,
/// seeded rating, and any user-submitted reviews.
///
/// [distanceKm] is computed at runtime from the user's current location and
/// is not persisted to the database.
class VetClinic {
  /// Auto-incremented primary key. Null when the clinic has not yet been saved.
  final int? id;


  /// Display name of the clinic.
  final String name;


  /// Geographic latitude of the clinic, in decimal degrees.
  final double latitude;


  /// Geographic longitude of the clinic, in decimal degrees.
  final double longitude;


  /// Human-readable street address.
  final String address;


  /// Primary contact number, stored as a string to preserve leading zeros
  /// and formatting (e.g. "+63 912 345 6789").
  final String contactNumber;


  /// Seeded/admin-provided star rating (1.0–5.0).
  /// UI should prefer [displayRating], which factors in user reviews.
  final double rating;


  /// Remote URL for the clinic's cover image.
  final String imageUrl;


  /// Absolute path to a locally cached copy of the cover image, if any.
  /// Null or empty when no local copy exists — check [hasLocalImage].
  final String? localImage;


  /// Straight-line distance from the user's current location to this clinic,
  /// in kilometres. Set by the location service at runtime; null until known.
  double? distanceKm;


  /// User-submitted reviews for this clinic.
  /// Loaded on demand — not stored in the `vet_clinics` table.
  final List<UserReview> userReviews;


  VetClinic({
    this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.address,
    required this.contactNumber,
    required this.rating,
    required this.imageUrl,
    this.localImage,
    this.distanceKm,
    this.userReviews = const [],
  });


  // ── Computed getters ──────────────────────────────────────────────────────


  /// The rating shown in the UI.
  ///
  /// Returns the mean of all [userReviews] star ratings when at least one
  /// review exists, otherwise falls back to the seeded [rating].
  double get displayRating {
    if (userReviews.isEmpty) return rating;
    final sum = userReviews.fold(rating, (acc, r) => acc + r.starRating);
    return sum / (userReviews.length + 1);
  }


  /// Whether this clinic meets the top-rated threshold ([kTopRatedThreshold]).
  ///
  /// Derived from [displayRating] so that user reviews are reflected on map
  /// markers and cards consistently with the threshold used across all UI files.
  bool get isTopRated => displayRating >= kTopRatedThreshold;


  /// True when a non-empty local image path is available.
  bool get hasLocalImage => localImage != null && localImage!.isNotEmpty;


  /// Total number of user-submitted reviews.
  int get reviewCount => userReviews.length;


  /// Human-readable distance string.
  ///
  /// Returns distances under 1 km in metres (e.g. "350 m away") and longer
  /// distances in kilometres to one decimal place (e.g. "2.4 km away").
  /// Returns "Unknown distance" when [distanceKm] is null.
  String get formattedDistance {
    if (distanceKm == null) return 'Unknown distance';
    if (distanceKm! < 1) {
      return '${(distanceKm! * 1000).toStringAsFixed(0)} m away';
    }
    return '${distanceKm!.toStringAsFixed(1)} km away';
  }


  // ── Transport fare estimates (Philippine rates) ───────────────────────────


  /// Estimated jeepney fare based on LTFRB base fare of ₱13 for the first
  /// 4 km, plus ₱1.80 per km thereafter.
  String get jeepneyFare {
    if (distanceKm == null) return '—';
    final d = distanceKm!;
    if (d <= 4) return '₱13.00';
    final fare = 13.0 + (d - 4) * 1.80;
    return '₱${fare.toStringAsFixed(2)}';
  }


  /// Estimated tricycle fare: ₱20 flat for the first 2 km,
  /// plus ₱3.00 per km thereafter.
  String get tricycleFare {
    if (distanceKm == null) return '—';
    final d = distanceKm!;
    if (d <= 2) return '₱20.00';
    final fare = 20.0 + (d - 2) * 3.0;
    return '₱${fare.toStringAsFixed(2)}';
  }


  /// Estimated bus fare: ₱15 flat for the first 5 km,
  /// plus ₱2.20 per km thereafter.
  String get busFare {
    if (distanceKm == null) return '—';
    final d = distanceKm!;
    if (d <= 5) return '₱15.00';
    final fare = 15.0 + (d - 5) * 2.20;
    return '₱${fare.toStringAsFixed(2)}';
  }


  /// Estimated taxi fare using a ₱40 flag-down rate plus ₱13.50 per km.
  String get taxiFare {
    if (distanceKm == null) return '—';
    final fare = 40.0 + distanceKm! * 13.50;
    return '₱${fare.toStringAsFixed(2)}';
  }


  // ── SQLite serialization ──────────────────────────────────────────────────


  /// Serialises this clinic to a column-name-keyed map for SQLite insert or
  /// update. [userReviews] and [distanceKm] are intentionally excluded —
  /// they are managed separately or computed at runtime.
  ///
  /// [id] is omitted when null so the database can auto-generate the key.
  Map<String, dynamic> toMap() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'contact_number': contactNumber,
      'rating': rating,
      'image_url': imageUrl,
      // Store empty string rather than NULL so the column stays non-null.
      'local_image': localImage ?? '',
    };
  }


  /// Creates a [VetClinic] from a SQLite row map [map].
  ///
  /// An empty `local_image` string is normalised back to null so callers
  /// can rely on [hasLocalImage] without additional null-or-empty checks.
  factory VetClinic.fromMap(Map<String, dynamic> map) {
    return VetClinic(
      id: map['id'] as int?,
      name: map['name'] as String,
      latitude: map['latitude'] as double,
      longitude: map['longitude'] as double,
      address: map['address'] as String,
      contactNumber: map['contact_number'] as String,
      rating: map['rating'] as double,
      imageUrl: map['image_url'] as String,
      // Treat an empty string the same as a missing value.
      localImage: (map['local_image'] as String?)?.isNotEmpty == true
          ? map['local_image'] as String
          : null,
    );
  }


  /// Returns a copy of this clinic with the specified fields replaced.
  ///
  /// [distanceKm] is always carried over from the current instance because
  /// it is runtime-computed and not a constructor parameter here — update it
  /// directly on the returned object if needed.
  VetClinic copyWith({
    int? id,
    String? name,
    double? latitude,
    double? longitude,
    String? address,
    String? contactNumber,
    double? rating,
    String? imageUrl,
    String? localImage,
    List<UserReview>? userReviews,
  }) {
    return VetClinic(
      id: id ?? this.id,
      name: name ?? this.name,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      contactNumber: contactNumber ?? this.contactNumber,
      rating: rating ?? this.rating,
      imageUrl: imageUrl ?? this.imageUrl,
      localImage: localImage ?? this.localImage,
      distanceKm: distanceKm, // runtime value — not replaced via copyWith
      userReviews: userReviews ?? this.userReviews,
    );
  }
}



