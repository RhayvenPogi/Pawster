// lib/widgets/clinic_bottom_sheet.dart

import 'package:flutter/material.dart';
import '../models/vet_clinic.dart';
import '../utils/app_theme.dart';

class ClinicBottomSheet extends StatelessWidget {
  final VetClinic clinic;
  final bool isNearest;
  final VoidCallback onCall;
  final VoidCallback onDirections;
  final VoidCallback onClose;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const ClinicBottomSheet({
    super.key,
    required this.clinic,
    required this.isNearest,
    required this.onCall,
    required this.onDirections,
    required this.onClose,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Top row: close + edit + delete
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 4, 0),
            child: Row(
              children: [
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.edit_rounded, color: AppTheme.primary),
                  tooltip: 'Edit',
                  onPressed: onEdit,
                ),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    color: Colors.red,
                  ),
                  tooltip: 'Delete',
                  onPressed: onDelete,
                ),
                IconButton(
                  icon: const Icon(
                    Icons.close_rounded,
                    color: AppTheme.textSecondary,
                  ),
                  onPressed: onClose,
                ),
              ],
            ),
          ),

          // Image
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                clinic.imageUrl,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 180,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.local_hospital_rounded,
                        size: 64,
                        color: AppTheme.primary.withOpacity(0.4),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'No Image Available',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.primary.withOpacity(0.5),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Badges
                Row(
                  children: [
                    if (isNearest)
                      _InfoBadge(
                        label: '📍 Nearest to You',
                        color: AppTheme.nearestBadge,
                      ),
                    if (isNearest && clinic.isTopRated)
                      const SizedBox(width: 8),
                    if (clinic.isTopRated)
                      _InfoBadge(
                        label: '⭐ Top Rated',
                        color: AppTheme.topRatedBadge,
                      ),
                  ],
                ),
                const SizedBox(height: 10),

                // Name
                Text(
                  clinic.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),

                // Rating row
                Row(
                  children: [
                    ...List.generate(5, (i) {
                      if (i < clinic.rating.floor()) {
                        return const Icon(
                          Icons.star_rounded,
                          size: 18,
                          color: AppTheme.starColor,
                        );
                      } else if (i < clinic.rating) {
                        return const Icon(
                          Icons.star_half_rounded,
                          size: 18,
                          color: AppTheme.starColor,
                        );
                      }
                      return const Icon(
                        Icons.star_outline_rounded,
                        size: 18,
                        color: AppTheme.starColor,
                      );
                    }),
                    const SizedBox(width: 6),
                    Text(
                      '${clinic.rating.toStringAsFixed(1)} / 5.0',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Info rows
                _InfoRow(
                  icon: Icons.location_on_rounded,
                  text: clinic.address,
                  color: AppTheme.primary,
                ),
                const SizedBox(height: 8),
                _InfoRow(
                  icon: Icons.phone_rounded,
                  text: clinic.contactNumber,
                  color: AppTheme.secondary,
                ),
                if (clinic.distanceKm != null) ...[
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.directions_walk_rounded,
                    text: clinic.formattedDistance,
                    color: AppTheme.accent,
                  ),
                ],

                const SizedBox(height: 20),

                // Call + Directions buttons
                Row(
                  children: [
                    Expanded(
                      child: _BigActionButton(
                        icon: Icons.phone_rounded,
                        label: 'Call Clinic',
                        color: AppTheme.primary,
                        onTap: onCall,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _BigActionButton(
                        icon: Icons.navigation_rounded,
                        label: 'Get Directions',
                        color: AppTheme.secondary,
                        onTap: onDirections,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoBadge extends StatelessWidget {
  final String label;
  final Color color;
  const _InfoBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  const _InfoRow({required this.icon, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary),
            ),
          ),
        ),
      ],
    );
  }
}

class _BigActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _BigActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    );
  }
}
