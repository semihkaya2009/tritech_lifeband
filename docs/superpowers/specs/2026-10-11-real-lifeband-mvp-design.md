# LifeBand Gerçek MVP Tasarımı

## Amaç

LifeBand artık demo QR gösterimi olmaktan çıkıp gerçek kullanıcı, gerçek QR, gerçek görünürlük ayarları ve Firebase tabanlı veri akışı olan bir MVP olacak. Sistem üç ana yüzeyden oluşur:

- Android mobil uygulama: kullanıcı profili, QR sahipliği ve görünürlük ayarları.
- Web QR ekranı: QR okutulunca herkesin veya sağlık personelinin görebileceği profil.
- Sistem admin paneli: QR oluşturma, sağlık çalışanı başvurusu ve sistem denetimi.

Backend Firebase Auth + Firestore olarak kalır. Web yayını Cloudflare Workers static assets üzerinde devam eder.

## Ana Roller

- Kullanıcı: LifeBand QR'ını sahiplenir, sağlık profilini doldurur, her alanın görünürlüğünü seçer.
- Sağlık çalışanı: başvuru yapar, sistem admin onayından sonra daha geniş profil bilgilerini görebilir.
- Sistem admin: yalnızca bizim ekipte olur; QR oluşturur, başvuruları onaylar, kayıtları denetler.
- Anonim ziyaretçi: QR linkini açınca sadece kullanıcının public veya maskeli yaptığı alanları görür.

Hastane admini bu MVP kapsamına alınmaz.

## QR Yaşam Döngüsü

1. Sistem admin `/admin` panelinden yeni QR oluşturur.
2. QR kaydı `unclaimed` durumunda Firestore'a yazılır.
3. Fiziksel QR üzerinde yalnızca güvenli URL bulunur:

```text
https://tritech-lifeband.semihkayaa2009.workers.dev/q/LB_randomToken
```

4. QR ilk kez okutulduğunda sahiplenme ekranı açılır.
5. Kullanıcı ad, soyad, e-posta, telefon ve opsiyonel TC bilgisini girer.
6. Kullanıcı e-posta ile mobil uygulamaya giriş yaptığında bu QR hesabına bağlı görünür.
7. Kullanıcı mobil uygulamadan profil bilgilerini ve görünürlük ayarlarını düzenler.
8. QR kaydı gerekirse admin veya kullanıcı tarafından `revoked` yapılıp yenilenebilir.

QR token tarih, TC, telefon, kullanıcı id veya sıralı sayaç içermez. Token rastgele üretilir ve tahmin edilemez olur.

## Giriş ve Sahiplenme

MVP için e-posta tabanlı akış kullanılır:

- Web sahiplenme formu kullanıcıdan e-posta alır.
- Mobil uygulama aynı e-posta ile giriş yapar.
- İlk aşamada Firebase Auth email/password veya email link kullanılabilir.
- Telefon doğrulama daha sonra Telegram/SMS doğrulama ile güçlendirilir.

Sahiplenme güvenliği için:

- Bir QR yalnızca `unclaimed` durumundayken sahiplenilebilir.
- Sahiplenmeden sonra `ownerUid` ve `ownerEmail` atanır.
- Aynı QR ikinci kez sahiplenilemez.
- Kullanıcı profilini düzenlemek için mobilde giriş yapmış olmalıdır.

## Görünürlük Modeli

Her profil alanının bağımsız görünürlük ayarı olur:

- `private`: sadece kullanıcı ve sistem admin görür.
- `public`: QR'ı açan herkes görür.
- `staff`: yalnızca onaylı sağlık çalışanı görür.
- `masked`: herkes maskeli veya kısmi biçimde görür, tam değer yalnızca kullanıcı/admin/onaylı personel için açılır.

Bu model alan bazlı çalışır. Örneğin kan grubu public, telefon masked, ilaçlar staff, TC private olabilir.

## Maskeli Alan Kuralları

Maskleme istemcide rastgele yapılmaz; veritabanına yazılırken veya güvenli okuma katmanında deterministik uygulanır.

Varsayılan maskeler:

- Ad soyad: `Mehmet Y.`
- TC: `12*******90`
- Telefon: `05** *** ** 34`
- E-posta: `m***@gmail.com`
- Doğum tarihi: sadece yıl
- Adres: sadece il/ilçe
- Hastalık bilgisi: kategori görünür, detay gizli

Kullanıcı mobil uygulamada şablon seçebilir:

- Minimal: yalnızca kan grubu, acil kişi, kritik alerji.
- Acil durum: kan grubu, alerji, kronik hastalık, ilaç, acil kişi.
- Sağlık personeli odaklı: public alan az, staff alan geniş.
- Özel: her alan tek tek seçilir.

## Firestore Koleksiyonları

