import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'tokens.dart';

export 'tokens.dart';

class AppTheme {
  static TextTheme _textTheme(Color primary) {
    final base = GoogleFonts.plusJakartaSansTextTheme(ThemeData.dark().textTheme);
    return base.copyWith(
      displayLarge: base.displayLarge?.copyWith(
        fontSize: 28,
        height: 34 / 28,
        fontWeight: FontWeight.w700,
        color: Tokens.textPrimary,
      ),
      headlineMedium: base.headlineMedium?.copyWith(
        fontSize: 18,
        height: 24 / 18,
        fontWeight: FontWeight.w600,
        color: Tokens.textPrimary,
      ),
      bodyLarge: base.bodyLarge?.copyWith(
        fontSize: 15,
        height: 22 / 15,
        fontWeight: FontWeight.w400,
        color: Tokens.textPrimary,
      ),
      bodyMedium: base.bodyMedium?.copyWith(
        fontSize: 15,
        height: 22 / 15,
        color: Tokens.textSecondary,
      ),
      labelMedium: base.labelMedium?.copyWith(
        fontSize: 13,
        height: 18 / 13,
        fontWeight: FontWeight.w500,
        color: Tokens.textSecondary,
      ),
    );
  }

  static ThemeData get dark {
    const primary = Tokens.green500;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: Tokens.bgBase,
      fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
      textTheme: _textTheme(primary),
      colorScheme: const ColorScheme.dark(
        primary: primary,
        secondary: Tokens.gold500,
        surface: Tokens.bgSurface,
        error: Tokens.red500,
        onPrimary: Tokens.textPrimary,
        onSecondary: Tokens.bgBase,
        onSurface: Tokens.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Tokens.bgBase,
        foregroundColor: Tokens.textPrimary,
        elevation: 0,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Tokens.textPrimary,
        ),
      ),
      cardTheme: CardThemeData(
        color: Tokens.bgSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Tokens.radiusCard),
          side: const BorderSide(color: Tokens.borderSubtle),
        ),
      ),
      dividerColor: Tokens.borderSubtle,
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Tokens.bgSurface2,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Tokens.radiusInput),
          borderSide: const BorderSide(color: Tokens.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Tokens.radiusInput),
          borderSide: const BorderSide(color: Tokens.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(Tokens.radiusInput),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        labelStyle: const TextStyle(color: Tokens.textSecondary),
        hintStyle: const TextStyle(color: Tokens.textTertiary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Tokens.textPrimary,
          minimumSize: const Size.fromHeight(Tokens.buttonHeight),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Tokens.radiusButton),
          ),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: Tokens.textPrimary,
          minimumSize: const Size(44, 44),
          side: const BorderSide(color: Tokens.borderSubtle),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Tokens.radiusButton),
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Tokens.bgSurface,
        indicatorColor: primary.withValues(alpha: 0.25),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.plusJakartaSans(
              color: primary,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            );
          }
          return GoogleFonts.plusJakartaSans(color: Tokens.textSecondary, fontSize: 12);
        }),
      ),
    );
  }
}
