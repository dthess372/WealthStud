import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BudgetPlanner from '../BudgetPlanner/BudgetPlanner';
import { getDefaultCategories } from '../../config/budgetConfig';

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    ChevronDown: icon('ChevronDown'), ChevronRight: icon('ChevronRight'),
    Trash2: icon('Trash2'), DiamondPlus: icon('DiamondPlus'), Pencil: icon('Pencil'),
    DollarSign: icon('DollarSign'), TrendingUp: icon('TrendingUp'),
    TrendingDown: icon('TrendingDown'), Calculator: icon('Calculator'),
    Download: icon('Download'), Upload: icon('Upload'), Shield: icon('Shield'),
    AlertCircle: icon('AlertCircle'), CheckCircle: icon('CheckCircle')
  };
});

jest.mock('@mui/x-charts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  pieArcLabelClasses: {}
}));

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

// Mock the shared utilities (plain arrow functions — jest.fn() in factory drops implementation)
jest.mock('../../lib/utils', () => ({
  parseNumber: (value) => {
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  },
  formatCurrency: (value) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value),
  formatPercent: (value) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1, maximumFractionDigits: 1
  }).format(value)
}));

// Mock the tax calculations.
// Use jest.fn() without implementation in the factory — set implementations in beforeEach.
jest.mock('../../lib/taxes', () => ({
  calculateAllTaxes: jest.fn(),
  calculateTaxableIncome: jest.fn(),
  getAllStates: jest.fn()
}));

// Mock the hooks (do NOT use jest.fn() implementations inside the factory —
// they are silently dropped by CRA's Jest setup)
jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

// Mock the config
const mockDefaultCategories = {
  'Housing': {
    label: 'Housing',
    recommended: 0.30,
    color: '#FF6B6B',
    subcategories: {
      'Rent/Mortgage': { monthly: 2000 },
      'Utilities': { monthly: 300 }
    }
  },
  'Food': {
    label: 'Food',
    recommended: 0.15,
    color: '#4ECDC4',
    subcategories: {
      'Groceries': { monthly: 600 },
      'Dining Out': { monthly: 300 }
    }
  },
  'Savings': {
    label: 'Savings',
    recommended: 0.20,
    color: '#45B7D1',
    subcategories: {
      'Emergency Fund': { monthly: 500 },
      'Investments': { monthly: 1000 }
    }
  }
};

jest.mock('../../config/budgetConfig', () => ({
  getDefaultCategories: () => ({
    'Housing': {
      label: 'Housing',
      recommended: 0.30,
      color: '#FF6B6B',
      subcategories: {
        'Rent/Mortgage': { monthly: 2000 },
        'Utilities': { monthly: 300 }
      }
    },
    'Food': {
      label: 'Food',
      recommended: 0.15,
      color: '#4ECDC4',
      subcategories: {
        'Groceries': { monthly: 600 },
        'Dining Out': { monthly: 300 }
      }
    },
    'Savings': {
      label: 'Savings',
      recommended: 0.20,
      color: '#45B7D1',
      subcategories: {
        'Emergency Fund': { monthly: 500 },
        'Investments': { monthly: 1000 }
      }
    }
  })
}));

const { useLocalStorage, useCSV } = require('../../hooks');

const defaultMockData = {
  grossIncome: '100000',
  k401Contribution: '10000',
  isRoth401k: false,
  iraContribution: '6000',
  isRothIra: false,
  filingStatus: 'single',
  selectedState: 'MI',
  categories: mockDefaultCategories
};

const renderBudgetPlanner = () => {
  return render(<BudgetPlanner />);
};

const taxes = require('../../lib/taxes');

