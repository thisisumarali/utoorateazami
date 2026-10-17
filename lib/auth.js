// Authentication utilities for Utoor Ate Azami Admin Panel

export const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || "salman@utoorate.com",
  password: process.env.ADMIN_PASSWORD || "azamis123",
  name: "Salman Azami",
  role: "Super Admin",
};

const SECRET_KEY_STRING = process.env.ADMIN_SESSION_SECRET || "utoor_azami_secret_key_salman_royal_attar_2026";

// Convert string to Uint8Array
function strToUint8(str) {
  return new TextEncoder().encode(str);
}

// Base64URL encode/decode helpers
function toBase64Url(str) {
  const base64 = typeof btoa !== "undefined"
    ? btoa(str)
    : Buffer.from(str).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(base64url) {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return typeof atob !== "undefined"
    ? atob(base64)
    : Buffer.from(base64, "base64").toString("utf-8");
}

// Sign payload using HMAC-SHA256
export async function signAdminToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    strToUint8(SECRET_KEY_STRING),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, strToUint8(data));
  const sigArray = Array.from(new Uint8Array(signature));
  const sigStr = String.fromCharCode.apply(null, sigArray);
  const encodedSignature = toBase64Url(sigStr);

  return `${data}.${encodedSignature}`;
}

// Verify token
export async function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      strToUint8(SECRET_KEY_STRING),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Reconstruct raw signature bytes
    const sigStr = fromBase64Url(encodedSignature);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, strToUint8(data));
    if (!isValid) return null;

    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}

// Check admin credentials with constant-time comparison to prevent timing attacks
export function validateAdminLogin(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const targetEmail = (ADMIN_CREDENTIALS.email || "").trim().toLowerCase();
  const inputPassword = password || "";
  const targetPassword = ADMIN_CREDENTIALS.password || "";

  if (!cleanEmail || !inputPassword || !targetEmail || !targetPassword) {
    return false;
  }

  // Constant-time email check
  let emailDiff = cleanEmail.length ^ targetEmail.length;
  const maxEmailLen = Math.max(cleanEmail.length, targetEmail.length);
  for (let i = 0; i < maxEmailLen; i++) {
    const a = cleanEmail.charCodeAt(i % cleanEmail.length) || 0;
    const b = targetEmail.charCodeAt(i % targetEmail.length) || 0;
    emailDiff |= a ^ b;
  }

  // Constant-time password check
  let passDiff = inputPassword.length ^ targetPassword.length;
  const maxPassLen = Math.max(inputPassword.length, targetPassword.length);
  for (let i = 0; i < maxPassLen; i++) {
    const a = inputPassword.charCodeAt(i % inputPassword.length) || 0;
    const b = targetPassword.charCodeAt(i % targetPassword.length) || 0;
    passDiff |= a ^ b;
  }

  return emailDiff === 0 && passDiff === 0;
}
