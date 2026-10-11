# Real LifeBand MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Firebase-backed LifeBand MVP where admin-created QR codes can be claimed by real users, managed in the Android app, and displayed through public/staff visibility rules.

**Architecture:** Firestore is the source of truth. The web Worker static site handles public QR pages and the system admin panel, while the Flutter Android app handles authenticated user profile editing and visibility selection. Public QR pages read only precomputed `publicProfiles` documents so full medical profiles are not exposed to anonymous users.

**Tech Stack:** Flutter/Dart, Firebase Auth, Cloud Firestore, Cloudflare Workers static assets, vanilla HTML/CSS/JavaScript.

**Spec:** `docs/superpowers/specs/2026-10-11-real-lifeband-mvp-design.md`

## Global Constraints

- Backend remains Firebase Auth + Firestore.
- Web remains deployed on Cloudflare Workers static assets.
- QR URLs use `https://tritech-lifeband.semihkayaa2009.workers.dev/q/LB_randomToken`.
- QR tokens must not include TC, phone, user id, dates, or sequential counters.
- Admin UI lives under `/admin`; public landing page must not expose admin data.
- Admin access is protected by Cloudflare Access and Firebase-side admin authorization.
- Public QR pages must read `publicProfiles/{qrId}`, not full `profiles/{uid}`.
- Visibility modes are exactly `private`, `public`, `staff`, and `masked`.
- MVP excludes hospital admin, Telegram verification, AI profile updates, doctor writes, and family doctor restrictions.

## Review Focus

- Unclaimed QR opened by a stranger: `/q/:qrId` must show claim form, not medical profile. Covered in Task 4 web route smoke test.
- Claimed QR opened anonymously: only `publicProfiles/{qrId}.displayFields` may render. Covered in Task 4 public profile rendering test.
- Masked fields: TC, phone, email, and name must never leak full values in public mode. Covered in Task 1 Dart tests and Task 2 JS tests.
- Wrong mobile account: user with different email must not attach another user's claimed QR. Covered in Task 3 rules review checklist and Task 6 mobile query test.
- Admin page: `/` must not render admin tables or QR generation controls. Covered in Task 4 route smoke test.

---

## File Structure

- `lib/src/models/lifeband_profile.dart`: typed profile, QR, visibility, and public profile models for Flutter.
- `lib/src/utils/visibility_masker.dart`: pure Dart masking and public profile compiler.
- `test/visibility_masker_test.dart`: Dart tests for visibility and masks.
- `lib/src/services/auth_service.dart`: email/password auth, registration, anonymous sign-in only where explicitly needed.
- `lib/src/services/firestore_service.dart`: Firestore reads/writes for QR, profile, visibility, public profile, and staff application records.
- `lib/src/providers/lifeband_provider.dart`: authenticated app state for user QR codes, profile, visibility settings.
- `lib/src/screens/auth_screen.dart`: email login/register.
- `lib/src/screens/qr_list_screen.dart`: user's claimed QR records.
- `lib/src/screens/profile_edit_screen.dart`: health profile editing.
- `lib/src/screens/visibility_settings_screen.dart`: per-field visibility and templates.
- `lib/src/screens/qr_scan_screen.dart`: QR parsing plus authenticated claim/open flow.
- `site/app.js`: web routing for `/`, `/q/:qrId`, and `/admin`.
- `site/visibility.js`: JS masking and public display helpers used by web routes.
- `site/visibility.test.mjs`: Node tests for JS masking helpers.
- `site/config.js`: Firebase Web App config, user-filled after Firebase Console Web App creation.
- `firestore.rules`: real rules for admin, QR claim, profile, visibility, public profile, staff, and logs.
- `firestore.indexes.json`: required Firestore indexes for owner email/uid, status, and admin lists.
- `docs/cloudflare-pages-setup.md`: update with real Firebase Web App and Cloudflare Access steps.

## Task 1: Dart Domain Models and Visibility Compiler

**Files:**
- Create: `lib/src/models/lifeband_profile.dart`
- Create: `lib/src/utils/visibility_masker.dart`
- Create: `test/visibility_masker_test.dart`
- Modify: `lib/src/models/device.dart`

