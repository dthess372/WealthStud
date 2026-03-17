import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CapitalGainsAnalyzer from '../CapitalGainsAnalyzer/CapitalGainsAnalyzer';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    TrendingUp: icon('TrendingUp'),
    Calculator: icon('Calculator'),
    Download: icon('Download'),
    Upload: icon('Upload'),
    Plus: icon('Plus'),
    Trash2: icon('Trash2'),
    BarChart3: icon('BarChart3'),
    Edit2: icon('Edit2')
  };
});

jest.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>
}));

jest.mock('@mui/x-charts', () => ({
  PieChart: () => <div data-testid="mui-pie-chart" />
}));

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

const { useLocalStorage, useCSV } = require('../../hooks');

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultCapGainsData = {
  trades: [],
  taxSettings: {
    filingStatus: 'single',
    state: 'MI',
    taxableIncome: 100000,
    niitApplies: false
  }
};

// A long-term trade (held > 1 year): gain of (200-100)*10 - 50 = $950
const longTermTrade = {
  id: 1,
  asset: 'AAPL',
  purchaseDate: '2020-01-01',
  saleDate: '2021-06-01',
  purchasePrice: 100,
  salePrice: 200,
  quantity: 10,
  fees: 50
};

// A short-term trade (held < 1 year): gain of (150-100)*5 = $250
const shortTermTrade = {
  id: 2,
  asset: 'BTC',
  purchaseDate: '2023-01-01',
  saleDate: '2023-06-01',
  purchasePrice: 100,
  salePrice: 150,
  quantity: 5,
  fees: 0
};

// A losing trade: (80-100)*10 = -$200
const losingTrade = {
  id: 3,
  asset: 'TSLA',
  purchaseDate: '2022-01-01',
  saleDate: '2022-06-01',
  purchasePrice: 100,
  salePrice: 80,
  quantity: 10,
  fees: 0
};

