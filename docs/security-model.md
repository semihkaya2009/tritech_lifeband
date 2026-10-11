# LifeBand güvenlik modeli

## QR id üretimi

QR id tarih veya kullanıcı id üzerinden üretilmez. Güvenli yaklaşım:

- `LB_` prefix
- 18 bayt veya daha fazla kriptografik rastgele veri
- Base64URL benzeri URL-safe çıktı
- Firestore'da token hash'i ve durum bilgisi

Örnek:

```text
https://tritech-lifeband.pages.dev/q/LB_8xP9mQ7aT2rV6kZpN4sD0A
```

`createdAt` sadece admin panelde sıralama ve denetim için tutulur, token üretim
malzemesi olarak kullanılmaz.

## Roller

- Normal kullanıcı: kendi profilini ve QR kayıtlarını yönetir.
- Sağlık çalışanı: başvuru yapar, sistem admin onayı sonrası geniş bilgi görür.
- Sistem admin: yalnızca bizim panelimizde olur; sağlık çalışanı başvurularını,
  QR kayıtlarını ve denetim kayıtlarını yönetir.
- Sistem admin yetkisi `systemAdmin: true` custom claim veya `adminUsers/{uid}`
  belgesi ile verilir. İlk admin için custom claim gerekir; sonraki admin
  kayıtları panelden/CLI'dan eklenebilir.

Hastane admini bu MVP kapsamına alınmadı.

## Koleksiyonlar

- `profiles`: kullanıcının gerçek sağlık profili.
- `visibilitySettings`: kullanıcının alan bazlı görünürlük tercihleri.
- `publicProfiles`: QR okutulduğunda herkese açılabilecek güvenli alanlar.
- `qrCodes`: QR id, `ownerUid`, `status`, token hash ve denetim tarihleri.
- `staffApplications`: sağlık çalışanı başvuruları.
- `medicalStaff`: onaylı sağlık çalışanı kayıtları.
- `accessLogs`: QR erişim kayıtları.
- `adminUsers`: sistem admin UID kayıtları.

## QR yaşam döngüsü

QR durumu dört aşamalıdır:

- `unclaimed`: Sistem admini QR üretir. Bu aşamada `ownerUid`, `claimEmail`,
  `claimPhone` ve `claimedAt` bulunmaz.
- `claimed`: QR ilk okutulduğunda kullanıcı telefon, mail ve başvuru bilgilerini
  girer. Bu kayıt sadece `status`, `claimEmail`, `claimPhone` ve `claimedAt`
  alanlarını değiştirebilir.
- `active`: Kullanıcı aynı mail adresiyle Firebase Auth üzerinden giriş yapınca
  QR `ownerUid` ile hesabına bağlanır.
- `revoked`: QR yalnızca sahibi veya sistem admini tarafından iptal edilir.

`claimEmail` küçük harfe normalize edilmelidir; mobil uygulama email girişini
bu alanla aynı formatta saklamalıdır.

## Erişim ilkesi

Herkese açık QR ekranı sadece `publicProfiles` içindeki seçilmiş alanları okur.
Tam sağlık profili için Firebase Auth ve onaylı sağlık çalışanı rolü gerekir.
Admin işlemleri için `systemAdmin: true` custom claim zorunlu olmalıdır.
`profiles` ve `visibilitySettings` belgelerini yalnızca kullanıcı sahibi veya
sistem admini okuyup yazabilir. `publicProfiles` herkese okunur, ancak sadece
ilgili QR sahibi veya sistem admini tarafından yazılır.
