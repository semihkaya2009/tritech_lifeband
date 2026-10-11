import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_theme.dart';
import '../providers/lifeband_provider.dart';
import '../services/auth_service.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';
import '../widgets/glass_app_bar.dart';
import 'qr_list_screen.dart';
import 'qr_scan_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LifeBandProvider>();
    final user = provider.user;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: GlassAppBar(
        title: 'LifeBand',
        actions: [
          IconButton(
            tooltip: 'Çıkış yap',
            onPressed: () => context.read<AuthService>().signOut(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const QrScanScreen()),
          ).then((_) => provider.refresh());
        },
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('QR Tara'),
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                FrostedContainer(
                  padding: const EdgeInsets.all(24),
                  borderRadius: 20,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.petroGreen.withValues(alpha: 0.35),
                      AppTheme.amberPrimary.withValues(alpha: 0.18),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: AppTheme.petroGradient,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.health_and_safety,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 18),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Acil Sağlık Profillerim',
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.email ?? 'LifeBand kullanıcısı',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        icon: Icons.qr_code_2,
                        value: '${provider.qrCodes.length}',
                        label: 'Bağlı QR',
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _MetricCard(
                        icon: Icons.verified_user,
                        value: provider.profile == null ? 'Eksik' : 'Hazır',
                        label: 'Profil',
                      ),
                    ),
                  ],
                ),
                if (provider.errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    provider.errorMessage!,
                    style: const TextStyle(color: Colors.redAccent),
                  ),
                ],
                const SizedBox(height: 24),
                Text(
                  'QR kayıtlarım',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 14),
                QrListScreen(
                  qrCodes: provider.qrCodes,
                  loading: provider.loading,
                  onRefresh: provider.refresh,
                ),
                const SizedBox(height: 96),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return FrostedContainer(
      padding: const EdgeInsets.all(18),
      borderRadius: 16,
      child: Column(
        children: [
          Icon(icon, color: AppTheme.petroMintGreen, size: 26),
          const SizedBox(height: 10),
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
