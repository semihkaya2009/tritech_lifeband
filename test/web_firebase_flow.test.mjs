import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appJs = readFileSync("site/app.js", "utf8");
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

assert.match(readme, /Email\/Password/);
assert.match(readme, /adminUsers/);
assert.match(setup, /--project tritech-lifeband/);
assert.match(setup, /adminUsers/);
