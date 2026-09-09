/* Isomorphic line-based diff used by the staged-change review UIs (GitHub
 * working copy and Kaggle notebooks). Produces a compact unified-diff patch.
 *
 * Algorithm: trim the common prefix/suffix, then LCS on the (usually small)
 * remaining middle window. If the middle is too large for O(n*m) LCS, fall
 * back to a "file rewritten" pseudo-hunk so the UI never hangs on a huge
 * rewrite. Preserves memory by storing LCS widths as Int32Array rows. */

export type DiffLine = { kind: " " | "+" | "-"; text: string };

const MAX_LCS_CELLS = 4_000_000; // ~2000 x 2000 lines

/** Line diff of `a` -> `b`. Returns per-line kinds for the whole input. */
export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.length ? a.split("\n") : [];
  const bLines = b.length ? b.split("\n") : [];

  // Common prefix
  let pre = 0;
  while (pre < aLines.length && pre < bLines.length && aLines[pre] === bLines[pre]) pre++;
  // Common suffix (not overlapping the prefix)
  let suf = 0;
  while (
    suf < aLines.length - pre && suf < bLines.length - pre &&
    aLines[aLines.length - 1 - suf] === bLines[bLines.length - 1 - suf]
  ) suf++;

  const aMid = aLines.slice(pre, aLines.length - suf);
  const bMid = bLines.slice(pre, bLines.length - suf);

  const out: DiffLine[] = [];
  for (let i = 0; i < pre; i++) out.push({ kind: " ", text: aLines[i] });

  if (aMid.length === 0 && bMid.length === 0) {
    // identical
  } else if (aMid.length === 0) {
    for (const t of bMid) out.push({ kind: "+", text: t });
  } else if (bMid.length === 0) {
    for (const t of aMid) out.push({ kind: "-", text: t });
  } else if (aMid.length * bMid.length > MAX_LCS_CELLS) {
    // Too different to align cheaply — render as one remove/add block.
    for (const t of aMid) out.push({ kind: "-", text: t });
    for (const t of bMid) out.push({ kind: "+", text: t });
  } else {
    // LCS table over the middle window.
    const rows: Int32Array[] = [];
    for (let i = 0; i <= aMid.length; i++) rows.push(new Int32Array(bMid.length + 1));
    for (let i = aMid.length - 1; i >= 0; i--) {
      const row = rows[i];
      const next = rows[i + 1];
      for (let j = bMid.length - 1; j >= 0; j--) {
        row[j] = aMid[i] === bMid[j] ? next[j + 1] + 1 : Math.max(next[j], row[j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < aMid.length && j < bMid.length) {
      if (aMid[i] === bMid[j]) { out.push({ kind: " ", text: aMid[i] }); i++; j++; }
      else if (rows[i + 1][j] >= rows[i][j + 1]) { out.push({ kind: "-", text: aMid[i] }); i++; }
      else { out.push({ kind: "+", text: bMid[j] }); j++; }
    }
    while (i < aMid.length) { out.push({ kind: "-", text: aMid[i++] }); }
    while (j < bMid.length) { out.push({ kind: "+", text: bMid[j++] }); }
  }

  for (let i = aLines.length - suf; i < aLines.length; i++) out.push({ kind: " ", text: aLines[i] });
  return out;
}

/**
 * Unified-diff-style patch with up to `context` context lines around each
 * hunk. Returns "" when the inputs are identical.
 */
export function unifiedDiff(a: string, b: string, opts: { context?: number; maxLines?: number } = {}): string {
  const context = Math.min(Math.max(opts.context ?? 3, 0), 10);
  const maxLines = opts.maxLines ?? 400;
  const lines = diffLines(a, b);
  const changed = lines.map((l) => l.kind !== " ");

  // Group changes into hunks: changes separated by more than 2*context
  // unchanged lines start a new hunk (expanding each side by `context` can
  // never overlap when the gap is larger than that).
  const hunks: Array<[number, number]> = []; // [start, end) over `lines`
  let idx = 0;
  while (idx < lines.length) {
    if (!changed[idx]) { idx++; continue; }
    const first = idx;
    let last = idx;
    let i = idx;
    while (i < lines.length) {
      if (changed[i]) { last = i; i++; continue; }
      let next = i;
      while (next < lines.length && !changed[next]) next++;
      if (next < lines.length && next - i <= context * 2) { i = next; continue; }
      break;
    }
    const start = Math.max(0, first - context);
    const end = Math.min(lines.length, last + 1 + context);
    hunks.push([start, end]);
    idx = end;
  }
  if (hunks.length === 0) return "";

  // Precompute the original/new line numbers at every index.
  const aNoAt = new Array<number>(lines.length + 1);
  const bNoAt = new Array<number>(lines.length + 1);
  aNoAt[0] = 1;
  bNoAt[0] = 1;
  for (let k = 0; k < lines.length; k++) {
    aNoAt[k + 1] = aNoAt[k] + (lines[k].kind !== "+" ? 1 : 0);
    bNoAt[k + 1] = bNoAt[k] + (lines[k].kind !== "-" ? 1 : 0);
  }

  const out: string[] = [];
  let emitted = 0;
  let truncated = false;
  for (const [start, end] of hunks) {
    if (truncated) break;
    const body: string[] = [];
    let aCount = 0;
    let bCount = 0;
    for (let k = start; k < end; k++) {
      const l = lines[k];
      body.push(l.kind + l.text);
      if (l.kind !== "+") aCount++;
      if (l.kind !== "-") bCount++;
      emitted++;
      if (emitted > maxLines) { truncated = true; break; }
    }
    if (body.length) {
      out.push(`@@ -${aNoAt[start]},${aCount} +${bNoAt[start]},${bCount} @@`);
      out.push(...body);
    }
  }
  if (truncated) out.push("… (diff truncated)");
  return out.join("\n");
}

/** Cheap summary: how many lines were added / removed. */
export function diffStats(a: string, b: string): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const l of diffLines(a, b)) {
    if (l.kind === "+") added++;
    else if (l.kind === "-") removed++;
  }
  return { added, removed };
}
