import 'package:flutter_test/flutter_test.dart';
import 'package:tritech_lifeband/src/demo/emergency_demo.dart';

void main() {
  test('accepts only 10 digit numeric QR tokens', () {
    expect(EmergencyDemo.isValidQrToken('1234567890'), isTrue);
    expect(EmergencyDemo.isValidQrToken(' 1234567890 '), isTrue);

    expect(EmergencyDemo.isValidQrToken('123456789'), isFalse);
    expect(EmergencyDemo.isValidQrToken('12345678901'), isFalse);
    expect(EmergencyDemo.isValidQrToken('lifeband-demo'), isFalse);
  });

  test('recognizes the printed demo token', () {
    expect(EmergencyDemo.isDemoToken('1234567890'), isTrue);
    expect(EmergencyDemo.isDemoToken('0000000000'), isFalse);
  });

  test('demo profile contains critical emergency fields', () {
    final device = EmergencyDemo.deviceForToken('1234567890');

    expect(device, isNotNull);
    expect(device!.name, 'LifeBand Acil Profil');
    expect(device.healthData['Kan Grubu'], 'A Rh+');
    expect(device.healthData['Yas'], '34');
    expect(device.healthData['Acil Durum Yakini'], contains('0532'));
    expect(device.healthData['Kesinlikle Yapilmamasi Gerekenler'], contains('Penisilin'));
  });
}
