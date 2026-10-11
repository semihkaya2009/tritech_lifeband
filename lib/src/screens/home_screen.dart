import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'qr_scan_screen.dart';

import '../providers/device_provider.dart';
import '../models/device.dart';
import '../widgets/device_tile.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';
import '../widgets/glass_app_bar.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';
import '../app_theme.dart';
import 'device_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late ScaffoldMessengerState _scaffoldMessenger;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _scaffoldMessenger = ScaffoldMessenger.of(context);
  }

  @override
  Widget build(BuildContext context) {
    final devices = context.watch<DeviceProvider>().devices;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'LifeBand'),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),

                // Welcome section - Teknolojik spor tarzı
                FrostedContainer(
                  padding: const EdgeInsets.all(24),
                  borderRadius: 20,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.petroGreen.withValues(alpha: 0.35),
                      AppTheme.amberPrimary.withValues(alpha: 0.2),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: AppTheme.petroGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.petroGreen.withValues(alpha: 0.4),
                              blurRadius: 16,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.health_and_safety,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Acil Sağlık Profili',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'QR bilekliği okutun, kritik bilgileri saniyeler içinde görün',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),

                // Statistics cards - Bölümlenmiş metrik kartları
                Row(
                  children: [
                    Expanded(
                      child: FrostedContainer(
                        padding: const EdgeInsets.all(20),
                        borderRadius: 16,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.amberPrimary.withValues(alpha: 0.15),
                            AppTheme.amberDark.withValues(alpha: 0.05),
                          ],
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: AppTheme.amberGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.amberPrimary.withValues(
                                      alpha: 0.3,
                                    ),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.devices,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '${devices.length}',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            Text(
                              'Acil Profil',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: FrostedContainer(
                        padding: const EdgeInsets.all(20),
                        borderRadius: 16,
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.petroGreen.withValues(alpha: 0.15),
                            AppTheme.petroMintGreen.withValues(alpha: 0.05),
                          ],
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: AppTheme.petroGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.petroGreen.withValues(
                                      alpha: 0.3,
                                    ),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.show_chart,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Demo',
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(fontSize: 20),
                            ),
                            Text(
                              'Hazır',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Devices section header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'LifeBand Profilleri',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    GestureDetector(
                      onTap: () async {
                        final res = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const QrScanScreen(),
                          ),
                        );
                        if (!context.mounted) return;
                        if (res is Device) {
                          context.read<DeviceProvider>().addLocalDemoDevice(
                            res,
                          );
                          _scaffoldMessenger.showSnackBar(
                            const SnackBar(
                              content: Text('Demo acil profil açıldı'),
                              backgroundColor: AppTheme.petroGreen,
                            ),
                          );
                        } else if (res == true) {
                          _scaffoldMessenger.showSnackBar(
                            const SnackBar(
                              content: Text('LifeBand profili eklendi'),
                              backgroundColor: AppTheme.petroGreen,
                            ),
                          );
                        } else if (res == false) {
                          _scaffoldMessenger.showSnackBar(
                            const SnackBar(
                              content: Text(
                                'QR token Firestore içinde bulunamadı. Demo QR: 1234567890',
                              ),
                              backgroundColor: Colors.orange,
                            ),
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          gradient: AppTheme.amberGradient,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.amberPrimary.withValues(alpha: 0.3),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.amberPrimary.withValues(
                                alpha: 0.2,
                              ),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.add,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Devices list
                devices.isEmpty
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
                                Icons.device_hub_outlined,
                                size: 48,
                                color: AppTheme.petroMintGreen,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'Henüz acil profil yok',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'QR tarayın veya tarama ekranından demo profili açın',
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
                          itemCount: devices.length,
                          itemBuilder: (context, index) {
                            final device = devices[index];
                            return AnimationConfiguration.staggeredList(
                              position: index,
                              duration: const Duration(milliseconds: 375),
                              child: SlideAnimation(
                                verticalOffset: 50.0,
                                child: FadeInAnimation(
                                  child: Dismissible(
                                    key: ValueKey(device.id),
                                    direction: DismissDirection.endToStart,
                                    background: Container(
                                      alignment: Alignment.centerRight,
                                      padding: const EdgeInsets.only(right: 20),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            Colors.red.withValues(alpha: 0.7),
                                            Colors.red.withValues(alpha: 0.9),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: const Icon(
                                        Icons.delete_forever,
                                        color: Colors.white,
                                        size: 28,
                                      ),
                                    ),
                                    confirmDismiss: (direction) async {
                                      final res = await showDialog<bool>(
                                        context: context,
                                        builder: (ctx) => AlertDialog(
                                          backgroundColor: AppTheme.darkCard,
                                          title: Text(
                                            'Profili kaldır',
                                            style: Theme.of(
                                              context,
                                            ).textTheme.titleMedium,
                                          ),
                                          content: Text(
                                            'Bu profili listeden kaldırmak istediğinize emin misiniz?',
                                            style: Theme.of(
                                              context,
                                            ).textTheme.bodyMedium,
                                          ),
                                          actions: [
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(ctx, false),
                                              child: Text(
                                                'İptal',
                                                style: TextStyle(
                                                  color: AppTheme.textLight,
                                                ),
                                              ),
                                            ),
                                            TextButton(
                                              onPressed: () =>
                                                  Navigator.pop(ctx, true),
                                              child: const Text(
                                                'Sil',
                                                style: TextStyle(
                                                  color: Colors.red,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                      return res == true;
                                    },
                                    onDismissed: (direction) async {
                                      try {
                                        final auth = context
                                            .read<AuthService>();
                                        final firestore = context
                                            .read<FirestoreService>();
                                        final deviceProvider = context
                                            .read<DeviceProvider>();

                                        final uid = auth.currentUser?.uid;
                                        if (uid == null) {
                                          _scaffoldMessenger.showSnackBar(
                                            const SnackBar(
                                              content: Text(
                                              'Kullanıcı oturumu yok',
                                              ),
                                              backgroundColor: Colors.red,
                                            ),
                                          );
                                          return;
                                        }

                                        await firestore.unenrollDeviceForUser(
                                          uid,
                                          device.id,
                                        );

                                        deviceProvider.removeById(device.id);

                                        if (!mounted) return;
                                        _scaffoldMessenger.showSnackBar(
                                          SnackBar(
                                            content: const Text(
                                              'Profil kaldırıldı',
                                            ),
                                            backgroundColor:
                                                AppTheme.petroGreen,
                                          ),
                                        );
                                      } catch (e) {
                                        if (!mounted) return;
                                        _scaffoldMessenger.showSnackBar(
                                          const SnackBar(
                                            content: Text('Silme başarısız'),
                                            backgroundColor: Colors.red,
                                          ),
                                        );
                                      }
                                    },
                                    child: DeviceTile(
                                      device: device,
                                      onTap: () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => DeviceDetailScreen(
                                            deviceId: device.id,
                                          ),
                                        ),
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
