export function compileDisplayFields(profile, settings = {}, mode = "public") {
  const displayFields = {};

  for (const [key, rawValue] of Object.entries(profile || {})) {
    const value = String(rawValue ?? "").trim();
    if (!value) continue;

    const level = settings[key] || "private";
    if (level === "public") {
      displayFields[key] = value;
      continue;
    }

    if (level === "masked") {
      displayFields[key] = maskField(key, value);
      continue;
    }

    if (level === "staff" && mode === "staff") {
      displayFields[key] = value;
    }
  }

  return displayFields;
}

export function maskField(fieldKey, value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  if (fieldKey === "nationalId") {
    return maskNationalId(text);
  }

  if (fieldKey === "phone") {
    return maskPhone(text);
  }

  if (fieldKey === "email") {
    return maskEmail(text);
  }

  if (fieldKey === "fullName") {
    return maskFullName(text);
  }

  if (text.length <= 2) {
    return "*".repeat(text.length);
  }

  return `${text.slice(0, 1)}${"*".repeat(Math.max(1, text.length - 2))}${text.slice(-1)}`;
}

function maskNationalId(value) {
  const digits = onlyDigits(value);
  if (digits.length < 5) {
    return maskGenericDigits(digits);
  }
  return `${digits.slice(0, 2)}${"*".repeat(Math.max(1, digits.length - 4))}${digits.slice(-2)}`;
}

function maskPhone(value) {
  const digits = onlyDigits(value);
  if (digits.length < 6) {
    return maskGenericDigits(digits);
  }
  return `${digits.slice(0, 2)}** *** ** ${digits.slice(-2)}`;
}

function maskEmail(value) {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) return maskField("generic", value);
  return `${localPart.slice(0, 1)}***@${domain}`;
}

function maskFullName(value) {
  const names = value.split(/\s+/).filter(Boolean);
  if (names.length === 1) return maskField("generic", value);
  return `${names[0]} ${names[names.length - 1].slice(0, 1)}.`;
}

function maskGenericDigits(value) {
  if (!value) return "";
  if (value.length <= 2) return "*".repeat(value.length);
  return `${value.slice(0, 1)}${"*".repeat(value.length - 2)}${value.slice(-1)}`;
}

function onlyDigits(value) {
  return String(value).replace(/\D/g, "");
}
