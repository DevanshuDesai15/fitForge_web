import { describe, it, expect } from 'vitest';
import {
    convertHeight,
    convertWeight,
    formatHeight,
    formatWeight,
    getHeightUnit,
    getWeightLabel,
    getWeightUnit,
    parseHeight,
} from '../unitConversions';

describe('unitConversions', () => {
    describe('convertWeight', () => {
        it('converts kg to lbs correctly', () => {
            const result = convertWeight(100, 'kg', 'lbs');
            expect(parseFloat(result)).toBeCloseTo(220.5, 1);
        });

        it('converts lbs to kg correctly', () => {
            const result = convertWeight(220, 'lbs', 'kg');
            expect(parseFloat(result)).toBeCloseTo(99.8, 1);
        });

        it('returns same value when units are identical', () => {
            expect(convertWeight(100, 'kg', 'kg')).toBe(100);
            expect(convertWeight(220, 'lbs', 'lbs')).toBe(220);
        });

        it('returns original value for NaN input', () => {
            expect(convertWeight('abc', 'kg', 'lbs')).toBe('abc');
            expect(convertWeight(undefined, 'kg', 'lbs')).toBe(undefined);
        });

        it('converts string numbers correctly', () => {
            const result = convertWeight('50', 'kg', 'lbs');
            expect(parseFloat(result)).toBeCloseTo(110.2, 1);
        });

        it('returns original for unknown unit pair', () => {
            expect(convertWeight(100, 'kg', 'stones')).toBe(100);
        });
    });

    describe('formatWeight', () => {
        it('formats number with unit', () => {
            expect(formatWeight(70, 'kg')).toBe('70.0 kg');
        });

        it('formats string number with unit', () => {
            expect(formatWeight('185.5', 'lbs')).toBe('185.5 lbs');
        });

        it('returns raw value with unit for NaN', () => {
            expect(formatWeight('abc', 'kg')).toBe('abc kg');
        });
    });

    describe('getWeightLabel', () => {
        it('returns default label with unit', () => {
            expect(getWeightLabel('kg')).toBe('Weight (kg)');
            expect(getWeightLabel('lbs')).toBe('Weight (lbs)');
        });

        it('uses custom label', () => {
            expect(getWeightLabel('kg', 'Max')).toBe('Max (kg)');
        });
    });

    describe('height conversion and formatting', () => {
        it('parses imperial height strings into total inches', () => {
            expect(parseHeight(`5'11"`, 'ft')).toBe(71);
            expect(parseHeight('6 2', 'imperial')).toBe(74);
        });

        it('parses metric height values as centimeters', () => {
            expect(parseHeight('180', 'cm')).toBe(180);
            expect(parseHeight('', 'cm')).toBeNull();
        });

        it('converts and formats height in either preference', () => {
            expect(convertHeight(`5'11"`, 'ft', 'cm')).toBe(180);
            expect(convertHeight(180, 'cm', 'ft')).toBe(71);
            expect(formatHeight(180, 'cm', 'imperial')).toBe(`5'11"`);
            expect(formatHeight(71, 'ft', 'metric')).toBe('180 cm');
        });

        it('returns preference-based unit labels', () => {
            expect(getWeightUnit('metric')).toBe('kg');
            expect(getWeightUnit('imperial')).toBe('lbs');
            expect(getHeightUnit('metric')).toBe('cm');
            expect(getHeightUnit('imperial')).toBe('ft');
        });
    });
});
