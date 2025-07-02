import { 
  INCOME_FREQUENCIES, 
  FILING_STATUSES,
  TAX_CATEGORIES,
  EXPENSE_CATEGORIES 
} from '../budgetConfig';

describe('Budget Configuration', () => {
  describe('INCOME_FREQUENCIES', () => {
    test('should have all required frequency options', () => {
      const expectedFrequencies = ['weekly', 'biweekly', 'semimonthly', 'monthly', 'annually'];
      
      expectedFrequencies.forEach(freq => {
        expect(INCOME_FREQUENCIES).toHaveProperty(freq);
        expect(INCOME_FREQUENCIES[freq]).toHaveProperty('label');
        expect(INCOME_FREQUENCIES[freq]).toHaveProperty('multiplier');
        expect(typeof INCOME_FREQUENCIES[freq].multiplier).toBe('number');
      });
    });

    test('should have correct multipliers for annual calculation', () => {
      expect(INCOME_FREQUENCIES.weekly.multiplier).toBe(52);
      expect(INCOME_FREQUENCIES.biweekly.multiplier).toBe(26);
      expect(INCOME_FREQUENCIES.semimonthly.multiplier).toBe(24);
      expect(INCOME_FREQUENCIES.monthly.multiplier).toBe(12);
      expect(INCOME_FREQUENCIES.annually.multiplier).toBe(1);
    });

    test('should have descriptive labels', () => {
      Object.values(INCOME_FREQUENCIES).forEach(freq => {
        expect(freq.label).toBeTruthy();
        expect(typeof freq.label).toBe('string');
        expect(freq.label.length).toBeGreaterThan(0);
      });
    });
  });

  describe('FILING_STATUSES', () => {
    test('should have all standard filing statuses', () => {
      const expectedStatuses = ['single', 'marriedFilingJointly', 'marriedFilingSeparately', 'headOfHousehold'];
      
      expectedStatuses.forEach(status => {
        expect(FILING_STATUSES).toHaveProperty(status);
        expect(FILING_STATUSES[status]).toHaveProperty('label');
        expect(FILING_STATUSES[status]).toHaveProperty('description');
      });
    });

    test('should have meaningful descriptions', () => {
      Object.values(FILING_STATUSES).forEach(status => {
        expect(status.description).toBeTruthy();
        expect(typeof status.description).toBe('string');
        expect(status.description.length).toBeGreaterThan(10);
      });
    });

    test('should match tax system expected values', () => {
      // These should match what the tax calculation system expects
      expect(FILING_STATUSES.single.label).toBe('Single');
      expect(FILING_STATUSES.marriedFilingJointly.label).toBe('Married Filing Jointly');
    });
  });

  describe('TAX_CATEGORIES', () => {
    test('should have federal and state tax categories', () => {
      expect(TAX_CATEGORIES).toHaveProperty('federal');
      expect(TAX_CATEGORIES).toHaveProperty('state');
      expect(TAX_CATEGORIES).toHaveProperty('fica');
    });

    test('should have proper category structure', () => {
      Object.values(TAX_CATEGORIES).forEach(category => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('color');
        expect(typeof category.name).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(typeof category.color).toBe('string');
      });
    });

    test('should have valid color codes', () => {
      Object.values(TAX_CATEGORIES).forEach(category => {
        // Should be a valid hex color
        expect(category.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('EXPENSE_CATEGORIES', () => {
    test('should have comprehensive expense categories', () => {
      const expectedCategories = [
        'housing', 'transportation', 'food', 'healthcare', 
        'entertainment', 'savings', 'debt', 'other'
      ];
      
      expectedCategories.forEach(category => {
        expect(EXPENSE_CATEGORIES).toHaveProperty(category);
      });
    });

    test('should have proper category structure', () => {
      Object.values(EXPENSE_CATEGORIES).forEach(category => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('color');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('subcategories');
        expect(Array.isArray(category.subcategories)).toBe(true);
      });
    });

    test('should have meaningful subcategories', () => {
      Object.values(EXPENSE_CATEGORIES).forEach(category => {
        expect(category.subcategories.length).toBeGreaterThan(0);
        category.subcategories.forEach(sub => {
          expect(typeof sub).toBe('string');
          expect(sub.length).toBeGreaterThan(0);
        });
      });
    });

    test('should have valid icons', () => {
      Object.values(EXPENSE_CATEGORIES).forEach(category => {
        // Icon should be a React component or function
        expect(typeof category.icon).toBe('function');
      });
    });

    test('should cover essential expense types', () => {
      // Housing should include rent/mortgage
      expect(EXPENSE_CATEGORIES.housing.subcategories).toContain('Rent/Mortgage');
      
      // Transportation should include fuel
      expect(EXPENSE_CATEGORIES.transportation.subcategories).toContain('Gas/Fuel');
      
      // Food should include groceries
      expect(EXPENSE_CATEGORIES.food.subcategories).toContain('Groceries');
      
      // Savings should include emergency fund
      expect(EXPENSE_CATEGORIES.savings.subcategories).toContain('Emergency Fund');
    });
  });

  describe('Configuration Integration', () => {
    test('should have consistent structure across all configs', () => {
      // All major configs should be objects
      expect(typeof INCOME_FREQUENCIES).toBe('object');
      expect(typeof FILING_STATUSES).toBe('object');
      expect(typeof TAX_CATEGORIES).toBe('object');
      expect(typeof EXPENSE_CATEGORIES).toBe('object');
    });

    test('should not have overlapping category names', () => {
      const taxCategoryNames = Object.keys(TAX_CATEGORIES);
      const expenseCategoryNames = Object.keys(EXPENSE_CATEGORIES);
      
      // No overlap between tax and expense category keys
      const overlap = taxCategoryNames.filter(name => 
        expenseCategoryNames.includes(name)
      );
      expect(overlap).toHaveLength(0);
    });

    test('should have unique colors within each category set', () => {
      // Tax categories should have unique colors
      const taxColors = Object.values(TAX_CATEGORIES).map(cat => cat.color);
      const uniqueTaxColors = [...new Set(taxColors)];
      expect(uniqueTaxColors).toHaveLength(taxColors.length);

      // Expense categories should have unique colors
      const expenseColors = Object.values(EXPENSE_CATEGORIES).map(cat => cat.color);
      const uniqueExpenseColors = [...new Set(expenseColors)];
      expect(uniqueExpenseColors).toHaveLength(expenseColors.length);
    });
  });
});