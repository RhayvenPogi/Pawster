// =============================================================================
// HOME SCREEN — Main map + clinic list interface for Pawnagaywan
// =============================================================================
// This screen combines an interactive map (flutter_map) with a draggable
// bottom sheet showing nearby veterinary clinics. It supports:
//   • Real-time user geolocation
//   • Search & filter (nearest / top-rated)
//   • CRUD operations (add, edit, delete clinics)
//   • Turn-by-turn directions to selected clinic
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';

import '../models/vet_clinic.dart';
import '../services/clinic_provider.dart';
import '../widgets/clinic_map_widget.dart';
import '../widgets/clinic_card.dart';
import '../widgets/clinic_bottom_sheet.dart';
import '../widgets/clinic_form_dialog.dart';
import 'directions_screen.dart';

// ── Inline colour constants (previously AppTheme) ─────────────────────────────
// Kept inline to reduce import overhead for this single-file screen.
// Green-based palette to match the veterinary / nature theme.

const _primary       = Color(0xFF388E3C);   // Main brand green
const _primaryTint   = Color(0xFFE8F4E2);   // Light green for backgrounds/icons
const _secondary     = Color(0xFF1976D2);   // Blue accent (refresh, links)
const _accent        = Color(0xFFF57C00);   // Orange for warnings / highlights
const _accentTint    = Color(0xFFFFF3E0);   // Light orange for banners
const _danger        = Color(0xFFE53935);   // Red for delete / errors
const _background    = Color(0xFFF5F9F3);   // Off-white green-tinted page bg
const _cardBg        = Color(0xFFFFFFFF);   // Pure white for cards
const _surface       = Color(0xFFC8E6C9);   // Mid-green for drag handles, chips
const _borderLight   = Color(0xFFE0E0E0);   // Neutral light border
const _textPrimary   = Color(0xFF1B2B1C);   // Near-black for headings
const _textSecondary = Color(0xFF5A7A5C);   // Muted green-grey for body text
const _textHint      = Color(0xFF9DB09E);   // Pale green-grey for hints
const _radiusMd      = 12.0;                // Standard card / button radius
const _radiusLg      = 16.0;                // Dialog radius
const _radiusXl      = 20.0;                // Bottom sheet top radius

// =============================================================================
// HOME SCREEN — StatefulWidget
// =============================================================================
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

