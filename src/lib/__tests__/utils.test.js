import {
  parseNumber,
  parseInteger,
  validateNumber,
  formatCurrency,
  formatNumber,
  formatLargeCurrency,
  formatPercent,
  decimalToPercent,
  calculateAge,
  formatDate,
  calculateCompoundInterest,
  calculateLoanPayment,
  calculateAnnuityFV,
  sum,
  average,
  sortBy,
  isValidEmail,
  isValidAge,
  isValidPercentage,
  arrayToCSV,
  csvToArray,
  capitalize,
  camelToTitle,
  getStorageItem,
  setStorageItem,
  removeStorageItem
} from '../utils';

describe('Number Parsing and Validation', () => {
  describe('parseNumber', () => {
    test('should parse valid numbers correctly', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('123.45')).toBe(123.45);
      expect(parseNumber(456.78)).toBe(456.78);
      expect(parseNumber('0')).toBe(0);
      expect(parseNumber('-123.45')).toBe(-123.45);
    });

    test('should return fallback for invalid inputs', () => {
      expect(parseNumber('')).toBe(0);
      expect(parseNumber('abc')).toBe(0);
      expect(parseNumber(null)).toBe(0);
      expect(parseNumber(undefined)).toBe(0);
      expect(parseNumber('abc', 100)).toBe(100);
    });

    test('should handle edge cases', () => {
      expect(parseNumber('123abc')).toBe(123);
      expect(parseNumber('  456  ')).toBe(456);
      expect(parseNumber('1,234')).toBe(1);
    });
  });

  describe('parseInteger', () => {
    test('should parse valid integers correctly', () => {
      expect(parseInteger('123')).toBe(123);
      expect(parseInteger('123.99')).toBe(123);
      expect(parseInteger(456.78)).toBe(456);
      expect(parseInteger('-123')).toBe(-123);
    });

    test('should return fallback for invalid inputs', () => {
      expect(parseInteger('')).toBe(0);
      expect(parseInteger('abc')).toBe(0);
      expect(parseInteger('abc', 50)).toBe(50);
    });
  });

  describe('validateNumber', () => {
    test('should validate numbers within range', () => {
      expect(validateNumber(50, 0, 100)).toBe(true);
      expect(validateNumber(0, 0, 100)).toBe(true);
      expect(validateNumber(100, 0, 100)).toBe(true);
    });

    test('should reject numbers outside range', () => {
      expect(validateNumber(-1, 0, 100)).toBe(false);
      expect(validateNumber(101, 0, 100)).toBe(false);
    });

    test('should handle invalid inputs', () => {
      expect(validateNumber('abc', 0, 100)).toBe(false);
      expect(validateNumber('', 0, 100)).toBe(false);
    });
  });
});

describe('Currency Formatting', () => {
  describe('formatCurrency', () => {
    test('should format positive numbers correctly', () => {
      expect(formatCurrency(1234)).toBe('$1,234');
      expect(formatCurrency(1234.56)).toBe('$1,235'); // Rounds to nearest dollar
      expect(formatCurrency(0)).toBe('$0');
    });

    test('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234)).toBe('-$1,234');
      expect(formatCurrency(-1234.56)).toBe('-$1,235');
    });

    test('should handle invalid inputs', () => {
      expect(formatCurrency(NaN)).toBe('$0');
      expect(formatCurrency(Infinity)).toBe('$0');
      expect(formatCurrency(-Infinity)).toBe('$0');
    });

    test('should handle very large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(1234567890)).toBe('$1,234,567,890');
    });
  });

  describe('formatNumber', () => {
    test('should format numbers with commas', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });

    test('should handle invalid inputs', () => {
      expect(formatNumber(NaN)).toBe('0');
      expect(formatNumber(Infinity)).toBe('0');
    });
  });

  describe('formatLargeCurrency', () => {
    test('should format large numbers with abbreviations', () => {
      expect(formatLargeCurrency(1000)).toBe('$1.0K');
      expect(formatLargeCurrency(1234)).toBe('$1.2K');
      expect(formatLargeCurrency(1000000)).toBe('$1.0M');
      expect(formatLargeCurrency(1500000)).toBe('$1.5M');
      expect(formatLargeCurrency(2500000000)).toBe('$2.5B');
    });

    test('should handle small numbers', () => {
      expect(formatLargeCurrency(500)).toBe('$500');
      expect(formatLargeCurrency(0)).toBe('$0');
    });

    test('should handle custom decimal places', () => {
      expect(formatLargeCurrency(1234, 2)).toBe('$1.23K');
      expect(formatLargeCurrency(1234567, 0)).toBe('$1M');
    });
  });

  describe('formatPercent', () => {
    test('should format percentages correctly', () => {
      expect(formatPercent(25)).toBe('25.0%');
      expect(formatPercent(25.456)).toBe('25.5%');
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(100)).toBe('100.0%');
    });

    test('should handle custom decimal places', () => {
      expect(formatPercent(25.456, 0)).toBe('25%');
      expect(formatPercent(25.456, 2)).toBe('25.46%');
    });
  });

  describe('decimalToPercent', () => {
    test('should convert decimals to percentages', () => {
      expect(decimalToPercent(0.25)).toBe('25.0%');
      expect(decimalToPercent(0.5)).toBe('50.0%');
      expect(decimalToPercent(1)).toBe('100.0%');
      expect(decimalToPercent(0)).toBe('0.0%');
    });

    test('should handle values over 1', () => {
      expect(decimalToPercent(1.5)).toBe('150.0%');
    });
  });
});

