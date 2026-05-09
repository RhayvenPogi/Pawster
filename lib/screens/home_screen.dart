import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';

import '../models/vet_clinic.dart';
import '../services/clinic_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/clinic_map_widget.dart';
import '../widgets/clinic_card.dart';
import '../widgets/clinic_bottom_sheet.dart';
import '../widgets/clinic_form_dialog.dart';
import 'directions_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final MapController _mapController = MapController();
  final DraggableScrollableController _draggableController =
  DraggableScrollableController();
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ClinicProvider>();
      if (provider.userPosition == null) provider.fetchUserLocation();
    });
  }

  @override
  void dispose() {
    _mapController.dispose();
    _draggableController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onMarkerTapped(VetClinic clinic) {
    context.read<ClinicProvider>().selectClinic(clinic);
    _mapController.move(LatLng(clinic.latitude, clinic.longitude), 14.0);
    _showClinicSheet(clinic);
  }

  void _showClinicSheet(VetClinic clinic) {
    final provider = context.read<ClinicProvider>();
    final isNearest = provider.nearestClinic == clinic;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ClinicBottomSheet(
        clinic: clinic,
        isNearest: isNearest,
        onDirections: () => _openDirections(clinic),
        onEdit: () {
          Navigator.pop(context);
          _goToEditClinic(clinic);
        },
        onDelete: () {
          Navigator.pop(context);
          _confirmDelete(clinic);
        },
        onClose: () {
          Navigator.pop(context);
          context.read<ClinicProvider>().selectClinic(null);
        },
      ),
    ).whenComplete(() => context.read<ClinicProvider>().selectClinic(null));
  }

  Future<void> _openDirections(VetClinic clinic) async {
    final provider = context.read<ClinicProvider>();
    if (provider.userPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location not available yet. Please wait or retry.'),
        ),
      );
      return;
    }
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DirectionsScreen(
          clinic: clinic,
          currentPosition: provider.userPosition!,
        ),
      ),
    );
  }

  void _centerOnUser() {
    final pos = context.read<ClinicProvider>().userPosition;
    if (pos != null) {
      _mapController.move(LatLng(pos.latitude, pos.longitude), 13.0);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location not available yet')),
      );
    }
  }

  void _goToAddClinic() {
    showDialog(
      context: context,
      builder: (_) => ClinicFormDialog(
        onSubmit: (name, address, contact, imageUrl, localImagePath,
            lat, lng, rating) async {
          final clinic = VetClinic(
            name: name,
            address: address,
            contactNumber: contact,
            imageUrl: imageUrl.isNotEmpty
                ? imageUrl
                : 'https://images.unsplash.com/photo-1559854012-2f3891e0b20a?w=400&q=80',
            localImage: localImagePath.isNotEmpty ? localImagePath : null,
            latitude: lat,
            longitude: lng,
            rating: rating,
          );
          final success = await context.read<ClinicProvider>().addClinic(clinic);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(success ? '✅ Clinic added!' : '❌ Failed to add clinic'),
                backgroundColor: success ? AppTheme.primary : AppTheme.danger,
              ),
            );
          }
        },
      ),
    );
  }

  void _goToEditClinic(VetClinic clinic) {
    showDialog(
      context: context,
      builder: (_) => ClinicFormDialog(
        clinic: clinic,
        onSubmit: (name, address, contact, imageUrl, localImagePath,
            lat, lng, rating) async {
          final updated = clinic.copyWith(
            name: name,
            address: address,
            contactNumber: contact,
            imageUrl: imageUrl.isNotEmpty ? imageUrl : clinic.imageUrl,
            localImage: localImagePath.isNotEmpty ? localImagePath : clinic.localImage,
            latitude: lat,
            longitude: lng,
            rating: rating,
          );
          final success = await context.read<ClinicProvider>().updateClinic(updated);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(success ? '✅ Clinic updated!' : '❌ Failed to update'),
                backgroundColor: success ? AppTheme.primary : AppTheme.danger,
              ),
            );
          }
        },
      ),
    );
  }

  Future<void> _confirmDelete(VetClinic clinic) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        ),
        title: const Text(
          'Delete clinic',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
        ),
        content: Text(
          'Remove "${clinic.name}" from the list?',
          style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.danger,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final success = await context.read<ClinicProvider>().deleteClinic(clinic.id!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success ? '🗑️ "${clinic.name}" deleted' : '❌ Could not delete clinic',
            ),
            backgroundColor: success ? AppTheme.danger : AppTheme.textSecondary,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Stack(
        children: [
          Positioned.fill(
            child: ClinicMapWidget(
              mapController: _mapController,
              onMarkerTapped: _onMarkerTapped,
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _TopBar(
              searchController: _searchController,
              onSearch: (q) => context.read<ClinicProvider>().setSearchQuery(q),
            ),
          ),
          Consumer<ClinicProvider>(
            builder: (context, provider, __) {
              final msg = provider.locationError ?? provider.dbError;
              if (msg == null) return const SizedBox();
              return Positioned(
                top: 120,
                left: 16,
                right: 16,
                child: _ErrorBanner(
                  message: msg,
                  isPermanent: msg.contains('permanently'),
                  onDismiss: () => provider.clearErrors(),
                ),
              );
            },
          ),
          Positioned(
            right: 16,
            bottom: 300,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: 'add',
                  onPressed: _goToAddClinic,
                  backgroundColor: AppTheme.primary,
                  child: const Icon(Icons.add_rounded, color: Colors.white),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'location',
                  onPressed: _centerOnUser,
                  backgroundColor: AppTheme.cardBg,
                  child: const Icon(Icons.my_location_rounded, color: AppTheme.primary),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'refresh',
                  onPressed: () => context.read<ClinicProvider>().fetchUserLocation(),
                  backgroundColor: AppTheme.cardBg,
                  child: Consumer<ClinicProvider>(
                    builder: (context, p, __) => p.isLoadingLocation
                        ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.primary,
                      ),
                    )
                        : const Icon(Icons.refresh_rounded, color: AppTheme.secondary),
                  ),
                ),
              ],
            ),
          ),
          DraggableScrollableSheet(
            controller: _draggableController,
            initialChildSize: 0.35,
            minChildSize: 0.12,
            maxChildSize: 0.88,
            builder: (context, scrollController) => _ClinicListSheet(
              scrollController: scrollController,
              onClinicTap: _onMarkerTapped,
              onDirections: _openDirections,
              onEdit: _goToEditClinic,
              onDelete: _confirmDelete,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Top search bar ─────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final TextEditingController searchController;
  final ValueChanged<String> onSearch;

  const _TopBar({required this.searchController, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 16,
        right: 16,
        bottom: 14,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFFF59E0B).withOpacity(0.92),
            const Color(0xFFF59E0B).withOpacity(0.0),
          ],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(9),
                child: SizedBox(
                  width: 45,
                  height: 45,
                  child: Image.asset(
                    'assets/logo/logo.png',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.pets_rounded,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'PawAywan',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Veterinary Clinic Locator · La Union',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Consumer<ClinicProvider>(
                builder: (context, p, __) {
                  if (p.isLoadingLocation) {
                    return const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    );
                  }
                  return Icon(
                    p.userPosition != null
                        ? Icons.location_on_rounded
                        : Icons.location_off_rounded,
                    color: Colors.white,
                    size: 22,
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: AppTheme.cardBg,
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: TextField(
              controller: searchController,
              onChanged: onSearch,
              style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary),
              decoration: InputDecoration(
                hintText: 'Search clinics in La Union...',
                hintStyle: const TextStyle(color: AppTheme.textHint, fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primary, size: 20),
                suffixIcon: searchController.text.isNotEmpty
                    ? IconButton(
                  icon: const Icon(Icons.clear_rounded, color: AppTheme.textHint, size: 18),
                  onPressed: () {
                    searchController.clear();
                    onSearch('');
                  },
                )
                    : null,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Error banner ───────────────────────────────────────────────────────────────

class _ErrorBanner extends StatelessWidget {
  final String message;
  final bool isPermanent;
  final VoidCallback onDismiss;

  const _ErrorBanner({
    required this.message,
    required this.isPermanent,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.accentTint,
        borderRadius: BorderRadius.circular(AppTheme.radiusMd),
        border: Border.all(color: AppTheme.accent.withOpacity(0.35)),
        boxShadow: [
          BoxShadow(color: AppTheme.accent.withOpacity(0.15), blurRadius: 8),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: AppTheme.accent, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 12)),
          ),
          if (isPermanent)
            TextButton(
              onPressed: () => openAppSettings(),
              child: const Text(
                'Settings',
                style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.close_rounded, color: AppTheme.textSecondary, size: 18),
            onPressed: onDismiss,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

// ── Clinic list sheet ──────────────────────────────────────────────────────────

class _ClinicListSheet extends StatelessWidget {
  final ScrollController scrollController;
  final void Function(VetClinic) onClinicTap;
  final void Function(VetClinic) onDirections;
  final void Function(VetClinic) onEdit;
  final void Function(VetClinic) onDelete;

  const _ClinicListSheet({
    required this.scrollController,
    required this.onClinicTap,
    required this.onDirections,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusXl)),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, -4)),
        ],
      ),
      child: CustomScrollView(
        controller: scrollController,
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 4),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                  child: Row(
                    children: [
                      const Text(
                        'Nearby clinics',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      Consumer<ClinicProvider>(
                        builder: (context, provider, __) => Row(
                          children: [
                            _FilterChip(
                              label: 'Nearest',
                              selected: provider.sortMode == SortMode.nearest,
                              onTap: () => provider.setSortMode(SortMode.nearest),
                            ),
                            const SizedBox(width: 6),
                            _FilterChip(
                              label: 'Top rated',
                              selected: provider.sortMode == SortMode.highestRated,
                              onTap: () => provider.setSortMode(SortMode.highestRated),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Consumer<ClinicProvider>(
            builder: (context, provider, __) {
              if (provider.isLoadingClinics) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
                  ),
                );
              }

              if (provider.clinics.isEmpty) {
                return SliverToBoxAdapter(child: _EmptyState());
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate(
                      (context, index) {
                    final clinic = provider.clinics[index];
                    final isNearest = provider.nearestClinic == clinic;
                    return Dismissible(
                      key: ValueKey(clinic.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: AppTheme.danger,
                          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                        ),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.delete_outline_rounded, color: Colors.white, size: 24),
                            Text(
                              'Delete',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      confirmDismiss: (_) async {
                        onDelete(clinic);
                        return false;
                      },
                      child: ClinicCard(
                        clinic: clinic,
                        isNearest: isNearest,
                        onTap: () => onClinicTap(clinic),
                        onDirections: () => onDirections(clinic),
                        onEdit: () => onEdit(clinic),
                      ),
                    );
                  },
                  childCount: provider.clinics.length,
                ),
              );
            },
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

// ── Filter chip ────────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : AppTheme.cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primary : AppTheme.borderLight),
          boxShadow: selected
              ? [BoxShadow(color: AppTheme.primary.withOpacity(0.25), blurRadius: 6, offset: const Offset(0, 2))]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

// ── Empty state ────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(color: AppTheme.primaryTint, shape: BoxShape.circle),
            child: const Icon(Icons.search_off_rounded, size: 48, color: AppTheme.primary),
          ),
          const SizedBox(height: 14),
          const Text(
            'No clinics found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 6),
          const Text(
            'Try a different search term',
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}