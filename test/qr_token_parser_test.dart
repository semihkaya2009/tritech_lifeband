import 'package:flutter_test/flutter_test.dart';
import 'package:tritech_lifeband/src/utils/qr_token_parser.dart';

void main() {
  test('extracts direct and URL based LifeBand QR tokens', () {
    const token = 'LB_8xP9mQ7aT2rV6kZpN4sD0A';

    expect(extractQrToken(token), token);
    expect(extractQrToken('https://example.com/q/$token'), token);
    expect(extractQrToken('https://example.com/profile?id=$token'), token);
    expect(extractQrToken('https://example.com/profile?qr=$token'), token);
    expect(extractQrToken('not-a-life-band-code'), isNull);
  });
}
