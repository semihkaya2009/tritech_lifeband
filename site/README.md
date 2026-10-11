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
ile çalışır; kullanıcı daha sonra mobil uygulamada aynı e-posta ile giriş
yaptığında QR hesabına bağlanır.
