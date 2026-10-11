import 'package:flutter/material.dart';

class AppTheme {
  static const Color amberPrimary = Color(0xFF0F766E);
  static const Color amberLight = Color(0xFF14B8A6);
  static const Color amberDark = Color(0xFF115E59);

  static const Color petroGreen = Color(0xFF2563EB);
  static const Color petroLightGreen = Color(0xFF3B82F6);
  static const Color petroMintGreen = Color(0xFF0F766E);

  static const Color darkBg = Color(0xFFF6F8FB);
  static const Color darkCard = Color(0xFFFFFFFF);
  static const Color darkBorder = Color(0xFFD9E2EC);

  static const Color neutralWhite = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF14213D);
  static const Color textLight = Color(0xFF64748B);

  static const List<Color> backgroundGradient = [
    Color(0xFFF8FAFC),
    Color(0xFFF6F8FB),
  ];

  static final ThemeData lightTheme = ThemeData(
    scaffoldBackgroundColor: darkBg,
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: amberPrimary,
      brightness: Brightness.light,
      primary: amberPrimary,
      secondary: petroGreen,
      surface: darkCard,
    ),
    textTheme: TextTheme(
      headlineLarge: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 36,
        fontWeight: FontWeight.w700,
        color: amberPrimary,
        letterSpacing: 0,
      ),
      headlineMedium: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: textDark,
        letterSpacing: 0,
      ),
      headlineSmall: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: textDark,
        letterSpacing: 0,
      ),
      titleLarge: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textDark,
        letterSpacing: 0,
      ),
      titleMedium: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textDark,
        letterSpacing: 0,
      ),
      bodyLarge: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: textDark,
      ),
      bodyMedium: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: textLight,
      ),
      bodySmall: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: Color(0xFF64748B),
      ),
    ),
    appBarTheme: AppBarTheme(
      elevation: 0,
      backgroundColor: darkCard.withValues(alpha: 0.92),
      foregroundColor: textDark,
      centerTitle: true,
      titleTextStyle: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: textDark,
        letterSpacing: 0,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: darkCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        elevation: 0,
        backgroundColor: amberPrimary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        textStyle: const TextStyle(
          fontFamily: 'Roboto',
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      fillColor: Colors.white,
      filled: true,
      labelStyle: const TextStyle(fontFamily: 'Roboto', color: textLight),
      hintStyle: const TextStyle(
        fontFamily: 'Roboto',
        color: Color(0xFF9CA3AF),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: darkBorder, width: 1),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(
          color: darkBorder.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: amberPrimary, width: 2),
      ),
    ),
  );

  // Renk gradient yardımcıları
  static LinearGradient get amberGradient => LinearGradient(
    colors: [amberPrimary, amberLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get petroGradient => LinearGradient(
    colors: [petroGreen, petroMintGreen],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient get mixedGradient => LinearGradient(
    colors: [amberPrimary, petroMintGreen],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
