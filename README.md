# TriTech Lifeband

TriTech Lifeband, Flutter ile geliştirilmiş bir cihaz yönetimi ve sağlık verisi takip uygulamasıdır. Kullanıcı QR kod ile Lifeband cihazını hesabına ekler, kendisine yetkilendirilmiş cihazları listeler, cihaz detayındaki sağlık bilgilerini görüntüler ve düzenleyebilir.

Uygulama Firebase tabanlıdır. Firebase Auth anonim kullanıcı kimliği sağlar; Cloud Firestore ise cihaz, token ve sağlık verilerini saklar.

## Teknoloji Yığını

- Flutter / Dart
- Provider ile state management
- Firebase Core
- Firebase Auth
- Cloud Firestore
- mobile_scanner ile QR kod okuma
- google_fonts
- flutter_staggered_animations
- glassmorphism / cam efektli özel UI bileşenleri

## Proje Yapısı

```text
lib/
  main.dart
  firebase_options.dart
  src/
    app_theme.dart
    models/
      device.dart
    providers/
      device_provider.dart
    screens/
      home_screen.dart
      qr_scan_screen.dart
      device_detail_screen.dart
      device_edit_screen.dart
      scan_screen.dart
    services/
      auth_service.dart
      firestore_service.dart
    widgets/
      animated_background.dart
      device_tile.dart
      frosted_container.dart
      glass_app_bar.dart
      glass_card.dart
      staggered_item.dart
```

## Uygulama Nasıl Çalışır?

Uygulama açıldığında `main.dart` içinde önce Firebase başlatılır. Ardından anonim Firebase Auth oturumu açılır. Bu anonim kullanıcının `uid` değeri, hangi cihazlara erişebileceğini belirlemek için kullanılır.

Servisler ve state yönetimi `Provider` üzerinden uygulamaya verilir:

- `FirestoreService`: Firestore okuma/yazma işlemleri
- `AuthService`: Firebase Auth işlemleri
- `DeviceProvider`: cihaz listesini ve sağlık verilerini yöneten state katmanı

Ana akış şöyledir:

1. Kullanıcı uygulamayı açar.
2. Firebase initialize edilir ve anonim oturum açılır.
3. `DeviceProvider`, aktif kullanıcının yetkili cihaz ID listesini dinler.
4. Yetkili cihaz ID'leri Firestore'daki `devices` koleksiyonundan çekilir.
5. Cihazlar ana ekranda listelenir.
6. Kullanıcı QR kod okutarak yeni cihazı kendisine yetkilendirebilir.
7. Kullanıcı cihaz detayından sağlık bilgilerini görüntüleyebilir veya düzenleyebilir.

## Firestore Veri Modeli

Uygulama iki ana Firestore veri alanı kullanır.

### Cihazlar

```text
devices/{deviceId}
  id: string
  name: string
  token: string
  healthData: map
```

Örnek:

```json
{
  "id": "dev-001",
  "name": "TriTech Pro Max",
  "token": "1234567890",
  "healthData": {
    "Kan Grubu": "A+",
    "Alerjiler": "Penisilin",
    "Kalp Atış Hızı": "72 bpm"
  }
}
```

### Kullanıcıya Yetkili Cihazlar

```text
users/{uid}/authorizedDevices/{deviceId}
  enrolledAt: timestamp
  token: string
```

Bu yapı sayesinde cihaz dokümanı global kalır, fakat her kullanıcı yalnızca kendi `authorizedDevices` listesinde bulunan cihazları görür.

## QR ile Cihaz Ekleme

QR tarama ekranı `qr_scan_screen.dart` içindedir. QR koddan okunan değer 10 haneli numeric token olarak beklenir.

Akış:

1. Kamera QR kodu okur.
2. QR içeriği trim edilir.
3. Değer `^\d{10}$` formatına göre kontrol edilir.
4. Token Firestore'daki `devices` koleksiyonunda aranır.
5. Eşleşen cihaz bulunursa kullanıcının `authorizedDevices` alt koleksiyonuna eklenir.
6. Ana ekran cihaz listesini otomatik günceller.

İlgili servis metodu:

```dart
Future<bool> enrollTokenForUser(String uid, String token)
```

## Ana Ekranlar

### HomeScreen

`home_screen.dart`, uygulamanın ana ekranıdır. Kayıtlı cihazları, cihaz sayısını ve genel durum bilgisini gösterir. Kullanıcı bu ekrandan QR tarama ekranına gidebilir veya cihaz detayına geçebilir.

Cihaz kartı sola kaydırıldığında cihaz, kullanıcının yetkili cihaz listesinden kaldırılır. Bu işlem cihaz dokümanını tamamen silmez.

### QrScanScreen

