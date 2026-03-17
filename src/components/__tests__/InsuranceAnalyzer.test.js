import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InsuranceAnalyzer from '../InsuranceAnalyzer/InsuranceAnalyzer';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

jest.mock('lucide-react', () => {
  const icon = (name) => () => <div data-testid={`icon-${name}`} />;
  return {
    Shield: icon('Shield'), Home: icon('Home'), Car: icon('Car'),
    Heart: icon('Heart'), Calculator: icon('Calculator'), Users: icon('Users'),
    DollarSign: icon('DollarSign'), Zap: icon('Zap'), Activity: icon('Activity'),
    Target: icon('Target'), Download: icon('Download'), Upload: icon('Upload')
  };
});

jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>
}));

jest.mock('../SuggestionBox/SuggestionBox', () => () => <div data-testid="suggestion-box" />);
jest.mock('../shared/Navigation', () => () => <nav data-testid="navigation" />);

const { useLocalStorage, useCSV } = require('../../hooks');

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultInsuranceData = {
  activeTab: 'life',
  generalInfo: {
    age: 35, state: 'MI', dependents: 2, annualIncome: 75000,
    totalDebt: 250000, emergencyFund: 15000
  },
  lifeInsurance: {
    currentCoverage: 0, employerCoverage: 100000, spouseIncome: 50000,
    mortgageBalance: 200000, otherDebts: 30000, childrenEducation: 100000,
    finalExpenses: 15000, yearsOfIncome: 10, insuranceType: 'term', termLength: 20
  },
  autoInsurance: {
    vehicleValue: 25000, liability: 300000, collision: 1000, comprehensive: 500,
    personalInjury: 100000, uninsuredMotorist: 100000, roadside: true,
    vehicles: [{ id: 1, year: 2020, make: 'Toyota', model: 'Camry', value: 25000, annualMiles: 12000, ownership: 'financed' }],
    drivingRecord: 'clean', creditScore: 'good', currentPremium: 1200,
    coverageLevels: { liability: '100/300/100', collision: 500, comprehensive: 500, uninsured: true, medical: 5000 }
  },
  homeInsurance: {
    homeValue: 300000, dwellingCoverage: 300000, personalProperty: 150000,
    liability: 300000, medicalPayments: 5000, deductible: 1000,
    homeType: 'single-family', yearBuilt: 2010, squareFeet: 2500, roofAge: 5,
    securityFeatures: ['smoke_detectors', 'deadbolts'], floodZone: false, earthquakeZone: false
  },
  healthInsurance: {
    plan: 'hmo', deductible: 1500, copay: 25, coinsurance: 20, maxOutOfPocket: 8000,
    monthlyPremium: 450, currentPremium: 450, employerContribution: 300,
    expectedMedicalCosts: 3000, hsaEligible: false, hsaContribution: 0, chronicConditions: false
  }
};

const renderComponent = (data = defaultInsuranceData) => {
  const setData = jest.fn();
  useLocalStorage.mockReturnValue([data, setData]);
  useCSV.mockReturnValue({
    exportCSV: jest.fn(),
    createFileInputHandler: jest.fn(() => jest.fn())
  });
  render(<InsuranceAnalyzer />);
  return { setData };
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InsuranceAnalyzer', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('rendering', () => {
    test('should render page title', () => {
      renderComponent();
      expect(screen.getByText('Insurance Coverage Analyzer')).toBeInTheDocument();
    });

    test('should render intro heading', () => {
      renderComponent();
      expect(screen.getByText('Complete Insurance Coverage Analysis')).toBeInTheDocument();
    });

    test('should render navigation', () => {
      renderComponent();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    test('should render General Information section', () => {
      renderComponent();
      expect(screen.getByText('General Information')).toBeInTheDocument();
    });
  });

  describe('general info inputs with accessibility associations', () => {
    test('should render Your Age with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/your age/i)).toBeInTheDocument();
    });

    test('should render State with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/^state$/i)).toBeInTheDocument();
    });

    test('should render Number of Dependents with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/number of dependents/i)).toBeInTheDocument();
    });

    test('should render Annual Income with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/annual income/i)).toBeInTheDocument();
    });
  });

  describe('insurance tabs', () => {
    test('should render Life Insurance tab button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /life insurance/i })).toBeInTheDocument();
    });

    test('should render Auto Insurance tab button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /auto insurance/i })).toBeInTheDocument();
    });

    test('should render Home Insurance tab button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /home insurance/i })).toBeInTheDocument();
    });

    test('should render Health Insurance tab button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /health insurance/i })).toBeInTheDocument();
    });
  });

  describe('life insurance tab (default)', () => {
    test('should render Current Life Insurance Coverage with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/current life insurance coverage/i)).toBeInTheDocument();
    });

    test('should render Employer-Provided Coverage with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/employer-provided coverage/i)).toBeInTheDocument();
    });

    test('should render Years of Income to Replace with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/years of income to replace/i)).toBeInTheDocument();
    });

    test('should render Insurance Type Preference with correct htmlFor/id', () => {
      renderComponent();
      expect(screen.getByLabelText(/insurance type preference/i)).toBeInTheDocument();
    });

    test('should render Coverage Analysis results', () => {
      renderComponent();
      expect(screen.getByText('Coverage Analysis')).toBeInTheDocument();
    });
  });

  describe('input interaction', () => {
    test('should call setData when age changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByLabelText(/your age/i);
      fireEvent.change(input, { target: { value: '40' } });
      expect(setData).toHaveBeenCalled();
    });

    test('should call setData when annual income changes', () => {
      const { setData } = renderComponent();
      const input = screen.getByLabelText(/annual income/i);
      fireEvent.change(input, { target: { value: '100000' } });
      expect(setData).toHaveBeenCalled();
    });
  });

  describe('auto insurance tab', () => {
    test('should show auto insurance content when activeTab is auto', () => {
      renderComponent({ ...defaultInsuranceData, activeTab: 'auto' });
      expect(screen.getByLabelText(/driving record/i)).toBeInTheDocument();
    });

    test('should show vehicle fields with dynamic ids when activeTab is auto', () => {
      renderComponent({ ...defaultInsuranceData, activeTab: 'auto' });
      expect(screen.getByLabelText(/^year$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^make$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^model$/i)).toBeInTheDocument();
    });
  });

  describe('home insurance tab', () => {
    test('should show home value input when activeTab is home', () => {
      renderComponent({ ...defaultInsuranceData, activeTab: 'home' });
      expect(screen.getByLabelText(/home value/i)).toBeInTheDocument();
    });
  });

  describe('health insurance tab', () => {
    test('should show monthly premium input when activeTab is health', () => {
      renderComponent({ ...defaultInsuranceData, activeTab: 'health' });
      expect(screen.getByLabelText(/monthly premium/i)).toBeInTheDocument();
    });
  });

  describe('CSV controls', () => {
    test('should render navigation (which hosts export/import actions)', () => {
      renderComponent();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });
  });
});
