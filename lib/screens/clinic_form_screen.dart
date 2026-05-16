// =============================================================================
// CLINIC FORM SCREEN — Add or edit a veterinary clinic
// =============================================================================
// Supports both create and update modes determined by the optional [clinic]
// parameter. All fields are validated before submission to the ClinicProvider.
// =============================================================================


import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/vet_clinic.dart';
import '../services/clinic_provider.dart';


// ── Inline colour constants (previously AppTheme) ─────────────────────────────
const _primary       = Color(0xFF388E3C);   // Brand green
const _surface       = Color(0xFFC8E6C9);   // Mid-green (dividers)
const _danger        = Color(0xFFE53935);   // Error / delete
const _background    = Color(0xFFF5F9F3);   // Page background
const _cardBg        = Color(0xFFFFFFFF);   // Card surfaces
const _borderLight   = Color(0xFFE0E0E0);   // Neutral borders
const _textPrimary   = Color(0xFF1B2B1C);   // Headings
const _textSecondary = Color(0xFF5A7A5C);   // Body text
const _radiusMd      = 12.0;                // Standard corner radius


// =============================================================================
// CLINIC FORM SCREEN
// =============================================================================
/// A full-screen form for creating or updating a [VetClinic].
///
/// Pass a [clinic] to enter **edit mode** — all fields are pre-filled and the
/// provider's [ClinicProvider.updateClinic] is called on save.
/// Omit [clinic] (or pass null) to enter **add mode** — fields start blank and
/// [ClinicProvider.addClinic] is called instead.
///
/// The screen pops with `true` on success so the caller can react
/// (e.g. refresh a list).
// =============================================================================
class ClinicFormScreen extends StatefulWidget {
  /// The clinic to edit, or null when adding a new one.
  final VetClinic? clinic;


  const ClinicFormScreen({super.key, this.clinic});


  @override
  State<ClinicFormScreen> createState() => _ClinicFormScreenState();
}


// =============================================================================
// CLINIC FORM SCREEN STATE
// =============================================================================
/// Manages form state for [ClinicFormScreen].
///
/// One [TextEditingController] is created per field and disposed together in
/// [dispose]. The [_formKey] drives inline validation. [_saving] is true while
/// the async provider call is in flight, which disables the save button and
/// replaces it with a [CircularProgressIndicator].
// =============================================================================
class _ClinicFormScreenState extends State<ClinicFormScreen> {
  /// Key used to trigger [Form] validation programmatically.
  final _formKey = GlobalKey<FormState>();


  // One controller per editable field.
  late final TextEditingController _name;
  late final TextEditingController _address;
  late final TextEditingController _contact;
  late final TextEditingController _imageUrl;
  late final TextEditingController _lat;
  late final TextEditingController _lng;
  late final TextEditingController _rating;


  /// True while the provider save operation is awaited.
  /// Prevents double-submission and shows a loading indicator.
  bool _saving = false;


  /// Convenience getter — true when the screen was opened with an existing clinic.
  bool get _isEditing => widget.clinic != null;


  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------


  @override
  void initState() {
    super.initState();
    // Pre-fill each controller with the existing clinic's data, or an empty
    // string when adding a new clinic.
    final c = widget.clinic;
    _name     = TextEditingController(text: c?.name ?? '');
    _address  = TextEditingController(text: c?.address ?? '');
    _contact  = TextEditingController(text: c?.contactNumber ?? '');
    _imageUrl = TextEditingController(text: c?.imageUrl ?? '');
    _lat      = TextEditingController(text: c?.latitude.toString() ?? '');
    _lng      = TextEditingController(text: c?.longitude.toString() ?? '');
    _rating   = TextEditingController(text: c?.rating.toString() ?? '');
  }


  @override
  void dispose() {
    // Dispose all controllers together to avoid memory leaks.
    for (final c in [_name, _address, _contact, _imageUrl, _lat, _lng, _rating]) {
      c.dispose();
    }
    super.dispose();
  }


  // ---------------------------------------------------------------------------
  // SAVE / SUBMIT
  // ---------------------------------------------------------------------------


  /// Validates the form, constructs a [VetClinic] from field values, and
  /// delegates to the appropriate [ClinicProvider] method.
  ///
  /// On success: pops the route with `true` and shows a confirmation snackbar.
  /// On failure: shows an error snackbar and re-enables the save button.
  /// No-ops immediately if validation fails.
  Future<void> _save() async {
    // Abort early if any field fails its validator.
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);


    final clinic = VetClinic(
      id: widget.clinic?.id, // Preserved in edit mode; null triggers auto-increment on insert.
      name: _name.text.trim(),
      address: _address.text.trim(),
      contactNumber: _contact.text.trim(),
      imageUrl: _imageUrl.text.trim(),
      latitude: double.parse(_lat.text.trim()),
      longitude: double.parse(_lng.text.trim()),
      rating: double.parse(_rating.text.trim()),
    );


    final provider = context.read<ClinicProvider>();
    // Choose the correct provider operation based on mode.
    final success = _isEditing
        ? await provider.updateClinic(clinic)
        : await provider.addClinic(clinic);


