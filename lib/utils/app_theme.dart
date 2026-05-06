// lib/utils/app_theme.dart

import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF0E8A5F);
  static const Color primaryDark = Color(0xFF075E41);
  static const Color secondary = Color(0xFF1A7BB8);
  static const Color accent = Color(0xFF4ECDC4);
  static const Color background = Color(0xFFF5F9F7);
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF1A2E2A);
  static const Color textSecondary = Color(0xFF6B8B84);
  static const Color starColor = Color(0xFFF5A623);
  static const Color nearestBadge = Color(0xFF0E8A5F);
  static const Color topRatedBadge = Color(0xFF1A7BB8);

  static ThemeData get theme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
    ),
    scaffoldBackgroundColor: background,
    fontFamily: 'Roboto',
    appBarTheme: const AppBarTheme(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: surface,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
  );
}