**Interfaces:**
- Produces: `enum VisibilityLevel { private, public, staff, masked }`
- Produces: `class LifeBandProfile`, `class QrCodeRecord`, `class VisibilitySettings`, `class PublicProfile`
- Produces: `Map<String, String> compilePublicFields(LifeBandProfile profile, VisibilitySettings settings)`
- Produces: `String maskField(String fieldKey, String value)`
- Consumes: existing `Device` only for temporary compatibility while old screens are migrated.

- [ ] **Step 1: Write failing tests for mask output**

Add tests in `test/visibility_masker_test.dart` asserting:

```dart
expect(maskField('nationalId', '12345678901'), '12*******01');
expect(maskField('phone', '05321234567'), '05** *** ** 67');
expect(maskField('email', 'mehmet@example.com'), 'm***@example.com');
expect(maskField('fullName', 'Mehmet Yilmaz'), 'Mehmet Y.');
```

- [ ] **Step 2: Run tests to verify failure**

Run: `flutter test test/visibility_masker_test.dart`
Expected: FAIL because `visibility_masker.dart` does not exist.

- [ ] **Step 3: Implement models and `maskField`**

Create `lib/src/models/lifeband_profile.dart` with `fromMap`/`toMap` methods for each model. Create `lib/src/utils/visibility_masker.dart` with `maskField(String fieldKey, String value) -> String` and `compilePublicFields(LifeBandProfile profile, VisibilitySettings settings) -> Map<String, String>`.

- [ ] **Step 4: Add compiler tests**

Add tests asserting `public` fields are emitted as full values, `masked` fields are emitted masked, and `private`/`staff` fields are omitted from anonymous public output.

- [ ] **Step 5: Run test**

Run: `flutter test test/visibility_masker_test.dart`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/src/models/lifeband_profile.dart lib/src/utils/visibility_masker.dart test/visibility_masker_test.dart lib/src/models/device.dart
git commit -m "Add LifeBand profile visibility models"
```

## Task 2: Web Visibility Helpers and Public/Admin Route Split

**Files:**
- Create: `site/visibility.js`
- Create: `site/visibility.test.mjs`
- Modify: `site/app.js`
- Modify: `site/styles.css`

**Interfaces:**
- Consumes: same visibility names from Task 1 as string values.
- Produces: `maskField(fieldKey, value)`, `compileDisplayFields(profile, settings, mode)` exported from `site/visibility.js`.
- Produces: route behavior where `/` renders public landing, `/admin` renders admin panel, `/q/:qrId` renders QR flow.

- [ ] **Step 1: Write failing JS mask tests**

Create `site/visibility.test.mjs` using Node's built-in `assert`:

```js
import assert from "node:assert/strict";
import { maskField, compileDisplayFields } from "./visibility.js";

assert.equal(maskField("nationalId", "12345678901"), "12*******01");
assert.equal(maskField("phone", "05321234567"), "05** *** ** 67");
assert.equal(maskField("email", "mehmet@example.com"), "m***@example.com");
assert.equal(maskField("fullName", "Mehmet Yilmaz"), "Mehmet Y.");
```

- [ ] **Step 2: Run test to verify failure**

Run: `node site/visibility.test.mjs`
Expected: FAIL because `site/visibility.js` does not exist.

- [ ] **Step 3: Implement `site/visibility.js`**

Export `maskField(fieldKey, value) -> string` and `compileDisplayFields(profile, settings, mode) -> object`. `mode` is `public` or `staff`; staff mode includes `staff` fields.

- [ ] **Step 4: Split web routes**

Modify `site/app.js` so:
- `/` calls `renderLanding()`.
- `/admin` calls `renderAdmin()`.
- `/q/:qrId` calls `renderQrProfile(qrId)`.
- `renderLanding()` must not include `Yeni QR oluştur`, staff application table, or QR manager table.

- [ ] **Step 5: Add route smoke checks**

Run local server:

```bash
python3 -m http.server 8788 --directory site
```

Then check:

```bash
curl -s http://127.0.0.1:8788/ | rg "LifeBand Admin|Yeni QR oluştur" && false || true
curl -s http://127.0.0.1:8788/app.js | rg "renderLanding"
```

Expected: first command returns no admin terms; second finds `renderLanding`.

- [ ] **Step 6: Run tests and syntax checks**

Run:

```bash
node site/visibility.test.mjs
node --check site/app.js
node --check site/visibility.js
```

Expected: PASS/no syntax errors.

- [ ] **Step 7: Commit**

```bash
git add site/app.js site/styles.css site/visibility.js site/visibility.test.mjs
git commit -m "Split public and admin web routes"
```

## Task 3: Firestore Rules and Indexes for Real QR Lifecycle

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`
- Modify: `docs/security-model.md`