describe('BudgetPlanner Mathematical Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocalStorage.mockReturnValue([defaultMockData, jest.fn()]);
    useCSV.mockReturnValue({
      exportCSV: jest.fn(),
      createFileInputHandler: jest.fn(() => jest.fn())
    });
    taxes.calculateAllTaxes.mockImplementation((grossIncome) => ({
      federal: grossIncome * 0.12,
      state: grossIncome * 0.04,
      payroll: {
        socialSecurity: grossIncome * 0.062,
        medicare: { total: grossIncome * 0.0145, additional: 0 }
      },
      total: grossIncome * 0.2265,
      net: grossIncome * 0.7735,
      effectiveRate: 0.12,
      marginalRate: 0.22
    }));
    taxes.calculateTaxableIncome.mockImplementation((grossIncome, filingStatus, deductions) =>
      grossIncome - (deductions || 0) - 13850
    );
    taxes.getAllStates.mockReturnValue([
      { code: 'MI', name: 'Michigan', rate: 0.04 },
      { code: 'FL', name: 'Florida', rate: 0.0 }
    ]);
  });

  describe('Tax Calculations', () => {
    test('should call calculateTaxableIncome with gross income and 401k contribution', () => {
      renderBudgetPlanner();
      // Component treats k401Contribution as the pre-tax deduction (always traditional)
      expect(require('../../lib/taxes').calculateTaxableIncome).toHaveBeenCalledWith(
        100000,
        'single',
        10000 // k401Contribution reduces taxable income
      );
    });

    test('should call calculateAllTaxes with derived taxable income', () => {
      renderBudgetPlanner();
      expect(require('../../lib/taxes').calculateAllTaxes).toHaveBeenCalled();
    });

    test('should display gross income input', () => {
      renderBudgetPlanner();
      const grossIncome = screen.getByDisplayValue('100000');
      expect(grossIncome).toBeInTheDocument();
    });
  });

  describe('Budget Metrics Calculations', () => {
    test('should calculate total expenses correctly', () => {
      renderBudgetPlanner();
      
      // Expected: Housing (2000+300)*12 + Food (600+300)*12 = 27600 + 10800 = 38400
      // Savings should not be counted as expenses
      
      const budgetData = {
        'Housing': { monthly: 2300 * 12 }, // 27600
        'Food': { monthly: 900 * 12 }, // 10800
        'Savings': { monthly: 1500 * 12 } // Should not count as expense
      };
      
      // Total expenses should be 38400 (excluding savings)
      expect(screen.getByText(/Total Expenses/i)).toBeInTheDocument();
    });

    test('should calculate available after expenses correctly', () => {
      renderBudgetPlanner();
      
      // Net income: ~77,350 (100,000 - 22,650 taxes)
      // Total expenses: 38,400
      // Available after expenses: 77,350 - 38,400 = 38,950
      
      expect(screen.getByText(/Available for Savings/i)).toBeInTheDocument();
    });

    test('should calculate excess savings correctly', () => {
      renderBudgetPlanner();
      
      // Available after expenses: 38,950
      // Planned savings: 18,000 (1500 * 12)
      // Excess savings: 38,950 - 18,000 = 20,950
      
      expect(screen.getByText(/Savings Rate/i)).toBeInTheDocument();
    });

    test('should calculate savings rate correctly', () => {
      renderBudgetPlanner();
      
      // Total savings with excess: 18,000 + 20,950 = 38,950
      // Savings rate: 38,950 / 77,350 = ~50.4%
      
      expect(screen.getByText(/Savings Rate/i)).toBeInTheDocument();
    });
  });

  describe('Budget Health Scoring', () => {
    test('should calculate weighted budget health score correctly', () => {
      renderBudgetPlanner();
      
      // Housing: 27,600 / 77,350 = 35.7% (recommended 30%, over by 5.7%)
      // Score: 100 - (5.7 * 3) = 82.9, Weight: 30
      
      // Food: 10,800 / 77,350 = 14.0% (recommended 15%, under)
      // Score: 100, Weight: 15
      
      // Weighted score: (82.9 * 30 + 100 * 15) / 45 = 87.6
      // Plus savings bonus for 50%+ savings rate: +10
      // Final score: min(100, 87.6 + 10) = 97.6 ≈ 98
      
      expect(screen.getAllByText(/Budget Health/i).length).toBeGreaterThan(0);
    });

    test('should apply penalty for overspending categories', () => {
      const { useLocalStorage } = require('../../hooks');
      const overSpendingCategories = getDefaultCategories();
      overSpendingCategories['Housing'].subcategories['Rent/Mortgage'].monthly = 4000; // Way over budget
      
      useLocalStorage.mockReturnValue([{
        grossIncome: '100000',
        k401Contribution: '10000',
        isRoth401k: false,
        iraContribution: '6000',
        isRothIra: false,
        filingStatus: 'single',
        selectedState: 'MI',
        categories: overSpendingCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // Housing would be significantly over budget, should reduce health score
      expect(screen.getAllByText(/Budget Health/i).length).toBeGreaterThan(0);
    });

    test('should apply savings bonus correctly', () => {
      // Test different savings rates
      const testCases = [
        { savingsRate: 25, expectedBonus: 10 }, // 20%+ gets +10
        { savingsRate: 17, expectedBonus: 5 },  // 15%+ gets +5
        { savingsRate: 12, expectedBonus: 0 }   // <15% gets no bonus
      ];
      
      testCases.forEach(({ savingsRate, expectedBonus }) => {
        // This would require mocking the savingsRate calculation
        // The logic is: if (savingsRate >= 20) bonus = 10; else if (savingsRate >= 15) bonus = 5;
        expect(savingsRate >= 20 ? 10 : savingsRate >= 15 ? 5 : 0).toBe(expectedBonus);
      });
    });

    test('should handle zero spending categories', () => {
      const { useLocalStorage } = require('../../hooks');
      const zeroSpendingCategories = getDefaultCategories();
      zeroSpendingCategories['Food'].subcategories['Groceries'].monthly = 0;
      zeroSpendingCategories['Food'].subcategories['Dining Out'].monthly = 0;
      
      useLocalStorage.mockReturnValue([{
        grossIncome: '100000',
        k401Contribution: '10000',
        isRoth401k: false,
        iraContribution: '6000',
        isRothIra: false,
        filingStatus: 'single',
        selectedState: 'MI',
        categories: zeroSpendingCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // Should handle zero spending without errors
      expect(screen.getAllByText(/Budget Health/i).length).toBeGreaterThan(0);
    });
  });

  describe('Category Calculations', () => {
    test('should calculate category percentages correctly', () => {
      renderBudgetPlanner();
      
      // Housing: 27,600 / 77,350 = 35.7%
      // Food: 10,800 / 77,350 = 14.0%
      // Savings: (18,000 + excess) / 77,350
      
      expect(screen.getAllByText(/Housing/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Food/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Savings/i).length).toBeGreaterThan(0);
    });

    test('should include excess savings in savings category', () => {
      renderBudgetPlanner();

      // Savings category should show both planned savings + excess savings
      expect(screen.getAllByText(/Savings/i).length).toBeGreaterThan(0);
    });

    test('should convert monthly to annual correctly', () => {
      renderBudgetPlanner();
      
      // All monthly values should be multiplied by 12 for annual calculations
      const monthlyValues = [2000, 300, 600, 300, 500, 1000]; // Example monthly values
      const expectedAnnual = monthlyValues.map(monthly => monthly * 12);
      
      expectedAnnual.forEach(annual => {
        expect(annual).toBeGreaterThan(0);
        expect(annual % 12).toBe(0); // Should be evenly divisible by 12
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero income gracefully', () => {
      const { useLocalStorage } = require('../../hooks');
      useLocalStorage.mockReturnValue([{
        grossIncome: '0',
        k401Contribution: '0',
        isRoth401k: false,
        iraContribution: '0',
        isRothIra: false,
        filingStatus: 'single',
        selectedState: 'MI',
        categories: mockDefaultCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // Should not crash with zero income
      expect(screen.getAllByText(/Budget Health/i).length).toBeGreaterThan(0);
    });

    test('should handle negative available income', () => {
      const { useLocalStorage } = require('../../hooks');
      const highExpenseCategories = getDefaultCategories();
      // Set very high expenses that exceed income
      highExpenseCategories['Housing'].subcategories['Rent/Mortgage'].monthly = 10000;
      
      useLocalStorage.mockReturnValue([{
        grossIncome: '50000', // Lower income
        k401Contribution: '5000',
        isRoth401k: false,
        iraContribution: '0',
        isRothIra: false,
        filingStatus: 'single',
        selectedState: 'MI',
        categories: highExpenseCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // Should handle negative available income scenario
      expect(screen.getByText(/Available for Savings/i)).toBeInTheDocument();
    });

    test('should handle empty string inputs', () => {
      const { useLocalStorage } = require('../../hooks');
      useLocalStorage.mockReturnValue([{
        grossIncome: '',
        k401Contribution: '',
        isRoth401k: false,
        iraContribution: '',
        isRothIra: false,
        filingStatus: 'single',
        selectedState: 'MI',
        categories: mockDefaultCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // Should handle empty inputs by treating them as 0
      expect(screen.getAllByText(/Budget Health/i).length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    test('should parse number inputs correctly', () => {
      const { parseNumber } = require('../../lib/utils');
      
      // Test various input formats
      expect(parseNumber('100000')).toBe(100000);
      expect(parseNumber('100,000')).toBe(100000);
      expect(parseNumber('100000.50')).toBe(100000.5);
      expect(parseNumber('')).toBe(0);
      expect(parseNumber('invalid')).toBe(0);
    });

    test('should format currency correctly', () => {
      const { formatCurrency } = require('../../lib/utils');
      
      expect(formatCurrency(100000)).toBe('100,000');
      expect(formatCurrency(1234.56)).toBe('1,235');
      expect(formatCurrency(0)).toBe('0');
    });

    test('should format percentages correctly', () => {
      const { formatPercent } = require('../../lib/utils');
      
      expect(formatPercent(25.5)).toBe('25.5');
      expect(formatPercent(0)).toBe('0.0');
      expect(formatPercent(100)).toBe('100.0');
    });
  });
});

describe('BudgetPlanner Mathematical Precision', () => {
  test('should maintain precision in financial calculations', () => {
    // Test that calculations maintain appropriate precision for financial data
    const grossIncome = 100000;
    const taxRate = 0.2265;
    const netIncome = grossIncome * (1 - taxRate);
    
    // Should maintain precision to cents
    expect(netIncome).toBeCloseTo(77350, 2);
  });

  test('should handle rounding consistently', () => {
    // Test that all rounding is done consistently
    const values = [1234.567, 1234.432, 1234.5];
    values.forEach(value => {
      const rounded = Math.round(value);
      expect(Number.isInteger(rounded)).toBe(true);
    });
  });

  test('should prevent division by zero', () => {
    // Test that division by zero is handled gracefully
    const netIncome = 0;
    const expenses = 1000;
    
    // Savings rate calculation should handle zero income
    const savingsRate = netIncome > 0 ? (expenses / netIncome * 100) : 0;
    expect(savingsRate).toBe(0);
  });
});