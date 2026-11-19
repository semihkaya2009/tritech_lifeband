import { compileDisplayFields } from "./visibility.js";

const DEMO_QR_ID = "LB_DEMO_20261011";
const STORAGE_KEY = "lifeband.admin.demo.v1";
const LAST_QR_KEY = "lifeband.admin.lastQrId";
const DEFAULT_ORIGIN = "https://tritech-lifeband.semihkayaa2009.workers.dev";

const FIELD_LABELS = {
  fullName: "Ad Soyad",
  firstName: "Ad",
  lastName: "Soyad",
  nationalId: "T.C. Kimlik",
  phone: "Telefon",
  email: "E-posta",
  birthDate: "Doğum Tarihi",
  bloodType: "Kan Grubu",
  emergencyContact: "Acil Durum Yakını",
  allergies: "Alerjiler",
  chronicConditions: "Kronik Rahatsızlık",
  chronicDiseases: "Kronik Rahatsızlık",
  medications: "Kullandığı İlaçlar",
  notes: "Notlar",
  criticalNotes: "Kritik Not",
  lastUpdated: "Son Güncelleme"
};

// Editable profile fields, in form order. Mirrors lib/src/models/lifeband_profile.dart.
const PROFILE_FIELDS = [
  { key: "firstName", label: "Ad", required: true },
  { key: "lastName", label: "Soyad", required: true },
  { key: "nationalId", label: "T.C. Kimlik No" },
  { key: "phone", label: "Telefon" },
  { key: "email", label: "E-posta" },
  { key: "birthDate", label: "Doğum Tarihi (YYYY-AA-GG)" },
  { key: "bloodType", label: "Kan Grubu", required: true },
  { key: "allergies", label: "Alerjiler" },
  { key: "chronicDiseases", label: "Kronik Hastalıklar" },
  { key: "medications", label: "Kullandığı İlaçlar" },
  { key: "emergencyContact", label: "Acil Durum Yakını", required: true },
  { key: "notes", label: "Notlar", multiline: true }
];

const VISIBILITY_LEVEL_LABELS = {
  private: "Gizli",
  public: "Açık",
  masked: "Yarı görünür",
  staff: "Sağlık personeli"
};

