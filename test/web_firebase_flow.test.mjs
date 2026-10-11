import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appJs = readFileSync("site/app.js", "utf8");
const indexHtml = readFileSync("site/index.html", "utf8");
const qrGenerator = readFileSync("site/qrcode-generator.js", "utf8");
const readme = readFileSync("site/README.md", "utf8");
const setup = readFileSync("docs/cloudflare-pages-setup.md", "utf8");

for (const symbol of [
  "getAuth",
  "signInWithEmailAndPassword",
  "signInAnonymously",
  "onAuthStateChanged",
  "doc",
  "getDoc",
  "setDoc",
  "updateDoc",
  "collection",
  "query",
  "where",
  "orderBy",
  "getDocs",
  "serverTimestamp"
]) {
  assert.match(appJs, new RegExp(`\\b${symbol}\\b`));
}

assert.match(appJs, /function renderAdminLogin/);
assert.match(appJs, /adminUsers/);
assert.match(appJs, /Bu hesap sistem admin değil/);
assert.match(appJs, /status: "unclaimed"/);
assert.match(appJs, /status: "claimed"/);
assert.match(appJs, /claimEmail/);
assert.match(appJs, /claimPhone/);
assert.match(appJs, /claimedAt/);
assert.match(appJs, /publicProfiles/);
assert.match(appJs, /renderClaimForm/);
assert.match(appJs, /signInAnonymously/);
assert.match(appJs, /function selectPreviewQr/);
assert.match(appJs, /sessionStorage\.setItem\(LAST_QR_KEY, qrId\)/);
assert.match(appJs, /data-qr-canvas/);
assert.match(appJs, /data-action="download-qr"/);
assert.match(appJs, /function downloadQrPng/);
assert.match(appJs, /window\.qrcode/);
assert.match(indexHtml, /src="\/qrcode-generator\.js"/);
assert.doesNotMatch(indexHtml, /cdn\.jsdelivr/);
assert.match(qrGenerator, /QR Code Generator for JavaScript/);
assert.match(qrGenerator, /var qrcode = function/);

const renderQrStart = appJs.indexOf("async function renderFirebaseQrProfile");
const publicProfileRead = appJs.indexOf('"publicProfiles", qrId', renderQrStart);
const qrCodeRead = appJs.indexOf('"qrCodes", qrId', renderQrStart);
assert.ok(renderQrStart > -1);
assert.ok(publicProfileRead > -1);
assert.ok(qrCodeRead > -1);
assert.ok(
  publicProfileRead < qrCodeRead,
  "QR public route must read publicProfiles before protected qrCodes"
);

assert.match(readme, /Email\/Password/);
assert.match(readme, /adminUsers/);
assert.match(setup, /--project tritech-lifeband/);
assert.match(setup, /adminUsers/);
