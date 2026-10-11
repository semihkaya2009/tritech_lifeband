import assert from "node:assert/strict";
import { compileDisplayFields, maskField } from "./visibility.js";

assert.equal(maskField("nationalId", "12345678901"), "12*******01");
assert.equal(maskField("phone", "05321234567"), "05** *** ** 67");
assert.equal(maskField("email", "mehmet@example.com"), "m***@example.com");
assert.equal(maskField("fullName", "Mehmet Yilmaz"), "Mehmet Y.");

const fields = compileDisplayFields(
  {
    bloodType: "A Rh+",
    nationalId: "12345678901",
    phone: "05321234567",
    medications: "Insulin"
  },
  {
    bloodType: "public",
    nationalId: "masked",
    phone: "private",
    medications: "staff"
  },
  "public"
);

assert.deepEqual(fields, {
  bloodType: "A Rh+",
  nationalId: "12*******01"
});
