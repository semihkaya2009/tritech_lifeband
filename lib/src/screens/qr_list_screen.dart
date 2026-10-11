import 'package:flutter/material.dart';

import '../app_theme.dart';
import '../models/lifeband_profile.dart';
import '../widgets/frosted_container.dart';
import 'profile_edit_screen.dart';

class QrListScreen extends StatelessWidget {
  const QrListScreen({
    super.key,
    required this.qrCodes,
    required this.loading,
    required this.onRefresh,
  });

  final List<QrCodeRecord> qrCodes;
  final bool loading;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (qrCodes.isEmpty) {
      return FrostedContainer(
        padding: const EdgeInsets.all(28),
        borderRadius: 20,
        child: Column(
          children: [
            const Icon(
              Icons.qr_code_2,
              color: AppTheme.petroMintGreen,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              'Hesabına bağlı QR yok',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Admin panelinden oluşturulan QR ilk okutulduğunda e-postanı gir. Bu hesapla giriş yaptığında burada görünecek.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRefresh,
              icon: const Icon(Icons.refresh),
              label: const Text('Yenile'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        shrinkWrap: true,
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: qrCodes.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final qr = qrCodes[index];
          return FrostedContainer(
            padding: const EdgeInsets.all(18),
            borderRadius: 18,
            child: ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  gradient: AppTheme.petroGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.qr_code, color: Colors.white),
              ),
              title: Text(qr.qrId),
              subtitle: Text(_subtitle(qr)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => ProfileEditScreen(qr: qr)),
                );
              },
            ),
          );
        },
      ),
    );
  }

  String _subtitle(QrCodeRecord qr) {
    if (qr.status == 'claimed') {
      return 'Sahiplenme bekliyor: ${qr.claimEmail ?? ''}';
    }
    if (qr.status == 'active') return 'Aktif LifeBand QR';
    return qr.status;
  }
}
