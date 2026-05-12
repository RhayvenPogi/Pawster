import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import 'splash_screen.dart';

// Shared neutral colours used across all pages
const _cardBg        = Color(0xFFFFFFFF);
const _surface       = Color(0xFFC8E6C9);
const _textPrimary   = Color(0xFF1B2B1C);
const _textSecondary = Color(0xFF5A7A5C);
const _radiusMd      = 12.0;

// ---------------------------------------------------------------------------
// Per-page colour theme
// ---------------------------------------------------------------------------

/// Holds the two accent colours that animate when the user swipes pages.
class _PageTheme {
  final Color primary;
  final Color primaryTint;
  final Color accent;
  final Color accentTint;

  const _PageTheme({
    required this.primary,
    required this.primaryTint,
    required this.accent,
    required this.accentTint,
  });
}

// One theme entry per onboarding page
const _pageThemes = [
  _PageTheme(
    primary:     Color(0xFF4CAF50),
    primaryTint: Color(0xFFF1F8F1),
    accent:      Color(0xFF388E3C),
    accentTint:  Color(0xFFE8F5E9),
  ),
  _PageTheme(
    primary:     Color(0xFFF59E0B),
    primaryTint: Color(0xFFFFFBEB),
    accent:      Color(0xFFD97706),
    accentTint:  Color(0xFFFEF3C7),
  ),
  _PageTheme(
    primary:     Color(0xFF2E7D32),
    primaryTint: Color(0xFFEDF7EE),
    accent:      Color(0xFF43A047),
    accentTint:  Color(0xFFE8F5E9),
  ),
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

/// Three-page onboarding flow shown on first launch.
/// Each page slides and fades in; the colour scheme cross-fades between pages.
/// The last page's CTA navigates to [SplashScreen].
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final _pageController = PageController();

  late final AnimationController _fadeCtrl;
  late final AnimationController _buttonCtrl;
  late final AnimationController _slideCtrl;
  late final AnimationController _themeCtrl;

  late final Animation<double> _fadeAnim;
  late final Animation<double> _buttonScale;
  late final Animation<Offset> _slideAnim;

  // Cross-fade colour animations between page themes
  late Animation<Color?> _primaryAnim;
  late Animation<Color?> _primaryTintAnim;
  late Animation<Color?> _accentAnim;
  late Animation<Color?> _accentTintAnim;

  int _currentPage = 0;

  // Static page content
  static const _pages = [
    _PageData(
      lottie:   'assets/lottie/paws.json',
      title:    'Welcome to\nPawAywan',
      subtitle: "Your pet's trusted health partner",
      body:     'Find the best veterinary clinics near you across La Union, Philippines — quickly and easily.',
    ),
    _PageData(
      lottie:   'assets/lottie/location.json',
      title:    'Navigate with\nconfidence',
      subtitle: 'Real-time routing & fares',
      body:     'Get live road directions via OSRM, drive time estimates, and Philippine public transport fare breakdowns.',
    ),
    _PageData(
      lottie:   'assets/lottie/star.json',
      title:    'Manage &\ndiscover',
      subtitle: 'Ratings, photos & more',
      body:     'Browse clinic ratings, upload photos, call directly, and add new clinics to keep the community updated.',
    ),
  ];

  @override
  void initState() {
    super.initState();

    _fadeCtrl   = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _buttonCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 150));
    _slideCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _themeCtrl  = AnimationController(vsync: this, duration: const Duration(milliseconds: 450));

    _fadeAnim    = CurvedAnimation(parent: _fadeCtrl,   curve: Curves.easeIn);
    _buttonScale = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _buttonCtrl, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut),
    );

    // Initialise colour animations at page 0 (no transition needed yet)
    _buildThemeAnimations(0, 0);

    _fadeCtrl.forward();
    _slideCtrl.forward();
    _themeCtrl.value = 1.0; // jump to end so page-0 colours show immediately
  }

  /// Rebuilds the colour tweens to animate from [from] theme to [to] theme.
  void _buildThemeAnimations(int from, int to) {
    final fromTheme = _pageThemes[from];
    final toTheme   = _pageThemes[to];
    final curved    = CurvedAnimation(parent: _themeCtrl, curve: Curves.easeInOut);

    _primaryAnim     = ColorTween(begin: fromTheme.primary,     end: toTheme.primary).animate(curved);
    _primaryTintAnim = ColorTween(begin: fromTheme.primaryTint, end: toTheme.primaryTint).animate(curved);
    _accentAnim      = ColorTween(begin: fromTheme.accent,      end: toTheme.accent).animate(curved);
    _accentTintAnim  = ColorTween(begin: fromTheme.accentTint,  end: toTheme.accentTint).animate(curved);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fadeCtrl.dispose();
    _buttonCtrl.dispose();
    _slideCtrl.dispose();
    _themeCtrl.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    _fadeCtrl.forward(from: 0);
    _slideCtrl.forward(from: 0);
    _buildThemeAnimations(_currentPage, index);
    _themeCtrl.forward(from: 0);
    setState(() => _currentPage = index);
  }

  /// Animates the CTA button press, then advances or finishes onboarding.
  Future<void> _next() async {
    await _buttonCtrl.forward();
    await _buttonCtrl.reverse();
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _goToApp();
    }
  }

  /// Replaces the screen with [SplashScreen] using a fade transition.
  void _goToApp() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const SplashScreen(),
        transitionsBuilder: (_, anim, __, child) =>
            FadeTransition(opacity: anim, child: child),
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Transparent status bar so the curved background shows through
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
    );

    final size   = MediaQuery.of(context).size;
    final isLast = _currentPage == _pages.length - 1;

    return AnimatedBuilder(
      animation: _themeCtrl,
      builder: (context, _) {
        // Resolve animated colours; fall back to current page theme if null
        final theme       = _pageThemes[_currentPage];
        final primary     = _primaryAnim.value     ?? theme.primary;
        final primaryTint = _primaryTintAnim.value ?? theme.primaryTint;
        final accent      = _accentAnim.value      ?? theme.accent;
        final accentTint  = _accentTintAnim.value  ?? theme.accentTint;

        return Scaffold(
          backgroundColor: _cardBg,
          body: Stack(
            children: [
              // Curved tinted background shape
              Positioned(
                top: 0, left: 0, right: 0,
                child: _TopDecoration(size: size, color: primaryTint),
              ),
              SafeArea(
                child: Column(
                  children: [
                    // Top bar: logo + app name + optional Skip button
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 14),
                      child: Row(
                        children: [
                          _LogoBadge(primary: primary),
                          const SizedBox(width: 10),
                          Text(
                            'PawAywan',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: primary,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const Spacer(),
                          // Hide Skip on last page — CTA becomes "Get started"
                          if (!isLast)
                            GestureDetector(
                              onTap: _goToApp,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(
                                  color: primaryTint,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  'Skip',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: _textSecondary,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),

                    // Swipeable page content
                    Expanded(
                      child: PageView.builder(
                        controller: _pageController,
                        onPageChanged: _onPageChanged,
                        itemCount: _pages.length,
                        itemBuilder: (_, i) => _OnboardPage(
                          data: _pages[i],
                          fadeAnim: _fadeAnim,
                          slideAnim: _slideAnim,
                          isActive: i == _currentPage,
                          accent: accent,
                          accentTint: accentTint,
                        ),
                      ),
                    ),

                    // Dot indicators + CTA button
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        28, 12, 28,
                        MediaQuery.of(context).padding.bottom + 28,
                      ),
                      child: Column(
                        children: [
                          // Page indicator dots — active dot stretches to a pill
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(_pages.length, (i) {
                              final active = i == _currentPage;
                              return AnimatedContainer(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                width: active ? 24 : 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: active ? primary : _surface,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 24),

                          // CTA: "Continue" on pages 1–2, "Get started" on page 3
                          ScaleTransition(
                            scale: _buttonScale,
                            child: GestureDetector(
                              onTap: _next,
                              child: Container(
                                width: double.infinity,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: primary,
                                  borderRadius: BorderRadius.circular(_radiusMd),
                                  boxShadow: [
                                    BoxShadow(
                                      color: primary.withOpacity(0.28),
                                      blurRadius: 16,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      isLast ? 'Get started' : 'Continue',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                        letterSpacing: 0.2,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Icon(
                                      isLast
                                          ? Icons.pets_rounded
                                          : Icons.arrow_forward_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Private sub-widgets
// ---------------------------------------------------------------------------

/// Curved tinted blob at the top of each onboarding page.
class _TopDecoration extends StatelessWidget {
  final Size size;
  final Color color;
  const _TopDecoration({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return ClipPath(
      clipper: _CurveClipper(),
      child: Container(
        width: size.width,
        height: size.height * 0.52,
        color: color,
      ),
    );
  }
}

/// Custom clip that produces a bottom-curved rectangular shape.
class _CurveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    return Path()
      ..lineTo(0, size.height * 0.78)
      ..quadraticBezierTo(
        size.width * 0.5, size.height * 1.0,
        size.width, size.height * 0.78,
      )
      ..lineTo(size.width, 0)
      ..close();
  }

  @override
  bool shouldReclip(_CurveClipper oldClipper) => false;
}

/// Small rounded square showing the app logo in the top bar.
class _LogoBadge extends StatelessWidget {
  final Color primary;
  const _LogoBadge({required this.primary});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _surface),
        boxShadow: [
          BoxShadow(
            color: primary.withOpacity(0.12),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(9),
        child: Image.asset(
          'assets/logo/logo.png',
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) =>
              Icon(Icons.pets_rounded, color: primary, size: 20),
        ),
      ),
    );
  }
}

/// Content for a single onboarding page: Lottie animation, subtitle pill,
/// title, accent divider, and body text.
class _OnboardPage extends StatelessWidget {
  final _PageData data;
  final Animation<double> fadeAnim;
  final Animation<Offset> slideAnim;
  final bool isActive;
  final Color accent;
  final Color accentTint;

  const _OnboardPage({
    required this.data,
    required this.fadeAnim,
    required this.slideAnim,
    required this.isActive,
    required this.accent,
    required this.accentTint,
  });

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: fadeAnim,
      child: SlideTransition(
        position: slideAnim,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Lottie illustration
              SizedBox(
                width: 270,
                height: 270,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Lottie.asset(
                    data.lottie,
                    fit: BoxFit.fill,
                    repeat: true,
                    errorBuilder: (_, __, ___) =>
                        Icon(Icons.pets_rounded, size: 80, color: accent),
                  ),
                ),
              ),
              const SizedBox(height: 36),

              // Subtitle pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: accentTint,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: accent.withOpacity(0.35)),
                ),
                child: Text(
                  data.subtitle,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: accent,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Page title
              Text(
                data.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: _textPrimary,
                  height: 1.2,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),

              // Short accent divider bar
              Container(
                width: 36,
                height: 3,
                decoration: BoxDecoration(
                  color: accent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 14),

              // Body description
              Text(
                data.body,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: _textSecondary,
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Immutable data for a single onboarding page.
class _PageData {
  final String lottie;
  final String title;
  final String subtitle;
  final String body;

  const _PageData({
    required this.lottie,
    required this.title,
    required this.subtitle,
    required this.body,
  });
}