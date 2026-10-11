enum VisibilityLevel {
  private,
  public,
  staff,
  masked;

  String get wireName => name;

  static VisibilityLevel fromWire(Object? value) {
    final text = value?.toString();
    return VisibilityLevel.values.firstWhere(
      (level) => level.wireName == text,
      orElse: () => VisibilityLevel.private,
    );
  }
}

class LifeBandProfile {
  final String uid;
  final String firstName;
  final String lastName;
  final String nationalId;
  final String phone;
  final String email;
  final String birthDate;
  final String bloodType;
  final String allergies;
  final String chronicDiseases;
  final String medications;
  final String emergencyContact;
  final String notes;
  final DateTime? updatedAt;

  const LifeBandProfile({
    required this.uid,
    this.firstName = '',
    this.lastName = '',
    this.nationalId = '',
    this.phone = '',
    this.email = '',
    this.birthDate = '',
    this.bloodType = '',
    this.allergies = '',
    this.chronicDiseases = '',
    this.medications = '',
    this.emergencyContact = '',
    this.notes = '',
    this.updatedAt,
  });

  String get fullName => [
    firstName,
    lastName,
  ].where((part) => part.trim().isNotEmpty).join(' ').trim();

  Map<String, String> get fieldValues => {
    'fullName': fullName,
    'firstName': firstName,
    'lastName': lastName,
    'nationalId': nationalId,
    'phone': phone,
    'email': email,
    'birthDate': birthDate,
    'bloodType': bloodType,
    'allergies': allergies,
    'chronicDiseases': chronicDiseases,
    'medications': medications,
    'emergencyContact': emergencyContact,
    'notes': notes,
  };

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'firstName': firstName,
      'lastName': lastName,
      'nationalId': nationalId,
      'phone': phone,
      'email': email,
      'birthDate': birthDate,
      'bloodType': bloodType,
      'allergies': allergies,
      'chronicDiseases': chronicDiseases,
      'medications': medications,
      'emergencyContact': emergencyContact,
      'notes': notes,
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  static LifeBandProfile fromMap(Map<String, dynamic> map) {
    return LifeBandProfile(
      uid: map['uid']?.toString() ?? '',
      firstName: map['firstName']?.toString() ?? '',
      lastName: map['lastName']?.toString() ?? '',
      nationalId: map['nationalId']?.toString() ?? '',
      phone: map['phone']?.toString() ?? '',
      email: map['email']?.toString() ?? '',
      birthDate: map['birthDate']?.toString() ?? '',
      bloodType: map['bloodType']?.toString() ?? '',
      allergies: map['allergies']?.toString() ?? '',
      chronicDiseases: map['chronicDiseases']?.toString() ?? '',
      medications: map['medications']?.toString() ?? '',
      emergencyContact: map['emergencyContact']?.toString() ?? '',
      notes: map['notes']?.toString() ?? '',
      updatedAt: _parseDate(map['updatedAt']),
    );
  }
}

class VisibilitySettings {
  final String uid;
  final Map<String, VisibilityLevel> fields;
  final String template;
  final DateTime? updatedAt;

  const VisibilitySettings({
    required this.uid,
    this.fields = const {},
    this.template = 'custom',
    this.updatedAt,
  });

  factory VisibilitySettings.minimal(String uid) {
    return VisibilitySettings(
      uid: uid,
      template: 'minimal',
      fields: const {
        'bloodType': VisibilityLevel.public,
        'allergies': VisibilityLevel.public,
        'emergencyContact': VisibilityLevel.public,
        'fullName': VisibilityLevel.masked,
      },
    );
  }

  factory VisibilitySettings.emergency(String uid) {
    return VisibilitySettings(
      uid: uid,
      template: 'emergency',
      fields: const {
        'fullName': VisibilityLevel.masked,
        'bloodType': VisibilityLevel.public,
        'allergies': VisibilityLevel.public,
        'emergencyContact': VisibilityLevel.public,
        'chronicDiseases': VisibilityLevel.public,
        'medications': VisibilityLevel.staff,
        'notes': VisibilityLevel.staff,
      },
    );
  }

