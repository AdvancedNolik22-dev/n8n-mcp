/**
 * Repairs workflow payloads mangled by some HTTP MCP clients (issue #814):
 * JSON-string roots (`parameters: "{}"`), arrays flattened to dense numeric-index
 * records (`[x, y]` → `{"0": x, "1": y}`), and stringified numbers (`typeVersion: "3"`).
 *
 * Deliberate tradeoff: a legitimate user object keyed exactly "0".."n" is
 * indistinguishable from a mangled array and WILL be converted to one. This is
 * accepted because n8n itself never produces dense numeric-index objects in node
 * parameters, and the normalization must run unconditionally — the client-side
 * mangling is non-deterministic, so there is no reliable signal to gate on.
 */
type JsonRecord = Record<string, unknown>;

function isPlainRecord(value: unknown): value is JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function tryParseJsonRoot(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isDenseIndexRecord(record: JsonRecord): boolean {
  const keys = Object.keys(record);
  if (keys.length === 0) {
    return false;
  }

  return keys.every((key) => /^\d+$/.test(key))
    && keys
      .map(Number)
      .sort((a, b) => a - b)
      .every((key, index) => key === index);
}

function restoreIndexedArrays(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(restoreIndexedArrays);
  }

  if (!isPlainRecord(value)) {
    return value;
  }

  const normalizedEntries = Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, restoreIndexedArrays(entryValue)])
  );

  if (isDenseIndexRecord(normalizedEntries)) {
    return Object.keys(normalizedEntries)
      .map(Number)
      .sort((a, b) => a - b)
      .map((index) => normalizedEntries[String(index)]);
  }

  return normalizedEntries;
}

export function normalizeMcpJsonValue(value: unknown): unknown {
  return restoreIndexedArrays(tryParseJsonRoot(value));
}

function normalizeNumberLike(value: unknown): unknown {
  if (typeof value !== 'string' || value.trim() === '') {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

export function normalizeMcpWorkflowNode(value: unknown): unknown {
  const parsed = normalizeMcpJsonValue(value);
  if (!isPlainRecord(parsed)) {
    return parsed;
  }

  // Only rewrite fields present on the input — adding explicit undefined-valued
  // keys would change Object.keys()-based consumers downstream.
  const normalized: JsonRecord = { ...parsed };
  if ('typeVersion' in parsed) {
    normalized.typeVersion = normalizeNumberLike(parsed.typeVersion);
  }
  if ('position' in parsed) {
    normalized.position = normalizeMcpJsonValue(parsed.position);
  }
  if ('parameters' in parsed) {
    normalized.parameters = normalizeMcpJsonValue(parsed.parameters);
  }
  if ('credentials' in parsed) {
    normalized.credentials = normalizeMcpJsonValue(parsed.credentials);
  }
  return normalized;
}

export function normalizeMcpWorkflowNodes(value: unknown): unknown {
  const parsed = normalizeMcpJsonValue(value);
  if (!Array.isArray(parsed)) {
    return parsed;
  }

  return parsed.map(normalizeMcpWorkflowNode);
}

export function normalizeMcpWorkflowConnections(value: unknown): unknown {
  return normalizeMcpJsonValue(value);
}
