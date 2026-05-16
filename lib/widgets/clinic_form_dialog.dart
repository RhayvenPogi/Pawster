import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/vet_clinic.dart';

// ── Theme constants ────────────────────────────────────────────────────────────
// Centralised palette so colour changes only need to happen in one place.
const Color _primary       = Color(0xFF388E3C); // App green — used for headers, accents
const Color _secondary     = Color(0xFF1976D2); // Blue — used for "Top Rated" badge
const Color _accent        = Color(0xFFF57C00); // Orange — used for star ratings
const Color _danger        = Color(0xFFE53935); // Red — used for errors and destructive actions
const Color _textPrimary   = Color(0xFF1B2B1C); // Near-black body text
const Color _textSecondary = Color(0xFF5A7A5C); // Muted green — secondary labels

/// A modal [Dialog] for **adding** a new [VetClinic] or **editing** an existing one.
///
/// Pass [clinic] to enter edit mode; leave it `null` for add mode.
/// [onSubmit] is called with the validated field values when the user taps Save.
class ClinicFormDialog extends StatefulWidget {
  /// The clinic to edit. `null` means "add new clinic" mode.
  final VetClinic? clinic;

  /// Callback invoked with the validated form values on submit.
  /// The caller is responsible for persisting the data (e.g. via a repository).
  final Future<void> Function(
      String name,
      String address,
      String contactNumber,
      String imageUrl,
      String localImagePath,
      double latitude,
      double longitude,
      double rating,
      ) onSubmit;

  const ClinicFormDialog({super.key, this.clinic, required this.onSubmit});

  @override
  State<ClinicFormDialog> createState() => _ClinicFormDialogState();
}

class _ClinicFormDialogState extends State<ClinicFormDialog> {
  // ── Form key & text controllers ─────────────────────────────────────────────
  final _formKey     = GlobalKey<FormState>();
  final _nameCtrl    = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _latCtrl     = TextEditingController();
  final _lngCtrl     = TextEditingController();

  // ── Image state ─────────────────────────────────────────────────────────────
  /// The image file selected from the camera or gallery (if any).
  XFile? _pickedImage;

  /// `true` while the image picker is open, to show a loading indicator.
  bool _pickingImage = false;

  // ── Submission state ────────────────────────────────────────────────────────
  /// `true` while [widget.onSubmit] is awaiting, to disable the Save button.
  bool _submitting = false;

  // ── Rating (add mode only) ──────────────────────────────────────────────────
  /// Initial rating shown on the slider when adding a new clinic.
  /// In edit mode this value is ignored; the existing clinic rating is preserved.
  double _rating = 1.0;

  // ── Convenience getters ─────────────────────────────────────────────────────

  /// Whether the dialog is in edit mode (a [VetClinic] was supplied).
  bool get _isEditing => widget.clinic != null;

