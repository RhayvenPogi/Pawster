// lib/models/vet_clinic.dart

class VetClinic {
  final int? id;
  final String name;
  final double latitude;
  final double longitude;
  final String address;
  final String contactNumber;
  final double rating;
  final String imageUrl;
  final String? localImage;
  double? distanceKm;

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
  });

  bool get isTopRated => rating >= 4.8;

  bool get hasLocalImage => localImage != null && localImage!.isNotEmpty;

  String get formattedDistance {
    if (distanceKm == null) return 'Unknown distance';
    if (distanceKm! < 1) {
      return '${(distanceKm! * 1000).toStringAsFixed(0)} m away';
    }
    return '${distanceKm!.toStringAsFixed(1)} km away';
  }

  // ── Transport fare estimates (Philippine rates) ───────────────────────────

  String get jeepneyFare {
    if (distanceKm == null) return '—';
    final d = distanceKm!;
    if (d <= 4) return '₱13.00';
    final fare = 13.0 + (d - 4) * 1.80;
    return '₱${fare.toStringAsFixed(2)}';
  }

  String get tricycleFare {
    if (distanceKm == null) return '—';
    final d = distanceKm!;
    if (d <= 2) return '₱20.00';
    final fare = 20.0 + (d - 2) * 3.0;
    return '₱${fare.toStringAsFixed(2)}';
  }

  String get busFare {
    if (distanceKm == null) return '—';
    final d = distanceKm!;
    if (d <= 5) return '₱15.00';
    final fare = 15.0 + (d - 5) * 2.20;
    return '₱${fare.toStringAsFixed(2)}';
  }

  String get taxiFare {
    if (distanceKm == null) return '—';
    final fare = 40.0 + distanceKm! * 13.50;
    return '₱${fare.toStringAsFixed(2)}';
  }

  // ── SQLite serialization ──────────────────────────────────────────────────

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
      'local_image': localImage ?? '',
    };
  }

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
      localImage: (map['local_image'] as String?)?.isNotEmpty == true
          ? map['local_image'] as String
          : null,
    );
  }

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
      distanceKm: distanceKm,
    );
  }
}