import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/vet_clinic.dart';
import '../models/user_review.dart';
import '../services/clinic_provider.dart';


// ---------------------------------------------------------------------------
// Shared colour constants — defined at file scope so every widget in this
// file can reference them without passing them down as constructor parameters.
// ---------------------------------------------------------------------------
const _primary       = Color(0xFF388E3C); // main green brand colour
const _secondary     = Color(0xFF1976D2); // blue, used for top-rated clinics
const _accent        = Color(0xFFF57C00); // amber, used exclusively for stars
const _danger        = Color(0xFFE53935); // red, used for delete actions
const _textPrimary   = Color(0xFF1B2B1C); // near-black body text
const _textSecondary = Color(0xFF5A7A5C); // muted label / subtitle text
const _textHint      = Color(0xFF9DB09E); // placeholder / hint text
const _borderLight   = Color(0xFFE0E0E0); // subtle card / input borders
const _surface       = Color(0xFFF5F9F3); // off-white card backgrounds


// =============================================================================
// CLINIC BOTTOM SHEET
// =============================================================================


/// A draggable bottom sheet that displays full details for a single [VetClinic].
///
/// Responsibilities:
/// - Shows the clinic image, name, rating, address, contact, and distance.
/// - Provides "Get Directions" and "Call Clinic" quick-action buttons.
/// - Hosts the [_ReviewsSection] and opens [_ReviewFormSheet] for new reviews.
/// - Exposes edit / delete / close callbacks to the parent screen.
class ClinicBottomSheet extends StatefulWidget {
  final VetClinic clinic;


  /// Whether this clinic is the geographically closest one to the user.
  /// Controls whether the "Nearest to You" badge is shown.
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
  State<ClinicBottomSheet> createState() => _ClinicBottomSheetState();
}


class _ClinicBottomSheetState extends State<ClinicBottomSheet> {
  /// Local mutable copy of the clinic, kept in sync with [ClinicProvider]
  /// inside the [Consumer] builder so UI reflects live data changes.
  late VetClinic _clinic;