  factory VisibilitySettings.staffFocused(String uid) {
    return VisibilitySettings(
      uid: uid,
      template: 'staffFocused',
      fields: const {
        'fullName': VisibilityLevel.masked,
        'bloodType': VisibilityLevel.public,
        'allergies': VisibilityLevel.public,
        'emergencyContact': VisibilityLevel.public,
        'chronicDiseases': VisibilityLevel.staff,
        'medications': VisibilityLevel.staff,
        'notes': VisibilityLevel.staff,
      },
    );
  }

  VisibilityLevel levelFor(String key) {
    return fields[key] ?? VisibilityLevel.private;
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'fields': fields.map((key, value) => MapEntry(key, value.wireName)),
      'template': template,
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  static VisibilitySettings fromMap(Map<String, dynamic> map) {
    final rawFields = map['fields'];
    final parsedFields = <String, VisibilityLevel>{};
    if (rawFields is Map) {
      rawFields.forEach((key, value) {
        parsedFields[key.toString()] = VisibilityLevel.fromWire(value);
      });
    }
    return VisibilitySettings(
      uid: map['uid']?.toString() ?? '',
      fields: parsedFields,
      template: map['template']?.toString() ?? 'custom',
      updatedAt: _parseDate(map['updatedAt']),
    );
  }
}

class QrCodeRecord {
  final String qrId;
  final String tokenHash;
  final String status;
  final String? ownerUid;
  final String? ownerEmail;
  final String? claimEmail;
  final String? claimPhone;
  final DateTime? createdAt;
  final DateTime? claimedAt;
  final DateTime? revokedAt;

  const QrCodeRecord({
    required this.qrId,
    this.tokenHash = '',
    this.status = 'unclaimed',
    this.ownerUid,
    this.ownerEmail,
    this.claimEmail,
    this.claimPhone,
    this.createdAt,
    this.claimedAt,
    this.revokedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'qrId': qrId,
      'tokenHash': tokenHash,
      'status': status,
      if (ownerUid != null) 'ownerUid': ownerUid,
      if (ownerEmail != null) 'ownerEmail': ownerEmail,
      if (claimEmail != null) 'claimEmail': claimEmail,
      if (claimPhone != null) 'claimPhone': claimPhone,
      if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
      if (claimedAt != null) 'claimedAt': claimedAt!.toIso8601String(),
      if (revokedAt != null) 'revokedAt': revokedAt!.toIso8601String(),
    };
  }

  static QrCodeRecord fromMap(Map<String, dynamic> map) {
    return QrCodeRecord(
      qrId: map['qrId']?.toString() ?? map['id']?.toString() ?? '',
      tokenHash: map['tokenHash']?.toString() ?? '',
      status: map['status']?.toString() ?? 'unclaimed',
      ownerUid: map['ownerUid']?.toString(),
      ownerEmail: map['ownerEmail']?.toString(),
      claimEmail: map['claimEmail']?.toString(),
      claimPhone: map['claimPhone']?.toString(),
      createdAt: _parseDate(map['createdAt']),
      claimedAt: _parseDate(map['claimedAt']),
      revokedAt: _parseDate(map['revokedAt']),
    );
  }
}

class PublicProfile {
  final String qrId;
  final String ownerUid;
  final Map<String, String> displayFields;
  final DateTime? updatedAt;

  const PublicProfile({
    required this.qrId,
    required this.ownerUid,
    this.displayFields = const {},
    this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'qrId': qrId,
      'ownerUid': ownerUid,
      'displayFields': displayFields,
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
    };
  }

  static PublicProfile fromMap(Map<String, dynamic> map) {
    final fields = <String, String>{};
    final rawFields = map['displayFields'];
    if (rawFields is Map) {
      rawFields.forEach((key, value) {
        fields[key.toString()] = value.toString();
      });
    }
    return PublicProfile(
      qrId: map['qrId']?.toString() ?? '',
      ownerUid: map['ownerUid']?.toString() ?? '',
      displayFields: fields,
      updatedAt: _parseDate(map['updatedAt']),
    );
  }
}

DateTime? _parseDate(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  final dynamic dynamicValue = value;
  try {
    final date = dynamicValue.toDate();
    if (date is DateTime) return date;
  } catch (_) {
    // Firestore Timestamp is handled above when available.
  }
  return DateTime.tryParse(value.toString());
}
