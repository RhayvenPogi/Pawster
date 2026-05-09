// lib/utils/app_theme.dart

import 'package:flutter/material.dart';

class AppTheme {
  // ── Primary (forest green) ────────────────────────────────────────────────
  static const Color primary      = Color(0xFF388E3C);
  static const Color primaryDark  = Color(0xFF2E7D32);
  static const Color primaryLight = Color(0xFF66BB6A);
  static const Color primaryTint  = Color(0xFFE8F4E2);
  static const Color surface      = Color(0xFFC8E6C9);

  // ── Secondary (steel blue — routes, distance) ─────────────────────────────
  static const Color secondary     = Color(0xFF1976D2);
  static const Color secondaryTint = Color(0xFFE3F0FC);

  // ── Accent (amber — ratings, warnings, highlights) ────────────────────────
  static const Color accent     = Color(0xFFF57C00);
  static const Color accentTint = Color(0xFFFFF3E0);

  // ── Badge & star colours (used by clinic widgets) ─────────────────────────
  static const Color nearestBadge  = primary;
  static const Color topRatedBadge = secondary;
  static const Color starColor     = accent;

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color danger     = Color(0xFFE53935);
  static const Color dangerTint = Color(0xFFFFEBEE);

  // ── Neutrals ──────────────────────────────────────────────────────────────
  static const Color background    = Color(0xFFF5F9F3);
  static const Color cardBg        = Color(0xFFFFFFFF);
  static const Color borderLight   = Color(0xFFE0E0E0);
  static const Color textPrimary   = Color(0xFF1B2B1C);
  static const Color textSecondary = Color(0xFF5A7A5C);
  static const Color textHint      = Color(0xFF9DB09E);

  // ── Radius ────────────────────────────────────────────────────────────────
  static const double radiusSm = 10.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 20.0;

  // ── Splash gradient (single source of truth) ──────────────────────────────
  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryDark, primary, primaryLight],
    stops: [0.0, 0.55, 1.0],
  );

  // ── Global ThemeData ──────────────────────────────────────────────────────
  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorSchemeSeed: primary,
    scaffoldBackgroundColor: background,
    appBarTheme: const AppBarTheme(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        padding: const EdgeInsets.symmetric(vertical: 14),
        textStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primary,
        side: const BorderSide(color: primary, width: 1.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
        padding: const EdgeInsets.symmetric(vertical: 14),
        textStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cardBg,
      contentPadding:
      const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      iconColor: primary,
      prefixIconColor: primary,
      labelStyle: const TextStyle(color: textSecondary, fontSize: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: borderLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: surface),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
        borderSide: const BorderSide(color: danger, width: 2),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 2,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: textPrimary,
      contentTextStyle: const TextStyle(color: Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusMd),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: primaryTint,
      labelStyle: const TextStyle(
        color: primary,
        fontWeight: FontWeight.w600,
        fontSize: 12,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      side: const BorderSide(color: surface),
    ),
  );
}