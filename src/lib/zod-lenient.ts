// Lenient Zod wrappers for LLM tool arguments.
// Many models (especially OpenAI-compatible providers behind OpenRouter) emit
// JSON-encoded strings for array/object/boolean/number arguments instead of the
// real type, and the embedded JSON is frequently malformed in the same ways:
// raw newlines/tabs inside string values (invalid in JSON), an extra layer of
// escaping, or per-element stringification. Strict schemas then fail validation
// before the tool ever runs and the whole agent run dies with
// AI_InvalidToolInputError. These helpers coerce the common mistakes so tool
// calls succeed.
import { z } from "zod";

/** Escape control characters that appear raw inside a JSON string literal. */
function escapeBareControls(s: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of s) {
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      if (ch.charCodeAt(0) < 0x20) {
        out += "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0");
        continue;
      }
      out += ch;
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    out += ch;
  }
  return out;
}

/** Undo ONE layer of JSON.stringify escaping on a string's content. */
function unescapeOneLayer(s: string): string {
  let out = "";
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c !== "\\" || i + 1 >= n) {
      out += c;
      i++;
      continue;
    }
    const next = s[i + 1];
    switch (next) {
      case '"': out += '"'; i += 2; break;
      case "\\": out += "\\"; i += 2; break;
      case "n": out += "\n"; i += 2; break;
      case "r": out += "\r"; i += 2; break;
      case "t": out += "\t"; i += 2; break;
      case "/": out += "/"; i += 2; break;
      case "u": {
        const hex = s.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        } else {
          out += "\\u";
          i += 2;
        }
        break;
      }
      default:
        // Keep unknown escapes as-is (do not corrupt legitimate content).
        out += "\\" + next;
        i += 2;
    }
  }
  return out;
}

/**
 * Repair the classic LLM quote bug: unescaped `"` characters inside string
 * values. JSON structure is `{...}`/`[...]` containers whose member *keys*
 * are quoted strings that sit right after `{`/`,` — a quote followed by `:`
 * there is always a key boundary, and a quote followed by `,`/`}`/`]`/EOF
 * inside a container is a string end. Any other quote is an unescaped quote
 * inside a value and gets escaped. Backslash-escaped quotes are left alone.
 * Returns repaired text, or null when no stray quotes were found.
 */
function fixStrayQuotes(s: string): string | null {
  let out = "";
  let inString = false;
  let escaped = false;
  let repaired = false;
  let containerDepth = 0;
  let afterColon = false; // inside an object, expecting a value
  let prevSignificant = "";
  let i = 0;
  const n = s.length;
  const isWs = (c: string) => c === " " || c === "\t" || c === "\r" || c === "\n";
  const skipWs = (j: number) => {
    while (j < n && isWs(s[j])) j++;
    return j;
  };
  while (i < n) {
    const c = s[i];
    if (inString) {
      if (escaped) { out += c; escaped = false; i++; continue; }
      if (c === "\\") { out += c; escaped = true; i++; continue; }
      if (c === '"') {
        if (afterColon) {
          // Inside a container expecting a value: a quote here is the string
          // end only if the next non-ws char is a delimiter; otherwise it is
          // an unescaped quote inside the value.
          const j = skipWs(i + 1);
          const next = j >= n ? "" : s[j];
          if (next === "" || next === "," || next === "}" || next === "]") {
            inString = false;
            out += c;
          } else {
            out += '\\"'; // stray quote → escape it
            repaired = true;
          }
        } else if (containerDepth > 0 && (prevSignificant === "{" || prevSignificant === ",")) {
          // Key position right after { or , inside an object.
          const j = skipWs(i + 1);
          if (j < n && s[j] === ":") {
            inString = false;
            out += c;
          } else {
            out += '\\"';
            repaired = true;
          }
        } else {
          // Not after a colon, not a key — treat as a plain structural quote.
          inString = false;
          out += c;
        }
        i++;
        continue;
      }
      if (c === "\n") { out += "\\n"; repaired = true; i++; continue; }
      if (c === "\r") { out += "\\r"; repaired = true; i++; continue; }
      if (c === "\t") { out += "\\t"; repaired = true; i++; continue; }
      out += c;
      i++;
      continue;
    }
    // Outside string
    if (c === '"') {
      inString = true;
      afterColon = prevSignificant === ":";
      out += c;
      i++;
      continue;
    }
    if (c === "{" || c === "[") {
      containerDepth++;
      prevSignificant = c;
      out += c;
      i++;
      continue;
    }
    if (c === "}" || c === "]") {
      containerDepth = Math.max(0, containerDepth - 1);
      prevSignificant = c;
      out += c;
      i++;
      continue;
    }
    if (!isWs(c)) prevSignificant = c;
    out += c;
    i++;
  }
  return repaired ? out : null;
}

/**
 * Try to parse text as a JSON value with progressively stronger repairs.
 * Returns the parsed value, or undefined if every attempt failed.
 */
