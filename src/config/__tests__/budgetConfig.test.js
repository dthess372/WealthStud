import { 
  DEFAULT_BUDGET_CATEGORIES, 
  getDefaultCategories 
} from '../budgetConfig';

describe('Budget Configuration', () => {
  describe('DEFAULT_BUDGET_CATEGORIES', () => {
    test('should have all essential expense categories', () => {
      const expectedCategories = [
        'Housing', 'Food', 'Transportation', 'Entertainment', 
        'Personal', 'Healthcare', 'Education', 'Savings'
      ];
      
      expectedCategories.forEach(category => {
        expect(DEFAULT_BUDGET_CATEGORIES).toHaveProperty(category);
      });
    });

    test('should have proper category structure', () => {
      Object.values(DEFAULT_BUDGET_CATEGORIES).forEach(category => {
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('recommended');
        expect(category).toHaveProperty('color');
        expect(category).toHaveProperty('subcategories');
        
        expect(typeof category.label).toBe('string');
        expect(typeof category.recommended).toBe('number');
        expect(typeof category.color).toBe('string');
        expect(typeof category.subcategories).toBe('object');
      });
    });

    test('should have valid color codes', () => {
      Object.values(DEFAULT_BUDGET_CATEGORIES).forEach(category => {
        // Should be a valid hex color
        expect(category.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('should have realistic recommended percentages', () => {
      Object.values(DEFAULT_BUDGET_CATEGORIES).forEach(category => {
        expect(category.recommended).toBeGreaterThan(0);
        expect(category.recommended).toBeLessThanOrEqual(1);
      });
      
      // Total recommendations should be reasonable (close to 100%)
      const totalRecommended = Object.values(DEFAULT_BUDGET_CATEGORIES)
        .reduce((sum, cat) => sum + cat.recommended, 0);
      expect(totalRecommended).toBeCloseTo(1.0, 1);
    });

    test('should have meaningful subcategories', () => {
      Object.values(DEFAULT_BUDGET_CATEGORIES).forEach(category => {
        const subcategories = Object.keys(category.subcategories);
        expect(subcategories.length).toBeGreaterThan(0);
        
        subcategories.forEach(subcat => {
          expect(typeof subcat).toBe('string');
          expect(subcat.length).toBeGreaterThan(0);
          expect(category.subcategories[subcat]).toHaveProperty('monthly');
          expect(typeof category.subcategories[subcat].monthly).toBe('number');
        });
      });
    });

    test('should cover essential expense types', () => {
      // Housing should include rent/mortgage
      expect(DEFAULT_BUDGET_CATEGORIES.Housing.subcategories).toHaveProperty('Rent/Mortgage');
      
      // Transportation should include gas
      expect(DEFAULT_BUDGET_CATEGORIES.Transportation.subcategories).toHaveProperty('Gas');
      
      // Food should include groceries
      expect(DEFAULT_BUDGET_CATEGORIES.Food.subcategories).toHaveProperty('Groceries');
      
      // Savings should include emergency fund
      expect(DEFAULT_BUDGET_CATEGORIES.Savings.subcategories).toHaveProperty('Emergency Fund');
    });

    test('should have unique colors', () => {
      const colors = Object.values(DEFAULT_BUDGET_CATEGORIES).map(cat => cat.color);
      const uniqueColors = [...new Set(colors)];
      expect(uniqueColors).toHaveLength(colors.length);
    });
  });

  describe('getDefaultCategories', () => {
    test('should return a deep copy of categories', () => {
      const categories1 = getDefaultCategories();
      const categories2 = getDefaultCategories();
      
      // Should be equal but not the same reference
      expect(categories1).toEqual(categories2);
      expect(categories1).not.toBe(categories2);
      
      // Modifying one should not affect the other
      categories1.Housing.label = 'Modified';
      expect(categories2.Housing.label).toBe('Housing');
    });

    test('should return object with proper structure', () => {
      const categories = getDefaultCategories();
      
      expect(typeof categories).toBe('object');
      expect(Object.keys(categories).length).toBeGreaterThan(0);
      
      // Should have same structure as default categories
      Object.keys(DEFAULT_BUDGET_CATEGORIES).forEach(key => {
        expect(categories).toHaveProperty(key);
        expect(categories[key]).toEqual(DEFAULT_BUDGET_CATEGORIES[key]);
      });
    });

    test('should return categories with default zero values', () => {
      const categories = getDefaultCategories();
      
      Object.values(categories).forEach(category => {
        Object.values(category.subcategories).forEach(subcat => {
          expect(subcat.monthly).toBe(0);
        });
      });
    });
  });

  describe('Configuration Quality', () => {
    test('should have descriptive category labels', () => {
      Object.values(DEFAULT_BUDGET_CATEGORIES).forEach(category => {
        expect(category.label.length).toBeGreaterThan(3);
        expect(category.label).not.toMatch(/^\s*$/); // Not just whitespace
      });
    });

    test('should have reasonable category distribution', () => {
      const housing = DEFAULT_BUDGET_CATEGORIES.Housing.recommended;
      const savings = DEFAULT_BUDGET_CATEGORIES.Savings.recommended;
      
      // Housing should be largest single category
      expect(housing).toBeGreaterThanOrEqual(0.25);
      
      // Savings should be significant
      expect(savings).toBeGreaterThanOrEqual(0.15);
    });

    test('should not have empty subcategories', () => {
      Object.values(DEFAULT_BUDGET_CATEGORIES).forEach(category => {
        const subcategoryCount = Object.keys(category.subcategories).length;
        expect(subcategoryCount).toBeGreaterThan(0);
        expect(subcategoryCount).toBeLessThan(10); // Not too many either
      });
    });
  });
});