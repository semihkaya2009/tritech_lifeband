import { compileDisplayFields } from "./visibility.js";

const DEMO_QR_ID = "LB_DEMO_20261011";
const STORAGE_KEY = "lifeband.admin.demo.v1";
const DEFAULT_ORIGIN = "https://tritech-lifeband.semihkayaa2009.workers.dev";

const FIELD_LABELS = {
  fullName: "Ad Soyad",
  firstName: "Ad",
  lastName: "Soyad",
  nationalId: "T.C. Kimlik",
  phone: "Telefon",
  email: "E-posta",
  bloodType: "Kan Grubu",
  emergencyContact: "Acil Durum Yakını",
  allergies: "Alerjiler",
  chronicConditions: "Kronik Rahatsızlık",
  medications: "Kullandığı İlaçlar",
  criticalNotes: "Kritik Not",
  lastUpdated: "Son Güncelleme"
};

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
      ownerUid: "demo-user",
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
let firebaseAuth = null;
let currentUser = null;
let authReady = false;

const firebaseAuthApi = {};
const firestoreApi = {};
const app = document.querySelector("#app");

bootstrap();

async function bootstrap() {
  await initFirebase();
  await render();
  window.addEventListener("popstate", () => {
    void render();
  });
}

async function initFirebase() {
  const config = window.LIFEBAND_FIREBASE_CONFIG;
  if (!config || !config.projectId || !config.appId || config.appId.includes("FIREBASE_")) {
    authReady = true;
    return;
  }

  try {
    const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js")
    ]);

    const firebaseApp = initializeApp(config);
    firebaseAuth = authModule.getAuth(firebaseApp);
    firestoreDb = firestoreModule.getFirestore(firebaseApp);
    Object.assign(firebaseAuthApi, {
      getAuth: authModule.getAuth,
      signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
      signInAnonymously: authModule.signInAnonymously,
      onAuthStateChanged: authModule.onAuthStateChanged
    });
    Object.assign(firestoreApi, {
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      setDoc: firestoreModule.setDoc,
      updateDoc: firestoreModule.updateDoc,
      collection: firestoreModule.collection,
      query: firestoreModule.query,
      where: firestoreModule.where,
      orderBy: firestoreModule.orderBy,
      getDocs: firestoreModule.getDocs,
      serverTimestamp: firestoreModule.serverTimestamp
    });

    firebaseReady = true;
    await new Promise((resolve) => {
      let firstAuthEvent = true;
      firebaseAuthApi.onAuthStateChanged(firebaseAuth, (user) => {
        currentUser = user;
        authReady = true;
        if (firstAuthEvent) {
          firstAuthEvent = false;
          resolve();
          return;
        }
        void render();
      });
    });
  } catch (error) {
    console.warn("Firebase web init failed, demo mode continues.", error);
    authReady = true;
  }
}

