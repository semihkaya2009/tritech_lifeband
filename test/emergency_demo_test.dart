import 'package:flutter_test/flutter_test.dart';
import 'package:tritech_lifeband/src/demo/emergency_demo.dart';

void main() {
  test('accepts secure LifeBand QR tokens and legacy demo tokens', () {
    expect(EmergencyDemo.isValidQrToken('LB_DEMO_20261011'), isTrue);
    expect(
      EmergencyDemo.isValidQrToken(
        'https://tritech-lifeband.pages.dev/q/LB_DEMO_20261011',
      ),
      isTrue,
    );
    expect(EmergencyDemo.isValidQrToken('1234567890'), isTrue);

    expect(EmergencyDemo.isValidQrToken('123456789'), isFalse);
    expect(EmergencyDemo.isValidQrToken('12345678901'), isFalse);
    expect(EmergencyDemo.isValidQrToken('lifeband-demo'), isFalse);
  });

  test('recognizes the printed demo token', () {
    expect(EmergencyDemo.isDemoToken('LB_DEMO_20261011'), isTrue);
    expect(EmergencyDemo.isDemoToken(EmergencyDemo.demoWebUrl), isTrue);
    expect(EmergencyDemo.isDemoToken('0000000000'), isFalse);
  });

  test('extracts token from route and query based QR links', () {
    expect(
      EmergencyDemo.extractQrToken(
        'https://example.pages.dev/q/LB_8xP9mQ7aT2rV6kZpN4sD0A',
      ),
      'LB_8xP9mQ7aT2rV6kZpN4sD0A',
    );
    expect(
      EmergencyDemo.extractQrToken(
        'https://example.pages.dev/profile?id=LB_8xP9mQ7aT2rV6kZpN4sD0A',
      ),
      'LB_8xP9mQ7aT2rV6kZpN4sD0A',
    );
  });

  test('demo profile contains critical emergency fields', () {
    final device = EmergencyDemo.deviceForToken(EmergencyDemo.demoWebUrl);

    expect(device, isNotNull);
    expect(device!.name, 'LifeBand Acil Profil');
    expect(device.healthData['Kan Grubu'], 'A Rh+');
    expect(device.healthData['Yas'], '34');
    expect(device.healthData['Acil Durum Yakini'], contains('0532'));
    expect(device.healthData['Kesinlikle Yapilmamasi Gerekenler'], contains('Penisilin'));
  });
}
