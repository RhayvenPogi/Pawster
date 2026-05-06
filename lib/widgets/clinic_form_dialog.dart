// lib/widgets/clinic_form_dialog.dart

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/vet_clinic.dart';
import '../utils/app_theme.dart';

class ClinicFormDialog extends StatefulWidget {
  final VetClinic? clinic;
  final Future<void> Function(
    // ✅ was: Function(...)
    String name,
    String address,
    String contactNumber,
    String imageUrl,
    String localImagePath,
    double latitude,
    double longitude,
    double rating,
  )
  onSubmit;

  const ClinicFormDialog({super.key, this.clinic, required this.onSubmit});

  @override
  State<ClinicFormDialog> createState() => _ClinicFormDialogState();
}

class _ClinicFormDialogState extends State<ClinicFormDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _imageUrlCtrl = TextEditingController();
  final _latCtrl = TextEditingController();
  final _lngCtrl = TextEditingController();
  final _ratingCtrl = TextEditingController();

  XFile? _pickedImage;
  bool _pickingImage = false;
  bool _submitting = false; // ✅ new: loading state while saving

  @override
  void initState() {
    super.initState();
    if (widget.clinic != null) {
      final c = widget.clinic!;
      _nameCtrl.text = c.name;
      _addressCtrl.text = c.address;
      _contactCtrl.text = c.contactNumber;
      _imageUrlCtrl.text = c.imageUrl;
      _latCtrl.text = c.latitude.toString();
      _lngCtrl.text = c.longitude.toString();
      _ratingCtrl.text = c.rating.toString();
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _contactCtrl.dispose();
    _imageUrlCtrl.dispose();
    _latCtrl.dispose();
    _lngCtrl.dispose();
    _ratingCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    setState(() => _pickingImage = true);
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 800,
      );
      if (file != null) {
        setState(() => _pickedImage = file);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Could not pick image: $e')));
      }
    } finally {
      setState(() => _pickingImage = false);
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Choose Image Source',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: AppTheme.primary,
                child: Icon(Icons.camera_alt_rounded, color: Colors.white),
              ),
              title: const Text('Take a Photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const CircleAvatar(
                backgroundColor: AppTheme.secondary,
                child: Icon(Icons.photo_library_rounded, color: Colors.white),
              ),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            if (_pickedImage != null || (widget.clinic?.hasLocalImage == true))
              ListTile(
                leading: const CircleAvatar(
                  backgroundColor: Colors.red,
                  child: Icon(Icons.delete_rounded, color: Colors.white),
                ),
                title: const Text('Remove Photo'),
                onTap: () {
                  Navigator.pop(context);
                  setState(() => _pickedImage = null);
                },
              ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  // ✅ Fixed: now async, awaits onSubmit, shows loader, then closes
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      final localPath = _pickedImage?.path ?? widget.clinic?.localImage ?? '';
      await widget.onSubmit(
        _nameCtrl.text.trim(),
        _addressCtrl.text.trim(),
        _contactCtrl.text.trim(),
        _imageUrlCtrl.text.trim(),
        localPath,
        double.parse(_latCtrl.text.trim()),
        double.parse(_lngCtrl.text.trim()),
        double.parse(_ratingCtrl.text.trim()),
      );
      if (mounted) Navigator.pop(context);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.clinic != null;

    final existingLocalImage = widget.clinic?.localImage;
    final showLocalPreview =
        _pickedImage != null ||
        (existingLocalImage != null && existingLocalImage.isNotEmpty);
    final previewPath = _pickedImage?.path ?? existingLocalImage;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(
            isEditing ? Icons.edit_rounded : Icons.add_circle_rounded,
            color: AppTheme.primary,
          ),
          const SizedBox(width: 8),
          Text(
            isEditing ? 'Edit Clinic' : 'Add Clinic',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: _showImageSourceDialog,
                  child: Container(
                    height: 150,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.grey.shade100,
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _pickingImage
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppTheme.primary,
                            ),
                          )
                        : showLocalPreview
                        ? Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.file(File(previewPath!), fit: BoxFit.cover),
                              Positioned(
                                bottom: 6,
                                right: 6,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.black54,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.edit_rounded,
                                        color: Colors.white,
                                        size: 12,
                                      ),
                                      SizedBox(width: 4),
                                      Text(
                                        'Change',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : _imageUrlCtrl.text.isNotEmpty
                        ? Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.network(
                                _imageUrlCtrl.text,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) =>
                                    _ImagePlaceholder(),
                              ),
                              Positioned(
                                bottom: 6,
                                right: 6,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.black54,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.camera_alt_rounded,
                                        color: Colors.white,
                                        size: 12,
                                      ),
                                      SizedBox(width: 4),
                                      Text(
                                        'Upload Photo',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          )
                        : _ImagePlaceholder(),
                  ),
                ),
                const SizedBox(height: 6),
                Center(
                  child: Text(
                    'Tap to upload or take a photo',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                  ),
                ),
                const SizedBox(height: 14),

                TextFormField(
                  controller: _nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Clinic Name',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.local_hospital_rounded),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Name is required'
                      : null,
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _addressCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Address',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.location_on_rounded),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Address is required'
                      : null,
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _contactCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Contact Number',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.phone_rounded),
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Contact is required'
                      : null,
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _latCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                          signed: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Latitude',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.my_location_rounded),
                        ),
                        validator: (v) {
                          final d = double.tryParse(v ?? '');
                          if (d == null) return 'Invalid';
                          if (d < -90 || d > 90) return '-90~90';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _lngCtrl,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                          signed: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Longitude',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.explore_rounded),
                        ),
                        validator: (v) {
                          final d = double.tryParse(v ?? '');
                          if (d == null) return 'Invalid';
                          if (d < -180 || d > 180) return '-180~180';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _ratingCtrl,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'Rating (0.0 – 5.0)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.star_rounded),
                  ),
                  validator: (v) {
                    final d = double.tryParse(v ?? '');
                    if (d == null) return 'Invalid rating';
                    if (d < 0 || d > 5) return 'Must be 0.0 – 5.0';
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _imageUrlCtrl,
                  keyboardType: TextInputType.url,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    labelText: 'Image URL (optional)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.link_rounded),
                    hintText: 'https://...',
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        // ✅ Shows loader while saving
        ElevatedButton(
          onPressed: _submitting ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
          ),
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : Text(
                  isEditing ? 'Update' : 'Add',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
        ),
      ],
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.add_photo_alternate_rounded,
          size: 40,
          color: Colors.grey.shade400,
        ),
        const SizedBox(height: 8),
        Text(
          'Tap to add photo',
          style: TextStyle(color: Colors.grey.shade400, fontSize: 13),
        ),
      ],
    );
  }
}