```text
users/{uid}
  email
  phone
  role
  createdAt

qrCodes/{qrId}
  qrId
  tokenHash
  status: unclaimed | active | revoked
  ownerUid
  ownerEmail
  createdBy
  createdAt
  claimedAt
  revokedAt

profiles/{uid}
  firstName
  lastName
  nationalId
  phone
  email
  birthDate
  bloodType
  allergies
  chronicDiseases
  medications
  emergencyContact
  notes
  updatedAt

visibilitySettings/{uid}
  fields
    firstName: public | private | staff | masked
    nationalId: public | private | staff | masked
    phone: public | private | staff | masked
    bloodType: public | private | staff | masked
    allergies: public | private | staff | masked
    chronicDiseases: public | private | staff | masked
    medications: public | private | staff | masked
    emergencyContact: public | private | staff | masked
  template
  updatedAt

publicProfiles/{qrId}
  qrId
  ownerUid
  displayFields
  updatedAt

staffApplications/{applicationId}
  uid
  name
  title
  hospital
  phone
  email
  status: pending | approved | rejected
  createdAt
  reviewedAt

medicalStaff/{uid}
  status: approved | suspended
  applicationId
  title
  hospital
  approvedAt

accessLogs/{logId}
  qrId
  viewerUid
  mode: public | staff | admin
  createdAt
```

## Public Profil Üretimi

Web QR ekranı tam `profiles/{uid}` dokümanını doğrudan okumaz. Bunun yerine `publicProfiles/{qrId}` okunur.

`publicProfiles` içinde yalnızca kullanıcının görünür yaptığı veya maskelenmiş hale getirilmiş alanlar bulunur. Bu sayede Firestore Rules hatası veya frontend hatası olsa bile public ekranda tam hassas profil açılmaz.

İlk MVP'de `publicProfiles` mobil uygulama profil kaydederken güncellenebilir. Daha güvenli ikinci aşamada bu üretim Cloud Functions ile yapılır.

## Web Yüzeyi

`/` herkese açık LifeBand tanıtım/QR yönlendirme sayfası olur. Admin verisi göstermez.

`/q/:qrId` QR profil ekranıdır:

- QR `unclaimed` ise sahiplenme formu gösterir.
- QR `active` ise `publicProfiles/{qrId}` içeriğini gösterir.
- Kullanıcı onaylı sağlık çalışanı olarak giriş yapmışsa staff görünümü açılabilir.
- QR `revoked` ise pasif QR uyarısı gösterir.

`/admin` sistem admin panelidir:

- Cloudflare Access ile korunur.
- QR oluşturur.
- Sağlık çalışanı başvurularını onaylar/reddeder.
- QR durumlarını ve erişim loglarını gösterir.

## Mobil Uygulama Yüzeyi

Mobil tasarım web sitesiyle aynı sade sağlık paneli diline yaklaşır:

- Beyaz/açık zemin.
- Teal/yeşil ana renk.
- Net kartlar.
- Gereksiz dekorasyon yok.

Ekranlar:

- Giriş/kayıt.
- QR'larım.
- QR sahiplenme sonucunu görme.
- Sağlık profili düzenleme.
- Görünürlük ayarları.
- Şablon seçimi.
- Sağlık çalışanı başvurusu.

Mobil uygulamada kullanıcı aynı e-posta ile giriş yapınca `qrCodes.ownerEmail == email` veya `ownerUid == uid` üzerinden QR hesabına bağlanır.

## Firestore Güvenliği

Kuralların hedefi:

- Kullanıcı yalnızca kendi profilini düzenler.
- Public ekran yalnızca `publicProfiles` okur.
- QR oluşturma ve başvuru onayı sistem admin yetkisindedir.
- Onaylı sağlık çalışanı staff alanlarını okuyabilir.
- Admin rolü frontend şifresine bağlı olmaz; Firebase custom claim veya Cloudflare Access ile korunur.

Gerçek prod aşamasında sistem admin için Firebase custom claim `systemAdmin: true` kullanılır.

## MVP Sırası

1. Web `/` ve `/admin` ayrımı yapılır; admin panel public ana sayfadan kaldırılır.
2. Cloudflare Access ile `/admin*` korunur.
3. Firebase Web App config eklenir.
4. Firestore veri modeli ve güvenlik kuralları güncellenir.
5. Web admin gerçek Firestore QR oluşturur.
6. QR sahiplenme ekranı Firestore'a yazar.
7. Mobil e-posta giriş ve QR'larım ekranı eklenir.
8. Mobil profil ve görünürlük ayarları eklenir.
9. Public QR ekranı `publicProfiles` üzerinden gerçek veriyi gösterir.
10. Mobil ve web görsel dili aynı sade tasarıma yaklaştırılır.

## MVP Dışı Bırakılanlar

- Hastane admin paneli.
- Tam Telegram doğrulama.
- Yapay zeka ile profil güncelleme.
- Doktorun QR okutup doğrudan tıbbi bilgi değiştirmesi.
- Aile hekimi özel yetki modeli.

Bu başlıklar sonraki faza bırakılır; veri modeli bu fazları destekleyecek şekilde genişleyebilir.

## Başarı Kriterleri

- Admin paneline herkes giremez.
- Admin gerçek QR oluşturabilir.
- Kullanıcı QR'ı sahiplenebilir.
- Mobil uygulamada aynı kullanıcıya QR düşer.
- Kullanıcı sağlık bilgisini ve alan görünürlüğünü ayarlayabilir.
- QR linki public/masked/staff kurallarına göre farklı veri gösterir.
- Hassas tam profil anonim QR ekranında asla doğrudan okunmaz.
