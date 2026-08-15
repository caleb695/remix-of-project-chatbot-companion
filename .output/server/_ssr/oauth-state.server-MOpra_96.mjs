import processModule from "node:process";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/oauth-state.server-MOpra_96.js
function secret() {
	const s = processModule.env.SUPABASE_SERVICE_ROLE_KEY || processModule.env.SUPABASE_PUBLISHABLE_KEY;
	if (!s) throw new Error("Missing signing secret");
	return s;
}
function b64url(buf) {
	return buf.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlDecode(str) {
	str = str.replace(/-/g, "+").replace(/_/g, "/");
	while (str.length % 4) str += "=";
	return Buffer.from(str, "base64");
}
function signState(payload) {
	const body = b64url(Buffer.from(JSON.stringify({
		...payload,
		iat: Date.now()
	})));
	return `${body}.${b64url(crypto.createHmac("sha256", secret()).update(body).digest())}`;
}
function verifyState(token, maxAgeMs = 900 * 1e3) {
	const [body, sig] = token.split(".");
	if (!body || !sig) throw new Error("Invalid state");
	const expected = b64url(crypto.createHmac("sha256", secret()).update(body).digest());
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error("Bad signature");
	const payload = JSON.parse(b64urlDecode(body).toString("utf8"));
	if (typeof payload.iat !== "number" || Date.now() - payload.iat > maxAgeMs) throw new Error("State expired");
	return payload;
}
//#endregion
export { signState, verifyState };
