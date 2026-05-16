import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/vet_clinic.dart';


// ---------------------------------------------------------------------------
// Theme constants — centralised so colour changes only need one edit.
// ---------------------------------------------------------------------------
const Color _primary       = Color(0xFF388E3C); // green  – brand / nearest badge
const Color _secondary     = Color(0xFF1976D2); // blue   – top-rated badge / directions
const Color _accent        = Color(0xFFF57C00); // orange – always used for stars & edit
const Color _textPrimary   = Color(0xFF1B2B1C); // dark   – clinic name
const Color _textSecondary = Color(0xFF5A7A5C); // muted  – address / meta text


// ---------------------------------------------------------------------------
// ClinicCard
// ---------------------------------------------------------------------------
/// A card widget that displays a summary of a [VetClinic].
///
/// Shows the clinic photo, name, address, star rating, distance, and three
/// quick-action buttons (Directions, Call, Edit).  An optional green border
/// highlights the nearest clinic, and badges overlay the hero image when
/// the clinic is nearest and/or top-rated.
class ClinicCard extends StatelessWidget {
  final VetClinic clinic;


  /// When `true` a green border and a "📍 Nearest" badge are shown.
  final bool isNearest;


  /// Called when the user taps anywhere on the card (opens detail view).
  final VoidCallback onTap;


  /// Called when the user taps the Directions button.
  final VoidCallback onDirections;


  /// Called when the user taps the Edit button.
  final VoidCallback onEdit;


  const ClinicCard({
    super.key,
    required this.clinic,
    required this.isNearest,
    required this.onTap,
    required this.onDirections,
    required this.onEdit,
  });


  @override
  Widget build(BuildContext context) {
    final displayRating = clinic.displayRating; // resolved rating (local or Google)
    final isTopRated    = clinic.isTopRated;    // true when rating ≥ threshold


    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.07),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
          // Highlight the nearest clinic with a coloured border.
          border: isNearest ? Border.all(color: _primary, width: 2) : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Hero image with overlaid badges ──────────────────────────
            Stack(
              children: [
                // Rounded top corners so the image fits the card shape.
                ClipRRect(
                  borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(14)),
                  child: _ClinicImage(clinic: clinic, height: 130),
                ),


                // Badges sit at the bottom-left of the image.
                Positioned(
                  bottom: 8,
                  left: 10,
                  child: Row(
                    children: [
                      if (isNearest)
                        _Badge(label: '📍 Nearest', color: _primary),
                      if (isNearest && isTopRated)
                        const SizedBox(width: 6), // spacing between badges
                      if (isTopRated)
                        _Badge(label: '⭐ Top Rated', color: _secondary),
                    ],
                  ),
                ),
              ],
            ),


            // ── Text + action area ────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Clinic name — single line, truncated if too long.
                  Text(
                    clinic.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: _textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),


                  // Address row with a pin icon.
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 13, color: _textSecondary),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          clinic.address,
                          style: const TextStyle(
                              fontSize: 12, color: _textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),


                  // Rating row: stars | numeric value | review count | distance
                  Row(
                    children: [
                      // 5-star visual indicator (always orange).
                      _RatingStars(rating: displayRating),
                      const SizedBox(width: 5),


                      // Numeric rating, e.g. "4.5".
                      Text(
                        displayRating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _accent,
                        ),
                      ),


                      // Review count shown only when reviews exist.
                      if (clinic.reviewCount > 0) ...[
                        const SizedBox(width: 3),
                        Text(
                          '(${clinic.reviewCount})',
                          style: const TextStyle(
                              fontSize: 11, color: _textSecondary),
                        ),
                      ],


                      const Spacer(),


                      // Distance from the user's current location.
                      if (clinic.distanceKm != null)
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.directions_walk_rounded,
                                size: 13, color: _primary),
                            const SizedBox(width: 2),
                            Text(
                              clinic.formattedDistance, // e.g. "1.2 km"
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: _primary,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),


                  // ── Quick-action buttons ──────────────────────────────
                  Row(
                    children: [
                      // Opens the device's maps app to the clinic.
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.navigation_rounded,
                          label: 'Directions',
                          color: _secondary,
                          onTap: onDirections,
                        ),
                      ),
                      const SizedBox(width: 6),


                      // Dials the clinic's contact number via tel: URI.
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.phone_rounded,
                          label: 'Call',
                          color: _primary,
                          onTap: () async {
                            final uri =
                            Uri(scheme: 'tel', path: clinic.contactNumber);
                            await launchUrl(uri);
                          },
                        ),
                      ),
                      const SizedBox(width: 6),


                      // Opens the edit form for this clinic.
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.edit_rounded,
                          label: 'Edit',
                          color: _accent,
                          onTap: onEdit,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}