  @override
  void initState() {
    super.initState();
    _clinic = widget.clinic;


    // Load reviews after the first frame so the widget tree is fully built
    // before we trigger a Provider state change.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_clinic.id != null) {
        context.read<ClinicProvider>().loadReviewsForClinic(_clinic.id!);
      }
    });
  }


  /// Opens the [_ReviewFormSheet] modal as a separate bottom sheet layered
  /// on top of this one, keeping this sheet visible underneath.
  void _openReviewForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,    // lets the sheet grow to fit the keyboard
      backgroundColor: Colors.transparent,
      builder: (_) => _ReviewFormSheet(clinicId: _clinic.id!),
    );
  }


  @override
  Widget build(BuildContext context) {
    // Consumer rebuilds whenever ClinicProvider notifies listeners, ensuring
    // the rating, review count, and badge state stay up to date after a new
    // review is submitted or deleted.
    return Consumer<ClinicProvider>(
      builder: (context, provider, _) {
        // Pull the freshest version of this clinic from the provider list so
        // displayRating and reviewCount reflect the latest DB state.
        final fresh = provider.clinics
            .where((c) => c.id == _clinic.id)
            .toList();
        if (fresh.isNotEmpty) _clinic = fresh.first;


        // displayRating already accounts for user reviews (see VetClinic model).
        final displayRating = _clinic.displayRating;
        // isTopRated uses displayRating internally — no duplication needed.
        final isTopRated  = _clinic.isTopRated;
        // Top-rated clinics use the blue secondary colour; others use green.
        final markerColor = isTopRated ? _secondary : _primary;


        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.75, // opens at 75 % of screen height
          minChildSize: 0.4,      // can be collapsed to 40 %
          maxChildSize: 0.95,     // can be expanded to near full-screen
          builder: (_, scrollController) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                controller: scrollController,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- Drag handle ------------------------------------------
                    // Standard pill indicator that signals this sheet is draggable.
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(top: 12, bottom: 4),
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),


                    // --- Action icons row -------------------------------------
                    // Edit / Delete / Close are kept at the top-right so they
                    // don't compete visually with the clinic content below.
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 0, 4, 0),
                      child: Row(
                        children: [
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.edit_rounded, color: _primary),
                            tooltip: 'Edit',
                            onPressed: widget.onEdit,
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline_rounded,
                                color: Colors.red),
                            tooltip: 'Delete',
                            onPressed: widget.onDelete,
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded,
                                color: _textSecondary),
                            onPressed: widget.onClose,
                          ),
                        ],
                      ),
                    ),


                    // --- Clinic image -----------------------------------------
                    // [_ClinicImage] handles local file, network URL, and the
                    // placeholder fallback internally.
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: _ClinicImage(clinic: _clinic, height: 180),
                      ),
                    ),
                    const SizedBox(height: 16),


                    // --- Clinic details ---------------------------------------
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Conditional badges — only rendered when relevant.
                          Row(
                            children: [
                              if (widget.isNearest)
                                _InfoBadge(
                                  label: '📍 Nearest to You',
                                  color: _primary,
                                ),
                              if (widget.isNearest && isTopRated)
                                const SizedBox(width: 8),
                              if (isTopRated)
                                _InfoBadge(
                                  label: '⭐ Top Rated',
                                  color: _secondary,
                                ),
                            ],
                          ),
                          const SizedBox(height: 10),


                          // Clinic name
                          Text(
                            _clinic.name,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: _textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),


                          // --- Star rating row --------------------------------
                          // Stars are generated by [_buildStars]; the numeric
                          // label and review count sit alongside them.
                          Row(
                            children: [
                              ..._buildStars(displayRating, markerColor),
                              const SizedBox(width: 6),
                              Text(
                                '${displayRating.toStringAsFixed(1)} / 5.0',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: markerColor,
                                ),
                              ),
                              // Only show review count when there is at least one.
                              if (_clinic.reviewCount > 0) ...[
                                const SizedBox(width: 6),
                                Text(
                                  '(${_clinic.reviewCount} '
                                      '${_clinic.reviewCount == 1 ? 'review' : 'reviews'})',
                                  style: const TextStyle(
                                      fontSize: 12, color: _textSecondary),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 14),


                          // --- Info rows (address / contact / distance) -------
                          _InfoRow(
                              icon: Icons.location_on_rounded,
                              text: _clinic.address,
                              color: _primary),
                          const SizedBox(height: 8),
                          _InfoRow(
                              icon: Icons.phone_rounded,
                              text: _clinic.contactNumber,
                              color: _secondary),
                          // Distance row is optional — only shown after
                          // location permission is granted and distanceKm is set.
                          if (_clinic.distanceKm != null) ...[
                            const SizedBox(height: 8),
                            _InfoRow(
                              icon: Icons.directions_walk_rounded,
                              text: _clinic.formattedDistance,
                              color: _accent,
                            ),
                          ],
                          const SizedBox(height: 20),


                          // --- Get Directions button -------------------------
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: widget.onDirections,
                              icon: const Icon(Icons.navigation_rounded,
                                  size: 18),
                              label: const Text('Get Directions',
                                  style:
                                  TextStyle(fontWeight: FontWeight.w600)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: markerColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                    vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),


                          // --- Call Clinic button ----------------------------
                          // Uses the tel: URI scheme; the OS handles routing to
                          // the dialler or a call app.
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final uri = Uri(
                                    scheme: 'tel',
                                    path: _clinic.contactNumber);
                                await launchUrl(uri);
                              },
                              icon:
                              const Icon(Icons.phone_rounded, size: 18),
                              label: const Text('Call Clinic',
                                  style:
                                  TextStyle(fontWeight: FontWeight.w600)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _primary,
                                side: const BorderSide(
                                    color: _primary, width: 1.5),
                                padding: const EdgeInsets.symmetric(
                                    vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),


                          // --- Reviews section --------------------------------
                          _ReviewsSection(
                            clinic: _clinic,
                            markerColor: markerColor,
                            onAddReview: _openReviewForm,
                            onDeleteReview: (reviewId) {
                              provider.deleteReview(reviewId, _clinic.id!);
                            },
                          ),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }


  /// Builds a row of 5 star icons for [rating].
  ///
  /// - Full star  → integer portion of [rating]
  /// - Half star  → fractional portion between 0 and 1
  /// - Empty star → remainder up to 5
  ///
  /// Stars always use [_accent] (amber) regardless of [starColor], which is
  /// currently unused but kept for future theming flexibility.
  List<Widget> _buildStars(double rating, Color starColor) {
    return List.generate(5, (i) {
      if (i < rating.floor()) {
        return const Icon(Icons.star_rounded, size: 18, color: _accent);
      } else if (i < rating) {
        return const Icon(Icons.star_half_rounded, size: 18, color: _accent);
      }
      return const Icon(Icons.star_outline_rounded, size: 18, color: _accent);
    });
  }
}


