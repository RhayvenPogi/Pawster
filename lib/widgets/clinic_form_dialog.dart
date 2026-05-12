import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/vet_clinic.dart';

// Colors used across this file
const Color _primary       = Color(0xFF388E3C);
const Color _danger        = Color(0xFFE53935); // validation errors, delete
const Color _textPrimary   = Color(0xFF1B2B1C);
const Color _textSecondary = Color(0xFF5A7A5C);

/// Modal dialog for adding a new clinic or editing an existing one.
/// Pass [clinic] to pre-populate fields for editing; leave it null to add.
/// [onSubmit] is called with the validated field values when the user saves.
class ClinicFormDialog extends StatefulWidget {
  final VetClinic? clinic;
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
  final _formKey     = GlobalKey<FormState>();
  final _nameCtrl    = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _latCtrl     = TextEditingController();
  final _lngCtrl     = TextEditingController();

  XFile? _pickedImage;
  bool   _pickingImage = false; // true while the image picker is open
  bool   _submitting   = false; // true while onSubmit is awaiting
  double _rating       = 0.0;

  bool get _isEditing => widget.clinic != null;

  @override
  void initState() {
    super.initState();
    // Pre-populate fields when editing an existing clinic
    if (widget.clinic != null) {
      final c = widget.clinic!;
      _nameCtrl.text    = c.name;
      _addressCtrl.text = c.address;
      _contactCtrl.text = c.contactNumber;
      _latCtrl.text     = c.latitude.toString();
      _lngCtrl.text     = c.longitude.toString();
      _rating           = c.rating.clamp(0.0, 5.0);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _contactCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Image picking
  // ---------------------------------------------------------------------------

  /// Opens the camera or gallery and stores the picked file in [_pickedImage].
  Future<void> _pickImage(ImageSource source) async {
    setState(() => _pickingImage = true);
    try {
      final file = await ImagePicker().pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 800,
      );
      if (file != null) setState(() => _pickedImage = file);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not pick image: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _pickingImage = false);
    }
  }

  /// Bottom sheet that lets the user choose camera, gallery, or remove photo.
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
            // Show "Remove photo" only when there is already a photo to remove
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

  // ---------------------------------------------------------------------------
  // Form submission
  // ---------------------------------------------------------------------------

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      // Prefer newly picked image; fall back to existing local path
      final localPath = _pickedImage?.path ?? widget.clinic?.localImage ?? '';
      final imageUrl  = widget.clinic?.imageUrl ?? '';
      await widget.onSubmit(
        _nameCtrl.text.trim(),
        _addressCtrl.text.trim(),
        _contactCtrl.text.trim(),
        imageUrl,
        localPath,
        double.parse(_latCtrl.text.trim()),
        double.parse(_lngCtrl.text.trim()),
        _rating,
      );
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
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

          // ── Header ──────────────────────────────────────────────────────
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
            color: _primary,
            child: Row(
              children: [
                // Mode icon
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

          // ── Scrollable form body ─────────────────────────────────────────
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // Photo picker — shows preview when an image is selected
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
                            ? const Center(
                          child: CircularProgressIndicator(color: _primary),
                        )
                            : hasPreview
                            ? Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.file(File(previewPath!),
                                fit: BoxFit.cover),
                            // "Change" overlay in bottom-right corner
                            Positioned(
                              bottom: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius:
                                  BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.edit_rounded,
                                        color: Colors.white, size: 12),
                                    SizedBox(width: 4),
                                    Text('Change',
                                        style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 11)),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        )
                            : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_rounded,
                                size: 32,
                                color: Colors.grey.shade400),
                            const SizedBox(height: 6),
                            Text(
                              'Tap to add photo',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade400),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Basic info ───────────────────────────────────────────
                    const _SectionLabel(label: 'Basic info'),
                    const SizedBox(height: 10),
                    _FormField(
                      controller: _nameCtrl,
                      hint: 'Clinic name',
                      icon: Icons.local_hospital_rounded,
                      validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 10),
                    _FormField(
                      controller: _addressCtrl,
                      hint: 'Address',
                      icon: Icons.location_on_rounded,
                      validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Address is required' : null,
                    ),
                    const SizedBox(height: 10),
                    _FormField(
                      controller: _contactCtrl,
                      hint: 'Contact number',
                      icon: Icons.phone_rounded,
                      keyboardType: TextInputType.phone,
                      validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'Contact is required' : null,
                    ),
                    const SizedBox(height: 20),

                    // ── Location ─────────────────────────────────────────────
                    const _SectionLabel(label: 'Location'),
                    const SizedBox(height: 10),
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

                    // ── Rating ───────────────────────────────────────────────
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
                          // Star preview + numeric value
                          Row(
                            children: [
                              ...List.generate(5, (i) {
                                final filled = i < _rating.floor();
                                final half   = !filled && i < _rating;
                                return Icon(
                                  filled
                                      ? Icons.star_rounded
                                      : half
                                      ? Icons.star_half_rounded
                                      : Icons.star_outline_rounded,
                                  color: const Color(0xFFF59E0B),
                                  size: 26,
                                );
                              }),
                              const Spacer(),
                              Text(
                                _rating.toStringAsFixed(1),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: _textPrimary,
                                ),
                              ),
                              const Text(
                                ' / 5.0',
                                style: TextStyle(
                                    fontSize: 13, color: _textSecondary),
                              ),
                            ],
                          ),
                          // Slider — 50 divisions give 0.1 step precision
                          SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              activeTrackColor: _primary,
                              inactiveTrackColor: Colors.grey.shade200,
                              thumbColor: _primary,
                              overlayColor: _primary.withOpacity(0.1),
                              trackHeight: 3,
                              thumbShape: const RoundSliderThumbShape(
                                  enabledThumbRadius: 8),
                            ),
                            child: Slider(
                              value: _rating,
                              min: 0,
                              max: 5,
                              divisions: 50,
                              onChanged: (v) => setState(() => _rating = v),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),

          // ── Cancel / Save actions ────────────────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Row(
              children: [
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
                    // Show a spinner while saving
                    child: _submitting
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

// ---------------------------------------------------------------------------
// Private sub-widgets
// ---------------------------------------------------------------------------

/// Small section header with a coloured left bar, e.g. "BASIC INFO".
class _SectionLabel extends StatelessWidget {
  final String label;

  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Accent bar
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

/// Reusable styled [TextFormField] with prefix icon, hint, and validation.
class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
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
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade400, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _danger),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _danger, width: 1.5),
        ),
      ),
    );
  }
}