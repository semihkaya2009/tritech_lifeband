import 'package:flutter/material.dart';

class AppTheme {
  // TRI TECH logo paleti
  // Siyah zemin + beyaz tipografi + elektrik mavi/cyan vurgu
  static const Color amberPrimary = Color(0xFF49A8F5);
  static const Color amberLight = Color(0xFF74C3FF);
  static const Color amberDark = Color(0xFF1E7ED6);

  static const Color petroGreen = Color(0xFF0F6DCC);
  static const Color petroLightGreen = Color(0xFF2F8EF0);
  static const Color petroMintGreen = Color(0xFF8BD8FF);

  static const Color darkBg = Color(0xFF05070B);
  static const Color darkCard = Color(0xFF0E1622);
  static const Color darkBorder = Color(0xFF223246);

  static const Color neutralWhite = Color(0xFFF7FBFF);
  static const Color textDark = Color(0xFF0A1018);
  static const Color textLight = Color(0xFF9CB8D3);

  // Arka plan gradyentleri
  static const List<Color> backgroundGradient = [
    Color(0xFF05070B),
    Color(0xFF0E1622),
  ];

  static final ThemeData lightTheme = ThemeData(
    scaffoldBackgroundColor: darkBg,
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: amberPrimary,
      brightness: Brightness.dark,
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
        letterSpacing: 0.5,
      ),
      headlineMedium: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: neutralWhite,
        letterSpacing: 0.3,
      ),
      headlineSmall: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: neutralWhite,
        letterSpacing: 0.2,
      ),
      titleLarge: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: amberPrimary,
        letterSpacing: 0.3,
      ),
      titleMedium: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: neutralWhite,
        letterSpacing: 0.2,
      ),
      bodyLarge: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: textLight,
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
        color: Color(0xFF9CA3AF),
      ),
    ),
    appBarTheme: AppBarTheme(
      elevation: 0,
      backgroundColor: darkCard.withValues(alpha: 0.8),
      foregroundColor: neutralWhite,
      centerTitle: true,
      titleTextStyle: const TextStyle(
        fontFamily: 'Roboto',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: amberPrimary,
        letterSpacing: 0.3,
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
        foregroundColor: textDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        textStyle: const TextStyle(
          fontFamily: 'Roboto',
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      fillColor: darkBg.withValues(alpha: 0.5),
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