async function render() {
  const route = getRoute();
  if (route.type === "qr") {
    await renderQrProfile(route.qrId);
    return;
  }
  if (route.type === "admin") {
    await renderAdmin();
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

async function renderAdmin() {
  if (firebaseReady && !authReady) {
    renderLoading("Admin oturumu kontrol ediliyor...");
    return;
  }

  if (firebaseReady) {
    if (!currentUser) {
      renderAdminLogin();
      return;
    }

    if (!(await isCurrentSystemAdmin())) {
      renderAdminLogin("Bu hesap sistem admin değil");
      return;
    }

    const state = await loadFirebaseAdminState();
    renderAdminPanel(state);
    return;
  }

  renderAdminPanel(loadState());
}

function renderAdminLogin(errorMessage = "") {
  const hint = window.LIFEBAND_ADMIN_EMAIL_HINT || "";
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand Admin</p>
          <h1 class="profile-title">Sistem admin girişi</h1>
        </div>
        <a class="button secondary" href="/">Ana sayfa</a>
      </div>
      <section class="card stack">
        ${errorMessage ? `<p class="alert">${escapeHtml(errorMessage)}</p>` : ""}
        <form id="adminLoginForm" class="form-grid">
          <div class="field full">
            <label for="adminEmail">E-posta</label>
            <input id="adminEmail" name="email" type="email" value="${escapeAttr(hint)}" autocomplete="username" required />
          </div>
          <div class="field full">
            <label for="adminPassword">Şifre</label>
            <input id="adminPassword" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="button field full" type="submit">Admin olarak giriş yap</button>
        </form>
        <p class="footer-note">
          Bu panel yalnızca adminUsers koleksiyonunda kaydı olan veya systemAdmin claim'i bulunan hesaplara açılır.
        </p>
      </section>
    </main>
  `;
  document.title = "LifeBand Admin Giriş";
  bindAdminLoginEvents();
}

function bindAdminLoginEvents() {
  document.querySelector("#adminLoginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(form.get("email"));
    const password = String(form.get("password") || "");
    try {
      await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password);
      if (!(await isCurrentSystemAdmin())) {
        renderAdminLogin("Bu hesap sistem admin değil");
        return;
      }
      toast("Admin girişi başarılı.");
      await render();
    } catch (error) {
      renderAdminLogin(adminAuthError(error));
    }
  });
}

async function isCurrentSystemAdmin() {
  if (!firebaseReady || !currentUser) return false;
  try {
    const token = await currentUser.getIdTokenResult();
    if (token.claims.systemAdmin === true) return true;
  } catch {
    // Continue with adminUsers document check.
  }

  try {
    const adminDoc = await firestoreApi.getDoc(
      firestoreApi.doc(firestoreDb, "adminUsers", currentUser.uid)
    );
    return adminDoc.exists();
  } catch {
    return false;
  }
}

function renderAdminPanel(state) {
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
          <a class="button secondary" href="/q/${encodeURIComponent(latestQr.qrId)}">Son QR</a>
          <a class="button" href="/admin">Admin</a>
        </nav>
      </header>

      <main class="main">
        <section class="hero">
          <div class="hero-panel">
            <p class="eyebrow">Cloudflare + Firebase</p>
            <h1>Güvenli QR ile acil sağlık profili</h1>
            <p class="lead">
              Sistem admini QR üretir. Kullanıcı ilk okutma sırasında telefonu ve e-postasıyla QR'ı claim eder, sonra mobil uygulamada aynı e-posta ile hesabına bağlar.
            </p>
            <div class="hero-actions">
              <button class="button" id="generateQr">Yeni QR oluştur</button>
              <a class="button secondary" href="/q/${encodeURIComponent(latestQr.qrId)}">Son QR profili</a>
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

async function loadFirebaseAdminState() {
  const qrQuery = firestoreApi.query(
    firestoreApi.collection(firestoreDb, "qrCodes"),
    firestoreApi.orderBy("createdAt", "desc")
  );
  const staffQuery = firestoreApi.query(
    firestoreApi.collection(firestoreDb, "staffApplications"),
    firestoreApi.where("status", "in", ["pending", "approved", "rejected"]),
    firestoreApi.orderBy("createdAt", "desc")
  );
  const logQuery = firestoreApi.query(
    firestoreApi.collection(firestoreDb, "accessLogs"),
    firestoreApi.orderBy("createdAt", "desc")
  );

  const [qrSnapshot, staffSnapshot, logSnapshot] = await Promise.all([
    firestoreApi.getDocs(qrQuery),
    firestoreApi.getDocs(staffQuery),
    firestoreApi.getDocs(logQuery)
  ]);

  return {
    qrCodes: qrSnapshot.docs.map((snapshot) => normalizeQrRecord(snapshot.id, snapshot.data())),
    staffApplications: staffSnapshot.docs.map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    })),
    accessLogs: logSnapshot.docs.slice(0, 20).map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data()
    }))
  };
}

function normalizeQrRecord(id, data) {
  return {
    id,
    qrId: data.qrId || id,
    tokenHash: data.tokenHash || "",
    owner: data.claimEmail || data.ownerUid || "Henüz sahiplenilmedi",
    ownerUid: data.ownerUid || "",
    claimEmail: data.claimEmail || "",
    createdAt: data.createdAt,
    status: data.status || "unclaimed",
    scanCount: data.scanCount || 0,
    url: publicUrl(data.qrId || id)
  };
}

function renderQrManager(state) {
  const rows = state.qrCodes
    .map(
      (qr) => `
      <tr>
        <td><strong>${escapeHtml(qr.qrId)}</strong><br><span class="muted small">${escapeHtml(qr.owner || qr.claimEmail || "Henüz sahiplenilmedi")}</span></td>
        <td>${formatDate(qr.createdAt)}</td>
        <td><span class="badge ${statusClass(qr.status)}">${statusLabel(qr.status)}</span></td>
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
        <tbody>${rows || `<tr><td colspan="5">Henüz QR yok.</td></tr>`}</tbody>
      </table>
    </section>
  `;
}

function renderStaffApplications(state) {
  const rows = state.staffApplications
    .map(
      (item) => `
      <tr>
        <td><strong>${escapeHtml(item.name || item.fullName || "Başvuru")}</strong><br><span class="muted small">${escapeHtml(item.title || "")}</span></td>
        <td>${escapeHtml(item.hospital || item.organization || "")}<br><span class="muted small">${escapeHtml(item.phone || "")}</span></td>
        <td><span class="badge ${statusClass(item.status)}">${statusLabel(item.status)}</span></td>
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
        <tbody>${rows || `<tr><td colspan="4">Başvuru yok.</td></tr>`}</tbody>
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
          <p class="muted small">${firebaseReady ? "QR Firestore'a sahipsiz olarak kaydedilir; kullanıcı ilk okutma sırasında claim eder." : "Demo verisi local tutulur; Firebase config eklenince kayıt Firestore'a taşınır."}</p>
        </div>
      </div>
      <form id="qrForm" class="form-grid">
        ${
          firebaseReady
            ? `
          <div class="field full">
            <label>Oluşturma modu</label>
            <input value="Sahipsiz güvenli QR" readonly />
          </div>`
            : `
          <div class="field full">
            <label for="owner">Kullanıcı adı</label>
            <input id="owner" name="owner" value="Mehmet Yilmaz" required />
          </div>`
        }
        <button class="button field full" type="submit">Güvenli QR üret</button>
      </form>
    </section>
  `;
}

function renderAccessLogs(state) {
  const logs = [...state.accessLogs]
    .slice(0, 8)
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
        <tbody>${logs || `<tr><td colspan="3">Kayıt yok.</td></tr>`}</tbody>
      </table>
    </section>
  `;
}

async function renderQrProfile(qrId) {
  if (firebaseReady) {
    await renderFirebaseQrProfile(qrId);
    return;
  }
  renderDemoQrProfile(qrId);
}

async function renderFirebaseQrProfile(qrId) {
  renderLoading("QR bilgisi getiriliyor...");
  try {
    const profileSnapshot = await firestoreApi.getDoc(
      firestoreApi.doc(firestoreDb, "publicProfiles", qrId)
    );
    if (profileSnapshot.exists()) {
      const publicProfile = profileSnapshot.data();
      if (publicProfile.status === "revoked") {
        renderInactiveQr(qrId);
        return;
      }

      const staffMode = new URLSearchParams(window.location.search).get("staff") === "1";
      const displayFields =
        publicProfile.displayFields ||
        compileDisplayFields(
          publicProfile.fields || {},
          publicProfile.visibility || {},
          staffMode ? "staff" : "public"
        );
      void logAccess(qrId, staffMode ? "staff" : "public");
      renderProfileCard(qrId, "Acil Sağlık Profili", displayFields);
      return;
    }

    const qrRef = firestoreApi.doc(firestoreDb, "qrCodes", qrId);
    const qrSnapshot = await firestoreApi.getDoc(qrRef);
    if (!qrSnapshot.exists()) {
      renderInactiveQr(qrId);
      return;
    }

    const qr = { qrId, ...qrSnapshot.data() };
    if (qr.status === "revoked") {
      renderInactiveQr(qrId);
      return;
    }

    if (qr.status === "unclaimed") {
      renderClaimForm(qrId);
      bindClaimForm(qrId);
      return;
    }

    renderProfileCard(qrId, "Profil henüz tamamlanmadı.", {});
  } catch (error) {
    renderProfileCard(qrId, "QR okunamadı", {
      criticalNotes: "Bağlantı veya yetki hatası oluştu. Lütfen tekrar deneyin."
    });
    console.error(error);
  }
}

function renderDemoQrProfile(qrId) {
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

  if (!isDemo) {
    renderInactiveQr(qrId);
    return;
  }
  renderProfileCard(qrId, "Acil Sağlık Profili", displayFields, staffMode);
}

function renderClaimForm(qrId, errorMessage = "") {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand QR</p>
          <h1 class="profile-title">QR sahiplenme</h1>
        </div>
        <a class="button secondary" href="/">Ana sayfa</a>
      </div>
      <section class="card stack">
        ${errorMessage ? `<p class="alert">${escapeHtml(errorMessage)}</p>` : ""}
        <p class="alert">Bu QR ilk kez okutuluyor. Telefon ve e-posta bilgilerini girerek kaydı başlat.</p>
        <form id="claimForm" class="form-grid">
          <div class="field">
            <label for="firstName">Ad</label>
            <input id="firstName" name="firstName" autocomplete="given-name" required />
          </div>
          <div class="field">
            <label for="lastName">Soyad</label>
            <input id="lastName" name="lastName" autocomplete="family-name" required />
          </div>
          <div class="field">
            <label for="claimEmail">E-posta</label>
            <input id="claimEmail" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="claimPhone">Telefon</label>
            <input id="claimPhone" name="phone" inputmode="tel" autocomplete="tel" required />
          </div>
          <div class="field full">
            <label for="nationalId">T.C. kimlik (opsiyonel)</label>
            <input id="nationalId" name="nationalId" inputmode="numeric" />
          </div>
          <button class="button field full" type="submit">QR kaydını başlat</button>
        </form>
      </section>
    </main>
  `;
  document.title = "LifeBand QR Sahiplenme";
}

function bindClaimForm(qrId) {
  document.querySelector("#claimForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const firstName = cleanText(form.get("firstName"));
    const lastName = cleanText(form.get("lastName"));
    const email = normalizeEmail(form.get("email"));
    const phone = cleanText(form.get("phone"));
    const nationalId = cleanText(form.get("nationalId"));

    try {
      if (!firebaseAuth.currentUser) {
        await firebaseAuthApi.signInAnonymously(firebaseAuth);
      }
      const claimUid = firebaseAuth.currentUser.uid;
      await firestoreApi.updateDoc(firestoreApi.doc(firestoreDb, "qrCodes", qrId), {
        status: "claimed",
        claimEmail: email,
        claimPhone: phone,
        claimUid,
        claimedAt: firestoreApi.serverTimestamp()
      });

      const fields = {
        fullName: `${firstName} ${lastName}`.trim(),
        nationalId,
        phone,
        email
      };
      const visibility = {
        fullName: "masked",
        nationalId: nationalId ? "masked" : "private",
        phone: "private",
        email: "private"
      };
      await firestoreApi.setDoc(firestoreApi.doc(firestoreDb, "publicProfiles", qrId), {
        qrId,
        claimUid,
        status: "claimed",
        displayFields: compileDisplayFields(fields, visibility, "public"),
        visibility,
        createdAt: firestoreApi.serverTimestamp(),
        updatedAt: firestoreApi.serverTimestamp()
      });

      toast("QR kaydı başlatıldı. Mobil uygulamada aynı e-posta ile giriş yapınca QR hesabına düşecek.");
      await renderFirebaseQrProfile(qrId);
    } catch (error) {
      console.error(error);
      renderClaimForm(qrId, "QR kaydı başlatılamadı. Bilgileri kontrol edip tekrar deneyin.");
      bindClaimForm(qrId);
    }
  });
}

function renderProfileCard(qrId, title, displayFields, staffMode = false) {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand QR</p>
          <h1 class="profile-title">${escapeHtml(title)}</h1>
        </div>
        <a class="button secondary" href="/admin">Admin</a>
      </div>
      <section class="card stack">
        <div class="card-header">
          <div>
            <h2>${escapeHtml(displayName(displayFields, firebaseReady ? {} : demoProfile.fields))}</h2>
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
        ${
          firebaseReady
            ? ""
            : `
          <div class="hero-actions">
            <a class="button" href="/q/${encodeURIComponent(qrId)}?staff=1">Sağlık personeli görünümü</a>
            <a class="button secondary" href="/q/${encodeURIComponent(qrId)}">Public görünüm</a>
          </div>`
        }
      </section>
    </main>
  `;
}

function renderInactiveQr(qrId) {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand QR</p>
          <h1 class="profile-title">QR aktif değil</h1>
        </div>
        <a class="button secondary" href="/">Ana sayfa</a>
      </div>
      <section class="card stack">
        <p class="alert">${escapeHtml(qrId)} aktif değil veya sistem admini tarafından iptal edilmiş.</p>
      </section>
    </main>
  `;
}

function renderLoading(message) {
  app.innerHTML = `
    <main class="profile-page">
      <section class="card stack">
        <p class="alert">${escapeHtml(message)}</p>
      </section>
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
    const qrId = `LB_${secureToken(18)}`;
    const tokenHash = await sha256Hex(qrId);

    if (firebaseReady && currentUser) {
      await firestoreApi.setDoc(firestoreApi.doc(firestoreDb, "qrCodes", qrId), {
        qrId,
        tokenHash,
        status: "unclaimed",
        createdBy: currentUser.uid,
        createdAt: firestoreApi.serverTimestamp(),
        scanCount: 0
      });
      toast("Sahipsiz güvenli QR oluşturuldu.");
      await renderAdmin();
      return;
    }

    const form = new FormData(event.currentTarget);
    const state = loadState();
    state.qrCodes.unshift({
      qrId,
      tokenHash,
      owner: String(form.get("owner") || "Yeni Kullanıcı"),
      ownerUid: "demo-user",
      createdAt: new Date().toISOString(),
      status: "active",
      scanCount: 0,
      url: publicUrl(qrId)
    });
    saveState(state);
    toast("Güvenli QR oluşturuldu.");
    await renderAdmin();
  });

  document.querySelectorAll("[data-action='revoke-qr']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      if (!id) return;
      if (firebaseReady) {
        await firestoreApi.updateDoc(firestoreApi.doc(firestoreDb, "qrCodes", id), {
          status: "revoked",
          revokedAt: firestoreApi.serverTimestamp()
        });
        toast("QR pasif yapıldı.");
        await renderAdmin();
        return;
      }

      const state = loadState();
      const qr = state.qrCodes.find((x) => x.qrId === id);
      if (qr) qr.status = "revoked";
      saveState(state);
      toast("QR pasif yapıldı.");
      await renderAdmin();
    });
  });

  document.querySelectorAll("[data-action='staff-status']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id");
      const status = button.getAttribute("data-status");
      if (!id || !status) return;

      if (firebaseReady) {
        await firestoreApi.updateDoc(firestoreApi.doc(firestoreDb, "staffApplications", id), {
          status,
          reviewedBy: currentUser.uid,
          reviewedAt: firestoreApi.serverTimestamp()
        });
        toast(status === "approved" ? "Başvuru onaylandı." : "Başvuru reddedildi.");
        await renderAdmin();
        return;
      }

      const state = loadState();
      const application = state.staffApplications.find((x) => x.id === id);
      if (application) application.status = status;
      saveState(state);
      toast(status === "approved" ? "Başvuru onaylandı." : "Başvuru reddedildi.");
      await renderAdmin();
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
  state.accessLogs.unshift({
    id: `LOG-${Date.now()}`,
    qrId,
    mode,
    createdAt: new Date().toISOString()
  });
  saveState(state);
}