// Mirrors VisibilitySettings.minimal/emergency/staffFocused in
// lib/src/models/lifeband_profile.dart, so mobile and web templates agree.
const VISIBILITY_TEMPLATES = {
  minimal: {
    fullName: "masked",
    bloodType: "public",
    allergies: "public",
    emergencyContact: "public"
  },
  emergency: {
    fullName: "masked",
    bloodType: "public",
    allergies: "public",
    emergencyContact: "public",
    chronicDiseases: "public",
    medications: "staff",
    notes: "staff"
  },
  staffFocused: {
    fullName: "masked",
    bloodType: "public",
    allergies: "public",
    emergencyContact: "public",
    chronicDiseases: "staff",
    medications: "staff",
    notes: "staff"
  }
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
      createUserWithEmailAndPassword: authModule.createUserWithEmailAndPassword,
      signInAnonymously: authModule.signInAnonymously,
      signOut: authModule.signOut,
      onAuthStateChanged: authModule.onAuthStateChanged
    });
    Object.assign(firestoreApi, {
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      setDoc: firestoreModule.setDoc,
      updateDoc: firestoreModule.updateDoc,
      addDoc: firestoreModule.addDoc,
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
  if (route.type === "personel") {
    await renderStaffPortal();
    return;
  }
  if (route.type === "login") {
    await renderUserAuthPortal();
    return;
  }
  if (route.type === "dashboard") {
    await renderUserDashboard();
    return;
  }
  if (route.type === "account") {
    await renderAccount();
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
  if (segments[0] === "personel") return { type: "personel" };
  if (segments[0] === "giris") return { type: "login" };
  if (segments[0] === "panelim") return { type: "dashboard" };
  if (segments[0] === "hesabim") return { type: "account" };
  return { type: "home" };
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  void render();
}

function renderLanding() {
  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <div class="brand-mark">LB</div>
          <div>
            <p class="brand-title">LifeBand</p>
            <p class="brand-subtitle">Tri Tech — Acil Sağlık QR Sistemi</p>
          </div>
        </div>
        <nav class="top-actions" aria-label="Ana menü">
          <a class="nav-link" href="#problem">Problem</a>
          <a class="nav-link" href="#cozum">Çözüm</a>
          <a class="nav-link" href="#roller">Roller</a>
          <a class="nav-link" href="#surec">QR Süreci</a>
          ${
            firebaseReady && currentUser
              ? `<a class="button" href="/hesabim">Hesabım</a>`
              : `<a class="button" href="/giris">Giriş Yap</a>`
          }
        </nav>
      </header>

      <main class="main">
        <section class="hero">
          <div class="hero-panel reveal">
            <p class="eyebrow">İnsan Yararına Teknolojiler · Sağlık ve İlk Yardım</p>
            <h1>Bilinci kapalı bir hastanın geçmişini, saniyeler içinde doğru ellere ulaştırır.</h1>
            <p class="lead">
              Pilsiz, şarjsız bir bileklik üzerindeki güvenli QR kod; kan grubu, alerji ve kronik hastalık gibi bilgileri — hastanın izin verdiği ölçüde — ilk yardım ekiplerine anında gösterir.
            </p>
            <div class="hero-actions">
              <a class="button" href="#surec">QR nasıl çalışır?</a>
              <a class="button secondary" href="#roller">Rolleri gör</a>
            </div>
          </div>

          <aside class="card band-showcase reveal reveal-delay-1" aria-label="LifeBand akıllı bileklik görseli">
            <div class="band-glow" aria-hidden="true"></div>
            <img class="band-float" src="/images/wristband-qr.png" alt="QR kodlu akıllı bileklik" />
          </aside>
        </section>

        <section class="section" id="problem">
          <div class="reveal">
            <p class="section-eyebrow">Problem</p>
            <h2>Hasta geçmişi bilinmeden yapılan müdahale, hayatı tehlikeye atar.</h2>
            <p class="lead" style="font-size: 16px;">
              Sokakta aniden bayılan sıradan bir vatandaşın yaklaşık %10 ihtimalle bir alerjisi, %11 ihtimalle şeker hastalığı vardır — ama bilinci kapalıyken bunu kimse bilemez.
            </p>
          </div>
          <div class="stat-grid">
            <div class="stat-card reveal"><strong>6,1 / 1000</strong><span>İlaç kaynaklı acil servis başvurusu oranı; bu hastaların %38,6'sı hastaneye yatırılıyor.</span></div>
            <div class="stat-card reveal reveal-delay-1"><strong>%16,1</strong><span>TÜİK Türkiye Sağlık Araştırması'na göre toplumda hipertansiyon oranı.</span></div>
            <div class="stat-card reveal reveal-delay-2"><strong>%11,4</strong><span>Toplumda diyabet görülme oranı — acil anda bilinmesi hayati bir bilgi.</span></div>
            <div class="stat-card reveal reveal-delay-3"><strong>%9,6</strong><span>Belirli madde/ilaçlara karşı alerji hassasiyeti taşıyan birey oranı.</span></div>
          </div>
        </section>

        <section class="section" id="cozum">
          <div class="reveal">
            <p class="section-eyebrow">Çözüm</p>
            <h2>Devresiz bir bileklik, görünürlüğü hasta kontrol eder.</h2>
          </div>
          <div class="stat-grid">
            <div class="stat-card reveal">
              <span class="role-scope">1</span>
              <p style="margin-top:10px;font-weight:800;">Pilsiz donanım</p>
              <p>Şarj veya arıza riski yok; günlük bir aksesuar gibi sürekli kolda taşınır.</p>
            </div>
            <div class="stat-card reveal reveal-delay-1">
              <span class="role-scope">2</span>
              <p style="margin-top:10px;font-weight:800;">Alan bazlı görünürlük</p>
              <p>Her bilgi için ayrı seçim: gizli, açık, yarı görünür (maskeli) veya yalnızca sağlık personeline açık.</p>
            </div>
            <div class="stat-card reveal reveal-delay-2">
              <span class="role-scope">3</span>
              <p style="margin-top:10px;font-weight:800;">Anlık güncelleme</p>
              <p>Yeni bir alerji eklendiği an sistem güncellenir; bilekliği değiştirmeye gerek kalmaz.</p>
            </div>
          </div>
        </section>

        <section class="section" id="roller">
          <div class="reveal">
            <p class="section-eyebrow">Erişim Modeli</p>
            <h2>Aynı QR, kim okuttuğuna göre farklı bilgi gösterir.</h2>
          </div>
          <div class="role-grid">
            <div class="role-card reveal">
              <p class="role-name">Sistem admini</p>
              <span class="role-scope">Tam yetki</span>
              <p>QR oluşturur/iptal eder, sağlık personeli başvurularını onaylar, erişim kayıtlarını denetler.</p>
            </div>
            <div class="role-card reveal reveal-delay-1">
              <p class="role-name">Anonim ziyaretçi</p>
              <span class="role-scope" style="color: var(--muted);">Sadece açık/maskeli alanlar</span>
              <p>QR'ı okutan herkes, yalnızca hastanın "açık" veya "yarı görünür" yaptığı alanları görür.</p>
            </div>
            <div class="role-card reveal reveal-delay-2">
              <p class="role-name">QR sahibi</p>
              <span class="role-scope">Kendi profili</span>
              <p>QR'ı sahiplenirken girdiği e-posta ile giriş yaptığında tüm sağlık bilgisini ve görünürlüğünü <a href="/panelim">webden düzenler</a>.</p>
            </div>
            <div class="role-card reveal reveal-delay-3">
              <p class="role-name">Sağlık personeli</p>
              <span class="role-scope">Admin onaylı</span>
              <p>Onaylandıktan sonra, hastanın "sağlık personeline açık" yaptığı ek alanları otomatik görür.</p>
            </div>
          </div>
        </section>

        <section class="section" id="surec" style="padding-bottom: 64px;">
          <div class="reveal">
            <p class="section-eyebrow">QR Yaşam Döngüsü</p>
            <h2>Oluşturulmasından profilin aktif olmasına kadar.</h2>
          </div>
          <div class="step-rail">
            <div class="step-item reveal"><strong>1. Oluşturma</strong><span>Admin panelden rastgele, tahmin edilemez bir QR üretilir — durum: sahipsiz.</span></div>
            <div class="step-item reveal reveal-delay-1"><strong>2. Sahiplenme</strong><span>İlk okutulduğunda ad, soyad, e-posta ve telefon alınır — durum: sahiplenildi.</span></div>
            <div class="step-item reveal reveal-delay-2"><strong>3. Profil</strong><span>Aynı e-posta ile <a href="/giris">webden giriş yapılır</a>, sağlık bilgisi ve görünürlük ayarlanır.</span></div>
            <div class="step-item reveal reveal-delay-3"><strong>4. Aktif</strong><span>QR artık canlı: herkes izin verilen alanları, onaylı personel ek alanları görür.</span></div>
          </div>
        </section>
      </main>
    </div>
  `;
  document.title = "LifeBand";
  initScrollReveal();
}

function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!elements.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  elements.forEach((element) => observer.observe(element));
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

async function getCurrentMedicalStaffDoc() {
  if (!firebaseReady || !currentUser) return null;
  try {
    const snap = await firestoreApi.getDoc(
      firestoreApi.doc(firestoreDb, "medicalStaff", currentUser.uid)
    );
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

async function isCurrentApprovedStaff() {
  const doc = await getCurrentMedicalStaffDoc();
  return doc?.status === "approved";
}

async function getCurrentPendingStaffApplication() {
  if (!firebaseReady || !currentUser) return null;
  try {
    const snap = await firestoreApi.getDocs(
      firestoreApi.query(
        firestoreApi.collection(firestoreDb, "staffApplications"),
        firestoreApi.where("uid", "==", currentUser.uid)
      )
    );
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return docs.find((d) => d.status === "pending") || docs[0] || null;
  } catch {
    return null;
  }
}

async function renderStaffPortal() {
  if (!firebaseReady) {
    app.innerHTML = `
      <main class="profile-page">
        <div class="profile-head">
          <div>
            <p class="eyebrow">LifeBand</p>
            <h1 class="profile-title">Sağlık Personeli</h1>
          </div>
          <a class="button secondary" href="/">Ana sayfa</a>
        </div>
        <section class="card stack">
          <p class="alert">Bu özellik için Firebase bağlantısı gerekli.</p>
        </section>
      </main>
    `;
    document.title = "LifeBand Sağlık Personeli";
    return;
  }

  if (!authReady) {
    renderLoading("Oturum kontrol ediliyor...");
    return;
  }

  if (!currentUser) {
    renderStaffAuthForm();
    return;
  }

  const staffDoc = await getCurrentMedicalStaffDoc();
  if (staffDoc?.status === "approved") {
    renderStaffApproved(staffDoc);
    return;
  }

  const pendingApp = await getCurrentPendingStaffApplication();
  if (pendingApp) {
    renderStaffApplicationStatus(pendingApp);
    return;
  }

  renderStaffApplicationForm();
}

function renderStaffAuthForm(errorMessage = "", mode = "login") {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">Sağlık Personeli Girişi</h1>
        </div>
        <a class="button secondary" href="/">Ana sayfa</a>
      </div>
      <section class="card stack">
        <p class="muted small">
          Onaylı sağlık personeli olarak giriş yaptığınızda, hastaların size açtığı QR'ları okuttuğunuzda ek klinik bilgileri görebilirsiniz.
        </p>
        ${errorMessage ? `<p class="alert">${escapeHtml(errorMessage)}</p>` : ""}
        <form id="staffAuthForm" class="form-grid">
          <div class="field full">
            <label for="staffEmail">E-posta</label>
            <input id="staffEmail" name="email" type="email" autocomplete="username" required />
          </div>
          <div class="field full">
            <label for="staffPassword">Şifre</label>
            <input id="staffPassword" name="password" type="password" autocomplete="${mode === "register" ? "new-password" : "current-password"}" minlength="6" required />
          </div>
          <button class="button field full" type="submit">${mode === "register" ? "Hesap oluştur" : "Giriş yap"}</button>
        </form>
        <button class="button ghost" id="staffAuthToggle" type="button">
          ${mode === "register" ? "Zaten hesabım var" : "Hesabım yok, oluşturmak istiyorum"}
        </button>
      </section>
    </main>
  `;
  document.title = "LifeBand Sağlık Personeli Girişi";

  document.querySelector("#staffAuthToggle")?.addEventListener("click", () => {
    renderStaffAuthForm("", mode === "register" ? "login" : "register");
  });

  document.querySelector("#staffAuthForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(form.get("email"));
    const password = String(form.get("password") || "");
    try {
      if (mode === "register") {
        await firebaseAuthApi.createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      await render();
    } catch (error) {
      renderStaffAuthForm(authError(error, "Giriş yapılamadı."), mode);
    }
  });
}

function renderStaffApplicationForm(errorMessage = "") {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">Sağlık Çalışanı Başvurusu</h1>
        </div>
        <button class="button secondary" id="staffSignOut" type="button">Çıkış yap</button>
      </div>
      <section class="card stack">
        <p class="muted small">
          Başvurunuz sistem admini tarafından incelenip onaylandıktan sonra, hastaların "sağlık personeline açık" yaptığı bilgileri QR okuttuğunuzda görebileceksiniz.
        </p>
        ${errorMessage ? `<p class="alert">${escapeHtml(errorMessage)}</p>` : ""}
        <form id="staffApplicationForm" class="form-grid">
          <div class="field">
            <label for="staffName">Ad soyad</label>
            <input id="staffName" name="name" required />
          </div>
          <div class="field">
            <label for="staffTitle">Unvan</label>
            <input id="staffTitle" name="title" placeholder="Örn. Acil Tıp Teknisyeni" required />
          </div>
          <div class="field">
            <label for="staffHospital">Kurum</label>
            <input id="staffHospital" name="hospital" required />
          </div>
          <div class="field">
            <label for="staffPhone">Telefon</label>
            <input id="staffPhone" name="phone" required />
          </div>
          <button class="button field full" type="submit">Başvuruyu gönder</button>
        </form>
      </section>
    </main>
  `;
  document.title = "LifeBand Sağlık Çalışanı Başvurusu";

  document.querySelector("#staffSignOut")?.addEventListener("click", async () => {
    await firebaseAuthApi.signOut(firebaseAuth);
    await render();
  });

  document.querySelector("#staffApplicationForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await firestoreApi.addDoc(firestoreApi.collection(firestoreDb, "staffApplications"), {
        uid: currentUser.uid,
        email: currentUser.email || "",
        name: String(form.get("name") || ""),
        title: String(form.get("title") || ""),
        hospital: String(form.get("hospital") || ""),
        phone: String(form.get("phone") || ""),
        status: "pending",
        createdAt: firestoreApi.serverTimestamp()
      });
      toast("Başvurunuz gönderildi.");
      await render();
    } catch (error) {
      renderStaffApplicationForm("Başvuru gönderilemedi: " + error.message);
    }
  });
}

function renderStaffApplicationStatus(application) {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">Başvurunuz İnceleniyor</h1>
        </div>
        <button class="button secondary" id="staffSignOut" type="button">Çıkış yap</button>
      </div>
      <section class="card stack">
        <p class="alert">
          ${application.status === "rejected"
            ? "Başvurunuz reddedildi. Sorularınız için sistem admini ile iletişime geçin."
            : "Başvurunuz sistem admini tarafından henüz onaylanmadı."}
        </p>
        <dl class="info-list">
          <div class="info-item"><dt>Ad soyad</dt><dd>${escapeHtml(application.name || "")}</dd></div>
          <div class="info-item"><dt>Unvan</dt><dd>${escapeHtml(application.title || "")}</dd></div>
          <div class="info-item"><dt>Kurum</dt><dd>${escapeHtml(application.hospital || "")}</dd></div>
        </dl>
      </section>
    </main>
  `;
  document.title = "LifeBand Sağlık Personeli";

  document.querySelector("#staffSignOut")?.addEventListener("click", async () => {
    await firebaseAuthApi.signOut(firebaseAuth);
    await render();
  });
}

function renderStaffApproved(staffDoc) {
  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">Onaylı Sağlık Personeli</h1>
        </div>
        <button class="button secondary" id="staffSignOut" type="button">Çıkış yap</button>
      </div>
      <section class="card stack">
        <p class="alert" style="background:#dff7ec;color:#047857;">
          Hesabınız onaylı. Bir hastanın QR'ını okuttuğunuzda, size açtığı ek klinik bilgileri otomatik olarak göreceksiniz — ayrı bir "personel görünümü" butonuna gerek yok.
        </p>
        <dl class="info-list">
          <div class="info-item"><dt>Unvan</dt><dd>${escapeHtml(staffDoc.title || "")}</dd></div>
          <div class="info-item"><dt>Kurum</dt><dd>${escapeHtml(staffDoc.hospital || "")}</dd></div>
        </dl>
      </section>
    </main>
  `;
  document.title = "LifeBand Sağlık Personeli";

  document.querySelector("#staffSignOut")?.addEventListener("click", async () => {
    await firebaseAuthApi.signOut(firebaseAuth);
    await render();
  });
}

async function attachClaimedQrsForCurrentUser() {
  if (!firebaseReady || !currentUser || !currentUser.email) return;
  try {
    const email = currentUser.email.toLowerCase();
    const snap = await firestoreApi.getDocs(
      firestoreApi.query(
        firestoreApi.collection(firestoreDb, "qrCodes"),
        firestoreApi.where("claimEmail", "==", email),
        firestoreApi.where("status", "==", "claimed")
      )
    );
    if (snap.docs.length === 0) return;

    // The claim form only collects name/national id to show a masked
    // preview; it never persists them anywhere the owner can see again.
    // Seed profiles/{uid} from the first claimed QR's data, once, so that
    // filling out the claim form isn't wasted work.
    const profileRef = firestoreApi.doc(firestoreDb, "profiles", currentUser.uid);
    const profileSnap = await firestoreApi.getDoc(profileRef);
    if (!profileSnap.exists()) {
      const claimData = snap.docs[0].data();
      const seed = {
        uid: currentUser.uid,
        firstName: claimData.claimFirstName || "",
        lastName: claimData.claimLastName || "",
        nationalId: claimData.claimNationalId || "",
        phone: claimData.claimPhone || "",
        email: claimData.claimEmail || email,
        updatedAt: firestoreApi.serverTimestamp()
      };
      if (seed.firstName || seed.lastName || seed.nationalId || seed.phone) {
        await firestoreApi.setDoc(profileRef, seed, { merge: true });
      }
    }

    for (const docSnapshot of snap.docs) {
      await firestoreApi.updateDoc(docSnapshot.ref, {
        status: "active",
        ownerUid: currentUser.uid,
        activatedAt: firestoreApi.serverTimestamp()
      });
      await firestoreApi.setDoc(
        firestoreApi.doc(firestoreDb, "publicProfiles", docSnapshot.id),
        { ownerUid: currentUser.uid, updatedAt: firestoreApi.serverTimestamp() },
        { merge: true }
      );
    }
  } catch (error) {
    console.warn("Claimed QR attach failed.", error);
  }
}

async function loadUserQrCodes() {
  if (!firebaseReady || !currentUser) return [];
  const snap = await firestoreApi.getDocs(
    firestoreApi.query(
      firestoreApi.collection(firestoreDb, "qrCodes"),
      firestoreApi.where("ownerUid", "==", currentUser.uid)
    )
  );
  return snap.docs.map((d) => ({ qrId: d.id, ...d.data() }));
}

const ROLE_TABS = {
  user: { label: "Kullanıcı", redirect: "/panelim", allowRegister: true },
  staff: { label: "Sağlık Personeli", redirect: "/personel", allowRegister: true },
  admin: { label: "Admin", redirect: "/admin", allowRegister: false }
};

async function renderUserAuthPortal(errorMessage = "", mode = "login", role = "user") {
  if (!firebaseReady) {
    app.innerHTML = `
      <main class="profile-page">
        <div class="profile-head">
          <div>
            <p class="eyebrow">LifeBand</p>
            <h1 class="profile-title">Giriş Yap</h1>
          </div>
          <a class="button secondary" href="/">Ana sayfa</a>
        </div>
        <section class="card stack">
          <p class="alert">Bu özellik için Firebase bağlantısı gerekli.</p>
        </section>
      </main>
    `;
    document.title = "LifeBand Giriş";
    return;
  }

  if (!authReady) {
    renderLoading("Oturum kontrol ediliyor...");
    return;
  }

  if (currentUser) {
    navigateTo("/hesabim");
    return;
  }

  const activeTab = ROLE_TABS[role] ? role : "user";
  const tabButtons = Object.entries(ROLE_TABS)
    .map(
      ([key, tab]) =>
        `<button class="button ${key === activeTab ? "" : "secondary"}" type="button" data-role="${key}">${tab.label}</button>`
    )
    .join("");
  const canRegister = ROLE_TABS[activeTab].allowRegister;
  const effectiveMode = canRegister ? mode : "login";

  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">${effectiveMode === "register" ? "Hesap Oluştur" : "Giriş Yap"}</h1>
        </div>
        <a class="button secondary" href="/">Ana sayfa</a>
      </div>
      <section class="card stack">
        <p class="muted small">Hangi rolle giriş yapmak istiyorsunuz?</p>
        <div class="template-row" id="roleTabs">${tabButtons}</div>
        <p class="muted small">
          ${
            activeTab === "admin"
              ? "Bu panel yalnızca adminUsers koleksiyonunda kaydı olan hesaplara açılır."
              : activeTab === "staff"
                ? "Onaylı sağlık personeli, hastaların size açtığı QR'ları okuttuğunuzda ek klinik bilgileri görür."
                : "QR'ınızı sahiplenirken girdiğiniz e-posta ile giriş yapın; QR otomatik olarak hesabınıza bağlanır."
          }
        </p>
        ${errorMessage ? `<p class="alert">${escapeHtml(errorMessage)}</p>` : ""}
        <form id="userAuthForm" class="form-grid">
          <div class="field full">
            <label for="userEmail">E-posta</label>
            <input id="userEmail" name="email" type="email" autocomplete="username" required />
          </div>
          <div class="field full">
            <label for="userPassword">Şifre</label>
            <input id="userPassword" name="password" type="password" autocomplete="${effectiveMode === "register" ? "new-password" : "current-password"}" minlength="6" required />
          </div>
          <button class="button field full" type="submit">${effectiveMode === "register" ? "Hesap oluştur" : "Giriş yap"}</button>
        </form>
        ${
          canRegister
            ? `<button class="button ghost" id="userAuthToggle" type="button">
                ${effectiveMode === "register" ? "Zaten hesabım var" : "Hesabım yok, oluşturmak istiyorum"}
              </button>`
            : ""
        }
      </section>
    </main>
  `;
  document.title = "LifeBand Giriş";

  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      renderUserAuthPortal("", "login", button.getAttribute("data-role"));
    });
  });

  document.querySelector("#userAuthToggle")?.addEventListener("click", () => {
    renderUserAuthPortal("", effectiveMode === "register" ? "login" : "register", activeTab);
  });

  document.querySelector("#userAuthForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(form.get("email"));
    const password = String(form.get("password") || "");
    try {
      if (effectiveMode === "register") {
        await firebaseAuthApi.createUserWithEmailAndPassword(firebaseAuth, email, password);
      } else {
        await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      // Attach any QR claimed with this email regardless of which tab
      // (Kullanıcı/Personel/Admin) was used to sign in — not just the
      // 'user' destination, which only happened to trigger it because
      // /panelim's own loader calls this too.
      await attachClaimedQrsForCurrentUser();
      navigateTo(ROLE_TABS[activeTab].redirect);
    } catch (error) {
      renderUserAuthPortal(authError(error, "Giriş yapılamadı."), effectiveMode, activeTab);
    }
  });
}