describe('Date Utilities', () => {
  describe('calculateAge', () => {
    test('should calculate age correctly', () => {
      const today = new Date();
      const twentyYearsAgo = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
      const thirtyYearsAgo = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      
      expect(calculateAge(twentyYearsAgo.toISOString().split('T')[0])).toBe(20);
      expect(calculateAge(thirtyYearsAgo.toISOString().split('T')[0])).toBe(30);
    });

    test('should handle birthday not yet reached this year', () => {
      const today = new Date();
      const almostTwenty = new Date(today.getFullYear() - 20, today.getMonth() + 1, today.getDate());
      
      // If birthday is next month, should be 19, not 20
      if (almostTwenty.getMonth() > today.getMonth()) {
        expect(calculateAge(almostTwenty.toISOString().split('T')[0])).toBe(19);
      }
    });

    test('should handle invalid dates', () => {
      expect(calculateAge('invalid-date')).toBe(0);
      expect(calculateAge('')).toBe(0);
      expect(calculateAge(null)).toBe(0);
    });
  });

  describe('formatDate', () => {
    test('should format dates correctly', () => {
      const date = new Date('2023-06-15');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/);
    });

    test('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(null)).toBe('Invalid Date');
    });
  });
});

describe('Financial Calculations', () => {
  describe('calculateCompoundInterest', () => {
    test('should calculate compound interest correctly', () => {
      // $1000 at 5% annually for 10 years
      const result = calculateCompoundInterest(1000, 0.05, 1, 10);
      expect(result).toBeCloseTo(1628.89, 1);
    });

    test('should handle monthly compounding', () => {
      // $1000 at 5% annually compounded monthly for 10 years
      const result = calculateCompoundInterest(1000, 0.05, 12, 10);
      expect(result).toBeCloseTo(1647.01, 1); // Updated expected value
    });

    test('should handle zero interest', () => {
      const result = calculateCompoundInterest(1000, 0, 1, 10);
      expect(result).toBe(1000);
    });

    test('should handle zero principal', () => {
      const result = calculateCompoundInterest(0, 0.05, 1, 10);
      expect(result).toBe(0);
    });
  });

  describe('calculateLoanPayment', () => {
    test('should calculate monthly payments correctly', () => {
      // $200,000 loan at 4% for 30 years
      const result = calculateLoanPayment(200000, 0.04, 30);
      expect(result).toBeCloseTo(954.83, 1);
    });

    test('should handle zero interest', () => {
      const result = calculateLoanPayment(120000, 0, 10);
      expect(result).toBeCloseTo(1000, 1); // 120000 / 120 months
    });

    test('should handle short-term loans', () => {
      const result = calculateLoanPayment(12000, 0.05, 1);
      expect(result).toBeCloseTo(1027.29, 1); // Updated expected value
    });
  });

  describe('calculateAnnuityFV', () => {
    test('should calculate future value of annuity', () => {
      // $100/month at 6% annually for 20 years
      const result = calculateAnnuityFV(100, 0.06/12, 20*12);
      expect(result).toBeCloseTo(46204.09, 1);
    });

    test('should handle zero interest', () => {
      const result = calculateAnnuityFV(100, 0, 12);
      expect(result).toBe(1200); // 100 * 12
    });
  });
});

