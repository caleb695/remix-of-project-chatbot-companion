// Lenient Zod wrappers for LLM tool arguments.
// Many models (especially OpenAI-compatible providers behind OpenRouter) emit
// JSON-encoded strings for array/object/boolean/number arguments instead of the
// real type. Strict schemas then fail validation before the tool ever runs.
// These helpers coerce the common mistakes so tool calls succeed.
import { z } from "zod";

function tryParse(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  if (!/^[[{]/.test(s)) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
}

/** Array that also accepts a JSON string, or a single item. */
export function lArray<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((v) => {
    const parsed = tryParse(v);
    if (Array.isArray(parsed)) return parsed.map(tryParse);
    if (parsed === undefined || parsed === null) return parsed;
    return [parsed];
  }, z.array(inner));
}

/** Object that also accepts a JSON string. */
export function lObject<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((v) => tryParse(v), inner) as unknown as T;
}

/** Boolean that also accepts "true"/"false"/"1"/"0"/1/0. */
export const lBool = z.preprocess((v) => {
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "yes" || s === "1") return true;
    if (s === "false" || s === "no" || s === "0" || s === "") return false;
  }
  if (typeof v === "number") return v !== 0;
  return v;
}, z.boolean());

/** Number that also accepts numeric strings. */
export const lNum = z.preprocess((v) => {
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return v;
}, z.number());

/** String that also accepts numbers/booleans (models sometimes send raw values). */
export const lStr = z.preprocess((v) => {
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return v;
}, z.string());
