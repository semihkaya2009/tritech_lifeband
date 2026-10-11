import 'package:flutter/material.dart';
import '../models/device.dart';
import 'frosted_container.dart';
import '../app_theme.dart';

class DeviceTile extends StatelessWidget {
  final Device device;
  final VoidCallback? onTap;

  const DeviceTile({super.key, required this.device, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: FrostedContainer(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(20),
        borderRadius: 16,
        backgroundColor: Colors.white,
        child: Row(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: AppTheme.mixedGradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.amberPrimary.withValues(alpha: 0.18),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  device.name.isNotEmpty ? device.name[0].toUpperCase() : '?',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    device.name,
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    device.token == null
                        ? 'Profil ID: ${device.id}'
                        : 'QR Token: ${device.token}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.petroGreen.withValues(alpha: 0.3),
                          AppTheme.petroMintGreen.withValues(alpha: 0.2),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppTheme.petroMintGreen.withValues(alpha: 0.4),
                        width: 1,
                      ),
                    ),
                    child: const Text(
                      'Hazır',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.amberDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.amberPrimary.withValues(alpha: 0.2),
                    AppTheme.amberLight.withValues(alpha: 0.1),
                  ],
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppTheme.amberPrimary.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              child: const Icon(
                Icons.arrow_forward_ios,
                color: AppTheme.amberPrimary,
                size: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
