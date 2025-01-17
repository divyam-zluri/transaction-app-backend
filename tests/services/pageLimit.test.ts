import { check } from '../../src/services/pageLimit.service';

describe('check', () => {
    it('should return true if page or limit is undefined', () => {
        expect(check(undefined, '10')).toBe(true);
        expect(check('1', undefined)).toBe(true);
        expect(check(undefined, undefined)).toBe(true);
    });

    it('should return false if page or limit is not a number', () => {
        expect(check('a', '10')).toBe(false);
        expect(check('1', 'b')).toBe(false);
        expect(check('a', 'b')).toBe(false);
        expect(check('1.1.1', '10')).toBe(false);
        expect(check('1', '10.10.10')).toBe(false);
    });

    it('should return true if page and limit are valid numbers', () => {
        expect(check('1', '10')).toBe(true);
        expect(check('0', '0')).toBe(true);
        expect(check('123', '456')).toBe(true);
    });
});