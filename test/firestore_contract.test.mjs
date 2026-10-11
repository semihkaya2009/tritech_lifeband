import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rules = readFileSync("firestore.rules", "utf8");
const indexes = JSON.parse(readFileSync("firestore.indexes.json", "utf8"));
const securityModel = readFileSync("docs/security-model.md", "utf8");
const firebaseRc = JSON.parse(readFileSync(".firebaserc", "utf8"));

assert.match(rules, /match \/adminUsers\/\{uid\}/);
assert.match(rules, /documents\/adminUsers\/\$\(request\.auth\.uid\)/);
assert.match(rules, /request\.resource\.data\.status == 'unclaimed'/);
assert.match(rules, /claimEmail/);
assert.match(rules, /claimPhone/);
assert.match(rules, /claimedAt/);
assert.match(rules, /claimUid/);
assert.match(rules, /ownerUid/);
assert.match(rules, /match \/visibilitySettings\/\{uid\}/);
assert.match(rules, /match \/users\/\{uid\}/);

const indexKeys = indexes.indexes.map((index) =>
  [
    index.collectionGroup,
    ...index.fields.map((field) => `${field.fieldPath}:${field.order}`)
  ].join("|")
);

assert.ok(indexKeys.includes("qrCodes|claimEmail:ASCENDING|status:ASCENDING"));
assert.ok(indexKeys.includes("qrCodes|ownerUid:ASCENDING|createdAt:DESCENDING"));
assert.ok(indexKeys.includes("qrCodes|status:ASCENDING|createdAt:DESCENDING"));
assert.ok(indexKeys.includes("staffApplications|status:ASCENDING|createdAt:DESCENDING"));

assert.match(securityModel, /adminUsers/);
assert.match(securityModel, /unclaimed/);
assert.match(securityModel, /claimed/);
assert.match(securityModel, /active/);
assert.match(securityModel, /revoked/);

assert.equal(firebaseRc.projects.default, "tritech-lifeband");