async function renderAccount() {
  if (!firebaseReady) {
    await renderUserAuthPortal();
    return;
  }

  if (!authReady) {
    renderLoading("Oturum kontrol ediliyor...");
    return;
  }

  if (!currentUser) {
    await renderUserAuthPortal();
    return;
  }

  renderLoading("Hesap bilgileri yükleniyor...");
  await attachClaimedQrsForCurrentUser();
  const [isAdmin, staffDoc, qrCodes] = await Promise.all([
    isCurrentSystemAdmin(),
    getCurrentMedicalStaffDoc(),
    loadUserQrCodes()
  ]);
  const isApprovedStaffUser = staffDoc?.status === "approved";

  const roleBadges = [
    `<span class="badge ok">Kullanıcı</span>`,
    isApprovedStaffUser ? `<span class="badge ok">Onaylı Sağlık Personeli</span>` : "",
    isAdmin ? `<span class="badge ok">Sistem Admini</span>` : ""
  ]
    .filter(Boolean)
    .join(" ");

  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">Hesabım</h1>
        </div>
        <button class="button secondary" id="accountSignOut" type="button">Çıkış yap</button>
      </div>
      <section class="card stack">
        <dl class="info-list">
          <div class="info-item"><dt>E-posta</dt><dd>${escapeHtml(currentUser.email || "")}</dd></div>
          <div class="info-item"><dt>Roller</dt><dd>${roleBadges}</dd></div>
          <div class="info-item"><dt>Bağlı QR sayısı</dt><dd>${qrCodes.length}</dd></div>
        </dl>
        <div class="hero-actions">
          <a class="button" href="/panelim">QR'larım ve Profilim</a>
          ${
            isApprovedStaffUser
              ? `<a class="button secondary" href="/personel">Sağlık Personeli Paneli</a>`
              : `<a class="button secondary" href="/personel">Sağlık Çalışanı Başvurusu</a>`
          }
          ${isAdmin ? `<a class="button secondary" href="/admin">Admin Paneli</a>` : ""}
        </div>
      </section>
    </main>
  `;
  document.title = "LifeBand Hesabım";

  document.querySelector("#accountSignOut")?.addEventListener("click", async () => {
    await firebaseAuthApi.signOut(firebaseAuth);
    navigateTo("/");
  });
}

async function renderUserDashboard() {
  if (!firebaseReady) {
    await renderUserAuthPortal();
    return;
  }

  if (!authReady) {
    renderLoading("Oturum kontrol ediliyor...");
    return;
  }

  if (!currentUser) {
    await renderUserAuthPortal();
    return;
  }

  renderLoading("QR'larınız yükleniyor...");
  await attachClaimedQrsForCurrentUser();
  const qrCodes = await loadUserQrCodes();

  if (qrCodes.length === 1) {
    await renderProfileEditor(qrCodes[0]);
    return;
  }

  const rows = qrCodes
    .map(
      (qr) => `
      <tr>
        <td><strong>${escapeHtml(qr.qrId)}</strong></td>
        <td><span class="badge ${qr.status === "active" ? "ok" : "warn"}">${statusLabel(qr.status)}</span></td>
        <td class="actions-cell">
          <button class="icon-button" title="Düzenle" data-action="edit-qr" data-qrid="${escapeAttr(qr.qrId)}">✎</button>
        </td>
      </tr>`
    )
    .join("");

  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand</p>
          <h1 class="profile-title">QR'larım</h1>
        </div>
        <button class="button secondary" id="userSignOut" type="button">Çıkış yap</button>
      </div>
      <section class="card stack">
        ${
          qrCodes.length === 0
            ? `<p class="alert">Henüz size bağlı bir QR yok. Bilekliğinizdeki QR'ı okutup sahiplenme formunu bu e-posta ile doldurun, sonra bu sayfayı yenileyin.</p>`
            : `
          <table class="table">
            <thead><tr><th>QR</th><th>Durum</th><th></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
        }
      </section>
    </main>
  `;
  document.title = "LifeBand QR'larım";

  document.querySelector("#userSignOut")?.addEventListener("click", async () => {
    await firebaseAuthApi.signOut(firebaseAuth);
    await render();
  });

  document.querySelectorAll("[data-action='edit-qr']").forEach((button) => {
    button.addEventListener("click", async () => {
      const qrId = button.getAttribute("data-qrid");
      const qr = qrCodes.find((x) => x.qrId === qrId);
      if (qr) await renderProfileEditor(qr);
    });
  });
}

