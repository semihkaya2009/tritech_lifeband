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
    test(
      'emits public and masked fields but omits private and staff fields',
      () {
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
      },
    );

    test('minimal template exposes emergency basics only', () {
      const profile = LifeBandProfile(
        uid: 'user-1',
        firstName: 'Mehmet',
        lastName: 'Yilmaz',
        nationalId: '12345678901',
        phone: '05321234567',
        bloodType: 'A Rh+',
        allergies: 'Penisilin',
        emergencyContact: 'Ayse Yilmaz',
      );

      final fields = compilePublicFields(
        profile,
        VisibilitySettings.minimal('user-1'),
      );

      expect(fields['bloodType'], 'A Rh+');
      expect(fields['allergies'], 'Penisilin');
      expect(fields['emergencyContact'], 'Ayse Yilmaz');
      expect(fields, isNot(contains('nationalId')));
      expect(fields, isNot(contains('phone')));
    });

    test('staffFocused template reserves clinical details for staff', () {
      final settings = VisibilitySettings.staffFocused('user-1');

      expect(settings.levelFor('chronicDiseases'), VisibilityLevel.staff);
      expect(settings.levelFor('medications'), VisibilityLevel.staff);

      const profile = LifeBandProfile(
        uid: 'user-1',
        bloodType: 'A Rh+',
        chronicDiseases: 'Diyabet',
        medications: 'Insulin',
      );
      final fields = compilePublicFields(profile, settings);

      expect(fields['bloodType'], 'A Rh+');
      expect(fields, isNot(contains('chronicDiseases')));
      expect(fields, isNot(contains('medications')));
    });
  });

  group('compileStaffFields', () {
    test('includes staff-level fields at full value, excludes private', () {
      const profile = LifeBandProfile(
        uid: 'user-1',
        bloodType: 'A Rh+',
        nationalId: '12345678901',
        chronicDiseases: 'Diyabet',
        medications: 'Insulin',
      );
      const settings = VisibilitySettings(
        uid: 'user-1',
        fields: {
          'bloodType': VisibilityLevel.public,
          'nationalId': VisibilityLevel.private,
          'chronicDiseases': VisibilityLevel.staff,
          'medications': VisibilityLevel.staff,
        },
      );

      final fields = compileStaffFields(profile, settings);

      expect(fields['bloodType'], 'A Rh+');
      expect(fields['chronicDiseases'], 'Diyabet');
      expect(fields['medications'], 'Insulin');
      expect(fields, isNot(contains('nationalId')));
    });

    test('still masks masked-level fields for staff view', () {
      const profile = LifeBandProfile(uid: 'user-1', phone: '05321234567');
      const settings = VisibilitySettings(
        uid: 'user-1',
        fields: {'phone': VisibilityLevel.masked},
      );

      final fields = compileStaffFields(profile, settings);

      expect(fields['phone'], '05** *** ** 67');
    });
  });
}
