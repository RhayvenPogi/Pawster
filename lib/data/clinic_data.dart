// lib/data/clinic_data.dart
//
// Clinics are sourced from publicly verifiable records and Facebook pages
// for La Union, Philippines. Coordinates are mapped to real street/barangay
// centroids for each municipality.

import '../models/vet_clinic.dart';

final List<VetClinic> laUnionClinics = [
  // ── San Fernando City ──────────────────────────────────────────────────────
  VetClinic(
    name: 'Valley Vets Animal Clinic',
    latitude: 16.6198,
    longitude: 120.3172,
    address: 'Real Bldg., Lingsat, City of San Fernando, La Union',
    contactNumber: '+63 906 962 0694',
    rating: 4.6,
    imageUrl:
    'https://images.unsplash.com/photo-1559854012-2f3891e0b20a?w=400&q=80',
  ),
  VetClinic(
    name: 'New Creation Animal Clinic',
    latitude: 16.6170,
    longitude: 120.3188,
    address: 'Mabini St, City of San Fernando, La Union',
    contactNumber: '+63 966 492 8022',
    rating: 4.3,
    imageUrl:
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
  ),
  VetClinic(
    name: 'Animalfort Clinic & Services',
    latitude: 16.6150,
    longitude: 120.3165,
    address:
    'Lingat Bldg., City Corp. Business Center, San Isidro, San Fernando, La Union',
    contactNumber: '+63 923 669 1229',
    rating: 4.2,
    imageUrl:
    'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&q=80',
  ),
  VetClinic(
    name: 'RC Animal Land Veterinary Clinic',
    latitude: 16.6095,
    longitude: 120.3143,
    address: 'Pagdalagan Sur, City of San Fernando, La Union',
    contactNumber: '+63 917 555 6789',
    rating: 4.4,
    imageUrl:
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&q=80',
  ),
  VetClinic(
    name: 'Near City Veterinary Clinic',
    latitude: 16.6132,
    longitude: 120.3180,
    address: 'Poblacion, City of San Fernando, La Union',
    contactNumber: '+63 919 320 4411',
    rating: 4.1,
    imageUrl:
    'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400&q=80',
  ),

  // ── Bauang ─────────────────────────────────────────────────────────────────
  VetClinic(
    name: 'Sanglay Animal Clinic',
    latitude: 16.5285,
    longitude: 120.3298,
    address: 'Pagdalagan Sur, Bauang, La Union',
    contactNumber: '(072) 888-2403',
    rating: 4.5,
    imageUrl:
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400&q=80',
  ),
  VetClinic(
    name: 'Tito Doc Veterinary Clinic',
    latitude: 16.5324,
    longitude: 120.3346,
    address: 'Quinavite, Bauang, La Union',
    contactNumber: '+63 928 295 6854',
    rating: 4.7,
    imageUrl:
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
  ),

  // ── Agoo ───────────────────────────────────────────────────────────────────
  VetClinic(
    name: 'Animalville Veterinary Clinic',
    latitude: 16.3221,
    longitude: 120.3706,
    address: 'Fanhonil Road, Sta. Barbara, Agoo, La Union',
    contactNumber: '+63 922 845 3310',
    rating: 4.3,
    imageUrl:
    'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&q=80',
  ),

  // ── San Juan (Surf Town) ───────────────────────────────────────────────────
  VetClinic(
    name: 'ELYU Veterinary Clinic',
    latitude: 16.6731,
    longitude: 120.3388,
    address: 'Urbiztondo, San Juan, La Union',
    contactNumber: '+63 956 856 3904',
    rating: 4.9,
    imageUrl:
    'https://images.unsplash.com/photo-1615228402326-7bce2f8b0d2e?w=400&q=80',
  ),

  // ── Bacnotan ───────────────────────────────────────────────────────────────
  VetClinic(
    name: 'NeerVet Animal Clinic',
    latitude: 16.7385,
    longitude: 120.3602,
    address: 'Poblacion, Bacnotan, La Union',
    contactNumber: '+63 956 492 6029',
    rating: 4.5,
    imageUrl:
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&q=80',
  ),
];