// =============================================================================
// REVIEWS SECTION
// =============================================================================


/// Displays the list of [UserReview]s for a clinic and a "Write a Review"
/// button. Shows an empty-state placeholder when [clinic.userReviews] is empty.
class _ReviewsSection extends StatelessWidget {
  final VetClinic clinic;
  final Color markerColor;
  final VoidCallback onAddReview;


  /// Called with the review's id when the user confirms deletion of a card.
  final void Function(int reviewId) onDeleteReview;


  const _ReviewsSection({
    required this.clinic,
    required this.markerColor,
    required this.onAddReview,
    required this.onDeleteReview,
  });


  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header with the "Write a Review" CTA aligned to the right.
        Row(
          children: [
            const Text(
              'Reviews',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: _textPrimary,
              ),
            ),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: onAddReview,
              icon: const Icon(Icons.rate_review_rounded, size: 16),
              label: const Text('Write a Review',
                  style:
                  TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              style: ElevatedButton.styleFrom(
                backgroundColor: markerColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),


        // Empty state — shown when no reviews have been submitted yet.
        if (clinic.userReviews.isEmpty)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 28),
            decoration: BoxDecoration(
              color: _surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _borderLight),
            ),
            child: const Center(
              child: Column(
                children: [
                  Icon(Icons.reviews_outlined, size: 36, color: _textHint),
                  SizedBox(height: 8),
                  Text('No reviews yet',
                      style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: _textSecondary)),
                  SizedBox(height: 4),
                  Text('Be the first to share your experience!',
                      style: TextStyle(fontSize: 12, color: _textHint)),
                ],
              ),
            ),
          ),


        // One [_ReviewCard] per review, mapped directly from the clinic model.
        ...clinic.userReviews.map((review) => _ReviewCard(
          review: review,
          markerColor: markerColor,
          onDelete: () => onDeleteReview(review.id!),
        )),
      ],
    );
  }
}


// =============================================================================
// SINGLE REVIEW CARD
// =============================================================================


/// Renders a single [UserReview] with an avatar, star badge, comment text,
/// and an optional delete button (shown only when [review.id] is non-null).
class _ReviewCard extends StatelessWidget {
  final UserReview review;
  final Color markerColor;


  /// Called after the user confirms deletion in the [_confirmDelete] dialog.
  final VoidCallback onDelete;


  const _ReviewCard({
    required this.review,
    required this.markerColor,
    required this.onDelete,
  });


  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Avatar: first letter of the reviewer's name, or '?' as fallback.
              CircleAvatar(
                radius: 16,
                backgroundColor: markerColor.withOpacity(0.12),
                child: Text(
                  review.reviewerName.isNotEmpty
                      ? review.reviewerName[0].toUpperCase()
                      : '?',
                  style: TextStyle(
                      color: markerColor,
                      fontWeight: FontWeight.w700,
                      fontSize: 14),
                ),
              ),
              const SizedBox(width: 10),


