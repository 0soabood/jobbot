const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your",
  "we",
  "our",
]);

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function stripHtml(value = "") {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value = "") {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#/.]+/i)
    .filter((token) => token && token.length > 1 && !STOP_WORDS.has(token));
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function toList(input) {
  if (Array.isArray(input)) {
    return unique(input.map((item) => String(item).trim()));
  }

  return unique(
    String(input ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function truncate(value, length = 160) {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();
  if (compact.length <= length) {
    return compact;
  }
  return `${compact.slice(0, Math.max(0, length - 3)).trim()}...`;
}

export function similarity(leftTokens, rightTokens) {
  const left = new Set(leftTokens);
  const right = new Set(rightTokens);

  if (!left.size || !right.size) {
    return 0;
  }

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) {
      intersection += 1;
    }
  }

  return intersection / Math.max(left.size, right.size);
}

export function parseSelection(value, max) {
  if (!value) {
    return [];
  }

  const indexes = new Set();
  for (const part of String(value).split(",")) {
    const chunk = part.trim();
    if (!chunk) {
      continue;
    }

    if (chunk.includes("-")) {
      const [startRaw, endRaw] = chunk.split("-");
      const start = Number.parseInt(startRaw, 10);
      const end = Number.parseInt(endRaw, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let current = start; current <= end; current += 1) {
          if (current >= 1 && current <= max) {
            indexes.add(current - 1);
          }
        }
      }
      continue;
    }

    const numeric = Number.parseInt(chunk, 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= max) {
      indexes.add(numeric - 1);
    }
  }

  return [...indexes].sort((a, b) => a - b);
}