**Interfaces:**
- Consumes: collection names from the spec: `adminUsers`, `users`, `qrCodes`, `profiles`, `visibilitySettings`, `publicProfiles`, `staffApplications`, `medicalStaff`, `accessLogs`.
- Produces: rules that permit admin QR creation, user QR claiming/attachment, owner profile writes, public profile reads, and admin-only review.

- [ ] **Step 1: Update rules for admin users**

Add `adminUsers/{uid}` rule and `isSystemAdmin()` implementation that returns true when either `request.auth.token.systemAdmin == true` or `exists(/databases/$(database)/documents/adminUsers/$(request.auth.uid))`.

- [ ] **Step 2: Update QR lifecycle rules**

Allow:
- system admin creates `qrCodes/{qrId}` with `status == 'unclaimed'`.
- anonymous or signed-in user updates unclaimed QR to set `status == 'claimed'`, `claimEmail`, `claimPhone`, and `claimedAt`.
- signed-in email user with `request.auth.token.email == resource.data.claimEmail` sets `ownerUid == request.auth.uid` and `status == 'active'`.
- owner or admin can set `status == 'revoked'`.

- [ ] **Step 3: Update profile and visibility rules**

Allow only owner or admin to read/write `profiles/{uid}` and `visibilitySettings/{uid}`. Allow public read on `publicProfiles/{qrId}` only. Allow owner/admin to write `publicProfiles` when `ownerUid == request.auth.uid`.

- [ ] **Step 4: Update indexes**

Add indexes for:
- `qrCodes`: `claimEmail ASC`, `status ASC`
- `qrCodes`: `ownerUid ASC`, `createdAt DESC`
- `qrCodes`: `status ASC`, `createdAt DESC`
- `staffApplications`: `status ASC`, `createdAt DESC`

- [ ] **Step 5: Validate deploy dry-run**

Run:

```bash
firebase deploy --only firestore:rules,firestore:indexes --dry-run
```

Expected: no rules syntax failure. If Firebase requires login/project confirmation, document that deployment validation was blocked by auth, then run local JSON validation for `firestore.indexes.json`.

- [ ] **Step 6: Commit**

```bash
git add firestore.rules firestore.indexes.json docs/security-model.md
git commit -m "Update Firestore rules for QR lifecycle"
```

## Task 4: Firebase-Backed Web Admin and QR Claim Flow

**Files:**
- Modify: `site/app.js`
- Modify: `site/config.example.js`
- Modify: `site/README.md`
- Modify: `docs/cloudflare-pages-setup.md`

**Interfaces:**
- Consumes: `maskField` and `compileDisplayFields` from `site/visibility.js`.
- Consumes: Firestore collections and rules from Task 3.
- Produces: web admin Firebase sign-in, QR creation, QR claim form, public profile read.

- [ ] **Step 1: Add Firebase Auth imports**

In `site/app.js`, extend `initFirebase()` to import `getAuth`, `signInWithEmailAndPassword`, `signInAnonymously`, `onAuthStateChanged`, and Firestore helpers: `doc`, `getDoc`, `setDoc`, `updateDoc`, `collection`, `query`, `where`, `orderBy`, `getDocs`, `serverTimestamp`.

- [ ] **Step 2: Implement admin sign-in gate**

Add `renderAdminLogin()` for `/admin` when no Firebase user is signed in. On login, check `adminUsers/{uid}` exists before rendering admin panel. If missing, show `Bu hesap sistem admin değil`.

- [ ] **Step 3: Implement QR generation**

Replace localStorage QR generation with Firestore `qrCodes/{qrId}` write:

```js
{
  qrId,
  tokenHash: await sha256Hex(qrId),
  status: "unclaimed",
  createdBy: auth.currentUser.uid,
  createdAt: serverTimestamp(),
  scanCount: 0
}
```

- [ ] **Step 4: Implement `/q/:qrId` real read**

`renderQrProfile(qrId)` reads `qrCodes/{qrId}`:
- missing or `revoked`: show inactive QR.
- `unclaimed`: show claim form.
- `claimed` or `active`: read `publicProfiles/{qrId}` and render `displayFields`.

- [ ] **Step 5: Implement claim form**

