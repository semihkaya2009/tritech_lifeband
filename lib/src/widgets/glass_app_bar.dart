import 'dart:ui';
import 'package:flutter/material.dart';
import '../app_theme.dart';

class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool centerTitle;
  final double elevation;

  const GlassAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.centerTitle = true,
    this.elevation = 0,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.darkCard.withValues(alpha: 0.92),
                AppTheme.petroGreen.withValues(alpha: 0.24),
              ],
            ),
            border: Border(
              bottom: BorderSide(
                color: AppTheme.amberPrimary.withValues(alpha: 0.18),
                width: 1,
              ),
            ),
          ),
          child: AppBar(
            title: Text(title, style: AppTheme.lightTheme.textTheme.titleLarge),
            centerTitle: centerTitle,
            backgroundColor: Colors.transparent,
            elevation: elevation,
            actions: actions,
            leading: leading,
            iconTheme: const IconThemeData(color: AppTheme.amberPrimary),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