// =============================================================================
// HOME SCREEN STATE
// =============================================================================
// Holds controllers for:
//   • Map zoom/pan (_mapController)
//   • Draggable sheet snap positions (_draggableController)
//   • Search text field (_searchController)
// =============================================================================
class _HomeScreenState extends State<HomeScreen> {
  final MapController _mapController = MapController();
  final DraggableScrollableController _draggableController =
  DraggableScrollableController();
  final TextEditingController _searchController = TextEditingController();

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  @override
  void initState() {
    super.initState();
    // Defer location fetch until first frame is rendered so that
    // context.read<ClinicProvider>() is safe and the map is ready.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ClinicProvider>();
      if (provider.userPosition == null) provider.fetchUserLocation();
    });
  }

  @override
  void dispose() {
    // Clean up all controllers to prevent memory leaks.
    _mapController.dispose();
    _draggableController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // MARKER INTERACTION
  // ---------------------------------------------------------------------------

  /// Called when a map marker or list item is tapped.
  /// Centres the map on the clinic and opens the detail bottom sheet.
  void _onMarkerTapped(VetClinic clinic) {
    context.read<ClinicProvider>().selectClinic(clinic);
    _mapController.move(LatLng(clinic.latitude, clinic.longitude), 14.0);
    _showClinicSheet(clinic);
  }

  /// Displays a modal bottom sheet with clinic details and action buttons.
  /// Automatically clears the selected clinic when dismissed.
  void _showClinicSheet(VetClinic clinic) {
    final provider  = context.read<ClinicProvider>();
    final isNearest = provider.nearestClinic == clinic;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,   // Allows sheet to expand near full-screen
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

  // ---------------------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------------------

  /// Pushes the DirectionsScreen if user location is available.
  /// Shows a SnackBar if GPS fix is still pending.
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

  // ---------------------------------------------------------------------------
  // MAP CONTROLS
  // ---------------------------------------------------------------------------

  /// Centres the map on the user's current GPS coordinates at zoom 13.
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

  // ---------------------------------------------------------------------------
  // CRUD OPERATIONS
  // ---------------------------------------------------------------------------

  /// Opens the add-clinic dialog and submits a new [VetClinic] to the provider.
  /// Falls back to a default Unsplash image if no image is provided.
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
          final success =
          await context.read<ClinicProvider>().addClinic(clinic);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    success ? 'Clinic added!' : 'Failed to add clinic'),
                backgroundColor: success ? _primary : _danger,
              ),
            );
          }
        },
      ),
    );
  }

  /// Opens the edit-clinic dialog pre-filled with existing data.
  /// Preserves original image fields when left empty.
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
            localImage:
            localImagePath.isNotEmpty ? localImagePath : clinic.localImage,
            latitude: lat,
            longitude: lng,
            rating: rating,
          );
          final success =
          await context.read<ClinicProvider>().updateClinic(updated);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    success ? 'Clinic updated!' : 'Failed to update'),
                backgroundColor: success ? _primary : _danger,
              ),
            );
          }
        },
      ),
    );
  }

  /// Shows a confirmation dialog before permanently deleting a clinic.
  /// Returns early if the user cancels.
  Future<void> _confirmDelete(VetClinic clinic) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_radiusLg),
        ),
        title: const Text(
          'Delete clinic',
          style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: _textPrimary),
        ),
        content: Text(
          'Remove "${clinic.name}" from the list?',
          style: const TextStyle(fontSize: 14, color: _textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel',
                style: TextStyle(color: _textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: _danger,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(_radiusMd),
              ),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final success =
      await context.read<ClinicProvider>().deleteClinic(clinic.id!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              success
                  ? '"${clinic.name}" deleted'
                  : 'Could not delete clinic',
            ),
            backgroundColor: success ? _danger : _textSecondary,
          ),
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // BUILD
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      body: Stack(
        children: [
          // Layer 1: Full-screen interactive map with clinic markers.
          Positioned.fill(
            child: ClinicMapWidget(
              mapController: _mapController,
              onMarkerTapped: _onMarkerTapped,
            ),
          ),

          // Layer 2: Top gradient bar with logo, title, and search field.
          Positioned(
            top: 0, left: 0, right: 0,
            child: _TopBar(
              searchController: _searchController,
              onSearch: (q) =>
                  context.read<ClinicProvider>().setSearchQuery(q),
            ),
          ),

          // Layer 3: Floating error banner (location denied, DB failure, etc.).
          Consumer<ClinicProvider>(
            builder: (context, provider, __) {
              final msg = provider.locationError ?? provider.dbError;
              if (msg == null) return const SizedBox();
              return Positioned(
                top: 120, left: 16, right: 16,
                child: _ErrorBanner(
                  message: msg,
                  isPermanent: msg.contains('permanently'),
                  onDismiss: () => provider.clearErrors(),
                ),
              );
            },
          ),

          // Layer 4: Right-side floating action buttons
          // (Add clinic, centre on user, refresh location).
          Positioned(
            right: 16,
            bottom: 300,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: 'add',
                  onPressed: _goToAddClinic,
                  backgroundColor: _primary,
                  child: const Icon(Icons.add_rounded, color: Colors.white),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'location',
                  onPressed: _centerOnUser,
                  backgroundColor: _cardBg,
                  child: const Icon(Icons.my_location_rounded, color: _primary),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: 'refresh',
                  onPressed: () =>
                      context.read<ClinicProvider>().fetchUserLocation(),
                  backgroundColor: _cardBg,
                  child: Consumer<ClinicProvider>(
                    builder: (context, p, __) => p.isLoadingLocation
                        ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: _primary,
                      ),
                    )
                        : const Icon(Icons.refresh_rounded, color: _secondary),
                  ),
                ),
              ],
            ),
          ),

          // Layer 5: Draggable bottom sheet listing clinics.
          DraggableScrollableSheet(
            controller: _draggableController,
            initialChildSize: 0.35,   // Starts at 35 % of screen height
            minChildSize: 0.12,       // Collapsed peek height
            maxChildSize: 0.88,       // Nearly full-screen when expanded
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

// =============================================================================
// TOP BAR — Gradient header with logo, title, live location icon, and search
// =============================================================================
class _TopBar extends StatelessWidget {
  final TextEditingController searchController;
  final ValueChanged<String> onSearch;

  const _TopBar({required this.searchController, required this.onSearch});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8, // Safe area offset
        left: 16,
        right: 16,
        bottom: 14,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFFF59E0B).withOpacity(0.92), // Amber top
            const Color(0xFFF59E0B).withOpacity(0.0),  // Fades to transparent
          ],
        ),
      ),
      child: Column(
        children: [
          // Row: App logo + name + live GPS status icon.
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
                      color: _primary,
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
                      'PAWNAGAYWAN',
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
              // Live location indicator: spinner while fetching,
              // filled icon when available, crossed-out when denied.
              Consumer<ClinicProvider>(
                builder: (context, p, __) {
                  if (p.isLoadingLocation) {
                    return const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
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
          // Search field with clear button that appears once text is entered.
          Container(
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(_radiusMd),
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
              style: const TextStyle(fontSize: 14, color: _textPrimary),
              decoration: InputDecoration(
                hintText: 'Search clinics in La Union...',
                hintStyle: const TextStyle(color: _textHint, fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded,
                    color: _primary, size: 20),
                suffixIcon: searchController.text.isNotEmpty
                    ? IconButton(
                  icon: const Icon(Icons.clear_rounded,
                      color: _textHint, size: 18),
                  onPressed: () {
                    searchController.clear();
                    onSearch('');
                  },
                )
                    : null,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// ERROR BANNER — Dismissible in-line alert for location or DB errors
// =============================================================================
class _ErrorBanner extends StatelessWidget {
  final String message;
  final bool isPermanent;   // True when permission is permanently denied
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
        color: _accentTint,
        borderRadius: BorderRadius.circular(_radiusMd),
        border: Border.all(color: _accent.withOpacity(0.35)),
        boxShadow: [
          BoxShadow(color: _accent.withOpacity(0.15), blurRadius: 8),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: _accent, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message,
                style: const TextStyle(color: _textPrimary, fontSize: 12)),
          ),
          // If permission is permanently denied, offer a shortcut to OS settings.
          if (isPermanent)
            TextButton(
              onPressed: () => openAppSettings(),
              child: const Text('Settings',
                  style: TextStyle(
                      color: _primary, fontWeight: FontWeight.w700)),
            ),
          IconButton(
            icon: const Icon(Icons.close_rounded,
                color: _textSecondary, size: 18),
            onPressed: onDismiss,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// CLINIC LIST SHEET — Draggable scrollable content showing clinic cards
// =============================================================================
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
        color: _background,
        borderRadius:
        BorderRadius.vertical(top: Radius.circular(_radiusXl)),
        boxShadow: [
          BoxShadow(
              color: Colors.black12, blurRadius: 20, offset: Offset(0, -4)),
        ],
      ),
      child: CustomScrollView(
        controller: scrollController,
        slivers: [
          // Header: drag handle + title + sort filter chips.
          SliverToBoxAdapter(
            child: Column(
              children: [
                // Visual drag handle indicator.
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 4),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: _surface,
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
                          color: _textPrimary,
                        ),
                      ),
                      const Spacer(),
                      // Sort-mode toggle chips (Nearest vs Top rated).
                      Consumer<ClinicProvider>(
                        builder: (context, provider, __) => Row(
                          children: [
                            _FilterChip(
                              label: 'Nearest',
                              selected: provider.sortMode == SortMode.nearest,
                              onTap: () =>
                                  provider.setSortMode(SortMode.nearest),
                            ),
                            const SizedBox(width: 6),
                            _FilterChip(
                              label: 'Top rated',
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

          // Main content: loading spinner, empty state, or list of clinics.
          Consumer<ClinicProvider>(
            builder: (context, provider, __) {
              if (provider.isLoadingClinics) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                        child:
                        CircularProgressIndicator(color: _primary)),
                  ),
                );
              }

              if (provider.clinics.isEmpty) {
                return SliverToBoxAdapter(child: _EmptyState());
              }

              // Build scrollable list of dismissible clinic cards.
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                      (context, index) {
                    final clinic    = provider.clinics[index];
                    final isNearest = provider.nearestClinic == clinic;
                    return Dismissible(
                      key: ValueKey(clinic.id),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        margin: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 6),
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: _danger,
                          borderRadius: BorderRadius.circular(_radiusLg),
                        ),
                        child: const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.delete_outline_rounded,
                                color: Colors.white, size: 24),
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
                      // confirmDismiss returns false because we handle
                      // deletion via a confirmation dialog instead.
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
          // Bottom padding so last card isn't hidden by system nav bar.
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

// =============================================================================
// FILTER CHIP — Animated toggle button for sort modes
// =============================================================================
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? _primary : _cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? _primary : _borderLight),
          boxShadow: selected
              ? [
            BoxShadow(
                color: _primary.withOpacity(0.25),
                blurRadius: 6,
                offset: const Offset(0, 2))
          ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : _textSecondary,
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// EMPTY STATE — Placeholder illustration when no clinics match the query
// =============================================================================
class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
                color: _primaryTint, shape: BoxShape.circle),
            child: const Icon(Icons.search_off_rounded,
                size: 48, color: _primary),
          ),
          const SizedBox(height: 14),
          const Text(
            'No clinics found',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: _textPrimary),
          ),
          const SizedBox(height: 6),
          const Text(
            'Try a different search term',
            style: TextStyle(fontSize: 13, color: _textSecondary),
          ),
        ],
      ),
    );
  }
}