async function renderProfileEditor(qr, statusMessage = "") {
  renderLoading("Profil yükleniyor...");

  const [profileSnap, visibilitySnap] = await Promise.all([
    firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "profiles", currentUser.uid)),
    firestoreApi.getDoc(firestoreApi.doc(firestoreDb, "visibilitySettings", currentUser.uid))
  ]);
  const profile = profileSnap.exists() ? profileSnap.data() : {};
  const visibility = visibilitySnap.exists() ? visibilitySnap.data().fields || {} : {};

  const fieldRows = PROFILE_FIELDS.map((field) => {
    const value = escapeAttr(profile[field.key] || "");
    const level = visibility[field.key] || "private";
    const options = Object.entries(VISIBILITY_LEVEL_LABELS)
      .map(
        ([optionValue, label]) =>
          `<option value="${optionValue}" ${optionValue === level ? "selected" : ""}>${label}</option>`
      )
      .join("");
    const input = field.multiline
      ? `<textarea id="field-${field.key}" name="${field.key}">${escapeHtml(profile[field.key] || "")}</textarea>`
      : `<input id="field-${field.key}" name="${field.key}" value="${value}" ${field.required ? "required" : ""} />`;

    return `
      <div class="field full">
        <div class="field-row">
          <div class="field">
            <label for="field-${field.key}">${escapeHtml(field.label)}</label>
            ${input}
          </div>
          <div class="field visibility-field">
            <label for="visibility-${field.key}">Görünürlük</label>
            <select id="visibility-${field.key}" name="visibility-${field.key}">${options}</select>
          </div>
        </div>
      </div>`;
  }).join("");

  app.innerHTML = `
    <main class="profile-page">
      <div class="profile-head">
        <div>
          <p class="eyebrow">LifeBand QR: ${escapeHtml(qr.qrId)}</p>
          <h1 class="profile-title">Sağlık Profili</h1>
        </div>
        <button class="button secondary" id="userSignOut" type="button">Çıkış yap</button>
      </div>
      <section class="card stack">
        ${statusMessage ? `<p class="alert" style="background:#dff7ec;color:#047857;">${escapeHtml(statusMessage)}</p>` : ""}
        <p class="muted small">
          Her alan için görünürlüğü siz seçersiniz: <strong>Gizli</strong> (sadece siz), <strong>Açık</strong> (QR'ı okutan herkes),
          <strong>Yarı görünür</strong> (herkese maskeli), <strong>Sağlık personeli</strong> (yalnızca onaylı personel).
        </p>
        <div class="template-row">
          <button class="button ghost" type="button" data-template="minimal">Minimal şablon</button>
          <button class="button ghost" type="button" data-template="emergency">Acil durum şablonu</button>
          <button class="button ghost" type="button" data-template="staffFocused">Personel odaklı şablon</button>
        </div>
        <form id="profileForm" class="form-grid">
          ${fieldRows}
          <button class="button field full" type="submit">Kaydet</button>
        </form>
      </section>
    </main>
  `;
  document.title = "LifeBand Sağlık Profili";

  document.querySelector("#userSignOut")?.addEventListener("click", async () => {
    await firebaseAuthApi.signOut(firebaseAuth);
    await render();
  });

  document.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
      const template = VISIBILITY_TEMPLATES[button.getAttribute("data-template")] || {};
      PROFILE_FIELDS.forEach((field) => {
        const select = document.querySelector(`#visibility-${field.key}`);
        if (!select) return;
        select.value = template[field.key] || "private";
      });
      toast("Şablon uygulandı. Kaydetmeyi unutmayın.");
    });
  });

  document.querySelector("#profileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newProfile = {};
    const newVisibility = {};
    PROFILE_FIELDS.forEach((field) => {
      newProfile[field.key] = cleanText(form.get(field.key));
      newVisibility[field.key] = String(form.get(`visibility-${field.key}`) || "private");
    });
    newProfile.fullName = `${newProfile.firstName} ${newProfile.lastName}`.trim();
    newVisibility.fullName = newVisibility.fullName || "masked";

    try {
      await saveProfileAndVisibility(qr.qrId, newProfile, newVisibility);
      toast("Profil kaydedildi.");
      await renderProfileEditor({ ...qr, status: "active" }, "Profil kaydedildi.");
    } catch (error) {
      console.error(error);
      toast("Kaydetme başarısız: " + error.message);
    }
  });
}

