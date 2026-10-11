import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../models/lifeband_profile.dart';
import '../providers/lifeband_provider.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';
import '../utils/qr_token_parser.dart';
import 'profile_edit_screen.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  bool _scanned = false;
  late ScaffoldMessengerState _scaffoldMessenger;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _scaffoldMessenger = ScaffoldMessenger.of(context);
  }

  @override
  Widget build(BuildContext context) {
    final fs = context.read<FirestoreService>();
    final auth = context.read<AuthService>();
    final lifeBand = context.read<LifeBandProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('LifeBand QR Tara')),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (capture) async {
              if (_scanned) return;
              final List<Barcode> barcodes = capture.barcodes;
              if (barcodes.isEmpty) return;
              final rawValue = (barcodes.first.rawValue ?? '').trim();
              if (rawValue.isEmpty) return;
              final token = extractQrToken(rawValue);

              if (token == null) {
                if (!mounted) return;
                _scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Geçersiz QR kodu. LifeBand QR linkini veya güvenli kodu tarayın.',
                    ),
                    duration: Duration(seconds: 2),
                  ),
                );
                return;
              }

              _scanned = true;
              final navigator = Navigator.of(context);

              try {
                final user = auth.currentUser;
                if (user == null) {
                  if (!mounted) return;
                  _scaffoldMessenger.showSnackBar(
                    const SnackBar(
                      content: Text('QR eklemek için önce giriş yapmalısın.'),
                    ),
                  );
                  navigator.pop(false);
                  return;
                }

                final qr = await fs.qrCodeById(token);
                if (!mounted) return;
                if (qr == null || qr.status == 'revoked') {
                  _scaffoldMessenger.showSnackBar(
                    const SnackBar(content: Text('QR aktif değil.')),
                  );
                  navigator.pop(false);
                  return;
                }

                if (qr.status == 'unclaimed') {
                  _scaffoldMessenger.showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Bu QR ilk kayıt için web claim formundan açılmalı.',
                      ),
                    ),
                  );
                  navigator.pop(false);
                  return;
                }

                var activeQr = qr;
                if (qr.status == 'claimed' &&
                    (qr.claimEmail ?? '').toLowerCase() ==
                        (user.email ?? '').toLowerCase()) {
                  await fs.attachClaimedQrToUser(qr, user.uid);
                  activeQr = QrCodeRecord(
                    qrId: qr.qrId,
                    tokenHash: qr.tokenHash,
                    status: 'active',
                    ownerUid: user.uid,
                    claimEmail: qr.claimEmail,
                    claimPhone: qr.claimPhone,
                    createdAt: qr.createdAt,
                    claimedAt: qr.claimedAt,
                  );
                  await lifeBand.refresh();
                }

                if (activeQr.ownerUid == user.uid) {
                  if (!mounted) return;
                  await navigator.pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => ProfileEditScreen(qr: activeQr),
                    ),
                  );
                  return;
                }

                _scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text('Bu QR bu hesaba bağlı görünmüyor.'),
                  ),
                );
                navigator.pop(false);
              } catch (error) {
                if (!mounted) return;
                _scaffoldMessenger.showSnackBar(
                  SnackBar(content: Text('QR okunamadı: $error')),
                );
                navigator.pop(false);
              }
            },
          ),
        ],
      ),
    );
  }
}