Claim form fields: first name, last name, email, phone, optional TC. Submit signs in anonymously if needed, updates QR status to `claimed`, writes `claimEmail`, `claimPhone`, `claimedAt`, and creates a minimal `publicProfiles/{qrId}` with display fields based on default minimal visibility.

- [ ] **Step 6: Web checks**

Run:

```bash
node --check site/app.js
node site/visibility.test.mjs
npx --yes wrangler deploy --dry-run
```

Expected: syntax pass and Wrangler reads assets from `/site`.

- [ ] **Step 7: Commit**

```bash
git add site/app.js site/config.example.js site/README.md docs/cloudflare-pages-setup.md
git commit -m "Connect web QR flow to Firebase"
```

## Task 5: Flutter Email Auth and QR Ownership State

**Files:**
- Modify: `lib/main.dart`
- Modify: `lib/src/services/auth_service.dart`
- Modify: `lib/src/services/firestore_service.dart`
- Create: `lib/src/providers/lifeband_provider.dart`
- Create: `lib/src/screens/auth_screen.dart`
- Create: `lib/src/screens/qr_list_screen.dart`
- Modify: `lib/src/screens/home_screen.dart`

**Interfaces:**
- Consumes: models from Task 1.
- Produces: `AuthService.signInWithEmailPassword(String email, String password)`, `AuthService.registerWithEmailPassword(String email, String password)`.
- Produces: `FirestoreService.qrCodesForUser(String uid, String email)`, `FirestoreService.attachClaimedQrToUser(QrCodeRecord qr, String uid)`.
- Produces: `LifeBandProvider` exposing `qrCodes`, `profile`, `visibilitySettings`, `loading`, `refresh()`.

- [ ] **Step 1: Write AuthService tests by inspection boundary**

No Firebase Auth emulator is configured. Add no fake Firebase tests here; instead keep this task's runnable tests focused on pure models from Task 1 and verify the service with analyzer. Record this in commit message body if needed.

- [ ] **Step 2: Update auth service**

Add email/password register/login methods and remove unconditional anonymous sign-in from `main.dart`. Keep `signInAnonymously()` only for QR scanner or web claim compatibility.

- [ ] **Step 3: Add `AuthScreen`**

Create a simple email/password screen with login/register toggle. On success, app enters authenticated home.

- [ ] **Step 4: Add `LifeBandProvider`**

Listen to auth state. For signed-in users:
- query `qrCodes` where `ownerUid == uid`.
- query `qrCodes` where `claimEmail == user.email && status == 'claimed'`, then call `attachClaimedQrToUser`.
- expose combined QR list.

- [ ] **Step 5: Add `QrListScreen` and update Home**

Home should show authenticated user's QR list and remove old "Demo Hazır" copy. `QrListScreen` opens profile edit for the selected QR.

- [ ] **Step 6: Run checks**

Run:

```bash
flutter analyze
flutter test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/main.dart lib/src/services/auth_service.dart lib/src/services/firestore_service.dart lib/src/providers/lifeband_provider.dart lib/src/screens/auth_screen.dart lib/src/screens/qr_list_screen.dart lib/src/screens/home_screen.dart
git commit -m "Add mobile email auth and QR ownership"
```

## Task 6: Flutter Profile Editing, Visibility Templates, and Public Profile Sync

**Files:**
- Create: `lib/src/screens/profile_edit_screen.dart`
- Create: `lib/src/screens/visibility_settings_screen.dart`
- Modify: `lib/src/services/firestore_service.dart`
- Modify: `lib/src/providers/lifeband_provider.dart`
- Modify: `test/visibility_masker_test.dart`

**Interfaces:**
- Consumes: `compilePublicFields` from Task 1.
- Produces: `FirestoreService.saveProfileAndVisibility({required String uid, required String qrId, required LifeBandProfile profile, required VisibilitySettings visibility})`.
- Produces: visibility templates `minimal`, `emergency`, `staffFocused`, `custom`.

- [ ] **Step 1: Add template tests**

Extend `test/visibility_masker_test.dart` to assert:
- `minimal` exposes blood type, emergency contact, allergies.
- `staffFocused` marks chronic diseases and medications as `staff`.
- private fields do not appear in `compilePublicFields`.

- [ ] **Step 2: Implement template helpers**

Add template factory methods to `VisibilitySettings`: `minimal()`, `emergency()`, `staffFocused()`.

- [ ] **Step 3: Implement profile edit screen**

