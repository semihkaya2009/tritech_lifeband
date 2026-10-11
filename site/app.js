import { compileDisplayFields } from "./visibility.js";

const DEMO_QR_ID = "LB_DEMO_20261011";
const STORAGE_KEY = "lifeband.admin.demo.v1";
const DEFAULT_ORIGIN = "https://tritech-lifeband.semihkayaa2009.workers.dev";

const demoProfile = {
  qrId: DEMO_QR_ID,
  fields: {
    fullName: "Mehmet Yilmaz",
    nationalId: "12345678901",
    phone: "0532 000 00 00",
    email: "mehmet.yilmaz@example.com",
    bloodType: "A Rh+",
    emergencyContact: "Ayse Yilmaz - 0532 000 00 00",
    allergies: "Penisilin, ari sokmasi",
    chronicConditions: "Diyabet Tip 1",
    medications: "Insulin kalemi",
    criticalNotes:
      "Penisilin verilmemeli. Bilinc kapaliysa seker dusmesi kontrol edilmeli.",
    lastUpdated: "11.10.2026 - doktor mobil uygulama uzerinden guncelledi"
  },
  visibility: {
    fullName: "masked",
    nationalId: "masked",
    phone: "private",
    email: "private",
    bloodType: "public",
    emergencyContact: "masked",
    allergies: "public",
    chronicConditions: "staff",
    medications: "staff",
    criticalNotes: "staff",
    lastUpdated: "staff"
  }
};

const defaultState = {
  qrCodes: [
    {
      qrId: DEMO_QR_ID,
      tokenHash:
        "demo-hash-7a0474a5cbb5c23a65d7b8e5b4c8d9d7a1a0e6f1f0d4c3b2a190817263544332",
      owner: "Mehmet Yilmaz",
      ownerUserId: "demo-user",
      createdAt: "2026-10-11T09:00:00.000Z",
      status: "active",
      scanCount: 0,
      publicFields: ["bloodType", "emergencyContact", "allergies"],
      url: `${DEFAULT_ORIGIN}/q/${DEMO_QR_ID}`
    }
  ],
  staffApplications: [
    {
      id: "APP-1001",
      name: "Dr. Elif Demir",
      title: "Acil Tip Uzmani",
      hospital: "TriTech Egitim Hastanesi",
      phone: "0555 010 10 10",
      status: "pending",
      createdAt: "2026-10-11T08:20:00.000Z"
    },
    {
      id: "APP-1002",
      name: "Hemsire Can Kaya",
      title: "Acil Servis Hemsire",
      hospital: "Merkez Devlet Hastanesi",
      phone: "0555 020 20 20",
      status: "approved",
      createdAt: "2026-10-10T15:00:00.000Z"
    }
  ],
  accessLogs: [
    {
      id: "LOG-1",
      qrId: DEMO_QR_ID,
      mode: "public",
      createdAt: "2026-10-11T09:12:00.000Z"
    }
  ]
};

let firebaseReady = false;
let firestoreDb = null;

const app = document.querySelector("#app");

bootstrap();

async function bootstrap() {
  await initFirebase();
  render();
  window.addEventListener("popstate", render);
}

async function initFirebase() {
  const config = window.LIFEBAND_FIREBASE_CONFIG;
  if (!config || !config.projectId || !config.appId || config.appId.includes("FIREBASE_")) {
    return;
  }

  try {
    const [{ initializeApp }, { getFirestore }] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js")
    ]);
    firestoreDb = getFirestore(initializeApp(config));
    firebaseReady = true;
  } catch (error) {
    console.warn("Firebase web init failed, demo mode continues.", error);
  }
}

function render() {
  const route = getRoute();
  if (route.type === "qr") {
    renderQrProfile(route.qrId);
    return;
  }
  if (route.type === "admin") {
    renderAdmin();
    return;
  }
  renderLanding();
}

function getRoute() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] === "q" && segments[1]) {
    return { type: "qr", qrId: segments[1] };
  }
  if (segments[0] === "admin") return { type: "admin" };
  return { type: "home" };
}

