# TriTech LifeBand

LifeBand, QR bileklik üzerinden acil sağlık bilgisini kontrollü gösteren Flutter + Firebase + Cloudflare uygulamasıdır.

## Gerçek Akış

1. Sistem admini web panelde sahipsiz QR oluşturur.
2. QR ilk okutulduğunda kullanıcı web claim formunda ad, soyad, e-posta ve telefon girer.
3. Kullanıcı Android uygulamasında aynı e-posta ile giriş yapınca QR hesabına bağlanır.
4. Kullanıcı profili ve alan bazlı görünürlük ayarlarını mobil uygulamadan düzenler.
5. Public QR sayfası yalnızca kullanıcının açık veya yarı görünür yaptığı alanları gösterir.

## Kurulum

### Firebase

```bash
firebase deploy --project tritech-lifeband --only firestore:rules,firestore:indexes
```

Firebase Console'da:

- Authentication > Sign-in method: Email/Password aç.
- Authentication > Sign-in method: Anonymous aç.
- İlk sistem admin hesabını Auth içinde oluştur.
- Admin UID'si ile `adminUsers/{uid}` dokümanı oluştur.

Örnek admin dokümanı:

```json
{
  "email": "admin@example.com",
  "role": "systemAdmin"
}
```

### Cloudflare

- Build command: boş bırak veya `npx wrangler deploy`
- Static asset directory: `site`
- Worker/Pages URL QR domaini olur: `https://.../q/LB_randomToken`
- Admin panelini herkese açmamak için Cloudflare Access ile `/admin*` kuralı ekle.

Firebase Web App config değerlerini `site/config.example.js` formatında `site/config.js` içine yaz.

### Android APK

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

APK çıktısı:

```text
build/app/outputs/flutter-apk/app-release.apk
```

## Önemli Dosyalar

- `firestore.rules`: QR sahiplenme, admin ve profil güvenlik kuralları.
- `site/app.js`: Cloudflare web/admin ve QR claim akışı.
- `lib/src/screens/auth_screen.dart`: Email/password giriş ve kayıt.
- `lib/src/screens/profile_edit_screen.dart`: Sağlık profili düzenleme.
- `lib/src/screens/visibility_settings_screen.dart`: Alan bazlı görünürlük.
- `lib/src/utils/qr_token_parser.dart`: `LB_...`, `/q/LB_...`, `?id=LB_...` QR ayrıştırma.

## Doğrulama

Son doğrulama komutları:

```bash
flutter analyze
flutter test
node site/visibility.test.mjs
node --check site/app.js
npx --yes wrangler deploy --dry-run
flutter build apk --release
```
