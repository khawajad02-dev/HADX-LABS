import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type OwnerTokenPayload = {
  type: "owner-login-challenge" | "owner-session";
  email: string;
  exp: number;
  codeHash?: string;
  nonce?: string;
};

function getSigningSecret(): string | null {
  const secret = [
    process.env.HADX_OWNER_SESSION_SECRET,
    process.env.HADX_ADMIN_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.STRIPE_SECRET_KEY,
    process.env.RESEND_API_KEY,
    process.env.CRON_SECRET,
  ].find((value) => value?.trim());
  return secret?.trim() || null;
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signEncodedPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function createToken(payload: OwnerTokenPayload): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${signEncodedPayload(encodedPayload, secret)}`;
}

function parseToken(token: string): OwnerTokenPayload | null {
  const secret = getSigningSecret();
  const [encodedPayload, signature] = token.split(".");
  if (!secret || !encodedPayload || !signature) return null;

  const expectedSignature = signEncodedPayload(encodedPayload, secret);
  const actual = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const decoded = decode(encodedPayload);
  if (!decoded) return null;
  try {
    const payload = JSON.parse(decoded) as OwnerTokenPayload;
    if (
      (payload.type !== "owner-login-challenge" && payload.type !== "owner-session") ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function normalizeOwnerEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getAllowedOwnerEmails(): string[] {
  const configured = [process.env.HADX_OWNER_EMAILS, process.env.HADX_OWNER_EMAIL, process.env.OWNER_EMAIL]
    .flatMap((value) => (value ? value.split(",") : []));

  // This is the public GitHub/Vercel account email already associated with the repository.
  // A deployment can override it through HADX_OWNER_EMAILS without changing source code.
  return [...configured, "khawajad02@gmail.com"]
    .map(normalizeOwnerEmail)
    .filter(Boolean);
}

export function isAllowedOwnerEmail(email: string): boolean {
  const normalized = normalizeOwnerEmail(email);
  const allowed = getAllowedOwnerEmails();
  return Boolean(normalized && allowed.length > 0 && allowed.includes(normalized));
}

export function createOwnerLoginChallenge(email: string, code: string): string | null {
  const codeHash = createHash("sha256").update(code).digest("hex");
  return createToken({
    type: "owner-login-challenge",
    email: normalizeOwnerEmail(email),
    codeHash,
    nonce: createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex"),
    exp: Date.now() + CHALLENGE_TTL_MS,
  });
}

export function consumeOwnerLoginChallenge(token: string, code: string): string | null {
  const payload = parseToken(token);
  if (!payload || payload.type !== "owner-login-challenge" || !payload.codeHash) return null;
  const providedHash = createHash("sha256").update(code.trim()).digest("hex");
  const actual = Buffer.from(providedHash, "utf8");
  const expected = Buffer.from(payload.codeHash, "utf8");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  return isAllowedOwnerEmail(payload.email) ? payload.email : null;
}

export function createOwnerSession(email: string): string | null {
  return createToken({
    type: "owner-session",
    email: normalizeOwnerEmail(email),
    exp: Date.now() + SESSION_TTL_MS,
  });
}

export function verifyOwnerSession(token: string): string | null {
  const payload = parseToken(token);
  if (!payload || payload.type !== "owner-session") return null;
  return isAllowedOwnerEmail(payload.email) ? payload.email : null;
}

export function isAdminRequest(req: Request): boolean {
  const serverSecret = getSigningSecret();
  const legacySecret = req.headers.get("x-admin-secret");
  if (serverSecret && legacySecret === serverSecret) return true;

  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  return Boolean(verifyOwnerSession(authorization.slice("Bearer ".length).trim()));
}

export function hasOwnerAuthConfiguration(): boolean {
  return Boolean(getSigningSecret() && getAllowedOwnerEmails().length > 0);
}
