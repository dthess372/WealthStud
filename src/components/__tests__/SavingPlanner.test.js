import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SavingPlanner from '../SavingPlanner/SavingPlanner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    TrendingUp: icon('TrendingUp'), Download: icon('Download'), Upload: icon('Upload'),
    Target: icon('Target'), Shield: icon('Shield'), Zap: icon('Zap'),
    AlertCircle: icon('AlertCircle'), CheckCircle: icon('CheckCircle'),
    Plus: icon('Plus'), X: icon('X'), Calculator: icon('Calculator'),
    BarChart3: icon('BarChart3'), Lightbulb: icon('Lightbulb'), Calendar: icon('Calendar')
  };
});

jest.mock('recharts', () => ({
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>
}));

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

const { useLocalStorage, useCSV } = require('../../hooks');

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultSavingsData = {
  currentAge: 30,
  retirementAge: 65,
  currentSavings: 25000,
  monthlyIncome: 6000,
  savingsRate: 15,
  annualRaise: 3,
  inflationRate: 2.5,
  scenario: 'moderate',
  goals: []
};

const renderComponent = (data = defaultSavingsData) => {
  const setData = jest.fn();
  // SavingPlanner calls useLocalStorage twice per render cycle.
  // Use the storage key to identify which call is which so re-renders work correctly.
  useLocalStorage.mockImplementation((key) => {
    if (key === 'wealthstud_savings_goals') return [[], jest.fn()];
    return [data, setData];
  });
  useCSV.mockReturnValue({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  });
  render(<SavingPlanner />);
  return { setData };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SavingPlanner', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText('Smart Savings Planner')).toBeInTheDocument();
    });

    test('should render intro heading', () => {
      renderComponent();
      expect(screen.getByText('Plan Your Financial Future')).toBeInTheDocument();
    });

    test('should render navigation', () => {
      renderComponent();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    test('should render area chart', () => {
      renderComponent();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  describe('input labels with accessibility associations', () => {
    test('should render Current Age with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/current age/i)).toBeInTheDocument();
    });

    test('should render Retirement Age with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/retirement age/i)).toBeInTheDocument();
    });

    test('should render Current Savings with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/current savings/i)).toBeInTheDocument();
    });

    test('should render Monthly Income with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/monthly income/i)).toBeInTheDocument();
    });

    test('should render Savings Rate with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/savings rate/i)).toBeInTheDocument();
    });

    test('should render Annual Raise with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/annual raise/i)).toBeInTheDocument();
    });

    test('should render Expected Inflation Rate with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/expected inflation rate/i)).toBeInTheDocument();
    });
  });

  describe('input interaction', () => {
    test('should call setData when current age changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByLabelText(/current age/i);
      fireEvent.change(input, { target: { value: '35' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should call setData when monthly income changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByLabelText(/monthly income/i);
      fireEvent.change(input, { target: { value: '8000' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should call setData when savings rate changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByLabelText(/savings rate/i);
      fireEvent.change(input, { target: { value: '20' } });
      expect(setData).toHaveBeenCalled();
    });
  });

  describe('investment scenarios', () => {
    test('should render Investment Strategy section', () => {
      renderComponent();
      expect(screen.getByText(/investment strategy/i)).toBeInTheDocument();
    });

    test('should render Conservative scenario', () => {
      renderComponent();
      expect(screen.getByText('Conservative')).toBeInTheDocument();
    });

    test('should render Moderate scenario', () => {
      renderComponent();
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    test('should render Aggressive scenario', () => {
      renderComponent();
      expect(screen.getByText('Aggressive')).toBeInTheDocument();
    });
  });

  describe('CSV controls', () => {
    test('should render navigation (which hosts export/import actions)', () => {
      renderComponent();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('should handle zero income without crashing', () => {
      renderComponent({ ...defaultSavingsData, monthlyIncome: 0, currentSavings: 0 });
      expect(screen.getByText('Smart Savings Planner')).toBeInTheDocument();
    });

    test('should handle maximum retirement age without crashing', () => {
      renderComponent({ ...defaultSavingsData, currentAge: 64, retirementAge: 65 });
      expect(screen.getByText('Smart Savings Planner')).toBeInTheDocument();
    });
  });
});