// ---------------------------------------------------------------------------
// _ClinicImage
// ---------------------------------------------------------------------------
/// Resolves and displays the best available image for a clinic.
///
/// Priority order:
///   1. Local file path (user-captured photo)
///   2. Remote URL (e.g. Google Places photo)
///   3. Placeholder with a hospital icon
class _ClinicImage extends StatelessWidget {
  final VetClinic clinic;
  final double height;


  const _ClinicImage({required this.clinic, required this.height});


  @override
  Widget build(BuildContext context) {
    // 1️⃣  Prefer a locally stored image (fastest, works offline).
    if (clinic.hasLocalImage) {
      return Image.file(File(clinic.localImage!),
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder());
    }


    // 2️⃣  Fall back to a network image.
    if (clinic.imageUrl.isNotEmpty) {
      return Image.network(clinic.imageUrl,
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder());
    }


    // 3️⃣  No image available — show a branded placeholder.
    return _placeholder();
  }


  /// A lightly tinted box with a hospital icon used when no photo exists.
  Widget _placeholder() => Container(
    height: height,
    width: double.infinity,
    color: _primary.withOpacity(0.1),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.local_hospital_rounded,
            size: 48, color: _primary.withOpacity(0.4)),
        const SizedBox(height: 6),
        Text('No Image Available',
            style: TextStyle(
                fontSize: 12,
                color: _primary.withOpacity(0.5),
                fontWeight: FontWeight.w500)),
      ],
    ),
  );
}


// ---------------------------------------------------------------------------
// _Badge
// ---------------------------------------------------------------------------
/// A small pill-shaped label used to mark a clinic as nearest or top-rated.
class _Badge extends StatelessWidget {
  final String label;
  final Color color;


  const _Badge({required this.label, required this.color});


  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
        // Soft shadow matches the badge colour for a glowing effect.
        boxShadow: [
          BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 6,
              offset: const Offset(0, 2))
        ],
      ),
      child: Text(label,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w700)),
    );
  }
}


// ---------------------------------------------------------------------------
// _RatingStars
// ---------------------------------------------------------------------------
/// Renders a 5-star rating indicator using filled, half, and outline icons.
///
/// Stars are always [_accent] (orange) for consistency across all screens.
class _RatingStars extends StatelessWidget {
  final double rating;


  const _RatingStars({required this.rating});


  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        if (i < rating.floor()) {
          // Fully filled star.
          return const Icon(Icons.star_rounded, size: 14, color: _accent);
        } else if (i < rating) {
          // Half-filled star for fractional ratings (e.g. 3.7 → 3 full + 1 half).
          return const Icon(Icons.star_half_rounded, size: 14, color: _accent);
        }
        // Empty star for the remainder.
        return const Icon(Icons.star_outline_rounded, size: 14, color: _accent);
      }),
    );
  }
}


// ---------------------------------------------------------------------------
// _ActionButton
// ---------------------------------------------------------------------------
/// A compact icon + label button used in the card's action row.
///
/// The button uses a lightly tinted background and a subtle border derived
/// from [color], keeping each action visually distinct without being loud.
class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;


  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });


  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),   // tinted background
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.3)), // subtle outline
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: color)),
          ],
        ),
      ),
    );
  }
}



