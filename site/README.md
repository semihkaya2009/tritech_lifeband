# LifeBand Cloudflare Pages sitesi

Bu klasör build gerektirmeyen statik web/admin panelidir. Cloudflare Pages'te:

- Build command: boş bırak
- Build output directory: `site`
- Production branch: `main`

Demo config olmadan localStorage ile çalışır. Gerçek Firebase bağlantısı için:

1. Firebase Console > Authentication ekranında Email/Password ve Anonymous
   sign-in provider'larını aç.
2. Firebase Console'da Web App oluşturup config değerlerini
   `config.example.js` dosyasından `config.js` dosyasına kopyala.
3. Admin kullanıcısını Firebase Auth'ta oluştur.
4. Admin UID'siyle `adminUsers/{uid}` dokümanı oluştur. İçerik örneği:

```json
{
  "email": "admin@example.com",
  "role": "systemAdmin",
  "createdAt": "serverTimestamp"
}
```

Admin paneli Email/Password ile giriş yapar. İlk QR claim akışı Anonymous Auth
ile çalışır; kullanıcı daha sonra **webde `/giris`'ten** (veya mobil
uygulamada) aynı e-posta ile giriş yaptığında QR hesabına bağlanır.

## Rotalar

- `/`: herkese açık tanıtım sayfası.
- `/q/:qrId`: QR profil ekranı. Giriş yapmış ve onaylı sağlık personeli ise
  otomatik olarak `staffProfiles`, aksi halde `publicProfiles` okunur.
- `/giris`: QR sahipleri için giriş/kayıt — başarılı girişte sahiplenilen QR
  otomatik hesaba bağlanır.
- `/panelim`: kullanıcının QR'larını listeler; tek QR varsa doğrudan profil
  düzenleme ekranını açar. Sağlık profili ve alan bazlı görünürlük
  (`Gizli`/`Açık`/`Yarı görünür`/`Sağlık personeli`) buradan düzenlenir —
  aynı veri modelini (`profiles`, `visibilitySettings`, `publicProfiles`,
  `staffProfiles`) mobil uygulamayla paylaşır.
- `/personel`: sağlık çalışanı başvurusu ve giriş.
- `/admin`: sistem admin paneli.