Fields: first name, last name, TC, phone, email, birth date text, blood type, allergies, chronic diseases, medications, emergency contact, notes.

- [ ] **Step 4: Implement visibility settings screen**

Show each profile field with segmented choices: Gizli, Açık, Sağlık personeli, Yarı görünür. Include template selector buttons.

- [ ] **Step 5: Save full and public data**

`saveProfileAndVisibility` writes:
- `profiles/{uid}`
- `visibilitySettings/{uid}`
- `publicProfiles/{qrId}` with `displayFields: compilePublicFields(...)`
- updates `qrCodes/{qrId}.status` to `active` if it was `claimed`

- [ ] **Step 6: Run checks**

Run:

```bash
flutter analyze
flutter test
flutter build apk --release
```

Expected: PASS and APK generated.

- [ ] **Step 7: Commit**

```bash
git add lib/src/screens/profile_edit_screen.dart lib/src/screens/visibility_settings_screen.dart lib/src/services/firestore_service.dart lib/src/providers/lifeband_provider.dart test/visibility_masker_test.dart
git commit -m "Add profile visibility controls"
```

## Task 7: QR Scanner and Mobile/Web Visual Alignment

**Files:**
- Modify: `lib/src/screens/qr_scan_screen.dart`
- Modify: `lib/src/app_theme.dart`
- Modify: `lib/src/widgets/device_tile.dart`
- Modify: `site/styles.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: `EmergencyDemo.extractQrToken` or replaces it with a production `QrTokenParser`.
- Produces: scanner behavior for real `LB_...` QR URLs.

- [ ] **Step 1: Rename demo parser**

Move QR URL parsing into a production utility: `lib/src/utils/qr_token_parser.dart` with `String? extractQrToken(String rawValue)`.

- [ ] **Step 2: Add parser tests**

Create `test/qr_token_parser_test.dart` asserting direct `LB_...`, `/q/LB_...`, and `?id=LB_...` inputs extract the same token and invalid text returns null.

- [ ] **Step 3: Update QR scanner**

If user is signed in and scans an active QR owned by them, open the QR/profile. If QR is unclaimed, show message to claim through web or in-app claim flow. If unsigned, navigate to auth first.

- [ ] **Step 4: Align visual style**

Update Flutter theme and screen copy to match web: white/light background, teal primary, restrained cards, no heavy glass demo language.

- [ ] **Step 5: Update README**

Document real setup: Firebase Web App config, Cloudflare Access for `/admin*`, first admin bootstrap via `adminUsers/{uid}`, Firestore rules deploy, Android APK build.

- [ ] **Step 6: Run full checks**

Run:

```bash
flutter analyze
flutter test
node site/visibility.test.mjs
node --check site/app.js
npx --yes wrangler deploy --dry-run
flutter build apk --release
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add lib/src/screens/qr_scan_screen.dart lib/src/app_theme.dart lib/src/widgets/device_tile.dart lib/src/utils/qr_token_parser.dart test/qr_token_parser_test.dart site/styles.css README.md
git commit -m "Polish real LifeBand mobile and QR flow"
```

## Task 8: Deploy and Handoff

**Files:**
- Modify if needed: `site/config.js`
- No source changes otherwise unless verification reveals a defect.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: live Cloudflare site and Android release APK for the real MVP.

- [ ] **Step 1: Confirm Firebase Web App config**

Ensure `site/config.js` contains real Web App config from Firebase Console. Do not commit private secrets; Firebase web config is public, but never add service account keys.

- [ ] **Step 2: Deploy Firestore rules**

Run:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

Expected: deploy succeeds.

- [ ] **Step 3: Push source**

Run:

```bash
git push origin main
```

Expected: Cloudflare build reaches Ready for latest commit.

- [ ] **Step 4: Smoke test live web**

Check:
- `/` shows public landing.
- `/admin` is blocked by Cloudflare Access before admin UI.
- `/q/:qrId` shows claim form for unclaimed QR.
- claimed QR shows only public/masked fields.

- [ ] **Step 5: Build Android APK**

Run:

```bash
flutter build apk --release
shasum -a 256 build/app/outputs/flutter-apk/app-release.apk
```

Expected: APK builds and checksum recorded.

- [ ] **Step 6: Final handoff**

Report:
- live URL
- admin setup status
- APK path and SHA-256
- any manual Firebase Console steps still needed
- known MVP limitations
