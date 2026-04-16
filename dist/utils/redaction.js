"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REDACTED = void 0;
exports.redactHeaders = redactHeaders;
exports.summarizeMcpBody = summarizeMcpBody;
const SENSITIVE_HEADER_NAMES = new Set([
    'authorization',
    'proxy-authorization',
    'cookie',
    'set-cookie',
    'x-n8n-key',
    'x-n8n-url',
]);
exports.REDACTED = '[REDACTED]';
function redactHeaders(headers) {
    if (!headers || typeof headers !== 'object') {
        return {};
    }
    const out = {};
    for (const [key, value] of Object.entries(headers)) {
        out[key] = SENSITIVE_HEADER_NAMES.has(key.toLowerCase()) ? exports.REDACTED : value;
    }
    return out;
}
function summarizeMcpBody(body) {
    if (body === undefined || body === null) {
        return { bodyType: body === null ? 'null' : 'undefined' };
    }
    if (typeof body !== 'object' || Array.isArray(body)) {
        return { bodyType: Array.isArray(body) ? 'array' : typeof body };
    }
    const b = body;
    return {
        jsonrpc: typeof b.jsonrpc === 'string' ? b.jsonrpc : undefined,
        method: typeof b.method === 'string' ? b.method : undefined,
        id: typeof b.id === 'string' || typeof b.id === 'number' ? b.id : undefined,
        hasParams: b.params !== undefined && b.params !== null,
    };
}
//# sourceMappingURL=redaction.js.map