// lib/widgets/clinic_bottom_sheet.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/vet_clinic.dart';

// ── Inline colour constants (previously AppTheme) ─────────────────────────────
const _primary       = Color(0xFF388E3C);
const _secondary     = Color(0xFF1976D2);
const _accent        = Color(0xFFF57C00);
const _textPrimary   = Color(0xFF1B2B1C);
const _textSecondary = Color(0xFF5A7A5C);

class ClinicBottomSheet extends StatelessWidget {
  final VetClinic clinic;
  final bool isNearest;
  final VoidCallback onDirections;
  final VoidCallback onClose;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const ClinicBottomSheet({
    super.key,
    required this.clinic,
    required this.isNearest,
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
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 4, 0),
            child: Row(
              children: [
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.edit_rounded, color: _primary),
                  tooltip: 'Edit',
                  onPressed: onEdit,
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded,
                      color: Colors.red),
                  tooltip: 'Delete',
                  onPressed: onDelete,
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: _textSecondary),
                  onPressed: onClose,
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: _ClinicImage(clinic: clinic, height: 180),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (isNearest)
                      _InfoBadge(
                          label: '📍 Nearest to You', color: _primary),
                    if (isNearest && clinic.isTopRated)
                      const SizedBox(width: 8),
                    if (clinic.isTopRated)
                      _InfoBadge(
                          label: '⭐ Top Rated', color: _secondary),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  clinic.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: _textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    ...List.generate(5, (i) {
                      if (i < clinic.rating.floor()) {
                        return const Icon(Icons.star_rounded,
                            size: 18, color: _accent);
                      } else if (i < clinic.rating) {
                        return const Icon(Icons.star_half_rounded,
                            size: 18, color: _accent);
                      }
                      return const Icon(Icons.star_outline_rounded,
                          size: 18, color: _accent);
                    }),
                    const SizedBox(width: 6),
                    Text(
                      '${clinic.rating.toStringAsFixed(1)} / 5.0',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _InfoRow(
                    icon: Icons.location_on_rounded,
                    text: clinic.address,
                    color: _primary),
                const SizedBox(height: 8),
                _InfoRow(
                    icon: Icons.phone_rounded,
                    text: clinic.contactNumber,
                    color: _secondary),
                if (clinic.distanceKm != null) ...[
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.directions_walk_rounded,
                    text: clinic.formattedDistance,
                    color: _accent,
                  ),
                ],
                const SizedBox(height: 20),

                // Get Directions button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: onDirections,
                    icon: const Icon(Icons.navigation_rounded, size: 18),
                    label: const Text('Get Directions',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _secondary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Call Clinic button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      final uri = Uri(scheme: 'tel', path: clinic.contactNumber);
                      await launchUrl(uri);
                    },
                    icon: const Icon(Icons.phone_rounded, size: 18),
                    label: const Text('Call Clinic',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _primary,
                      side: const BorderSide(color: _primary, width: 1.5),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
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
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }
    if (clinic.imageUrl.isNotEmpty) {
      return Image.network(
        clinic.imageUrl,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() => Container(
    height: height,
    width: double.infinity,
    decoration: BoxDecoration(
      color: _primary.withOpacity(0.1),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.local_hospital_rounded,
            size: 64, color: _primary.withOpacity(0.4)),
        const SizedBox(height: 8),
        Text(
          'No Image Available',
          style: TextStyle(
            fontSize: 13,
            color: _primary.withOpacity(0.5),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    ),
  );
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
          color: color, borderRadius: BorderRadius.circular(20)),
      child: Text(
        label,
        style: const TextStyle(
            color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  const _InfoRow(
      {required this.icon, required this.text, required this.color});

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
            child: Text(text,
                style: const TextStyle(
                    fontSize: 14, color: _textPrimary)),
          ),
        ),
      ],
    );
  }
}