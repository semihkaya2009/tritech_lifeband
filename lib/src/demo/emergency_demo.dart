import '../models/device.dart';

class EmergencyDemo {
  static const token = 'LB_DEMO_20261011';
  static const legacyToken = '1234567890';
  static const demoWebUrl =
      'https://tritech-lifeband.semihkayaa2009.workers.dev/q/LB_DEMO_20261011';

  static bool isValidQrToken(String value) {
    return extractQrToken(value) != null;
  }

  static String? extractQrToken(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;

    final directToken = _normalizeToken(trimmed);
    if (directToken != null) return directToken;

    final uri = Uri.tryParse(trimmed);
    if (uri == null) return null;

    final segments = uri.pathSegments;
    final qIndex = segments.indexOf('q');
    if (qIndex >= 0 && qIndex + 1 < segments.length) {
      return _normalizeToken(segments[qIndex + 1]);
    }

    final id = uri.queryParameters['id'] ?? uri.queryParameters['qr'];
    if (id != null) return _normalizeToken(id);

    return null;
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

  static String? _normalizeToken(String value) {
    final candidate = value.trim();
    if (RegExp(r'^\d{10}$').hasMatch(candidate)) return candidate;
    if (RegExp(r'^LB_[A-Za-z0-9_-]{8,64}$').hasMatch(candidate)) {
      return candidate;
    }
    return null;
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