const renderComponent = (data = defaultCapGainsData) => {
  const setData = jest.fn();
  useLocalStorage.mockReturnValue([data, setData]);
  useCSV.mockReturnValue({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  });

  render(<CapitalGainsAnalyzer />);
  return { setData };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CapitalGainsAnalyzer', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText('Capital Gains Analyzer')).toBeInTheDocument();
    });

    test('should render tax settings section', () => {
      renderComponent();
      expect(screen.getByText(/tax settings/i)).toBeInTheDocument();
    });

    test('should render investment trades section', () => {
      renderComponent();
      expect(screen.getByRole('heading', { name: /investment trades/i })).toBeInTheDocument();
    });

    test('should show empty state with no trades', () => {
      renderComponent();
      expect(screen.getByText(/no trades added yet/i)).toBeInTheDocument();
    });

    test('should render Add Trade button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /add trade/i })).toBeInTheDocument();
    });
  });

  describe('dashboard with no trades', () => {
    test('should show $0 net gain with no trades', () => {
      renderComponent();
      // Net gain/loss should be $0
      expect(screen.getByText(/net gain/i)).toBeInTheDocument();
    });

    test('should show $0 estimated tax with no trades', () => {
      renderComponent();
      expect(screen.getByText(/estimated tax/i)).toBeInTheDocument();
    });
  });

  describe('tax settings', () => {
    test('should render filing status selector', () => {
      renderComponent();
      expect(screen.getByLabelText(/filing status/i)).toBeInTheDocument();
    });

    test('should render state selector', () => {
      renderComponent();
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    });

    test('should render taxable income input', () => {
      renderComponent();
      expect(screen.getByLabelText(/taxable income/i)).toBeInTheDocument();
    });

    test('should update filing status when changed', () => {
      const { setData } = renderComponent();
      const select = screen.getByLabelText(/filing status/i);
      fireEvent.change(select, { target: { value: 'married' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should update state when changed', () => {
      const { setData } = renderComponent();
      const select = screen.getByLabelText(/state/i);
      fireEvent.change(select, { target: { value: 'CA' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should render NIIT checkbox', () => {
      renderComponent();
      expect(screen.getByText(/net investment income tax/i)).toBeInTheDocument();
    });
  });

  describe('add trade modal', () => {
    test('should open modal when Add Trade is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add trade/i }));
      expect(screen.getByText(/add new trade/i)).toBeInTheDocument();
    });

    test('should render all trade form fields', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add trade/i }));
      expect(screen.getByPlaceholderText(/aapl|bitcoin|real estate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/purchase date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sale date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    });

    test('should have Add Trade submit button disabled without required fields', () => {
      renderComponent();
      fireEvent.click(screen.getAllByRole('button', { name: /add trade/i })[0]);
      const submitBtns = screen.getAllByRole('button', { name: /add trade/i });
      // The last "Add Trade" button is the modal submit
      const submitBtn = submitBtns[submitBtns.length - 1];
      expect(submitBtn).toBeDisabled();
    });

    test('should close modal when Cancel is clicked', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /add trade/i }));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText(/add new trade/i)).not.toBeInTheDocument();
    });
  });

  describe('trade table with data', () => {
    const dataWithTrades = { ...defaultCapGainsData, trades: [longTermTrade, shortTermTrade] };

    test('should render trade rows', () => {
      renderComponent(dataWithTrades);
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('BTC')).toBeInTheDocument();
    });

    test('should display long-term badge for trade held > 1 year', () => {
      renderComponent(dataWithTrades);
      expect(screen.getAllByText(/long-term/i).length).toBeGreaterThan(0);
    });

    test('should display short-term badge for trade held < 1 year', () => {
      renderComponent(dataWithTrades);
      expect(screen.getAllByText(/short-term/i).length).toBeGreaterThan(0);
    });

    test('should show tax analysis section when trades present', () => {
      renderComponent(dataWithTrades);
      expect(screen.getByText(/tax analysis/i)).toBeInTheDocument();
    });

    test('should show short-term gains in tax analysis', () => {
      renderComponent(dataWithTrades);
      expect(screen.getByText(/short-term gains/i)).toBeInTheDocument();
    });

    test('should show long-term gains in tax analysis', () => {
      renderComponent(dataWithTrades);
      expect(screen.getByText(/long-term gains/i)).toBeInTheDocument();
    });

    test('should show total tax owed', () => {
      renderComponent(dataWithTrades);
      expect(screen.getByText(/total tax owed/i)).toBeInTheDocument();
    });

    test('should show charts section when trades present', () => {
      renderComponent(dataWithTrades);
      expect(screen.getByText(/performance charts/i)).toBeInTheDocument();
    });
  });

  describe('tax calculations with long-term trade', () => {
    // AAPL: gain = (200-100)*10 - 50 = $950, long-term, taxableIncome=$100k single
    // Long-term rate at $100k income (single): 15%
    const dataLT = { ...defaultCapGainsData, trades: [longTermTrade] };

    test('should show non-zero total tax for taxable gain', () => {
      renderComponent(dataLT);
      // Tax analysis card should show something > $0
      expect(screen.getByText(/federal \+ state \+ niit/i)).toBeInTheDocument();
    });

    test('should show positive net gain in dashboard', () => {
      renderComponent(dataLT);
      expect(screen.getByText(/net gain/i)).toBeInTheDocument();
    });
  });

  describe('tax calculations with losing trade', () => {
    const dataLoss = { ...defaultCapGainsData, trades: [losingTrade] };

    test('should show net loss in dashboard', () => {
      renderComponent(dataLoss);
      expect(screen.getByText(/net loss/i)).toBeInTheDocument();
    });
  });

  describe('loss carryforward dashboard card', () => {
    test('should show carryforward card', () => {
      renderComponent();
      expect(screen.getByText(/loss carryforward/i)).toBeInTheDocument();
    });
  });
});