function renderLanding() {
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">LB</div>
          <div>
            <p class="brand-title">LifeBand</p>
            <p class="brand-subtitle">Acil durumda kontrollü sağlık bilgisi</p>
          </div>
        </div>
        <nav class="top-actions" aria-label="Ana menü">
          <a class="button secondary" href="/q/${DEMO_QR_ID}">Örnek QR</a>
          <a class="button" href="/admin">Admin</a>
        </nav>
      </header>

      <main class="main">
        <section class="hero">
          <div class="hero-panel">
            <p class="eyebrow">LifeBand QR sistemi</p>
            <h1>Hasta bilgisini QR ile güvenli ve kontrollü paylaş.</h1>
            <p class="lead">
              Kullanıcı hangi alanların açık, gizli, yarı görünür veya yalnızca sağlık personeline açık olacağını uygulamadan belirler. QR okunduğunda aynı bağlantı webde açılır, uygulama yüklüyse mobil akışa taşınır.
            </p>
            <div class="hero-actions">
              <a class="button" href="/q/${DEMO_QR_ID}">Örnek QR profilini aç</a>
              <a class="button secondary" href="/admin">Admin paneline geç</a>
            </div>
            <div class="kpi-grid">
              <div class="kpi"><strong>4</strong><span>görünürlük seviyesi</span></div>
              <div class="kpi"><strong>90 gün</strong><span>Telegram doğrulama periyodu</span></div>
              <div class="kpi"><strong>6 ay</strong><span>sağlık çalışanı yeniden onayı</span></div>
            </div>
          </div>

          <aside class="card qr-preview" aria-label="QR akış özeti">
            <div class="card-header">
              <div>
                <h2>QR erişim modeli</h2>
                <p class="muted small">Aynı QR farklı yetkilere göre farklı alan gösterir.</p>
              </div>
              <span class="badge ok">MVP</span>
            </div>
            <dl class="info-list compact">
              <div class="info-item"><dt>Normal kullanıcı</dt><dd>Açık ve yarı görünür alanlar</dd></div>
              <div class="info-item"><dt>Onaylı personel</dt><dd>Kullanıcının izin verdiği sağlık alanları</dd></div>
              <div class="info-item"><dt>Sistem admini</dt><dd>QR oluşturma, iptal ve başvuru onayı</dd></div>
            </dl>
          </aside>
        </section>
      </main>
    </div>
  `;
  document.title = "LifeBand";
}

function renderAdmin() {
  const state = loadState();
  const pendingCount = state.staffApplications.filter((x) => x.status === "pending").length;
  const activeQrCount = state.qrCodes.filter((x) => x.status === "active").length;
  const latestQr = state.qrCodes[0] || defaultState.qrCodes[0];
  const demoUrl = publicUrl(latestQr.qrId);

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">LB</div>
          <div>
            <p class="brand-title">LifeBand Sistem Admin</p>
            <p class="brand-subtitle">QR, onay ve acil profil kontrol merkezi</p>
          </div>
        </div>
        <nav class="top-actions" aria-label="Ana menü">
          <a class="button secondary" href="/">Ana sayfa</a>
          <a class="button secondary" href="/q/${DEMO_QR_ID}">Demo QR</a>
          <a class="button" href="/admin">Admin</a>
        </nav>
      </header>

      <main class="main">
        <section class="hero">
          <div class="hero-panel">
            <p class="eyebrow">Cloudflare Pages + Firebase</p>
            <h1>Güvenli QR ile acil sağlık profili</h1>
            <p class="lead">
              Normal kullanıcı yalnızca izin verilen bilgileri görür. Onaylı sağlık çalışanı daha geniş sağlık bilgisine erişir. Sistem admini başvuruları ve QR kayıtlarını yönetir.
            </p>
            <div class="hero-actions">
              <button class="button" id="generateQr">Yeni QR oluştur</button>
              <a class="button secondary" href="/q/${latestQr.qrId}">Son QR profili</a>
            </div>
            <div class="kpi-grid">
              <div class="kpi"><strong>${activeQrCount}</strong><span>aktif QR</span></div>
              <div class="kpi"><strong>${pendingCount}</strong><span>bekleyen sağlık çalışanı</span></div>
              <div class="kpi"><strong>${state.accessLogs.length}</strong><span>erişim kaydı</span></div>
            </div>
          </div>

          <aside class="card qr-preview" aria-label="QR önizleme">
            <div>
              <div class="card-header">
                <div>
                  <h2>Yazdırılabilir QR</h2>
                  <p class="muted small">Token rastgele üretilir, tarih veya kullanıcı id içermez.</p>
                </div>
                <span class="badge ${firebaseReady ? "ok" : "warn"}">${firebaseReady ? "Firebase hazır" : "Demo mod"}</span>
              </div>
              <div class="qr-box" id="qrCanvas" data-url="${escapeAttr(demoUrl)}"></div>
            </div>
            <div class="qr-link" id="qrUrl">${escapeHtml(demoUrl)}</div>
            <div class="top-actions">
              <button class="button secondary" id="copyQr">Linki kopyala</button>
              <button class="button ghost" id="printQr">Yazdır</button>
            </div>
          </aside>
        </section>

        <section class="grid">
          <div class="stack">
            ${renderQrManager(state)}
            ${renderStaffApplications(state)}
          </div>
          <aside class="stack">
            ${renderCreateQrForm()}
            ${renderAccessLogs(state)}
          </aside>
        </section>
      </main>
    </div>
  `;

  drawQr(demoUrl);
  bindAdminEvents();
  document.title = "LifeBand Admin Panel";
}

