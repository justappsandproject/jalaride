import 'package:flutter/material.dart';

class Brand {
  static const primary = Color(0xFF1B6B3A);
  static const accent = Color(0xFFD4A017);
  static const background = Color(0xFF0A1628);
  static const surface = Color(0xFF132036);
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFFA0AEC0);
  static const error = Color(0xFFE53E3E);
  static const success = Color(0xFF38A169);
}

class AppTheme {
  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Brand.background,
        colorScheme: const ColorScheme.dark(
          primary: Brand.primary,
          secondary: Brand.accent,
          surface: Brand.surface,
          error: Brand.error,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Brand.background,
          foregroundColor: Brand.textPrimary,
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          color: Brand.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Brand.background,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Brand.primary, width: 2),
          ),
          labelStyle: const TextStyle(color: Brand.textSecondary),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Brand.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
        ),
      );
}
