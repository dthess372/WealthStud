import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VacationPlanner from '../VacationTimeTool/VacationPlanner';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    Calendar: icon('Calendar'), CheckCircle: icon('CheckCircle'),
    Download: icon('Download'), Upload: icon('Upload'),
    Plus: icon('Plus'), BarChart3: icon('BarChart3'), X: icon('X'),
    Trash2: icon('Trash2'), Edit2: icon('Edit2')
  };
});

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

const { useLocalStorage, useCSV } = require('../../hooks');

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultVacationData = {
  settings: {
    ptoDaysPerYear: 20,
    payFrequency: 14,
    mostRecentPayDate: '2026-01-01',
    ptoAccrual: 'accrual',
    currentPtoBalance: 15,
    ptoRolloverLimit: 5,
    enableCompTime: false,
    currentCompBalance: 0,
    compRolloverLimit: null,
    allowHolidayBanking: false,
    currentHolidayBalance: 0,
    holidayRolloverLimit: null,
    policyType: 'standard'
  },
  tableData: [],
  dashboardData: {
    currentBalance: 15,
    projectedBalance: 20,
    usageRate: 0,
    burnoutRisk: 'Low',
    healthScore: 100
  }
};

const renderComponent = (data = defaultVacationData) => {
  const setData = jest.fn();
  useLocalStorage.mockReturnValue([data, setData]);
  useCSV.mockReturnValue({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  });
  render(<VacationPlanner />);
  return { setData };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VacationPlanner', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText('PTO Vacation Planner')).toBeInTheDocument();
    });

    test('should render intro heading', () => {
      renderComponent();
      expect(screen.getByText('Optimize Your Time Off Strategy')).toBeInTheDocument();
    });

    test('should render navigation', () => {
      renderComponent();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });

  describe('input labels with accessibility associations', () => {
    test('should render PTO Days Per Year with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/pto days per year/i)).toBeInTheDocument();
    });

    test('should render Current PTO Balance with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/current pto balance/i)).toBeInTheDocument();
    });

    test('should render Pay Frequency with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/pay frequency/i)).toBeInTheDocument();
    });

    test('should render Most Recent Pay Date with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/most recent pay date/i)).toBeInTheDocument();
    });

    test('should render PTO Accrual Method with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/pto accrual method/i)).toBeInTheDocument();
    });

    test('should render PTO Rollover Limit with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/pto rollover limit/i)).toBeInTheDocument();
    });

    test('should render Vacation Policy Type with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/vacation policy type/i)).toBeInTheDocument();
    });
  });

  describe('input interaction', () => {
    test('should call setData when PTO days per year changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByLabelText(/pto days per year/i);
      fireEvent.change(input, { target: { value: '25' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should call setData when pay frequency changes', () => {
      const { setData } = renderComponent();
      const select = screen.getByLabelText(/pay frequency/i);
      fireEvent.change(select, { target: { value: '7' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should call setData when accrual method changes', () => {
      const { setData } = renderComponent();
      const select = screen.getByLabelText(/pto accrual method/i);
      fireEvent.change(select, { target: { value: 'lumpSum' } });
      expect(setData).toHaveBeenCalled();
    });
  });

  describe('compensatory time', () => {
    test('should show comp time balance field when enabled', () => {
      const data = {
        ...defaultVacationData,
        settings: { ...defaultVacationData.settings, enableCompTime: true, currentCompBalance: 8 },
        dashboardData: { ...defaultVacationData.dashboardData }
      };
      renderComponent(data);
      expect(screen.getByLabelText(/current comp time balance/i)).toBeInTheDocument();
    });

    test('should hide comp time balance field when disabled', () => {
      renderComponent();
      expect(screen.queryByLabelText(/current comp time balance/i)).not.toBeInTheDocument();
    });
  });

  describe('holiday banking', () => {
    test('should show holiday balance field when enabled', () => {
      const data = {
        ...defaultVacationData,
        settings: { ...defaultVacationData.settings, allowHolidayBanking: true, currentHolidayBalance: 3 },
        dashboardData: { ...defaultVacationData.dashboardData }
      };
      renderComponent(data);
      expect(screen.getByLabelText(/current holiday balance/i)).toBeInTheDocument();
    });
  });

  describe('CSV controls', () => {
    test('should render navigation (which hosts export/import actions)', () => {
      renderComponent();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });
});
