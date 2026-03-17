import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MortgageTool from '../MortgageTool/MortgageTool';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    Home: icon('Home'),
    Calculator: icon('Calculator'),
    TrendingUp: icon('TrendingUp'),
    Download: icon('Download'),
    Upload: icon('Upload'),
    AlertCircle: icon('AlertCircle'),
    CheckCircle: icon('CheckCircle')
  };
});

jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null
}));

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

// Provide realistic returns from mortgageCalculations to avoid NaN in display
jest.mock('../../lib/mortgageCalculations', () => ({
  calculateTotalMonthlyPayment: () => ({
    principalAndInterest: 2147,
    propertyTax: 667,
    homeInsurance: 100,
    pmi: 0,
    hoaFees: 0,
    total: 2914
  }),
  generateAmortizationSchedule: () => [
    { month: 1, year: 2024, payment: '2914.00', principal: '564.00', interest: '1733.00', totalInterest: '1733.00', balance: '319436.00', isYearEnd: false },
    { month: 12, year: 2024, payment: '2914.00', principal: '574.00', interest: '1723.00', totalInterest: '20000.00', balance: '313000.00', isYearEnd: true }
  ],
  calculateAffordability: () => ({
    currentDTI: 28,
    maxAffordable: 3200,
    affordabilityRating: 'Good',
    ratingClass: 'success'
  }),
  calculatePaymentSavings: () => ({
    interestSavings: 15000,
    timeSavings: 3,
    payoffDate: 27
  }),
  calculateLoanToValue: () => 80,
  calculatePMI: () => 0,
  getPaymentBreakdownChartData: () => [
    { name: 'Principal & Interest', value: 2147, color: '#3b82f6' }
  ],
  getAmortizationChartData: () => [
    { year: 2024, principal: 6800, interest: 20784, balance: 313000 }
  ]
}));

const { useLocalStorage, useCSV } = require('../../hooks');

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultMortgageData = {
  loanDetails: {
    principal: 400000,
    interestRate: 6.5,
    loanTerm: 30,
    downPayment: 80000,
    propertyTax: 8000,
    homeInsurance: 1200,
    pmi: 0,
    hoaFees: 0
  },
  extraPayments: { monthlyExtra: 0, yearlyExtra: 0, oneTimeExtra: 0, biWeekly: false },
  affordabilityData: { annualIncome: 100000, monthlyDebts: 500, creditScore: 740 }
};

const renderComponent = (data = defaultMortgageData) => {
  const setData = jest.fn();
  useLocalStorage.mockReturnValue([data, setData]);
  useCSV.mockReturnValue({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  });

  render(<MortgageTool />);
  return { setData };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MortgageTool', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText('Smart Mortgage Calculator')).toBeInTheDocument();
    });

    test('should render loan details section', () => {
      renderComponent();
      expect(screen.getByText(/loan details & costs/i)).toBeInTheDocument();
    });

    test('should render all tab buttons', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /payment breakdown/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /affordability/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /payment strategies/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /amortization/i })).toBeInTheDocument();
    });

    test('should display total monthly payment in dashboard', () => {
      renderComponent();
      // The mock returns total: 2914; formatCurrency renders it with commas
      expect(screen.getAllByText(/2,914/)).toHaveLength.greaterThan?.(0) ??
        expect(screen.getAllByText(/2,914/).length).toBeGreaterThan(0);
    });
  });

  describe('loan inputs', () => {
    test('should render home price input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('400,000')).toBeInTheDocument();
    });

    test('should render down payment input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('80,000')).toBeInTheDocument();
    });

    test('should render interest rate input', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('6.5')).toBeInTheDocument();
    });

    test('should call setData when home price changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByPlaceholderText('400,000');
      fireEvent.change(input, { target: { value: '500000' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should call setData when interest rate changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByPlaceholderText('6.5');
      fireEvent.change(input, { target: { value: '7.0' } });
      expect(setData).toHaveBeenCalled();
    });
  });

  describe('payment breakdown tab', () => {
    test('should show pie chart on payment breakdown tab', () => {
      renderComponent();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    test('should display loan amount in summary', () => {
      renderComponent();
      expect(screen.getByText(/loan amount:/i)).toBeInTheDocument();
    });

    test('should display loan-to-value ratio', () => {
      renderComponent();
      expect(screen.getByText(/ltv ratio:/i)).toBeInTheDocument();
    });

    test('should display total interest in summary', () => {
      renderComponent();
      expect(screen.getByText(/total interest:/i)).toBeInTheDocument();
    });
  });

  describe('tab navigation', () => {
    test('should switch to affordability tab', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /affordability/i }));
      expect(screen.getByText(/annual income/i)).toBeInTheDocument();
    });

    test('should switch to payment strategies tab', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /payment strategies/i }));
      expect(screen.getByLabelText(/extra monthly payment/i)).toBeInTheDocument();
    });

    test('should switch to amortization tab', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /amortization/i }));
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('affordability analysis', () => {
    test('should show DTI ratio', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /affordability/i }));
      expect(screen.getAllByText(/debt-to-income ratio/i).length).toBeGreaterThan(0);
    });

    test('should show maximum affordable payment', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /affordability/i }));
      expect(screen.getByText(/maximum affordable payment/i)).toBeInTheDocument();
    });

    test('should update income input', () => {
      const { setData } = renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /affordability/i }));
      const incomeInput = screen.getByPlaceholderText('100,000');
      fireEvent.change(incomeInput, { target: { value: '120000' } });
      expect(setData).toHaveBeenCalled();
    });
  });

  describe('amortization schedule', () => {
    test('should render schedule table headers', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /amortization/i }));
      expect(screen.getByText('Payment #')).toBeInTheDocument();
      expect(screen.getByText('Principal')).toBeInTheDocument();
      expect(screen.getByText('Interest')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
    });

    test('should render schedule rows from mock data', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /amortization/i }));
      // Our mock returns 2 rows
      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });
  });

  describe('payment strategies', () => {
    test('should display interest savings', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /payment strategies/i }));
      expect(screen.getByText(/interest savings/i)).toBeInTheDocument();
    });

    test('should display time savings', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /payment strategies/i }));
      expect(screen.getByText(/time savings/i)).toBeInTheDocument();
    });

    test('should update extra payment input', () => {
      const { setData } = renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /payment strategies/i }));
      const input = screen.getByLabelText(/extra monthly payment/i);
      fireEvent.change(input, { target: { value: '200' } });
      expect(setData).toHaveBeenCalled();
    });
  });
});
