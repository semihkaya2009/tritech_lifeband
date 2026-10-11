import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

import '../demo/emergency_demo.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';

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
              final token = EmergencyDemo.extractQrToken(rawValue);

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
              final demoDevice = EmergencyDemo.deviceForToken(token);

              try {
                final user = auth.currentUser;
                if (user == null) {
                  await auth.signInAnonymously();
                }
                final uid = auth.currentUser?.uid;
                if (uid == null) {
                  if (!mounted) return;
                  navigator.pop(demoDevice);
                  return;
                }

                final success = await fs.enrollTokenForUser(uid, token);
                if (!mounted) return;
                if (success) {
                  navigator.pop(true);
                } else {
                  navigator.pop(demoDevice ?? false);
                }
              } catch (_) {
                if (!mounted) return;
                navigator.pop(demoDevice ?? false);
              }
            },
          ),
          Positioned(
            left: 20,
            right: 20,
            bottom: 24,
            child: SafeArea(
              child: FilledButton.icon(
                onPressed: () {
                  Navigator.of(context).pop(EmergencyDemo.demoDevice);
                },
                icon: const Icon(Icons.medical_information_outlined),
                label: const Text('Demo acil profili aç'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
