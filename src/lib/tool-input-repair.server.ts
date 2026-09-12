// Deterministic repair for tool calls the model formatted badly.
//
// The AI SDK's `repairToolCall` hook lets us fix a tool call that failed to
// parse/validate INSTEAD of killing the whole run with AI_InvalidToolInputError.
// The dominant failure mode is models passing array arguments as JSON-encoded
// strings (often double-encoded or with raw newlines) — exactly the payloads
// zod-lenient's lArray already tolerates at schema level. This helper applies
// the same tolerance to the raw arguments text so the re-validated call passes.
import { parseLenientJson } from "./zod-lenient";

// Every in-page/runner tool argument that is schema-typed as an ARRAY and gets
// stringified by models. Keyed by name at any depth so free-text string
// arguments (e.g. notebook `source`, which may legitimately start with "{" for
// .ipynb JSON) are never touched.
const ARRAY_KEYS = new Set(["edits", "paths"]);

function parseItem(item: unknown): unknown {
  if (typeof item !== "string") return item;
  const parsed = parseLenientJson(item);
  if (parsed !== undefined && (Array.isArray(parsed) || (parsed !== null && typeof parsed === "object"))) {
    return parsed;
  }
  return item;
}

/**
 * Fully unwrap a value that may be a JSON string of JSON strings (the model's
 * extra escaping layers). Stops at the first real object/array, or returns the
 * original when nothing decodes.
 */
function unwrapValue(v: unknown, depth = 0): unknown {
  if (typeof v !== "string" || depth >= 4) return v;
  const t = v.trim();
  const c = t.charAt(0);
  if (c !== "[" && c !== "{" && c !== '"') return v;
  const parsed = parseLenientJson(t);
  if (parsed === undefined) return v;
  if (typeof parsed === "string") return unwrapValue(parsed, depth + 1);
  if (Array.isArray(parsed) || (parsed !== null && typeof parsed === "object")) return parsed;
  return v;
}

/** Best-effort fix of tool args text. Returns re-serialized JSON or null. */
export function repairToolInput(toolName: string, rawArgs: string): string | null {
  if (typeof rawArgs !== "string") return null;
  let value: unknown;
  let parsedRaw = true;
  try {
    value = JSON.parse(rawArgs.trim() === "" ? "{}" : rawArgs);
  } catch {
    parsedRaw = false;
    value = parseLenientJson(rawArgs);
    if (value === undefined) return null; // nothing can be done with this text
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    // Args should always be an object; if the whole thing decodes to an array
    // it cannot match any tool schema.
    return null;
  }
  const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
  let changed = !parsedRaw;
  for (const key of Object.keys(out)) {
    if (!ARRAY_KEYS.has(key)) continue;
    const v = out[key];
    if (typeof v === "string") {
      const unwrapped = unwrapValue(v);
      if (Array.isArray(unwrapped)) {
        out[key] = unwrapped.map(parseItem);
        changed = true;
      } else if (unwrapped !== null && typeof unwrapped === "object") {
        out[key] = [unwrapped];
        changed = true;
      }
    } else if (Array.isArray(v)) {
      const mapped = v.map(parseItem);
      if (mapped.some((el, i) => el !== v[i])) {
        out[key] = mapped;
        changed = true;
      }
    }
  }
  return changed ? JSON.stringify(out) : null;
}