async function saveProfileAndVisibility(qrId, profile, visibility) {
  const uid = currentUser.uid;
  const qrRef = firestoreApi.doc(firestoreDb, "qrCodes", qrId);
  const qrSnap = await firestoreApi.getDoc(qrRef);
  if (qrSnap.exists() && qrSnap.data().status === "claimed") {
    await firestoreApi.updateDoc(qrRef, {
      status: "active",
      ownerUid: uid,
      activatedAt: firestoreApi.serverTimestamp()
    });
  }

  await firestoreApi.setDoc(
    firestoreApi.doc(firestoreDb, "profiles", uid),
    { ...profile, uid, updatedAt: firestoreApi.serverTimestamp() },
    { merge: true }
  );
  await firestoreApi.setDoc(
    firestoreApi.doc(firestoreDb, "visibilitySettings", uid),
    { uid, fields: visibility, updatedAt: firestoreApi.serverTimestamp() },
    { merge: true }
  );
  await firestoreApi.setDoc(
    firestoreApi.doc(firestoreDb, "publicProfiles", qrId),
    {
      qrId,
      ownerUid: uid,
      displayFields: compileDisplayFields(profile, visibility, "public"),
      visibility,
      updatedAt: firestoreApi.serverTimestamp()
    },
    { merge: true }
  );
  await firestoreApi.setDoc(
    firestoreApi.doc(firestoreDb, "staffProfiles", qrId),
    {
      qrId,
      ownerUid: uid,
      displayFields: compileDisplayFields(profile, visibility, "staff"),
      updatedAt: firestoreApi.serverTimestamp()
    },
    { merge: true }
  );
}

