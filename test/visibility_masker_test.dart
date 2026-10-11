import 'package:flutter_test/flutter_test.dart';
import 'package:tritech_lifeband/src/models/lifeband_profile.dart';
import 'package:tritech_lifeband/src/utils/visibility_masker.dart';

void main() {
  group('maskField', () {
    test('masks sensitive identity and contact fields', () {
      expect(maskField('nationalId', '12345678901'), '12*******01');
      expect(maskField('phone', '05321234567'), '05** *** ** 67');
      expect(maskField('email', 'mehmet@example.com'), 'm***@example.com');
      expect(maskField('fullName', 'Mehmet Yilmaz'), 'Mehmet Y.');
    });
  });

  group('compilePublicFields', () {
    test('emits public and masked fields but omits private and staff fields', () {
      const profile = LifeBandProfile(
        uid: 'user-1',
        firstName: 'Mehmet',
        lastName: 'Yilmaz',
        nationalId: '12345678901',
        phone: '05321234567',
        bloodType: 'A Rh+',
        medications: 'Insulin',
      );
      const settings = VisibilitySettings(
        uid: 'user-1',
        fields: {
          'bloodType': VisibilityLevel.public,
          'nationalId': VisibilityLevel.masked,
          'phone': VisibilityLevel.private,
          'medications': VisibilityLevel.staff,
        },
      );

      final fields = compilePublicFields(profile, settings);

      expect(fields['bloodType'], 'A Rh+');
      expect(fields['nationalId'], '12*******01');
      expect(fields, isNot(contains('phone')));
      expect(fields, isNot(contains('medications')));
    });
  });
}
