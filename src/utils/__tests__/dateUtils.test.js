import { describe, it, expect } from 'vitest';
import { getCurrentDate, resetToCurrentMonth, debugDate, testDateHandling, getCorrectCurrentDate } from '../dateUtils';

describe('dateUtils', () => {
    describe('getCurrentDate', () => {
        it('returns a Date instance', () => {
            const result = getCurrentDate();
            expect(result).toBeInstanceOf(Date);
        });

        it('returns a date close to now', () => {
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

        it('returns same month and year as today', () => {
            const today = new Date();
            const result = resetToCurrentMonth();
            expect(result.getMonth()).toBe(today.getMonth());
            expect(result.getFullYear()).toBe(today.getFullYear());
        });
    });

    describe('debugDate', () => {
        it('returns the same date it receives', () => {
            const date = new Date(2025, 7, 15);
            const result = debugDate(date, 'Test');
            expect(result).toBe(date);
        });
    });

    describe('getCorrectCurrentDate', () => {
        it('returns a Date instance', () => {
            const result = getCorrectCurrentDate();
            expect(result).toBeInstanceOf(Date);
        });
    });

    describe('testDateHandling', () => {
        it('returns an object with expected shape', () => {
            const result = testDateHandling();
            expect(result).toHaveProperty('current');
            expect(result).toHaveProperty('currentMonth');
            expect(result).toHaveProperty('isCorrect');
            expect(result.current).toBeInstanceOf(Date);
            expect(result.currentMonth).toBeInstanceOf(Date);
            expect(typeof result.isCorrect).toBe('boolean');
        });
    });
});
