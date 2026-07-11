import 'package:flutter/material.dart';

/// Design tokens — government-grade trust, private-sector polish.
class Tokens {
  static const bgBase = Color(0xFF0B0F14);
  static const bgSurface = Color(0xFF131A22);
  static const bgSurface2 = Color(0xFF1B2430);
  static const borderSubtle = Color(0xFF263140);

  static const gold500 = Color(0xFFD9A22C);
  static const gold600 = Color(0xFFB5821A);
  static const gold100 = Color(0xFFF5E3B8);

  static const green500 = Color(0xFF1E8A5F);
  static const green100 = Color(0xFF163B2C);

  static const red500 = Color(0xFFE5484D);
  static const blue500 = Color(0xFF4C9AFF);

  static const textPrimary = Color(0xFFF5F7FA);
  static const textSecondary = Color(0xFF9AA7B5);
  static const textTertiary = Color(0xFF5C6B7A);

  static const radiusCard = 16.0;
  static const radiusButton = 14.0;
  static const radiusInput = 12.0;
  static const buttonHeight = 56.0;
  static const spaceXs = 4.0;
  static const spaceSm = 8.0;
  static const spaceMd = 16.0;
  static const spaceLg = 24.0;
  static const spaceXl = 32.0;
}

/// Backward-compatible Brand aliases — driver primary is gold.
class Brand {
  static const primary = Tokens.gold500;
  static const accent = Tokens.gold500;
  static const background = Tokens.bgBase;
  static const surface = Tokens.bgSurface;
  static const textPrimary = Tokens.textPrimary;
  static const textSecondary = Tokens.textSecondary;
  static const error = Tokens.red500;
  static const success = Tokens.green500;
}