              // Reviewer name and formatted date stacked vertically.
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.reviewerName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: _textPrimary,
                      ),
                    ),
                    Text(
                      _formatDate(review.createdAt),
                      style:
                      const TextStyle(fontSize: 11, color: _textHint),
                    ),
                  ],
                ),
              ),


              // Star rating pill badge aligned to the right of the header row.
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: markerColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded,
                        size: 14, color: _accent),
                    const SizedBox(width: 3),
                    Text(
                      review.starRating.toStringAsFixed(1),
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: markerColor),
                    ),
                  ],
                ),
              ),


              // Delete button — only rendered for persisted reviews (id != null).
              // Tapping shows a confirmation dialog before committing the deletion.
              if (review.id != null)
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded,
                      size: 18, color: _danger),
                  tooltip: 'Delete review',
                  padding: const EdgeInsets.only(left: 4),
                  constraints: const BoxConstraints(),
                  onPressed: () => _confirmDelete(context),
                ),
            ],
          ),
          const SizedBox(height: 10),


          // Review body text with comfortable line height for readability.
          Text(
            review.comment,
            style: const TextStyle(
                fontSize: 14, color: _textPrimary, height: 1.45),
          ),
        ],
      ),
    );
  }


  /// Shows an [AlertDialog] asking the user to confirm deletion.
  ///
  /// Only calls [onDelete] if the user explicitly presses the "Delete" button;
  /// dismissing the dialog or pressing "Cancel" is a no-op.
  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape:
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete review',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: _textPrimary)),
        content: const Text('Remove this review permanently?',
            style: TextStyle(fontSize: 14, color: _textSecondary)),
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
                  borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    // Guard against the dialog being dismissed without a selection (returns null).
    if (confirmed == true) onDelete();
  }


  /// Formats a [DateTime] as a human-readable string, e.g. "Jan 5, 2025".
  ///
  /// Uses a hardcoded month list to avoid pulling in the `intl` package for
  /// this single use case.
  String _formatDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}


// =============================================================================
// REVIEW FORM BOTTOM SHEET
// =============================================================================


/// A modal bottom sheet that lets the user compose and submit a [UserReview].
///
/// Fields: star rating (1–5 tap-to-select), reviewer name, and a comment.
/// The submit button shows a [CircularProgressIndicator] while the async
/// [ClinicProvider.submitReview] call is in flight.
class _ReviewFormSheet extends StatefulWidget {
  final int clinicId;
  const _ReviewFormSheet({required this.clinicId});


  @override
  State<_ReviewFormSheet> createState() => _ReviewFormSheetState();
}


class _ReviewFormSheetState extends State<_ReviewFormSheet> {
  final _nameController    = TextEditingController();
  final _commentController = TextEditingController();


  double _selectedRating = 5.0; // default to the highest star value
  bool   _isSubmitting   = false;


  /// Dynamically switches the accent colour based on whether the selected
  /// rating meets the top-rated threshold — mirrors the main sheet's logic.
  Color get _ratingColor =>
      _selectedRating >= kTopRatedThreshold ? _secondary : _primary;


  @override
  void dispose() {
    // Always dispose controllers to avoid memory leaks.
    _nameController.dispose();
    _commentController.dispose();
    super.dispose();
  }