`qr_scan_screen.dart`, `mobile_scanner` paketiyle QR kod okur. Geçerli token bulunduğunda cihazı aktif anonim kullanıcıya yetkilendirir.

### DeviceDetailScreen

`device_detail_screen.dart`, seçili cihazın adını, ID bilgisini ve `healthData` içindeki sağlık bilgilerini listeler. Kullanıcı sağlık bilgilerini tek tek silebilir.

### DeviceEditScreen

`device_edit_screen.dart`, cihaz adını ve sağlık bilgilerini düzenlemek için kullanılır. Sağlık bilgileri anahtar/değer satırları olarak tutulur. Kaydetme sırasında cihazın mevcut token değeri korunur.

## Model ve Servisler

### Device Modeli

`device.dart`, uygulamadaki cihaz modelini tanımlar.

Alanlar:

- `id`: cihaz kimliği
- `name`: cihaz adı
- `healthData`: sağlık verileri
- `token`: QR/enrollment için opsiyonel cihaz token'ı

Model, Firestore dönüşümü için `toMap()` ve `fromMap()` metodlarına sahiptir.

### AuthService

`auth_service.dart`, Firebase Auth işlemlerini sarmalar.

Başlıca görevleri:

- Anonim giriş yapmak
- Aktif kullanıcıyı döndürmek
- Auth state değişikliklerini dinlemek
- Çıkış yapmak

### FirestoreService

`firestore_service.dart`, Firestore erişim katmanıdır.

Başlıca görevleri:

- Cihaz oluşturmak veya güncellemek
- Token ile cihaz bulmak
- Kullanıcıya cihaz yetkisi vermek
- Kullanıcıdan cihaz yetkisini kaldırmak
- Cihaz ID listesine göre cihazları çekmek
- Sağlık verisi alanlarını güncellemek veya silmek

### DeviceProvider

`device_provider.dart`, cihaz listesini yönetir. Firebase Auth state değişikliklerini dinler, aktif kullanıcının `authorizedDevices` koleksiyonunu takip eder ve cihaz listesini Firestore verisiyle günceller.

Firestore servisleri verilmezse demo cihazlar ile çalışabilecek şekilde fallback veri içerir.

## UI ve Tema

Uygulama açık gri/mavi renk paleti, cam efektli kartlar ve yumuşak animasyonlar kullanır.

Öne çıkan bileşenler:

- `AppTheme`: renkler, fontlar ve Material tema ayarları
- `AnimatedBackground`: hareketli arka plan
- `FrostedContainer`: blur efektli yarı saydam container
- `GlassAppBar`: cam efektli app bar
- `DeviceTile`: cihaz liste kartı
- `GlassCard`: genel amaçlı cam efektli kart

## Platform Desteği

Firebase seçenekleri şu anda Android ve iOS için tanımlıdır.

Desteklenen Firebase hedefleri:

- Android
- iOS

`firebase_options.dart` içinde web, macOS, Windows ve Linux için Firebase konfigürasyonu bulunmadığından bu platformlarda uygulama Firebase başlatma sırasında `UnsupportedError` fırlatır.

## Çalıştırma

Bağımlılıkları yüklemek için:

```bash
flutter pub get
```

Android veya iOS cihaz/simülatörde çalıştırmak için:

```bash
flutter run
```

Kod analizini çalıştırmak için:

```bash
flutter analyze
```

Son kontrol sonucunda analiz çıktısı:

```text
No issues found!
```

## Mevcut Durum ve Dikkat Edilmesi Gerekenler

- Proje Android/iOS odaklıdır; diğer platformlar için Firebase yapılandırması eksiktir.
- `test/widget_test.dart` hâlâ Flutter'ın varsayılan counter testidir ve mevcut uygulama davranışını temsil etmez.
- `DeviceProvider.dispose()` içinde `authSub` ve `_authorizedIdsSub` abonelikleri de iptal edilmelidir.
- `_fireSub` tanımlı fakat aktif veri akışında kullanılmıyor.
- `deleteHealthEntry()` serviste var, ancak UI sağlık verisi silerken tüm `healthData` map'ini yeniden yazar.
- Firestore security rules bu proje için kritiktir; sağlık verileri hassas veri kabul edilmelidir.
- Release Android build hâlâ debug signing config kullanıyor; yayın öncesi üretim imzalama ayarlanmalıdır.

## Güvenlik Notu

Bu uygulama sağlık verisi tuttuğu için Firestore erişim kuralları dikkatli tasarlanmalıdır. Kullanıcı yalnızca kendi `users/{uid}/authorizedDevices` listesinde bulunan cihazları görebilmeli ve düzenleme yetkileri ayrıca sınırlandırılmalıdır.