function renderAdminPanel(state) {
  const pendingCount = state.staffApplications.filter((x) => x.status === "pending").length;
  const activeQrCount = state.qrCodes.filter((x) => x.status === "active").length;
  const previewQr = selectPreviewQr(state);
  const previewUrl = publicUrl(previewQr.qrId);

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
          <a class="button secondary" href="/q/${encodeURIComponent(previewQr.qrId)}">Son QR</a>
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
              <a class="button secondary" href="/q/${encodeURIComponent(previewQr.qrId)}">Son QR profili</a>
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
              <div class="qr-box" id="qrCanvas" data-qr-canvas data-qr-url="${escapeAttr(previewUrl)}"></div>
            </div>
            <div class="qr-link" id="qrUrl">${escapeHtml(previewUrl)}</div>
            <div class="top-actions">
              <button class="button secondary" id="copyQr">Linki kopyala</button>
              <button class="button secondary" data-action="download-qr" data-id="${escapeAttr(previewQr.qrId)}" data-url="${escapeAttr(previewUrl)}">PNG indir</button>
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

  drawQrCanvases();
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
    .map((qr) => {
      const qrUrl = qr.url || publicUrl(qr.qrId);
      return `
      <tr>
        <td>
          <div class="qr-record">
            <div class="qr-mini" data-qr-canvas data-qr-size="76" data-qr-url="${escapeAttr(qrUrl)}"></div>
            <div>
              <strong>${escapeHtml(qr.qrId)}</strong><br>
              <span class="muted small">${escapeHtml(qr.owner || qr.claimEmail || "Henüz sahiplenilmedi")}</span><br>
              <span class="muted small">${escapeHtml(qrUrl)}</span>
            </div>
          </div>
        </td>
        <td>${formatDate(qr.createdAt)}</td>
        <td><span class="badge ${statusClass(qr.status)}">${statusLabel(qr.status)}</span></td>
        <td>${qr.scanCount || 0}</td>
        <td class="actions-cell">
          <a class="icon-button" title="Profili aç" href="/q/${encodeURIComponent(qr.qrId)}">↗</a>
          <button class="icon-button wide" title="QR PNG indir" data-action="download-qr" data-id="${escapeAttr(qr.qrId)}" data-url="${escapeAttr(qrUrl)}">PNG</button>
          <button class="icon-button danger" title="QR iptal et" data-action="revoke-qr" data-id="${escapeAttr(qr.qrId)}">×</button>
        </td>
      </tr>`;
    })
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
          <button class="icon-button ok" title="Onayla" data-action="staff-status" data-status="approved" data-id="${escapeAttr(item.id)}" data-uid="${escapeAttr(item.uid || "")}" data-title="${escapeAttr(item.title || "")}" data-hospital="${escapeAttr(item.hospital || item.organization || "")}">✓</button>
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
    const staffMode = await isCurrentApprovedStaff();
    const collectionName = staffMode ? "staffProfiles" : "publicProfiles";
    const profileSnapshot = await firestoreApi.getDoc(
      firestoreApi.doc(firestoreDb, collectionName, qrId)
    );
    if (profileSnapshot.exists()) {
      const profileDoc = profileSnapshot.data();
      if (profileDoc.status === "revoked") {
        renderInactiveQr(qrId);
        return;
      }

      const displayFields =
        profileDoc.displayFields ||
        compileDisplayFields(
          profileDoc.fields || {},
          profileDoc.visibility || {},
          staffMode ? "staff" : "public"
        );
      void logAccess(qrId, staffMode ? "staff" : "public");
      renderProfileCard(qrId, "Acil Sağlık Profili", displayFields, staffMode);
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

    renderProfileCard(qrId, "Profil henüz tamamlanmadı.", {}, false, true);
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
        claimedAt: firestoreApi.serverTimestamp(),
        claimFirstName: firstName,
        claimLastName: lastName,
        claimNationalId: nationalId
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

      toast("QR kaydı başlatıldı. Şimdi aynı e-posta ile giriş yapıp sağlık profilinizi doldurun.");
      navigateTo("/giris");
    } catch (error) {
      console.error(error);
      renderClaimForm(qrId, "QR kaydı başlatılamadı. Bilgileri kontrol edip tekrar deneyin.");
      bindClaimForm(qrId);
    }
  });
}

