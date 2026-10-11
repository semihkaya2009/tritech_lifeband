import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

import '../providers/device_provider.dart';
import '../widgets/glass_app_bar.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';
import '../app_theme.dart';
import 'device_edit_screen.dart';

class DeviceDetailScreen extends StatelessWidget {
  final String deviceId;
  const DeviceDetailScreen({super.key, required this.deviceId});

  bool _isCritical(String key) {
    final normalized = key.toLowerCase();
    return normalized.contains('alerji') ||
        normalized.contains('yapilmamasi') ||
        normalized.contains('yapılmaması') ||
        normalized.contains('kronik') ||
        normalized.contains('ilac') ||
        normalized.contains('ilaç');
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<DeviceProvider>();
    final device = prov.getById(deviceId);

    if (device == null) {
      return Scaffold(
        appBar: const GlassAppBar(title: 'Profil bulunamadı'),
        body: const AnimatedBackground(
          child: Center(
            child: FrostedContainer(
              padding: EdgeInsets.all(40),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppTheme.petroMintGreen,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Acil profil verisi bulunamadı',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.amberPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final healthDataEntries = device.healthData.entries.toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: GlassAppBar(
        title: 'Acil Profil',
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            decoration: BoxDecoration(
              gradient: AppTheme.amberGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.amberPrimary.withValues(alpha: 0.3),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.amberPrimary.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.edit, color: Colors.white),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => DeviceEditScreen(deviceId: device.id),
                ),
              ),
            ),
          ),
        ],
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),

                // Emergency profile card
                FrostedContainer(
                  padding: const EdgeInsets.all(24),
                  borderRadius: 20,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.amberPrimary.withValues(alpha: 0.12),
                      AppTheme.petroGreen.withValues(alpha: 0.1),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: AppTheme.mixedGradient,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.amberPrimary.withValues(
                                alpha: 0.4,
                              ),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            device.name.isNotEmpty
                                ? device.name[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 32,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              device.name,
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppTheme.petroGreen.withValues(alpha: 0.2),
                                    AppTheme.petroMintGreen.withValues(
                                      alpha: 0.1,
                                    ),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: AppTheme.petroMintGreen.withValues(
                                    alpha: 0.4,
                                  ),
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                device.token == null
                                    ? 'Profil ID: ${device.id}'
                                    : 'QR Token: ${device.token}',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Health data header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: AppTheme.petroGradient,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.petroGreen.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.health_and_safety,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'Acil Sağlık Bilgileri',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Health data list
                healthDataEntries.isEmpty
                    ? FrostedContainer(
                        padding: const EdgeInsets.all(40),
                        borderRadius: 20,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    AppTheme.petroGreen.withValues(alpha: 0.2),
                                    AppTheme.petroMintGreen.withValues(
                                      alpha: 0.1,
                                    ),
                                  ],
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.data_usage_outlined,
                                size: 48,
                                color: AppTheme.petroMintGreen,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'Henüz sağlık bilgisi yok',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Profil bilgileri eklendiğinde burada görünecek',
                              style: Theme.of(context).textTheme.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      )
                    : AnimationLimiter(
                        child: ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: healthDataEntries.length,
                          itemBuilder: (context, index) {
                            final entry = healthDataEntries[index];
                            final isCritical = _isCritical(entry.key);
                            return AnimationConfiguration.staggeredList(
                              position: index,
                              duration: const Duration(milliseconds: 375),
                              child: SlideAnimation(
                                verticalOffset: 50.0,
                                child: FadeInAnimation(
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 16),
                                    child: FrostedContainer(
                                      padding: const EdgeInsets.all(20),
                                      borderRadius: 16,
                                      gradient: LinearGradient(
                                        colors: isCritical
                                            ? [
                                                Colors.red.withValues(
                                                  alpha: 0.18,
                                                ),
                                                AppTheme.darkCard.withValues(
                                                  alpha: 0.82,
                                                ),
                                              ]
                                            : [
                                                AppTheme.amberPrimary
                                                    .withValues(alpha: 0.08),
                                                AppTheme.petroGreen.withValues(
                                                  alpha: 0.04,
                                                ),
                                              ],
                                      ),
                                      border: isCritical
                                          ? Border.all(
                                              color: Colors.red.withValues(
                                                alpha: 0.45,
                                              ),
                                              width: 1.4,
                                            )
                                          : null,
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              gradient: isCritical
                                                  ? const LinearGradient(
                                                      colors: [
                                                        Colors.red,
                                                        Colors.deepOrange,
                                                      ],
                                                    )
                                                  : AppTheme.amberGradient,
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: AppTheme.amberPrimary
                                                      .withValues(alpha: 0.3),
                                                  blurRadius: 8,
                                                  offset: const Offset(0, 3),
                                                ),
                                              ],
                                            ),
                                            child: Icon(
                                              isCritical
                                                  ? Icons.warning_rounded
                                                  : Icons.favorite,
                                              color: Colors.white,
                                              size: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  entry.key,
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .titleMedium
                                                      ?.copyWith(
                                                        fontWeight:
                                                            FontWeight.w600,
                                                      ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  entry.value,
                                                  style: Theme.of(
                                                    context,
                                                  ).textTheme.bodyMedium,
                                                ),
                                              ],
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                              Icons.delete_outline,
                                              color: Colors.red,
                                              size: 20,
                                            ),
                                            onPressed: () async {
                                              final confirm = await showDialog<bool>(
                                                context: context,
                                                builder: (ctx) => AlertDialog(
                                                  backgroundColor:
                                                      AppTheme.darkCard,
                                                  title: Text(
                                                    'Sağlık bilgisini sil',
                                                    style: Theme.of(
                                                      context,
                                                    ).textTheme.titleMedium,
                                                  ),
                                                  content: Text(
                                                    'Bu sağlık bilgisini silmek istediğinize emin misiniz?',
                                                    style: Theme.of(
                                                      context,
                                                    ).textTheme.bodyMedium,
                                                  ),
                                                  actions: [
                                                    TextButton(
                                                      onPressed: () =>
                                                          Navigator.pop(
                                                            ctx,
                                                            false,
                                                          ),
                                                      child: Text(
                                                        'İptal',
                                                        style: TextStyle(
                                                          color: AppTheme
                                                              .textLight,
                                                        ),
                                                      ),
                                                    ),
                                                    TextButton(
                                                      onPressed: () =>
                                                          Navigator.pop(
                                                            ctx,
                                                            true,
                                                          ),
                                                      child: const Text(
                                                        'Sil',
                                                        style: TextStyle(
                                                          color: Colors.red,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              );
                                              if (confirm == true) {
                                                final newMap =
                                                    Map<String, String>.from(
                                                      device.healthData,
                                                    );
                                                newMap.remove(entry.key);
                                                prov.updateHealthData(
                                                  device.id,
                                                  newMap,
                                                );
                                              }
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
