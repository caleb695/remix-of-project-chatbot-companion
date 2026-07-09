import crypto from "node:crypto";

function secret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!s) throw new Error("Missing signing secret");
  return s;
}

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(str: string) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

export function signState(payload: Record<string, unknown>): string {
  const body = b64url(Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })));
  const sig = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyState(token: string, maxAgeMs = 15 * 60 * 1000): Record<string, unknown> {
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("Invalid state");
  const expected = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Bad signature");
  const payload = JSON.parse(b64urlDecode(body).toString("utf8")) as Record<string, unknown>;
  if (typeof payload.iat !== "number" || Date.now() - (payload.iat as number) > maxAgeMs) {
    throw new Error("State expired");
  }
  return payload;
}