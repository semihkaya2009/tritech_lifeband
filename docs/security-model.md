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

Hastane admini bu MVP kapsamına alınmadı.

## Koleksiyonlar

- `profiles`: kullanıcının gerçek sağlık profili.
- `publicProfiles`: QR okutulduğunda herkese açılabilecek güvenli alanlar.
- `qrCodes`: QR id, owner, status, hash ve sayaç bilgileri.
- `staffApplications`: sağlık çalışanı başvuruları.
- `medicalStaff`: onaylı sağlık çalışanı kayıtları.
- `accessLogs`: QR erişim kayıtları.

## Erişim ilkesi

Herkese açık QR ekranı sadece `publicProfiles` içindeki seçilmiş alanları okur.
Tam sağlık profili için Firebase Auth ve onaylı sağlık çalışanı rolü gerekir.
Admin işlemleri için `systemAdmin: true` custom claim zorunlu olmalıdır.
