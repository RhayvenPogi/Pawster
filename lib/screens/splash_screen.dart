// lib/screens/splash_screen.dart
// Detects location FIRST before navigating to HomeScreen

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/clinic_provider.dart';
import '../services/location_service.dart';
import '../utils/app_theme.dart';
import 'home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  String _statusMessage = 'Starting up...';
  bool _showRetry = false;
  bool _showSettingsBtn = false;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    );
    _scaleAnim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.elasticOut),
    );

    _animController.forward();

    // Small delay so splash is visible, then start location
    Future.delayed(const Duration(milliseconds: 1200), _initApp);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _initApp() async {
    setState(() {
      _statusMessage = 'Requesting location permission...';
      _showRetry = false;
      _showSettingsBtn = false;
    });

    // Step 1: Check / request permission
    final permStatus = await LocationService.checkAndRequestPermission();

    if (permStatus == LocationPermissionStatus.permanentlyDenied) {
      setState(() {
        _statusMessage =
            'Location permission is permanently denied.\nPlease enable it in Settings to show nearby clinics.';
        _showSettingsBtn = true;
        _showRetry = false;
      });
      // Still proceed after 3s — app works without location, just no distances
      await Future.delayed(const Duration(seconds: 3));
      _loadApp(withLocation: false);
      return;
    }

    if (permStatus == LocationPermissionStatus.denied) {
      setState(() {
        _statusMessage =
            'Location permission denied.\nDistances will not be shown.';
        _showRetry = true;
        _showSettingsBtn = false;
      });
      await Future.delayed(const Duration(seconds: 2));
      _loadApp(withLocation: false);
      return;
    }

    // Step 2: Get actual position
    setState(() {
      _statusMessage = 'Getting your location...';
    });

    final position = await LocationService.getCurrentPosition();

    if (position == null) {
      setState(() {
        _statusMessage =
            'Could not get your location.\nMake sure GPS is enabled.';
        _showRetry = true;
      });
      return; // Wait for user to tap Retry
    }

    // Step 3: Position acquired — load clinics from DB
    setState(() {
      _statusMessage = 'Loading nearby clinics...';
    });

    final provider = context.read<ClinicProvider>();
    await provider.initWithPosition(position);

    // Step 4: Navigate to HomeScreen
    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, _, _) => const HomeScreen(),
          transitionsBuilder: (_, anim, _, child) =>
              FadeTransition(opacity: anim, child: child),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  Future<void> _loadApp({required bool withLocation}) async {
    setState(() => _statusMessage = 'Loading clinics...');
    final provider = context.read<ClinicProvider>();
    await provider.loadClinicsFromDb();

    if (mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, _, _) => const HomeScreen(),
          transitionsBuilder: (_, anim, _, child) =>
              FadeTransition(opacity: anim, child: child),
          transitionDuration: const Duration(milliseconds: 500),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primary,
      body: SafeArea(
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: ScaleTransition(
              scale: _scaleAnim,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // App icon
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.pets_rounded,
                        size: 60,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // App name
                    const Text(
                      'PawAywan',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Veterinary Clinic Locator',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const Text(
                      'La Union, Philippines',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),

                    const SizedBox(height: 56),

                    // Loading indicator
                    if (!_showRetry && !_showSettingsBtn)
                      Column(
                        children: [
                          const SizedBox(
                            width: 36,
                            height: 36,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            _statusMessage,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ),

                    // Retry state
                    if (_showRetry)
                      Column(
                        children: [
                          const Icon(Icons.location_off_rounded,
                              color: Colors.white70, size: 40),
                          const SizedBox(height: 12),
                          Text(
                            _statusMessage,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              ElevatedButton.icon(
                                onPressed: _initApp,
                                icon: const Icon(Icons.refresh_rounded),
                                label: const Text('Retry'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: AppTheme.primary,
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              OutlinedButton(
                                onPressed: () =>
                                    _loadApp(withLocation: false),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.white,
                                  side: const BorderSide(
                                      color: Colors.white54),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12)),
                                ),
                                child: const Text('Skip'),
                              ),
                            ],
                          ),
                        ],
                      ),

                    // Permanently denied state
                    if (_showSettingsBtn)
                      Column(
                        children: [
                          const Icon(Icons.location_disabled_rounded,
                              color: Colors.white70, size: 40),
                          const SizedBox(height: 12),
                          Text(
                            _statusMessage,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            onPressed: () => openAppSettings(),
                            icon: const Icon(Icons.settings_rounded),
                            label: const Text('Open Settings'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppTheme.primary,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}