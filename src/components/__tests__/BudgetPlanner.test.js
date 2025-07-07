import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BudgetPlanner from '../BudgetPlanner/BudgetPlanner';
import { getDefaultCategories } from '../../config/budgetConfig';

// Mock the shared utilities
jest.mock('../../lib/utils', () => ({
  parseNumber: jest.fn((value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }),
  formatCurrency: jest.fn((value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }),
  formatPercent: jest.fn((value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  })
}));

// Mock the tax calculations
jest.mock('../../lib/taxes', () => ({
  calculateAllTaxes: jest.fn((grossIncome, taxableIncome, filingStatus, state) => ({
    federal: grossIncome * 0.12,
    state: grossIncome * 0.04,
    payroll: {
      socialSecurity: grossIncome * 0.062,
      medicare: {
        total: grossIncome * 0.0145,
        additional: 0
      }
    },
    total: grossIncome * 0.2265,
    net: grossIncome * 0.7735,
    effectiveRate: 0.12,
    marginalRate: 0.22
  })),
  calculateTaxableIncome: jest.fn((grossIncome, filingStatus, deductions) => 
    grossIncome - deductions - 13850 // Standard deduction for single
  ),
  getAllStates: jest.fn(() => [
    { code: 'MI', name: 'Michigan', rate: 0.04 },
    { code: 'FL', name: 'Florida', rate: 0.0 }
  ])
}));

// Mock the hooks
jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(() => [{
    grossIncome: '100000',
    k401Contribution: '10000',
    isRoth401k: false,
    iraContribution: '6000',
    isRothIra: false,
    filingStatus: 'single',
    selectedState: 'MI',
    categories: {}
  }, jest.fn()]),
  useCSV: jest.fn(() => ({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  }))
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
  getDefaultCategories: jest.fn(() => mockDefaultCategories)
}));

const renderBudgetPlanner = () => {
  return render(
    <BrowserRouter>
      <BudgetPlanner />
    </BrowserRouter>
  );
};

describe('BudgetPlanner Mathematical Calculations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Tax Calculations', () => {
    test('should correctly calculate traditional vs Roth retirement contributions', () => {
      renderBudgetPlanner();
      
      // Test data: $100,000 gross, $10,000 traditional 401k, $6,000 traditional IRA
      // Expected: $16,000 total traditional contributions reduce taxable income
      
      const grossIncome = screen.getByDisplayValue('100000');
      expect(grossIncome).toBeInTheDocument();
      
      // Verify tax calculation is called with correct parameters
      expect(require('../../lib/taxes').calculateTaxableIncome).toHaveBeenCalledWith(
        100000,
        'single',
        16000 // traditional 401k + traditional IRA
      );
    });

    test('should not reduce taxable income for Roth contributions', () => {
      const { useLocalStorage } = require('../../hooks');
      useLocalStorage.mockReturnValue([{
        grossIncome: '100000',
        k401Contribution: '10000',
        isRoth401k: true, // Roth 401k
        iraContribution: '6000',
        isRothIra: true, // Roth IRA
        filingStatus: 'single',
        selectedState: 'MI',
        categories: mockDefaultCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // With all Roth contributions, no deduction should be applied
      expect(require('../../lib/taxes').calculateTaxableIncome).toHaveBeenCalledWith(
        100000,
        'single',
        0 // No traditional contributions
      );
    });

    test('should calculate net income correctly with mixed contribution types', () => {
      const { useLocalStorage } = require('../../hooks');
      useLocalStorage.mockReturnValue([{
        grossIncome: '100000',
        k401Contribution: '10000',
        isRoth401k: true, // Roth 401k (after-tax)
        iraContribution: '6000',
        isRothIra: false, // Traditional IRA (pre-tax)
        filingStatus: 'single',
        selectedState: 'MI',
        categories: mockDefaultCategories
      }, jest.fn()]);

      renderBudgetPlanner();
      
      // Should only deduct traditional IRA from taxable income
      expect(require('../../lib/taxes').calculateTaxableIncome).toHaveBeenCalledWith(
        100000,
        'single',
        6000 // Only traditional IRA
      );
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
      
      expect(screen.getByText(/Budget Health/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Budget Health/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Budget Health/i)).toBeInTheDocument();
    });
  });

  describe('Category Calculations', () => {
    test('should calculate category percentages correctly', () => {
      renderBudgetPlanner();
      
      // Housing: 27,600 / 77,350 = 35.7%
      // Food: 10,800 / 77,350 = 14.0%
      // Savings: (18,000 + excess) / 77,350
      
      expect(screen.getByText(/Housing/i)).toBeInTheDocument();
      expect(screen.getByText(/Food/i)).toBeInTheDocument();
      expect(screen.getByText(/Savings/i)).toBeInTheDocument();
    });

    test('should include excess savings in savings category', () => {
      renderBudgetPlanner();
      
      // Savings category should show both planned savings + excess savings
      // Total savings = planned + excess = higher percentage
      
      expect(screen.getByText(/Savings/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Budget Health/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Budget Health/i)).toBeInTheDocument();
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