async function logAccess(qrId, mode) {
  try {
    await firestoreApi.setDoc(firestoreApi.doc(firestoreApi.collection(firestoreDb, "accessLogs")), {
      qrId,
      mode,
      createdAt: firestoreApi.serverTimestamp(),
      userAgent: navigator.userAgent
    });
  } catch {
    // Access logging must never block emergency profile rendering.
  }
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
  const entries = Object.entries(fields || {}).filter(([, value]) => String(value ?? "").trim());
  if (entries.length === 0) {
    return `
      <div class="info-item">
        <dt>Bilgi</dt>
        <dd>Gösterilebilir alan bulunmuyor.</dd>
      </div>`;
  }

  return entries
    .map(
      ([key, value]) => `
      <div class="info-item">
        <dt>${escapeHtml(FIELD_LABELS[key] || key)}</dt>
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
  if (status === "unclaimed") return "Sahipsiz";
  if (status === "claimed") return "Claim edildi";
  if (status === "active") return "Aktif";
  if (status === "revoked") return "Pasif";
  return "Bekliyor";
}

function statusClass(status) {
  if (status === "approved" || status === "active") return "ok";
  if (status === "rejected" || status === "revoked") return "danger";
  if (status === "pending" || status === "claimed" || status === "unclaimed") return "warn";
  return "";
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanText(value) {
  return String(value || "").trim();
}

function adminAuthError(error) {
  if (String(error?.code || "").includes("invalid-credential")) {
    return "E-posta veya şifre hatalı.";
  }
  return "Admin girişi yapılamadı.";
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
