import 'dart:ui';
import 'package:flutter/material.dart';
import '../app_theme.dart';

class FrostedContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets? margin;
  final double blur;
  final double borderRadius;
  final Color? backgroundColor;
  final Gradient? gradient;
  final Border? border;
  final List<BoxShadow>? boxShadow;

  const FrostedContainer({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.blur = 10,
    this.borderRadius = 16,
    this.backgroundColor,
    this.gradient,
    this.border,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow:
            boxShadow ??
            [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              gradient:
                  gradient ??
                  LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.darkCard.withValues(alpha: 0.94),
                      AppTheme.petroGreen.withValues(alpha: 0.08),
                    ],
                  ),
              color: gradient == null ? backgroundColor : null,
              borderRadius: BorderRadius.circular(borderRadius),
              border:
                  border ?? Border.all(color: AppTheme.darkBorder, width: 1),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
