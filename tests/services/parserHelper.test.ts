import { formatDate, getConversionRate } from '../../src/services/parserHelper.service';
import { currencyConversionRates } from '../../src/globals/currencyConversionRates';

jest.mock('../../src/globals/currencyConversionRates', () => ({
  currencyConversionRates: new Map([
    ['USD', 75],
    ['EUR', 85],
  ]),
}));

describe('parserHelper.service', () => {
  describe('formatDate', () => {
    it('should return a valid Date object for a valid date string', () => {
      const date = formatDate('01-01-2023');
      expect(date).toBeInstanceOf(Date);
      expect(date?.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should return null for an invalid date string', () => {
      expect(formatDate('invalid-date')).toBeNull();
    });

    it('should return null for a date string with missing parts', () => {
      expect(formatDate('01-2023')).toBeNull();
    });

    it('should return null for a non-string input', () => {
      expect(formatDate(123 as any)).toBeNull();
    });

    it('should return null for a date string with invalid format', () => {
      expect(formatDate('32-01-2023')).toBeNull(); // Invalid day
      expect(formatDate('01-13-2023')).toBeNull(); // Invalid month
    });
  });

  describe('getConversionRate', () => {
    it('should return the correct conversion rate for a valid currency code', () => {
      expect(getConversionRate('USD')).toBe(75);
      expect(getConversionRate('EUR')).toBe(85);
    });

    it('should return undefined for an invalid currency code', () => {
      expect(getConversionRate('XYZ')).toBeUndefined();
    });
  });
});