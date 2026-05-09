import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
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
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;
  late Animation<double> _slideAnim;

  String _status = 'Getting things ready...';
  double _progress = 0;
  bool _showRetry = false;
  bool _showSettings = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    _scaleAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic),
    );
    _slideAnim = Tween<double>(begin: 20, end: 0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic),
    );

    _ctrl.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 400), _initApp);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _setStatus(String msg, double progress) {
    if (!mounted) return;
    setState(() {
      _status = msg;
      _progress = progress;
      _showRetry = false;
      _showSettings = false;
    });
  }

  Future<void> _initApp() async {
    _setStatus('Checking location permission...', 0.25);
    final perm = await LocationService.checkAndRequestPermission();

    if (perm == LocationPermissionStatus.permanentlyDenied) {
      if (!mounted) return;
      setState(() {
        _status = 'Location access is disabled. Enable it in Settings to see distances.';
        _showSettings = true;
        _progress = 0.25;
      });
      await Future.delayed(const Duration(seconds: 3));
      if (mounted) _loadApp();
      return;
    }

    if (perm == LocationPermissionStatus.denied) {
      if (!mounted) return;
      setState(() {
        _status = 'Location denied. Distances will not be shown.';
        _showRetry = true;
        _progress = 0.25;
      });
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) _loadApp();
      return;
    }

    _setStatus('Locating you...', 0.55);
    final position = await LocationService.getCurrentPosition();

    if (position == null) {
      if (!mounted) return;
      setState(() {
        _status = 'Could not get your location. Check that GPS is on.';
        _showRetry = true;
        _progress = 0.55;
      });
      return;
    }

    _setStatus('Loading clinics...', 0.85);
    await context.read<ClinicProvider>().initWithPosition(position);

    if (mounted) {
      setState(() => _progress = 1.0);
      await Future.delayed(const Duration(milliseconds: 300));
      _goHome();
    }
  }

  Future<void> _loadApp() async {
    _setStatus('Loading clinics...', 0.85);
    await context.read<ClinicProvider>().loadClinicsFromDb();
    if (mounted) {
      setState(() => _progress = 1.0);
      await Future.delayed(const Duration(milliseconds: 200));
      _goHome();
    }
  }

  void _goHome() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const HomeScreen(),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(gradient: AppTheme.splashGradient),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: Column(
              children: [
                const Spacer(flex: 3),

                // Logo + title
                AnimatedBuilder(
                  animation: _ctrl,
                  builder: (_, child) => Transform.translate(
                    offset: Offset(0, _slideAnim.value),
                    child: Transform.scale(
                      scale: _scaleAnim.value,
                      child: child,
                    ),
                  ),
                  child: Column(
                    children: [
                      // Lottie loading animation
                      SizedBox(
                        width: 160,
                        height: 160,
                        child: Lottie.asset(
                          'assets/lottie/loading.json',
                          fit: BoxFit.contain,
                          repeat: true,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.pets_rounded,
                            size: 48,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'PawAywan',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Veterinary Clinic Locator · La Union',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.65),
                          fontSize: 13,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(flex: 3),

                // Bottom status area
                Padding(
                  padding: const EdgeInsets.fromLTRB(36, 0, 36, 48),
                  child: Column(
                    children: [
                      // Progress bar
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: _progress),
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeOut,
                          builder: (_, value, __) => LinearProgressIndicator(
                            value: value,
                            minHeight: 3,
                            backgroundColor: Colors.white.withOpacity(0.15),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Status message
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        child: _showSettings
                            ? _SettingsPrompt(
                          message: _status,
                          onSettings: () {
                            openAppSettings();
                          },
                          onSkip: _loadApp,
                        )
                            : _showRetry
                            ? _RetryPrompt(
                          message: _status,
                          onRetry: _initApp,
                          onSkip: _loadApp,
                        )
                            : _StatusText(
                          key: ValueKey(_status),
                          message: _status,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Status text ───────────────────────────────────────────────────────────────

class _StatusText extends StatelessWidget {
  final String message;
  const _StatusText({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: 13,
          height: 13,
          child: CircularProgressIndicator(
            strokeWidth: 1.8,
            color: Colors.white.withOpacity(0.7),
          ),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Settings prompt ───────────────────────────────────────────────────────────

class _SettingsPrompt extends StatelessWidget {
  final String message;
  final VoidCallback onSettings;
  final VoidCallback onSkip;

  const _SettingsPrompt({
    required this.message,
    required this.onSettings,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          message,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withOpacity(0.75),
            fontSize: 13,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _SplashButton(
              label: 'Open Settings',
              onTap: onSettings,
              filled: true,
            ),
            const SizedBox(width: 10),
            _SplashButton(label: 'Skip', onTap: onSkip, filled: false),
          ],
        ),
      ],
    );
  }
}

// ── Retry prompt ──────────────────────────────────────────────────────────────

class _RetryPrompt extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final VoidCallback onSkip;

  const _RetryPrompt({
    required this.message,
    required this.onRetry,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          message,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white.withOpacity(0.75),
            fontSize: 13,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _SplashButton(label: 'Retry', onTap: onRetry, filled: true),
            const SizedBox(width: 10),
            _SplashButton(label: 'Skip', onTap: onSkip, filled: false),
          ],
        ),
      ],
    );
  }
}

// ── Shared button ─────────────────────────────────────────────────────────────

class _SplashButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool filled;

  const _SplashButton({
    required this.label,
    required this.onTap,
    required this.filled,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
        decoration: BoxDecoration(
          color: filled ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(
            color: Colors.white.withOpacity(filled ? 0 : 0.4),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: filled ? AppTheme.primary : Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}