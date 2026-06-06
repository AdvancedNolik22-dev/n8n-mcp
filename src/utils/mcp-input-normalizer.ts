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

  return {
    ...parsed,
    typeVersion: normalizeNumberLike(parsed.typeVersion),
    position: normalizeMcpJsonValue(parsed.position),
    parameters: normalizeMcpJsonValue(parsed.parameters),
    credentials: parsed.credentials === undefined
      ? undefined
      : normalizeMcpJsonValue(parsed.credentials),
  };
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
