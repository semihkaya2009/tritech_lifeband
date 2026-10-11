import '../models/lifeband_profile.dart';

Map<String, String> compilePublicFields(
  LifeBandProfile profile,
  VisibilitySettings settings,
) {
  final result = <String, String>{};
  for (final entry in profile.fieldValues.entries) {
    final value = entry.value.trim();
    if (value.isEmpty) continue;

    final level = settings.levelFor(entry.key);
    switch (level) {
      case VisibilityLevel.public:
        result[entry.key] = value;
      case VisibilityLevel.masked:
        result[entry.key] = maskField(entry.key, value);
      case VisibilityLevel.private:
      case VisibilityLevel.staff:
        break;
    }
  }
  return result;
}

String maskField(String fieldKey, String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return '';

  switch (fieldKey) {
    case 'nationalId':
      return _maskNationalId(trimmed);
    case 'phone':
      return _maskPhone(trimmed);
    case 'email':
      return _maskEmail(trimmed);
    case 'fullName':
      return _maskFullName(trimmed);
    case 'birthDate':
      return _maskBirthDate(trimmed);
    default:
      return _maskGeneric(trimmed);
  }
}

String _maskNationalId(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  if (digits.length < 4) return _maskGeneric(value);
  final first = digits.substring(0, 2);
  final last = digits.substring(digits.length - 2);
  return '$first${'*' * (digits.length - 4)}$last';
}

String _maskPhone(String value) {
  final digits = value.replaceAll(RegExp(r'\D'), '');
  if (digits.length < 4) return _maskGeneric(value);
  final prefix = digits.length >= 2 ? digits.substring(0, 2) : digits;
  final suffix = digits.substring(digits.length - 2);
  return '$prefix** *** ** $suffix';
}

String _maskEmail(String value) {
  final atIndex = value.indexOf('@');
  if (atIndex <= 0) return _maskGeneric(value);
  return '${value[0]}***${value.substring(atIndex)}';
}

String _maskFullName(String value) {
  final parts = value.split(RegExp(r'\s+')).where((part) => part.isNotEmpty);
  final list = parts.toList();
  if (list.length < 2) return _maskGeneric(value);
  return '${list.first} ${list[1][0]}.';
}

String _maskBirthDate(String value) {
  final yearMatch = RegExp(r'(19|20)\d{2}').firstMatch(value);
  return yearMatch?.group(0) ?? _maskGeneric(value);
}

String _maskGeneric(String value) {
  if (value.length <= 2) return '*' * value.length;
  if (value.length <= 4) return '${value[0]}***';
  return '${value.substring(0, 2)}***${value.substring(value.length - 2)}';
}
