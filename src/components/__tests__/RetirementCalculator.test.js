import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RetirementCalc from '../RetirementCalculator/RetirementCalc';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    TrendingUp: icon('TrendingUp'),
    Target: icon('Target'),
    Briefcase: icon('Briefcase'),
    Calculator: icon('Calculator'),
    Plus: icon('Plus'),
    X: icon('X'),
    ChevronDown: icon('ChevronDown'),
    ChevronUp: icon('ChevronUp'),
    Download: icon('Download'),
    Upload: icon('Upload')
  };
});

jest.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>
}));

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

// Mock a minimal RETIREMENT_ACCOUNT_TYPES config
jest.mock('../../config/retirementConfig', () => ({
  RETIREMENT_ACCOUNT_TYPES: {
    '401k': {
      name: '401(k)',
      color: '#3b82f6',
      icon: () => <div />,
      fields: {
        currentBalance: { label: 'Current Balance', type: 'currency', default: 0 },
        expectedReturn: { label: 'Expected Return', type: 'percent', default: 7 }
      }
    },
    roth_ira: {
      name: 'Roth IRA',
      color: '#10b981',
      icon: () => <div />,
      fields: {
        currentBalance: { label: 'Current Balance', type: 'currency', default: 0 },
        expectedReturn: { label: 'Expected Return', type: 'percent', default: 7 }
      }
    }
  }
}));

const { useLocalStorage, useCSV } = require('../../hooks');

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeRetirementData = (overrides = {}) => ({
  generalInfo: {
    birthDate: '1990-01-01',
    currentSalary: 75000,
    annualRaise: 3,
    retirementAge: 67,
    ...overrides.generalInfo
  },
  accounts: overrides.accounts ?? []
});

const renderComponent = (data = makeRetirementData()) => {
  const setData = jest.fn();
  useLocalStorage.mockReturnValue([data, setData]);
  useCSV.mockReturnValue({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  });

  render(<RetirementCalc />);

  return { setData };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RetirementCalculator', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText('Retirement Planner Pro')).toBeInTheDocument();
    });

    test('should render general information fields', () => {
      renderComponent();
      expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual salary/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/retirement age/i)).toBeInTheDocument();
    });

    test('should show empty state when no accounts added', () => {
      renderComponent();
      expect(screen.getByText(/no accounts added yet/i)).toBeInTheDocument();
    });

    test('should render Add Account button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument();
    });

    test('should render Run Simulation button disabled with no accounts', () => {
      renderComponent();
      const btn = screen.getByRole('button', { name: /run simulation/i });
      expect(btn).toBeDisabled();
    });
  });

  describe('general info inputs', () => {
    test('should update salary when input changes', () => {
      const { setData } = renderComponent();
      const salaryInput = screen.getByLabelText(/annual salary/i);
      fireEvent.change(salaryInput, { target: { value: '90000' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should update retirement age when input changes', () => {
      const { setData } = renderComponent();
      const ageInput = screen.getByLabelText(/target retirement age/i);
      fireEvent.change(ageInput, { target: { value: '65' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should display years until retirement', () => {
      // birthDate 1990-01-01 → currently ~35; retirementAge 67 → 32 years away
      renderComponent();
      expect(screen.getByText(/years until retirement/i)).toBeInTheDocument();
    });

    test('should display current age', () => {
      renderComponent();
      expect(screen.getByText(/current age:/i)).toBeInTheDocument();
    });
  });

  describe('account management', () => {
    test('should open account type selector when Add Account is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add account/i }));
      expect(screen.getByText(/select account type/i)).toBeInTheDocument();
    });

    test('should show available account types in dropdown', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add account/i }));
      expect(screen.getByText('401(k)')).toBeInTheDocument();
      expect(screen.getByText('Roth IRA')).toBeInTheDocument();
    });

    test('should close account type selector when X is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add account/i }));
      const closeBtn = screen.getAllByRole('button').find(b => b.querySelector('[data-testid="icon-X"]'));
      fireEvent.click(closeBtn);
      expect(screen.queryByText(/select account type/i)).not.toBeInTheDocument();
    });

    test('should add an account when type is selected', () => {
      const data = makeRetirementData();
      const setData = jest.fn();
      useLocalStorage.mockReturnValue([data, setData]);
      useCSV.mockReturnValue({ exportCSV: jest.fn(), createFileInputHandler: jest.fn(() => jest.fn()) });

      render(<RetirementCalc />);
      fireEvent.click(screen.getByRole('button', { name: /add account/i }));
      fireEvent.click(screen.getByText('401(k)'));
      expect(setData).toHaveBeenCalled();
    });
  });

  describe('existing accounts', () => {
    const dataWithAccount = makeRetirementData({
      accounts: [{
        id: 1,
        type: '401k',
        name: 'My 401k',
        values: { currentBalance: 50000, expectedReturn: 7 }
      }]
    });

    test('should render account name', () => {
      renderComponent(dataWithAccount);
      expect(screen.getByDisplayValue('My 401k')).toBeInTheDocument();
    });

    test('should display current balance', () => {
      renderComponent(dataWithAccount);
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    test('should enable Run Simulation button when accounts exist', () => {
      renderComponent(dataWithAccount);
      const btn = screen.getByRole('button', { name: /run simulation/i });
      expect(btn).not.toBeDisabled();
    });

    test('should show ready-to-simulate message before running', () => {
      renderComponent(dataWithAccount);
      expect(screen.getAllByText(/run simulation/i).length).toBeGreaterThan(0);
    });
  });

  describe('simulation', () => {
    const dataWithAccount = makeRetirementData({
      accounts: [{
        id: 1,
        type: '401k',
        name: 'My 401k',
        values: { currentBalance: 100000, expectedReturn: 7 }
      }]
    });

    test('should show loading state while simulation runs', async () => {
      renderComponent(dataWithAccount);
      const btn = screen.getByRole('button', { name: /run simulation/i });
      fireEvent.click(btn);
      expect(screen.getByText(/running simulation/i)).toBeInTheDocument();
    });

    test('should show projection results after simulation completes', async () => {
      renderComponent(dataWithAccount);
      const btn = screen.getByRole('button', { name: /run simulation/i });
      fireEvent.click(btn);
      await waitFor(() =>
        expect(screen.getByText(/retirement projections summary/i)).toBeInTheDocument(),
        { timeout: 3000 }
      );
    });

    test('should render chart after simulation completes', async () => {
      renderComponent(dataWithAccount);
      fireEvent.click(screen.getByRole('button', { name: /run simulation/i }));
      await waitFor(() =>
        expect(screen.getByTestId('line-chart')).toBeInTheDocument(),
        { timeout: 3000 }
      );
    });

    test('should show conservative, expected, and optimistic scenarios', async () => {
      renderComponent(dataWithAccount);
      fireEvent.click(screen.getByRole('button', { name: /run simulation/i }));
      await waitFor(() => {
        expect(screen.getByText(/conservative scenario/i)).toBeInTheDocument();
        expect(screen.getByText(/expected scenario/i)).toBeInTheDocument();
        expect(screen.getByText(/optimistic scenario/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('should show 4% withdrawal rate monthly income', async () => {
      renderComponent(dataWithAccount);
      fireEvent.click(screen.getByRole('button', { name: /run simulation/i }));
      await waitFor(() =>
        expect(screen.getByText(/4% withdrawal rate/i)).toBeInTheDocument(),
        { timeout: 3000 }
      );
    });
  });
});