function renderQrManager(state) {
  const rows = state.qrCodes
    .map(
      (qr) => `
      <tr>
        <td><strong>${escapeHtml(qr.qrId)}</strong><br><span class="muted small">${escapeHtml(qr.owner)}</span></td>
        <td>${formatDate(qr.createdAt)}</td>
        <td><span class="badge ${qr.status === "active" ? "ok" : "danger"}">${qr.status === "active" ? "Aktif" : "Pasif"}</span></td>
        <td>${qr.scanCount || 0}</td>
        <td class="actions-cell">
          <a class="icon-button" title="Profili aç" href="/q/${encodeURIComponent(qr.qrId)}">↗</a>
          <button class="icon-button danger" title="QR iptal et" data-action="revoke-qr" data-id="${escapeAttr(qr.qrId)}">×</button>
        </td>
      </tr>`
    )
    .join("");

  return `
    <section class="card">
      <div class="card-header">
        <div>
          <h2>QR kayıtları</h2>
          <p class="muted small">Sızan veya eskiyen QR admin panelden pasif yapılır.</p>
        </div>
        <span class="badge">Sistem admin</span>
      </div>
      <table class="table">
        <thead><tr><th>QR</th><th>Oluşturma</th><th>Durum</th><th>Okutma</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderStaffApplications(state) {
  const rows = state.staffApplications
    .map(
      (item) => `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong><br><span class="muted small">${escapeHtml(item.title)}</span></td>
        <td>${escapeHtml(item.hospital)}<br><span class="muted small">${escapeHtml(item.phone)}</span></td>
        <td><span class="badge ${item.status === "approved" ? "ok" : item.status === "rejected" ? "danger" : "warn"}">${statusLabel(item.status)}</span></td>
        <td class="actions-cell">
          <button class="icon-button ok" title="Onayla" data-action="staff-status" data-status="approved" data-id="${escapeAttr(item.id)}">✓</button>
          <button class="icon-button danger" title="Reddet" data-action="staff-status" data-status="rejected" data-id="${escapeAttr(item.id)}">×</button>
        </td>
      </tr>`
    )
    .join("");

  return `
    <section class="card">
      <div class="card-header">
        <div>
          <h2>Sağlık çalışanı başvuruları</h2>
          <p class="muted small">Onay yetkisi yalnızca bizim sistem admininde kalır.</p>
        </div>
      </div>
      <table class="table">
        <thead><tr><th>Kişi</th><th>Kurum</th><th>Durum</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderCreateQrForm() {
  return `
    <section class="card">
      <div class="card-header">
        <div>
          <h2>QR oluştur</h2>
          <p class="muted small">Demo verisi local tutulur; Firebase config eklenince kayıt Firestore'a taşınır.</p>
        </div>
      </div>
      <form id="qrForm" class="form-grid">
        <div class="field full">
          <label for="owner">Kullanıcı adı</label>
          <input id="owner" name="owner" value="Mehmet Yilmaz" required />
        </div>
        <div class="field">
          <label for="blood">Kan grubu</label>
          <input id="blood" name="blood" value="A Rh+" />
        </div>
        <div class="field">
          <label for="allergy">Alerji</label>
          <input id="allergy" name="allergy" value="Penisilin" />
        </div>
        <div class="field full">
          <label>Herkese açık alanlar</label>
          <div class="checkbox-row">
            <label class="check"><input type="checkbox" name="fields" value="Kan Grubu" checked /> Kan grubu</label>
            <label class="check"><input type="checkbox" name="fields" value="Alerjiler" checked /> Alerji</label>
            <label class="check"><input type="checkbox" name="fields" value="Acil Durum Yakini" checked /> Acil kişi</label>
          </div>
        </div>
        <button class="button field full" type="submit">Güvenli QR üret</button>
      </form>
    </section>
  `;
}

function renderAccessLogs(state) {
  const logs = [...state.accessLogs]
    .slice(-6)
    .reverse()
    .map(
      (log) => `
      <tr>
        <td>${escapeHtml(log.qrId)}</td>
        <td><span class="badge ${log.mode === "staff" ? "ok" : ""}">${log.mode === "staff" ? "Personel" : "Public"}</span></td>
        <td>${formatDate(log.createdAt)}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="card">
      <div class="card-header">
        <div>
          <h2>Erişim kayıtları</h2>
          <p class="muted small">QR okutma ve görünüm tipi loglanır.</p>
        </div>
      </div>
      <table class="table">
        <thead><tr><th>QR</th><th>Tip</th><th>Zaman</th></tr></thead>
        <tbody>${logs}</tbody>
      </table>
    </section>
  `;
}

function renderQrProfile(qrId) {
  const state = loadState();
  const record = state.qrCodes.find((x) => x.qrId === qrId);
  const isDemo = qrId === DEMO_QR_ID || record;
  const staffMode = new URLSearchParams(window.location.search).get("staff") === "1";
  if (isDemo) {
    addAccessLog(qrId, staffMode ? "staff" : "public");
  }

  const displayFields = compileDisplayFields(
    demoProfile.fields,
    demoProfile.visibility,
    staffMode ? "staff" : "public"
  );

  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand QR</p>
          <h1 class="profile-title">${isDemo ? "Acil Sağlık Profili" : "QR bulunamadı"}</h1>
        </div>
        <a class="button secondary" href="/admin">Admin</a>
      </div>

      ${
        isDemo
          ? `
        <section class="card stack">
          <div class="card-header">
            <div>
              <h2>${escapeHtml(displayName(displayFields, demoProfile.fields))}</h2>
              <p class="muted small">QR: ${escapeHtml(qrId)}</p>
            </div>
            <span class="badge ${staffMode ? "ok" : "warn"}">${staffMode ? "Sağlık personeli görünümü" : "Public görünüm"}</span>
          </div>
          <div class="alert">
            Acil durumda bu bilgiler hastanın belirlediği görünürlük ayarlarına göre gösterilir.
          </div>
          <dl class="info-list">
            ${renderInfoItems(displayFields)}
          </dl>
          <div class="hero-actions">
            <a class="button" href="/q/${encodeURIComponent(qrId)}?staff=1">Sağlık personeli görünümü</a>
            <a class="button secondary" href="/q/${encodeURIComponent(qrId)}">Public görünüm</a>
          </div>
          <p class="footer-note">
            Gerçek sistemde sağlık personeli görünümü Firebase Auth ve admin onayı ile açılır. Bu ekran toplantı demosu için aynı akışı görünür hale getirir.
          </p>
        </section>`
          : `
        <section class="card stack">
          <p class="alert">Bu QR aktif değil veya sistem admini tarafından iptal edilmiş.</p>
          <a class="button" href="/admin">Panele dön</a>
        </section>`
      }
    </main>
  `;
}

function bindAdminEvents() {
  document.querySelector("#generateQr")?.addEventListener("click", () => {
    document.querySelector("#qrForm")?.requestSubmit();
  });

  document.querySelector("#copyQr")?.addEventListener("click", async () => {
    const text = document.querySelector("#qrUrl")?.textContent?.trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast("QR linki kopyalandı.");
  });

  document.querySelector("#printQr")?.addEventListener("click", () => window.print());

  document.querySelector("#qrForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const qrId = `LB_${secureToken(18)}`;
    const tokenHash = await sha256Hex(qrId);
    const selectedFields = form.getAll("fields");
    const state = loadState();

    state.qrCodes.unshift({
      qrId,
      tokenHash,
      owner: String(form.get("owner") || "Yeni Kullanıcı"),
      ownerUserId: "demo-user",
      createdAt: new Date().toISOString(),
      status: "active",
      scanCount: 0,
      publicFields: selectedFields,
      url: publicUrl(qrId)
    });

    saveState(state);
    toast("Güvenli QR oluşturuldu.");
    render();
  });

  document.querySelectorAll("[data-action='revoke-qr']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id");
      const state = loadState();
      const qr = state.qrCodes.find((x) => x.qrId === id);
      if (qr) qr.status = "revoked";
      saveState(state);
      toast("QR pasif yapıldı.");
      render();
    });
  });

  document.querySelectorAll("[data-action='staff-status']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-id");
      const status = button.getAttribute("data-status");
      const state = loadState();
      const application = state.staffApplications.find((x) => x.id === id);
      if (application && status) application.status = status;
      saveState(state);
      toast(status === "approved" ? "Başvuru onaylandı." : "Başvuru reddedildi.");
      render();
    });
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addAccessLog(qrId, mode) {
  const state = loadState();
  const active = state.qrCodes.find((x) => x.qrId === qrId);
  if (active && active.status === "revoked") return;
  if (active) active.scanCount = (active.scanCount || 0) + 1;
  state.accessLogs.push({
    id: `LOG-${Date.now()}`,
    qrId,
    mode,
    createdAt: new Date().toISOString()
  });
  saveState(state);
}

function publicUrl(qrId) {
  const origin = window.location.origin.startsWith("http")
    ? window.location.origin
    : DEFAULT_ORIGIN;
  return `${origin}/q/${encodeURIComponent(qrId)}`;
}

function secureToken(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function drawQr(url) {
  const box = document.querySelector("#qrCanvas");
  if (!box) return;
  box.innerHTML = "";
  if (!window.QRCode) {
    box.textContent = "QR kütüphanesi yüklenemedi.";
    return;
  }
  window.QRCode.toCanvas(url, { width: 210, margin: 1 }, (error, canvas) => {
    if (error) {
      box.textContent = "QR oluşturulamadı.";
      return;
    }
    box.appendChild(canvas);
  });
}

function renderInfoItems(fields) {
  return Object.entries(fields)
    .map(
      ([key, value]) => `
      <div class="info-item">
        <dt>${escapeHtml(key)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>`
    )
    .join("");
}

function displayName(displayFields, fallbackFields) {
  return displayFields.fullName || fallbackFields.fullName || "LifeBand kullanıcısı";
}

function statusLabel(status) {
  if (status === "approved") return "Onaylı";
  if (status === "rejected") return "Reddedildi";
  return "Bekliyor";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function toast(message) {
  const current = document.querySelector(".toast");
  current?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  document.body.appendChild(element);
  window.setTimeout(() => element.remove(), 2200);
}