    // Guard against setState/Navigator calls if the widget was unmounted
    // while the async operation was in flight.
    if (mounted) {
      setState(() => _saving = false);
      if (success) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditing
                  ? '✅ Clinic updated successfully'
                  : '✅ Clinic added successfully',
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Something went wrong. Please try again.'),
            backgroundColor: _danger,
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
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit clinic' : 'Add new clinic'),
        actions: [
          // While saving: replace the save button with a compact spinner so
          // the user knows work is in progress.
          if (_saving)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2),
              ),
            )
          else
            TextButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.save_rounded, color: Colors.white),
              label: const Text(
                'Save',
                style: TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Basic info ─────────────────────────────────────────────────
            _SectionHeader(label: 'Basic info'),
            _Field(
              controller: _name,
              label: 'Clinic name',
              icon: Icons.local_hospital_rounded,
              validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Name is required' : null,
            ),
            const SizedBox(height: 14),
            _Field(
              controller: _address,
              label: 'Address',
              icon: Icons.location_on_rounded,
              validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Address is required' : null,
            ),
            const SizedBox(height: 14),
            _Field(
              controller: _contact,
              label: 'Contact number',
              icon: Icons.phone_rounded,
              keyboardType: TextInputType.phone,
              validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Contact is required' : null,
            ),
            const SizedBox(height: 28),


            // ── Location ───────────────────────────────────────────────────
            // Latitude and longitude sit side-by-side to save vertical space
            // and visually group them as a coordinate pair.
            _SectionHeader(label: 'Location'),
            Row(
              children: [
                Expanded(
                  child: _Field(
                    controller: _lat,
                    label: 'Latitude',
                    icon: Icons.my_location_rounded,
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true, signed: true),
                    validator: (v) {
                      final d = double.tryParse(v ?? '');
                      if (d == null) return 'Invalid';
                      if (d < -90 || d > 90) return '−90 to 90';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _Field(
                    controller: _lng,
                    label: 'Longitude',
                    icon: Icons.explore_rounded,
                    keyboardType: const TextInputType.numberWithOptions(
                        decimal: true, signed: true),
                    validator: (v) {
                      final d = double.tryParse(v ?? '');
                      if (d == null) return 'Invalid';
                      if (d < -180 || d > 180) return '−180 to 180';
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),


            // ── Details ────────────────────────────────────────────────────
            _SectionHeader(label: 'Details'),
            _Field(
              controller: _rating,
              label: 'Rating (0.0 – 5.0)',
              icon: Icons.star_rounded,
              keyboardType:
              const TextInputType.numberWithOptions(decimal: true),
              validator: (v) {
                final d = double.tryParse(v ?? '');
                if (d == null) return 'Invalid rating';
                if (d < 0 || d > 5) return 'Must be 0.0 – 5.0';
                return null;
              },
            ),
            const SizedBox(height: 14),
            // Image URL is optional — no validator is attached.
            _Field(
              controller: _imageUrl,
              label: 'Image URL (optional)',
              icon: Icons.image_rounded,
              keyboardType: TextInputType.url,
            ),


            const SizedBox(height: 36),
            // Bottom action button mirrors the app-bar save action for
            // ergonomic reach on long forms.
            ElevatedButton.icon(
              onPressed: _saving ? null : _save,
              icon: Icon(_isEditing ? Icons.save_rounded : Icons.add_rounded),
              label: Text(_isEditing ? 'Update clinic' : 'Add clinic'),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}


// =============================================================================
// _SectionHeader
// =============================================================================
/// A compact section label rendered as a 3 px green accent bar beside
/// uppercase text.
///
/// Used to visually group related fields within the form (e.g. "Basic info",
/// "Location", "Details") without the visual weight of a full [Divider].
// =============================================================================
class _SectionHeader extends StatelessWidget {
  /// The text to display, rendered in uppercase by the widget itself.
  final String label;
  const _SectionHeader({required this.label});


  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          // Narrow vertical bar acting as a brand-coloured accent.
          Container(
            width: 3,
            height: 14,
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
      ),
    );
  }
}


// =============================================================================
// _Field
// =============================================================================
/// A reusable [TextFormField] with a leading icon, label, configurable
/// keyboard type, and an optional validator.
///
/// Kept intentionally thin — any field-specific behaviour (keyboard type,
/// validation logic) is injected by the parent so this widget stays generic.
// =============================================================================
class _Field extends StatelessWidget {
  /// Controls the field's text value and selection.
  final TextEditingController controller;


  /// Label shown as a floating hint inside the field.
  final String label;


  /// Icon displayed in the leading position of the input decoration.
  final IconData icon;


  /// Keyboard layout hint. Defaults to the system default when null.
  final TextInputType? keyboardType;


  /// Validation callback. Return a non-null error string to mark the field
  /// invalid; return null to indicate the value is acceptable.
  final String? Function(String?)? validator;


  const _Field({
    required this.controller,
    required this.label,
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
        labelText: label,
        prefixIcon: Icon(icon),
      ),
    );
  }
}



