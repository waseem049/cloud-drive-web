import { describe, it, expect } from 'vitest';
import { formatBytes } from '../utils/format';

// ── LEARNING NOTES: Utility Testing ──────────────────────────
// Pure functions (functions that take inputs and return outputs
// without side-effects like API calls or DOM mutations) are 
// the easiest and most important things to test.
// 
// `formatBytes` is pure. We can easily test edge cases without
// any complex mocking.

describe('formatBytes utility', () => {
    it('should format 0 bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 B');
    });

    it('should format into KB correctly', () => {
        expect(formatBytes(1024)).toBe('1.0 KB');
        expect(formatBytes(1500)).toBe('1.5 KB'); // rounding check
    });

    it('should format into MB correctly', () => {
        expect(formatBytes(1048576)).toBe('1.0 MB');
    });

    it('should handle decimal places gracefully', () => {
        // 1.23 MB
        expect(formatBytes(1289748)).toBe('1.2 MB');
    });
});