export function parseLenientJson(text: string): unknown | undefined {
  if (typeof text !== "string") return text;
  let s = text.trim();
  if (!s) return undefined;
  // Models occasionally wrap arguments in markdown code fences.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(s);
  if (fence) s = fence[1].trim();
  const looksJsonish = (x: string) => {
    const c = x.trim().charAt(0);
    return c === "[" || c === "{" || c === '"';
  };
  if (!looksJsonish(s)) return undefined;

  const attempts: string[] = [s];
  // Raw control characters inside string literals (very common).
  attempts.push(escapeBareControls(s));
  // One extra layer of JSON escaping on top (double-encoded).
  const u1 = unescapeOneLayer(s);
  attempts.push(u1);
  attempts.push(unescapeOneLayer(escapeBareControls(s)));
  // Unescaped quotes inside string values (fixed after control-escaping so
  // string boundaries are unambiguous).
  const strayEsc = fixStrayQuotes(escapeBareControls(s));
  if (strayEsc) attempts.push(strayEsc);
  const strayU1 = fixStrayQuotes(u1);
  if (strayU1) attempts.push(strayU1);
  // Two extra layers.
  attempts.push(unescapeOneLayer(unescapeOneLayer(s)));

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next repair */
    }
  }
  return undefined;
}

/** Parse a string that is itself a JSON value, or return it unchanged. */
function tryParse(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const parsed = parseLenientJson(v);
  return parsed === undefined ? v : parsed;
}

/**
 * Unwrap one element of an array argument: JSON strings decode to objects or
 * arrays; JSON strings of JSON strings (extra escaping layers) unwrap fully;
 * plain strings (file paths, find text) are preserved as-is.
 */
function unwrapItem(item: unknown, depth = 0): unknown {
  if (typeof item !== "string" || depth >= 4) return item;
  const t = item.trim();
  const c = t.charAt(0);
  if (c !== "[" && c !== "{" && c !== '"') return item;
  const parsed = parseLenientJson(t);
  if (parsed === undefined || parsed === item) return item;
  if (typeof parsed === "string") return unwrapItem(parsed, depth + 1);
  if (Array.isArray(parsed) || (parsed !== null && typeof parsed === "object")) return parsed;
  return item;
}

/**
 * Split an unparseable array-like string into top-level `{...}` chunks (quote
 * and backslash aware) and parse each chunk individually. Handles payloads
 * where the array as a whole is broken (e.g. a stray quote between elements)
 * but the individual objects are recoverable.
 */
function splitTopLevelChunks(s: string): string[] | null {
  const chunks: string[] = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    // Skip whitespace and separators until the next object/array start.
    while (i < n && /[\s,[\]]/.test(s[i])) i++;
    if (i >= n) break;
    if (s[i] !== "{") return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let start = i;
    for (; i < n; i++) {
      const c = s[i];
      if (inString) {
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') inString = false;
        continue;
      }
      if (c === '"') { inString = true; continue; }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          i++;
          chunks.push(s.slice(start, i));
          break;
        }
      }
    }
    if (depth !== 0) return null; // unbalanced — give up on splitting
  }
  return chunks.length ? chunks : null;
}

/**
 * Array schema that also accepts: a JSON string of an array, a JSON string of
 * a single item, per-item stringified JSON, arrays whose embedded JSON is
 * malformed in common model-specific ways (raw newlines, extra escaping
 * layer, stray quotes between elements), and a single bare item.
 */
export function lArray<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((v) => {
    // Fast path: real array (possibly with stringified items).
    if (Array.isArray(v)) return v.map((item) => unwrapItem(item));
    if (typeof v !== "string") {
      // null/undefined or a bare object (single item).
      return v === undefined || v === null ? v : [v];
    }
    const s = v.trim();
    if (!s) return []; // empty string → empty array (avoids hard failures on "").
    // Plain string where an array was expected (models often pass a single
    // item, e.g. one file path) → wrap as a one-element array.
    if (!/^[[{]/.test(s)) return [v];
    const parsed = tryParse(s);
    if (Array.isArray(parsed)) return parsed.map((item) => unwrapItem(item));
    if (parsed !== null && typeof parsed === "object") return [parsed];
    // Whole-string repairs failed. Try splitting the array text into chunks
    // and parsing each object individually.
    const chunks = splitTopLevelChunks(s);
    if (chunks) return chunks.map((chunk) => unwrapItem(chunk));
    // Nothing recovered it — keep the string so the inner schema reports a
    // precise per-element error (the repair hook can still fix it).
    return [v];
  }, z.array(inner));
}

/** Object that also accepts a JSON string. */
export function lObject<T extends z.ZodTypeAny>(inner: T) {
  return z.preprocess((v) => {
    if (typeof v !== "string") return v;
    const parsed = parseLenientJson(v);
    return parsed === undefined ? v : parsed;
  }, inner) as unknown as T;
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