describe('Array Utilities', () => {
  describe('sum', () => {
    test('should calculate sum correctly', () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
      expect(sum([10, -5, 3])).toBe(8);
      expect(sum([])).toBe(0);
      expect(sum([0])).toBe(0);
    });

    test('should handle non-numeric values', () => {
      expect(sum([1, 'abc', 3])).toBe(4);
      expect(sum([1, null, 3])).toBe(4);
      expect(sum([1, undefined, 3])).toBe(4);
    });
  });

  describe('average', () => {
    test('should calculate average correctly', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20])).toBe(15);
      expect(average([5])).toBe(5);
    });

    test('should handle empty array', () => {
      expect(average([])).toBe(0);
    });
  });

  describe('sortBy', () => {
    const testData = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 }
    ];

    test('should sort ascending by default', () => {
      const result = sortBy(testData, 'age');
      expect(result[0].age).toBe(25);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(35);
    });

    test('should sort descending when specified', () => {
      const result = sortBy(testData, 'age', 'desc');
      expect(result[0].age).toBe(35);
      expect(result[1].age).toBe(30);
      expect(result[2].age).toBe(25);
    });

    test('should sort by string properties', () => {
      const result = sortBy(testData, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });
  });
});

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    test('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidAge', () => {
    test('should validate reasonable ages', () => {
      expect(isValidAge(25)).toBe(true);
      expect(isValidAge(65)).toBe(true);
      expect(isValidAge(18)).toBe(true);
      expect(isValidAge(100)).toBe(true);
    });

    test('should reject invalid ages', () => {
      expect(isValidAge(-1)).toBe(false);
      expect(isValidAge(0)).toBe(false);
      expect(isValidAge(121)).toBe(false);
      expect(isValidAge('abc')).toBe(false);
      expect(isValidAge(null)).toBe(false);
    });
  });

  describe('isValidPercentage', () => {
    test('should validate reasonable percentages', () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage(25.5)).toBe(true);
    });

    test('should reject invalid percentages', () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage('abc')).toBe(false);
      expect(isValidPercentage(null)).toBe(false);
    });
  });
});

describe('CSV Utilities', () => {
  describe('arrayToCSV', () => {
    test('should convert array of objects to CSV', () => {
      const data = [
        { name: 'Alice', age: 30, city: 'New York' },
        { name: 'Bob', age: 25, city: 'Los Angeles' }
      ];
      const result = arrayToCSV(data);
      expect(result).toContain('name,age,city');
      expect(result).toContain('Alice,30,New York');
      expect(result).toContain('Bob,25,Los Angeles');
    });

    test('should handle custom headers', () => {
      const data = [{ a: 1, b: 2 }, { a: 3, b: 4 }];
      const result = arrayToCSV(data, ['Column A', 'Column B']);
      expect(result).toContain('Column A,Column B');
    });

    test('should handle empty array', () => {
      const result = arrayToCSV([]);
      expect(result).toBe('');
    });
  });

  describe('csvToArray', () => {
    test('should convert CSV string to array of objects', () => {
      const csv = 'name,age,city\nAlice,30,New York\nBob,25,Los Angeles';
      const result = csvToArray(csv);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'Alice', age: '30', city: 'New York' });
      expect(result[1]).toEqual({ name: 'Bob', age: '25', city: 'Los Angeles' });
    });

    test('should handle custom headers', () => {
      const csv = 'Alice,30\nBob,25';
      const result = csvToArray(csv, ['name', 'age']);
      expect(result[0]).toEqual({ name: 'Alice', age: '30' });
    });

    test('should handle empty CSV', () => {
      const result = csvToArray('');
      expect(result).toEqual([]);
    });
  });
});

describe('String Utilities', () => {
  describe('capitalize', () => {
    test('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
      expect(capitalize('a')).toBe('A');
    });

    test('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    test('should handle non-strings', () => {
      expect(capitalize(null)).toBe('');
      expect(capitalize(undefined)).toBe('');
    });
  });

  describe('camelToTitle', () => {
    test('should convert camelCase to Title Case', () => {
      expect(camelToTitle('firstName')).toBe('First Name');
      expect(camelToTitle('myLongVariableName')).toBe('My Long Variable Name');
      expect(camelToTitle('singleword')).toBe('Singleword');
    });

    test('should handle edge cases', () => {
      expect(camelToTitle('')).toBe('');
      expect(camelToTitle('a')).toBe('A');
    });
  });
});

describe('Local Storage Utilities', () => {
  // Mock localStorage for testing
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('getStorageItem', () => {
    test('should retrieve and parse stored items', () => {
      localStorageMock.getItem.mockReturnValue('{"name":"Alice","age":30}');
      const result = getStorageItem('user');
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    test('should return fallback for missing items', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = getStorageItem('missing', { default: true });
      expect(result).toEqual({ default: true });
    });

    test('should handle invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const result = getStorageItem('invalid', 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('setStorageItem', () => {
    test('should stringify and store items', () => {
      const data = { name: 'Alice', age: 30 };
      setStorageItem('user', data);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', '{"name":"Alice","age":30}');
    });

    test('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      // Should not throw
      expect(() => setStorageItem('test', 'data')).not.toThrow();
    });
  });

  describe('removeStorageItem', () => {
    test('should remove items from storage', () => {
      removeStorageItem('user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });
});