// lib/screens/home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:permission_handler/permission_handler.dart';

import '../models/vet_clinic.dart';
import '../services/clinic_provider.dart';
import '../utils/app_theme.dart';
import '../widgets/clinic_map_widget.dart';
import '../widgets/clinic_card.dart';
import '../widgets/clinic_bottom_sheet.dart';
import '../widgets/clinic_form_dialog.dart';
import 'clinic_form_screen.dart';
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
      if (provider.userPosition == null) {
        provider.fetchUserLocation();
      }
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
        onCall: () => _callClinic(clinic),
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

  Future<void> _callClinic(VetClinic clinic) async {
    final uri = Uri(scheme: 'tel', path: clinic.contactNumber);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not launch dialer')));
    }
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
        onSubmit:
            (
              name,
              address,
              contact,
              imageUrl,
              localImagePath,
              lat,
              lng,
              rating,
            ) async {
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
              final success = await context.read<ClinicProvider>().addClinic(
                clinic,
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? '✅ Clinic added!' : '❌ Failed to add clinic',
                    ),
                    backgroundColor: success ? AppTheme.primary : Colors.red,
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
        onSubmit:
            (
              name,
              address,
              contact,
              imageUrl,
              localImagePath,
              lat,
              lng,
              rating,
            ) async {
              final updated = clinic.copyWith(
                name: name,
                address: address,
                contactNumber: contact,
                imageUrl: imageUrl.isNotEmpty ? imageUrl : clinic.imageUrl,
                localImage: localImagePath.isNotEmpty
                    ? localImagePath
                    : clinic.localImage,
                latitude: lat,
                longitude: lng,
                rating: rating,
              );
              final success = await context.read<ClinicProvider>().updateClinic(
                updated,
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success ? '✅ Clinic updated!' : '❌ Failed to update',
                    ),
                    backgroundColor: success ? AppTheme.primary : Colors.red,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Clinic'),
        content: Text('Are you sure you want to delete "${clinic.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final success = await context.read<ClinicProvider>().deleteClinic(
        clinic.id!,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? '🗑️ "${clinic.name}" deleted'
                  : '❌ Could not delete clinic',
            ),
            backgroundColor: success ? Colors.red.shade700 : Colors.grey,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // MAP
          Positioned.fill(
            child: ClinicMapWidget(
              mapController: _mapController,
              onMarkerTapped: _onMarkerTapped,
            ),
          ),

          // TOP BAR
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _TopBar(
              searchController: _searchController,
              onSearch: (q) => context.read<ClinicProvider>().setSearchQuery(q),
            ),
          ),

          // LOCATION / DB ERROR BANNER
          Consumer<ClinicProvider>(
            builder: (_, provider, _) {
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

          // FABs (right side)
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
                  backgroundColor: Colors.white,
                  child: const Icon(
                    Icons.my_location_rounded,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'refresh',
                  onPressed: () =>
                      context.read<ClinicProvider>().fetchUserLocation(),
                  backgroundColor: Colors.white,
                  child: Consumer<ClinicProvider>(
                    builder: (_, p, _) => p.isLoadingLocation
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppTheme.primary,
                            ),
                          )
                        : const Icon(
                            Icons.refresh_rounded,
                            color: AppTheme.secondary,
                          ),
                  ),
                ),
              ],
            ),
          ),

          // DRAGGABLE BOTTOM SHEET
          DraggableScrollableSheet(
            controller: _draggableController,
            initialChildSize: 0.35,
            minChildSize: 0.12,
            maxChildSize: 0.88,
            builder: (context, scrollController) {
              return _ClinicListSheet(
                scrollController: scrollController,
                onClinicTap: _onMarkerTapped,
                onCall: _callClinic,
                onDirections: _openDirections,
                onEdit: _goToEditClinic,
                onDelete: _confirmDelete,
              );
            },
          ),
        ],
      ),
    );
  }
}

