import { describe, it, expect } from 'vitest';
import { getCurrentDate, resetToCurrentMonth, debugDate } from '../dateUtils';

describe('dateUtils', () => {
    describe('getCurrentDate', () => {
        it('returns a Date instance', () => {
            const result = getCurrentDate();
            expect(result).toBeInstanceOf(Date);
        });

        it('returns current time (within 1 second)', () => {
            const before = Date.now();
            const result = getCurrentDate();
            const after = Date.now();
            expect(result.getTime()).toBeGreaterThanOrEqual(before);
            expect(result.getTime()).toBeLessThanOrEqual(after);
        });
    });

    describe('resetToCurrentMonth', () => {
        it('returns first day of the current month', () => {
            const result = resetToCurrentMonth();
            expect(result.getDate()).toBe(1);
        });

        it('preserves current month and year', () => {
            const now = new Date();
            const result = resetToCurrentMonth();
            expect(result.getMonth()).toBe(now.getMonth());
            expect(result.getFullYear()).toBe(now.getFullYear());
        });
    });

    describe('debugDate', () => {
        it('returns the same date object passed in', () => {
            const date = new Date(2025, 0, 15);
            const result = debugDate(date, 'Test');
            expect(result).toBe(date);
        });

        it('works with default label', () => {
            const date = new Date();
            const result = debugDate(date);
            expect(result).toBe(date);
        });
    });
});