  /// Whether the current slider value qualifies the clinic as "Top Rated".
  bool get _willBeTopRated => _rating >= kTopRatedThreshold;

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    // Pre-fill text fields when editing an existing clinic.
    if (widget.clinic != null) {
      final c = widget.clinic!;
      _nameCtrl.text    = c.name;
      _addressCtrl.text = c.address;
      _contactCtrl.text = c.contactNumber;
      _latCtrl.text     = c.latitude.toString();
      _lngCtrl.text     = c.longitude.toString();
      // _rating is intentionally NOT pre-filled in edit mode — the existing
      // rating is preserved as-is and is not exposed to the user for editing
      // here (ratings come from user reviews instead).
    }
  }

  @override
  void dispose() {
    // Always dispose controllers to avoid memory leaks.
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _contactCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    super.dispose();
  }

  // ── Image picking ────────────────────────────────────────────────────────────

  /// Launches the image picker with the given [source] (camera or gallery).
  /// Updates [_pickedImage] on success, or shows a [SnackBar] on error.
  Future<void> _pickImage(ImageSource source) async {
    setState(() => _pickingImage = true);
    try {
      final file = await ImagePicker().pickImage(
        source: source,
        imageQuality: 80, // Compress to reduce storage footprint
        maxWidth: 800,    // Cap resolution for thumbnails
      );
      if (file != null) setState(() => _pickedImage = file);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not pick image: $e')),
        );
      }
    } finally {
      // Always clear the loading state, even if an error occurred.
      if (mounted) setState(() => _pickingImage = false);
    }
  }

  /// Shows a bottom sheet letting the user choose between camera, gallery,
  /// or removing the current photo.
  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),

            // Drag handle
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),

            const Text(
              'Add photo',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            const SizedBox(height: 8),

            // Camera option
            ListTile(
              leading: CircleAvatar(
                backgroundColor: _primary.withOpacity(0.1),
                child: const Icon(Icons.camera_alt_rounded, color: _primary),
              ),
              title: const Text('Take a photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),

            // Gallery option
            ListTile(
              leading: CircleAvatar(
                backgroundColor: _primary.withOpacity(0.1),
                child: const Icon(Icons.photo_library_rounded, color: _primary),
              ),
              title: const Text('Choose from gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),

            // Remove option — only shown when a photo is currently set
            if (_pickedImage != null || widget.clinic?.hasLocalImage == true)
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: _danger.withOpacity(0.1),
                  child: const Icon(Icons.delete_rounded, color: _danger),
                ),
                title: const Text('Remove photo'),
                onTap: () {
                  Navigator.pop(context);
                  setState(() => _pickedImage = null);
                },
              ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // ── Form submission ──────────────────────────────────────────────────────────

  /// Validates the form, then calls [widget.onSubmit] with the field values.
  /// Dismisses the dialog on success.
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      // Use the newly picked image path, fall back to the clinic's existing
      // local image, or empty string if neither is available.
      final localPath = _pickedImage?.path ?? widget.clinic?.localImage ?? '';

      // In edit mode, keep the original remote image URL; empty string for new clinics.
      final imageUrl = widget.clinic?.imageUrl ?? '';

      await widget.onSubmit(
        _nameCtrl.text.trim(),
        _addressCtrl.text.trim(),
        _contactCtrl.text.trim(),
        imageUrl,
        localPath,
        double.parse(_latCtrl.text.trim()),
        double.parse(_lngCtrl.text.trim()),
        // Edit mode → preserve the existing rating unchanged.
        // Add mode  → use the value selected on the slider.
        _isEditing ? (widget.clinic?.rating ?? 0.0) : _rating,
      );

      if (mounted) Navigator.pop(context);
    } finally {
      // Re-enable the Save button whether the call succeeded or failed.
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    // Determine which image path to show in the preview thumbnail.
    final existingLocal = widget.clinic?.localImage;
    final hasPreview    = _pickedImage != null || (existingLocal?.isNotEmpty == true);
    final previewPath   = _pickedImage?.path ?? existingLocal;

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      clipBehavior: Clip.antiAlias,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [

          // ── Header bar ───────────────────────────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
            color: _primary,
            child: Row(
              children: [
                // Icon badge (edit pencil vs. plus)
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    _isEditing ? Icons.edit_rounded : Icons.add_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),

                // Title + subtitle
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isEditing ? 'Edit clinic' : 'Add clinic',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      'Fill in the details below',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.75),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Scrollable form body ─────────────────────────────────────────────
          // Wrapped in [Flexible] so the dialog shrinks on short screens and
          // scrolls when the keyboard is open.
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // ── Photo picker thumbnail ─────────────────────────────────
                    GestureDetector(
                      onTap: _showImageSourceSheet,
                      child: Container(
                        height: 130,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: Colors.grey.shade50,
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: _pickingImage
                        // Loading state: spinner while picker is open
                            ? const Center(
                          child: CircularProgressIndicator(color: _primary),
                        )
                            : hasPreview
                        // Preview state: show selected image with an "edit" overlay
                            ? Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.file(File(previewPath!), fit: BoxFit.cover),
                            // "Change" label in bottom-right corner
                            Positioned(
                              bottom: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.edit_rounded,
                                        color: Colors.white, size: 12),
                                    SizedBox(width: 4),
                                    Text('Change',
                                        style: TextStyle(
                                            color: Colors.white, fontSize: 11)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                        // Empty state: placeholder icon + prompt text
                            : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_rounded,
                                size: 32, color: Colors.grey.shade400),
                            const SizedBox(height: 6),
                            Text('Tap to add photo',
                                style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade400)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Basic info section ─────────────────────────────────────
                    const _SectionLabel(label: 'Basic info'),
                    const SizedBox(height: 10),

                    // Clinic name
                    _FormField(
                      controller: _nameCtrl,
                      hint: 'Clinic name',
                      icon: Icons.local_hospital_rounded,
                      validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 10),

                    // Street / barangay address
                    _FormField(
                      controller: _addressCtrl,
                      hint: 'Address',
                      icon: Icons.location_on_rounded,
                      validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Address is required' : null,
                    ),
                    const SizedBox(height: 10),

                    // Phone / mobile number
                    _FormField(
                      controller: _contactCtrl,
                      hint: 'Contact number',
                      icon: Icons.phone_rounded,
                      keyboardType: TextInputType.phone,
                      validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Contact is required' : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Location section ───────────────────────────────────────
                    const _SectionLabel(label: 'Location'),
                    const SizedBox(height: 10),

                    // Latitude & Longitude side by side
                    Row(
                      children: [
                        Expanded(
                          child: _FormField(
                            controller: _latCtrl,
                            hint: 'Latitude',
                            icon: Icons.my_location_rounded,
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true, signed: true),
                            validator: (v) {
                              final d = double.tryParse(v ?? '');
                              if (d == null) return 'Invalid';
                              if (d < -90 || d > 90) return '-90 to 90';
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _FormField(
                            controller: _lngCtrl,
                            hint: 'Longitude',
                            icon: Icons.explore_rounded,
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true, signed: true),
                            validator: (v) {
                              final d = double.tryParse(v ?? '');
                              if (d == null) return 'Invalid';
                              if (d < -180 || d > 180) return '-180 to 180';
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // ── Rating section (add mode only) ─────────────────────────
                    // Hidden in edit mode because ratings are derived from user
                    // reviews and should not be manually overridden after creation.
                    if (!_isEditing) ...[
                      const _SectionLabel(label: 'Rating'),
                      const SizedBox(height: 10),

                      Container(
                        padding: const EdgeInsets.fromLTRB(14, 12, 14, 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: [

                            // Star icons + numeric value
                            Row(
                              children: [
                                // Render 5 stars: filled, half, or outline
                                ...List.generate(5, (i) {
                                  final filled = i < _rating.floor();
                                  final half   = !filled && i < _rating;
                                  return Icon(
                                    filled
                                        ? Icons.star_rounded
                                        : half
                                        ? Icons.star_half_rounded
                                        : Icons.star_outline_rounded,
                                    color: _accent, // Always orange — consistent with all star displays
                                    size: 26,
                                  );
                                }),
                                const Spacer(),
                                // Numeric rating label (e.g. "4.5 / 5.0")
                                Text(
                                  _rating.toStringAsFixed(1),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: _accent,
                                  ),
                                ),
                                const Text(
                                  ' / 5.0',
                                  style: TextStyle(
                                      fontSize: 13, color: _textSecondary),
                                ),
                              ],
                            ),

                            // "Top Rated" / "Not top rated" badge — animates on threshold cross
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 250),
                              child: _willBeTopRated
                                  ? Padding(
                                key: const ValueKey('top-rated'),
                                padding: const EdgeInsets.only(top: 6),
                                child: Row(
                                  children: [
                                    // Blue "Top Rated" pill
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: _secondary,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Text(
                                        '⭐ Top Rated',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                ),
                              )
                                  : Padding(
                                key: const ValueKey('not-top-rated'),
                                padding: const EdgeInsets.only(top: 6),
                                child: Row(
                                  children: [
                                    // Grey pill showing the threshold needed
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade100,
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                            color: Colors.grey.shade300),
                                      ),
                                      child: Text(
                                        'Not top rated  ·  needs ${kTopRatedThreshold.toStringAsFixed(1)}+',
                                        style: TextStyle(
                                          color: Colors.grey.shade500,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                ),
                              ),
                            ),

                            // Rating slider (1.0 – 5.0 in 0.125 increments)
                            SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                activeTrackColor: _accent,
                                inactiveTrackColor: Colors.grey.shade200,
                                thumbColor: _accent,
                                overlayColor: _accent.withOpacity(0.1),
                                trackHeight: 3,
                                thumbShape: const RoundSliderThumbShape(
                                    enabledThumbRadius: 8),
                              ),
                              child: Slider(
                                value: _rating,
                                min: 1.0,
                                max: 5.0,
                                divisions: 40, // 40 steps → 0.1 per step
                                onChanged: (v) => setState(() => _rating = v),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                  ],
                ),
              ),
            ),
          ),

          // ── Footer: Cancel / Save buttons ────────────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Row(
              children: [
                // Cancel — dismisses without saving
                Expanded(
                  child: OutlinedButton(
                    onPressed: _submitting ? null : () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      side: BorderSide(color: Colors.grey.shade300),
                      foregroundColor: _textSecondary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Cancel',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),

                // Save — disabled while submitting to prevent double-taps
                Expanded(
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _submitting
                    // Show spinner while awaiting onSubmit
                        ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                        : Text(
                      _isEditing ? 'Update' : 'Add clinic',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Private sub-widgets ────────────────────────────────────────────────────────

/// A small labelled section divider with a coloured left-border accent.
/// Used to visually group related form fields (e.g. "BASIC INFO", "LOCATION").
class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Green left-border accent bar
        Container(
          width: 3,
          height: 13,
          decoration: BoxDecoration(
            color: _primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: _primary,
            letterSpacing: 0.8,
          ),
        ),
      ],
    );
  }
}

/// A styled [TextFormField] wrapper used throughout [ClinicFormDialog].
///
/// Provides consistent padding, border radius, prefix icon, and error styling
/// so individual field declarations stay concise.
class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;

  /// Optional inline validator. Return a non-null string to show an error.
  final String? Function(String?)? validator;

  const _FormField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(fontSize: 14, color: _textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
        prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20),
        filled: true,
        fillColor: Colors.white,
        contentPadding:
        const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        // Default border
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        // Unfocused border
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        // Focused border — slightly thicker for emphasis
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade400, width: 1.5),
        ),
        // Validation-error border
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _danger),
        ),
        // Focused + validation-error border
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _danger, width: 1.5),
        ),
      ),
    );
  }
}