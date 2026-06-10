import { describe, it, expect } from 'vitest';
import {
  normalizeMcpJsonValue,
  normalizeMcpWorkflowNode,
  normalizeMcpWorkflowNodes,
  normalizeMcpWorkflowConnections,
} from '@/utils/mcp-input-normalizer';

describe('mcp-input-normalizer', () => {
  describe('normalizeMcpJsonValue', () => {
    it('restores dense numeric-index records to arrays', () => {
      expect(normalizeMcpJsonValue({ '0': 100, '1': 200 })).toEqual([100, 200]);
    });

    it('restores nested dense records recursively', () => {
      expect(normalizeMcpJsonValue({ '0': { '0': { node: 'End' } } }))
        .toEqual([[{ node: 'End' }]]);
    });

    it('parses a JSON string root', () => {
      expect(normalizeMcpJsonValue('{"a":1}')).toEqual({ a: 1 });
    });

    it('does not JSON-parse nested string values (guards jsCode payloads)', () => {
      const input = { parameters: { jsCode: '{"not":"parsed"}' } };
      expect(normalizeMcpJsonValue(input)).toEqual(input);
    });

    it('keeps an empty object as an object', () => {
      expect(normalizeMcpJsonValue({})).toEqual({});
    });

    it('leaves sparse numeric-key records untouched', () => {
      expect(normalizeMcpJsonValue({ '0': 'a', '2': 'b' })).toEqual({ '0': 'a', '2': 'b' });
    });

    it('leaves records with non-numeric keys untouched', () => {
      expect(normalizeMcpJsonValue({ '0': 'a', name: 'b' })).toEqual({ '0': 'a', name: 'b' });
    });

    it('passes already-normal input through unchanged (idempotent)', () => {
      const input = {
        nodes: [{ position: [1, 2], parameters: { values: ['a'] } }],
      };
      expect(normalizeMcpJsonValue(input)).toEqual(input);
      expect(normalizeMcpJsonValue(normalizeMcpJsonValue(input))).toEqual(input);
    });

    it('leaves non-JSON strings and primitives untouched', () => {
      expect(normalizeMcpJsonValue('plain text')).toBe('plain text');
      expect(normalizeMcpJsonValue(42)).toBe(42);
      expect(normalizeMcpJsonValue(null)).toBe(null);
      expect(normalizeMcpJsonValue(undefined)).toBe(undefined);
    });
  });

  describe('normalizeMcpWorkflowNode', () => {
    it('normalizes typeVersion, position, parameters and credentials', () => {
      const result = normalizeMcpWorkflowNode({
        id: 'n1',
        name: 'Set',
        type: 'n8n-nodes-base.set',
        typeVersion: '3.4',
        position: { '0': 100, '1': 200 },
        parameters: '{"values":{"0":{"name":"x"}}}',
        credentials: { '0': { id: 'c1' } },
      });

      expect(result).toEqual({
        id: 'n1',
        name: 'Set',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [100, 200],
        parameters: { values: [{ name: 'x' }] },
        credentials: [{ id: 'c1' }],
      });
    });

    it('does not add keys absent from the input', () => {
      const result = normalizeMcpWorkflowNode({ id: 'n1', name: 'Set' }) as object;
      expect(Object.keys(result)).toEqual(['id', 'name']);
    });

    it('leaves non-numeric typeVersion strings for Zod to reject', () => {
      const result = normalizeMcpWorkflowNode({ typeVersion: 'not-a-number' }) as any;
      expect(result.typeVersion).toBe('not-a-number');
    });

    it('returns non-record input unchanged', () => {
      expect(normalizeMcpWorkflowNode('not a node')).toBe('not a node');
      expect(normalizeMcpWorkflowNode(null)).toBe(null);
    });
  });

  describe('normalizeMcpWorkflowNodes', () => {
    it('restores a dense-record nodes collection and normalizes each node', () => {
      const result = normalizeMcpWorkflowNodes({
        '0': { id: 'n1', typeVersion: '1', position: { '0': 0, '1': 0 } },
      });
      expect(result).toEqual([{ id: 'n1', typeVersion: 1, position: [0, 0] }]);
    });

    it('returns non-array input unchanged after root normalization', () => {
      expect(normalizeMcpWorkflowNodes({ notAnArray: true })).toEqual({ notAnArray: true });
    });
  });

  describe('normalizeMcpWorkflowConnections', () => {
    it('restores nested connection arrays', () => {
      const result = normalizeMcpWorkflowConnections({
        Start: { main: { '0': { '0': { node: 'End', type: 'main', index: 0 } } } },
      });
      expect(result).toEqual({
        Start: { main: [[{ node: 'End', type: 'main', index: 0 }]] },
      });
    });
  });
});