function renderProfileCard(qrId, title, displayFields, staffMode = false, incomplete = false) {
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
          ${
            staffMode
              ? `<span class="badge ok">Sağlık personeli görünümü</span>`
              : !firebaseReady
                ? `<span class="badge warn">Public görünüm (demo)</span>`
                : ""
          }
        </div>
        <div class="alert">
          Acil durumda bu bilgiler hastanın belirlediği görünürlük ayarlarına göre gösterilir.
        </div>
        <dl class="info-list">
          ${renderInfoItems(displayFields)}
        </dl>
        ${
          !firebaseReady
            ? `
          <div class="hero-actions">
            <a class="button" href="/q/${encodeURIComponent(qrId)}?staff=1">Sağlık personeli görünümü</a>
            <a class="button secondary" href="/q/${encodeURIComponent(qrId)}">Public görünüm</a>
          </div>`
            : !staffMode
              ? incomplete
                ? `<p class="footer-note"><a href="/giris">Bu QR'ın sahibi misiniz? Giriş yapıp profilinizi tamamlayın</a></p>`
                : `<p class="footer-note"><a href="/personel">Sağlık personeli misiniz? Giriş yapın</a> — onaylı hesaplar ek klinik bilgileri otomatik görür.</p>`
              : ""
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
      rememberLastQr(qrId);
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
    rememberLastQr(qrId);
    saveState(state);
    toast("Güvenli QR oluşturuldu.");
    await renderAdmin();
  });

  document.querySelectorAll("[data-action='download-qr']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.getAttribute("data-id") || "lifeband-qr";
      const url = button.getAttribute("data-url") || publicUrl(id);
      await downloadQrPng(id, url);
    });
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

        if (status === "approved") {
          const applicantUid = button.getAttribute("data-uid");
          if (applicantUid) {
            await firestoreApi.setDoc(
              firestoreApi.doc(firestoreDb, "medicalStaff", applicantUid),
              {
                status: "approved",
                applicationId: id,
                title: button.getAttribute("data-title") || "",
                hospital: button.getAttribute("data-hospital") || "",
                approvedAt: firestoreApi.serverTimestamp()
              },
              { merge: true }
            );
          }
        }

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

