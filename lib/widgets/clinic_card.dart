import 'dart:io';
import 'package:flutter/material.dart';
import '../models/vet_clinic.dart';
import '../utils/app_theme.dart';

class ClinicCard extends StatelessWidget {
  final VetClinic clinic;
  final bool isNearest;
  final VoidCallback onTap;
  final VoidCallback onDirections;
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
          border: isNearest ? Border.all(color: AppTheme.primary, width: 2) : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                  child: _ClinicImage(clinic: clinic, height: 130),
                ),
                Positioned(
                  bottom: 8,
                  left: 10,
                  child: Row(
                    children: [
                      if (isNearest)
                        _Badge(label: '📍 Nearest', color: AppTheme.nearestBadge),
                      if (isNearest && clinic.isTopRated) const SizedBox(width: 6),
                      if (clinic.isTopRated)
                        _Badge(label: '⭐ Top Rated', color: AppTheme.topRatedBadge),
                    ],
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    clinic.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: AppTheme.textSecondary),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          clinic.address,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _RatingStars(rating: clinic.rating),
                      const SizedBox(width: 6),
                      Text(
                        clinic.rating.toStringAsFixed(1),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      if (clinic.distanceKm != null)
                        Row(
                          children: [
                            const Icon(Icons.directions_walk_rounded, size: 14, color: AppTheme.primary),
                            const SizedBox(width: 3),
                            Text(
                              clinic.formattedDistance,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.navigation_rounded,
                          label: 'Directions',
                          color: AppTheme.secondary,
                          onTap: onDirections,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _ActionButton(
                          icon: Icons.edit_rounded,
                          label: 'Edit',
                          color: Colors.orange,
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

class _ClinicImage extends StatelessWidget {
  final VetClinic clinic;
  final double height;
  const _ClinicImage({required this.clinic, required this.height});

  @override
  Widget build(BuildContext context) {
    if (clinic.hasLocalImage) {
      return Image.file(
        File(clinic.localImage!),
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(height),
      );
    }
    if (clinic.imageUrl.isNotEmpty) {
      return Image.network(
        clinic.imageUrl,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(height),
      );
    }
    return _placeholder(height);
  }

  Widget _placeholder(double h) => Container(
    height: h,
    width: double.infinity,
    color: AppTheme.primary.withOpacity(0.1),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.local_hospital_rounded, size: 48, color: AppTheme.primary.withOpacity(0.4)),
        const SizedBox(height: 6),
        Text(
          'No Image Available',
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.primary.withOpacity(0.5),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    ),
  );
}

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
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.4), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _RatingStars extends StatelessWidget {
  final double rating;
  const _RatingStars({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        if (i < rating.floor()) {
          return const Icon(Icons.star_rounded, size: 14, color: AppTheme.starColor);
        } else if (i < rating) {
          return const Icon(Icons.star_half_rounded, size: 14, color: AppTheme.starColor);
        }
        return const Icon(Icons.star_outline_rounded, size: 14, color: AppTheme.starColor);
      }),
    );
  }
}

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
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
            ),
          ],
        ),
      ),
    );
  }
}