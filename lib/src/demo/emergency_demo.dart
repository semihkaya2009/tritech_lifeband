import '../models/device.dart';

class EmergencyDemo {
  static const token = '1234567890';

  static bool isValidQrToken(String value) {
    return RegExp(r'^\d{10}$').hasMatch(value.trim());
  }

  static bool isDemoToken(String value) => value.trim() == token;

  static Device? deviceForToken(String value) {
    if (!isDemoToken(value)) return null;
    return demoDevice;
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