function selectPreviewQr(state) {
  const fallback = state.qrCodes[0] || defaultState.qrCodes[0];
  try {
    const lastQrId = sessionStorage.getItem(LAST_QR_KEY);
    const matched = state.qrCodes.find((qr) => qr.qrId === lastQrId);
    if (matched) return matched;
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
  return fallback;
}

function rememberLastQr(qrId) {
  try {
    sessionStorage.setItem(LAST_QR_KEY, qrId);
  } catch {
    // The QR still exists even when browser storage is unavailable.
  }
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

function drawQrCanvases() {
  document.querySelectorAll("[data-qr-canvas]").forEach((box) => {
    drawQrCanvas(box);
  });
}

function drawQrCanvas(box) {
  const url = box.getAttribute("data-qr-url");
  if (!url) return;
  const width = Number(box.getAttribute("data-qr-size") || 210);
  box.innerHTML = "";
  if (typeof window.qrcode !== "function") {
    box.textContent = "QR kütüphanesi yüklenemedi.";
    return;
  }
  try {
    box.appendChild(createQrCanvas(url, width, 1));
  } catch {
    box.textContent = "QR oluşturulamadı.";
  }
}

async function downloadQrPng(qrId, url) {
  try {
    const canvas = createQrCanvas(url, 720, 2);
    const link = document.createElement("a");
    link.download = `lifeband-${safeFileName(qrId)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast("QR PNG indiriliyor.");
  } catch {
    toast("QR indirilemedi. Linki kopyalayıp tekrar dene.");
  }
}

function createQrCanvas(url, width, margin) {
  if (typeof window.qrcode !== "function") {
    throw new Error("QRCode library unavailable");
  }

  const qr = window.qrcode(0, "M");
  qr.addData(url);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const quietZone = Math.max(0, margin);
  const cellSize = Math.max(1, Math.floor(width / (moduleCount + quietZone * 2)));
  const canvasSize = cellSize * (moduleCount + quietZone * 2);
  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvasSize, canvasSize);
  context.fillStyle = "#000000";

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        context.fillRect(
          (col + quietZone) * cellSize,
          (row + quietZone) * cellSize,
          cellSize,
          cellSize
        );
      }
    }
  }

  return canvas;
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

function safeFileName(value) {
  return String(value || "qr")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "qr";
}

function adminAuthError(error) {
  return authError(error, "Admin girişi yapılamadı.");
}

function authError(error, fallback) {
  const code = String(error?.code || "");
  if (code.includes("invalid-credential") || code.includes("wrong-password")) {
    return "E-posta veya şifre hatalı.";
  }
  if (code.includes("email-already-in-use")) {
    return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.";
  }
  if (code.includes("weak-password")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  return fallback;
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