// ─── Top Search Bar ─────────────────────────────────────────────────────────

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
        bottom: 12,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppTheme.primary.withOpacity(0.95),
            AppTheme.primary.withOpacity(0.0),
          ],
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.local_hospital_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PawAywan',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  Text(
                    'Veterinary Clinic Locator · La Union',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
              const Spacer(),
              Consumer<ClinicProvider>(
                builder: (_, p, _) => p.isLoadingLocation
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Icon(
                        p.userPosition != null
                            ? Icons.location_on_rounded
                            : Icons.location_off_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
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
                hintStyle: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 14,
                ),
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  color: AppTheme.primary,
                  size: 20,
                ),
                suffixIcon: searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(
                          Icons.clear_rounded,
                          color: AppTheme.textSecondary,
                          size: 18,
                        ),
                        onPressed: () {
                          searchController.clear();
                          onSearch('');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Error Banner ────────────────────────────────────────────────────────────

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
        color: Colors.orange.shade700,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.orange.withOpacity(0.3), blurRadius: 8),
        ],
      ),
      child: Row(
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: Colors.white,
            size: 18,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ),
          if (isPermanent)
            TextButton(
              onPressed: () => openAppSettings(),
              child: const Text(
                'Settings',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          IconButton(
            icon: const Icon(
              Icons.close_rounded,
              color: Colors.white,
              size: 18,
            ),
            onPressed: onDismiss,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

// ─── Clinic List Sheet ───────────────────────────────────────────────────────

class _ClinicListSheet extends StatelessWidget {
  final ScrollController scrollController;
  final void Function(VetClinic) onClinicTap;
  final void Function(VetClinic) onCall;
  final void Function(VetClinic) onDirections;
  final void Function(VetClinic) onEdit;
  final void Function(VetClinic) onDelete;

  const _ClinicListSheet({
    required this.scrollController,
    required this.onClinicTap,
    required this.onCall,
    required this.onDirections,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: CustomScrollView(
        controller: scrollController,
        slivers: [
          SliverToBoxAdapter(
            child: Column(
              children: [
                // Handle
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 4),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Header + filters
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      const Text(
                        'Nearby Clinics',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      Consumer<ClinicProvider>(
                        builder: (_, provider, _) => Row(
                          children: [
                            _FilterChip(
                              label: 'Nearest',
                              selected: provider.sortMode == SortMode.nearest,
                              onTap: () =>
                                  provider.setSortMode(SortMode.nearest),
                            ),
                            const SizedBox(width: 6),
                            _FilterChip(
                              label: 'Top Rated',
                              selected:
                                  provider.sortMode == SortMode.highestRated,
                              onTap: () =>
                                  provider.setSortMode(SortMode.highestRated),
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
            builder: (_, provider, _) {
              if (provider.isLoadingClinics) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                  ),
                );
              }

              if (provider.clinics.isEmpty) {
                return SliverToBoxAdapter(child: _EmptyState());
              }

              return SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final clinic = provider.clinics[index];
                  final isNearest = provider.nearestClinic == clinic;
                  return Dismissible(
                    key: ValueKey(clinic.id),
                    direction: DismissDirection.endToStart,
                    background: Container(
                      alignment: Alignment.centerRight,
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      padding: const EdgeInsets.only(right: 20),
                      decoration: BoxDecoration(
                        color: Colors.red.shade400,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.delete_outline_rounded,
                            color: Colors.white,
                            size: 26,
                          ),
                          Text(
                            'Delete',
                            style: TextStyle(color: Colors.white, fontSize: 11),
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
                      onCall: () => onCall(clinic),
                      onDirections: () => onDirections(clinic),
                      onEdit: () => onEdit(clinic),
                    ),
                  );
                }, childCount: provider.clinics.length),
              );
            },
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppTheme.primary : Colors.grey.shade300,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppTheme.primary.withOpacity(0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
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

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Icon(Icons.search_off_rounded, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text(
            'No clinics found',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Try a different search term',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }
}
