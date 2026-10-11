String? extractQrToken(String rawValue) {
  final trimmed = rawValue.trim();
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

String? _normalizeToken(String value) {
  final candidate = value.trim();
  if (RegExp(r'^\d{10}$').hasMatch(candidate)) return candidate;
  if (RegExp(r'^LB_[A-Za-z0-9_-]{8,64}$').hasMatch(candidate)) {
    return candidate;
  }
  return null;
}
