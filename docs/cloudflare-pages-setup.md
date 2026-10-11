# Cloudflare Pages kurulum notu

## Önerilen yayın mimarisi

- Mobil uygulama: Android APK
- Backend: Firebase Auth + Firestore
- Web/admin: Cloudflare Workers static assets veya Cloudflare Pages
- QR formatı: `https://tritech-lifeband.semihkayaa2009.workers.dev/q/LB_randomToken`

QR token içinde TC, telefon, kullanıcı id veya tarih bulunmaz. Token tarayıcıda
`crypto.getRandomValues` ile üretilen rastgele URL-safe değerdir.

## Senin yapacağın adımlar

1. GitHub'da boş bir repo aç.
2. Bu projeyi o repoya push et.
3. Cloudflare hesabına gir.
4. `Workers & Pages > Pages > Connect to Git` seç.
5. GitHub reposunu bağla.
6. Build command alanını boş bırak.
7. Build output directory alanına `site` yaz.
8. Production branch olarak `main` seç.
9. Deploy sonrası çıkan `*.workers.dev` veya `*.pages.dev` adresini QR alan adı olarak kullan.

## Firebase Web App ekleme

1. Firebase Console'da `tritech-lifeband` projesini aç.
2. Project settings ekranında Web App ekle.
3. Firebase'in verdiği web config değerlerini kopyala.
4. `site/config.js` dosyasını `site/config.example.js` içindeki formatla doldur.
5. `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`,
   `appId` alanlarını doldur.

Firebase config public olabilir; güvenlik Firestore Rules ve Firebase Auth
üzerinden sağlanır.

## Firestore kuralları

Bu repoda `firestore.rules` dosyası eklendi. Firebase CLI kurulu ve giriş
yapılmışsa kuralları şu şekilde yayınlayabilirsin:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Gerçek admin onayı için daha sonra sistem admin kullanıcılarına Firebase custom
claim olarak `systemAdmin: true` verilmeli.