  /// Validates inputs, constructs a [UserReview], and delegates to the provider.
  ///
  /// Guards against double-submission via [_isSubmitting]; closes the sheet
  /// on success and shows a snack bar with either a success or error message.
  Future<void> _submit() async {
    final name    = _nameController.text.trim();
    final comment = _commentController.text.trim();


    // Inline validation — show a snack bar and abort if either field is empty.
    if (name.isEmpty) {
      _showSnack('Please enter your name.');
      return;
    }
    if (comment.isEmpty) {
      _showSnack('Please write a comment.');
      return;
    }


    setState(() => _isSubmitting = true);


    final review = UserReview(
      clinicId:     widget.clinicId,
      reviewerName: name,
      starRating:   _selectedRating,
      comment:      comment,
      createdAt:    DateTime.now(),
    );


    final success =
    await context.read<ClinicProvider>().submitReview(review);


    // Check mounted before calling setState / Navigator after an await to
    // avoid acting on a widget that was removed from the tree mid-flight.
    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Review submitted! Thank you.'),
            backgroundColor: _primary,
          ),
        );
      } else {
        _showSnack('Failed to submit review. Please try again.');
      }
    }
  }


  /// Convenience wrapper so call-sites don't repeat the [ScaffoldMessenger] boilerplate.
  void _showSnack(String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg)));
  }


  @override
  Widget build(BuildContext context) {
    return Padding(
      // Shift the sheet up by the height of the on-screen keyboard so the
      // submit button remains visible while typing.
      padding:
      EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min, // shrink-wrap to content height
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),


            const Text(
              'Write a Review',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: _textPrimary,
              ),
            ),
            const SizedBox(height: 16),


            // --- Star picker -----------------------------------------------
            // Tapping a star sets [_selectedRating] to that star's value (1–5).
            const Text('Your Rating',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _textSecondary)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final starVal = (i + 1).toDouble();
                return GestureDetector(
                  onTap: () => setState(() => _selectedRating = starVal),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      // Filled star for every index below the selected rating.
                      i < _selectedRating
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      size: 36,
                      color: _ratingColor,
                    ),
                  ),
                );
              }),
            ),
            // Textual label (e.g. "Excellent!") shown below the star row.
            Center(
              child: Text(
                _ratingLabel(_selectedRating),
                style: TextStyle(
                    fontSize: 13,
                    color: _ratingColor,
                    fontWeight: FontWeight.w500),
              ),
            ),
            const SizedBox(height: 16),


            // --- Name field -----------------------------------------------
            const Text('Your Name',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _textSecondary)),
            const SizedBox(height: 6),
            TextField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              style: const TextStyle(fontSize: 14, color: _textPrimary),
              decoration: InputDecoration(
                hintText: 'e.g. Maria Santos',
                hintStyle: const TextStyle(color: _textHint),
                filled: true,
                fillColor: _surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _borderLight),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _borderLight),
                ),
                // Focused border adopts the dynamic rating colour.
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: _ratingColor, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 12),


            // --- Comment field --------------------------------------------
            const Text('Your Comment',
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: _textSecondary)),
            const SizedBox(height: 6),
            TextField(
              controller: _commentController,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              style: const TextStyle(fontSize: 14, color: _textPrimary),
              decoration: InputDecoration(
                hintText: 'Share your experience with this clinic...',
                hintStyle: const TextStyle(color: _textHint),
                filled: true,
                fillColor: _surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _borderLight),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: _borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: _ratingColor, width: 1.5),
                ),
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
              ),
            ),
            const SizedBox(height: 20),


            // --- Submit button --------------------------------------------
            // Disabled (greyed out) while [_isSubmitting] to prevent duplicate
            // submissions; replaced with a spinner during the async call.
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: _primary.withOpacity(0.5),
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
                    : const Text(
                  'Submit Review',
                  style: TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }


  /// Maps a numeric [r]ating to a short descriptive label shown below the stars.
  String _ratingLabel(double r) {
    if (r >= 5) return 'Excellent!';
    if (r >= 4) return 'Very Good';
    if (r >= 3) return 'Good';
    if (r >= 2) return 'Fair';
    return 'Poor';
  }
}


// =============================================================================
// SHARED SUB-WIDGETS
// =============================================================================


/// Displays a clinic's image with a priority order:
/// 1. Local file (e.g. a user-picked photo saved to device storage).
/// 2. Network URL from the clinic record.
/// 3. Placeholder graphic if neither source is available or fails to load.
class _ClinicImage extends StatelessWidget {
  final VetClinic clinic;
  final double height;
  const _ClinicImage({required this.clinic, required this.height});


  @override
  Widget build(BuildContext context) {
    if (clinic.hasLocalImage) {
      return Image.file(File(clinic.localImage!),
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder());
    }
    if (clinic.imageUrl.isNotEmpty) {
      return Image.network(clinic.imageUrl,
          height: height,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _placeholder());
    }
    return _placeholder();
  }


  /// Fallback widget shown when no image is available or loading fails.
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
        Text('No Image Available',
            style: TextStyle(
                fontSize: 13,
                color: _primary.withOpacity(0.5),
                fontWeight: FontWeight.w500)),
      ],
    ),
  );
}


/// A pill-shaped badge used for "Nearest to You" and "Top Rated" labels.
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
      child: Text(label,
          style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w700)),
    );
  }
}


/// A labelled icon row used for address, phone, and distance info.
///
/// The icon sits inside a tinted rounded container to give it visual weight
/// without competing with the text alongside it.
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
        // Tinted icon container — background opacity kept low so the icon
        // colour reads clearly against it.
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
            // Slight top padding vertically centres the text with the icon.
            padding: const EdgeInsets.only(top: 6),
            child: Text(text,
                style:
                const TextStyle(fontSize: 14, color: _textPrimary)),
          ),
        ),
      ],
    );
  }
}



