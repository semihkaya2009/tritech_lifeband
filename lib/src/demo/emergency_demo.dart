import '../models/device.dart';
import '../utils/qr_token_parser.dart' as qr_token_parser;

class EmergencyDemo {
  static const token = 'LB_DEMO_20261011';
  static const legacyToken = '1234567890';
  static const demoWebUrl =
      'https://tritech-lifeband.semihkayaa2009.workers.dev/q/LB_DEMO_20261011';

  static bool isValidQrToken(String value) {
    return extractQrToken(value) != null;
  }

  static String? extractQrToken(String value) {
    return qr_token_parser.extractQrToken(value);
  }

  static bool isDemoToken(String value) {
    final parsed = extractQrToken(value);
    return parsed == token || parsed == legacyToken;
  }

  static Device? deviceForToken(String value) {
    final parsed = extractQrToken(value);
    if (parsed != token && parsed != legacyToken) return null;
    return demoDevice.copyWith(token: parsed);
  }

  static const demoDevice = Device(
    id: 'lifeband-demo-profile',
    name: 'LifeBand Acil Profil',
    token: token,
    healthData: {
      'Kan Grubu': 'A Rh+',
      'Yas': '34',
      'Acil Durum Yakini': '0532 000 00 00 - Ayse Yilmaz',
      'Alerjiler': 'Penisilin, ari sokmasi',
      'Kronik Rahatsizlik': 'Diyabet Tip 1',
      'Kullandigi Ilaclar': 'Insulin kalemi, kan sulandirici yok',
      'Kesinlikle Yapilmamasi Gerekenler':
          'Penisilin verilmemeli. Bilinc kapaliysa seker dusmesi kontrol edilmeli.',
    },
  );
}
