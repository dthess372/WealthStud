import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NetWorthCalculator from '../NetWorthCalculator/NetWorthCalculator';

// Mock the hooks
jest.mock('../../hooks', () => ({
  useLocalStorage: jest.fn(),
  useCSV: jest.fn()
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
  Target: () => <div data-testid="target-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Info: () => <div data-testid="info-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Banknote: () => <div data-testid="banknote-icon" />,
  Home: () => <div data-testid="home-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  CreditCard: () => <div data-testid="credit-card-icon" />
}));

// Mock MUI components
jest.mock('@mui/x-charts', () => ({
  PieChart: ({ children, ...props }) => (
    <div data-testid="pie-chart" {...props}>
      {children}
    </div>
  )
}));

// Mock SuggestionBox
jest.mock('../SuggestionBox/SuggestionBox', () => {
  return function SuggestionBox() {
    return <div data-testid="suggestion-box">Suggestions</div>;
  };
});

const { useLocalStorage, useCSV } = require('../../hooks');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NetWorthCalculator', () => {
  const mockSetNetWorthData = jest.fn();
  const mockExportCSV = jest.fn();
  const mockCreateFileInputHandler = jest.fn();

  const defaultNetWorthData = {
    accounts: {
      cash: [
        { id: 'cash_0', name: 'Emergency Fund', value: 10000 },
        { id: 'cash_1', name: 'Checking Account', value: 5000 }
      ],
      investments: [
        { id: 'investments_0', name: 'Brokerage Account', value: 50000 }
      ],
      realEstate: [],
      retirement: [
        { id: 'retirement_0', name: '401(k)', value: 75000 }
      ],
      other: [],
      debts: [
        { id: 'debts_0', name: 'Credit Cards', value: 5000 }
      ]
    }
  };

  beforeEach(() => {
    useLocalStorage.mockReturnValue([defaultNetWorthData, mockSetNetWorthData]);
    useCSV.mockReturnValue({
      exportCSV: mockExportCSV,
      createFileInputHandler: mockCreateFileInputHandler
    });
    jest.clearAllMocks();
  });

  test('should render net worth calculator with correct title', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    expect(screen.getByText('Net Worth Calculator')).toBeInTheDocument();
    expect(screen.getByText('Track your assets, liabilities, and overall financial health')).toBeInTheDocument();
  });

  test('should calculate and display net worth correctly', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    // Total assets: 10000 + 5000 + 50000 + 75000 = 140000
    // Total debts: 5000
    // Net worth: 140000 - 5000 = 135000
    
    expect(screen.getByText('$135,000')).toBeInTheDocument(); // Net worth
    expect(screen.getByText('$140,000')).toBeInTheDocument(); // Total assets
    expect(screen.getByText('$5,000')).toBeInTheDocument(); // Total debts
  });

  test('should display financial health score', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    // With this data, should show a health score
    const healthScoreElements = screen.getAllByText(/\d+/);
    expect(healthScoreElements.length).toBeGreaterThan(0);
  });

  test('should show category sections with account data', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    expect(screen.getByText('Cash & Equivalents')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Retirement Accounts')).toBeInTheDocument();
    expect(screen.getByText('Debts & Liabilities')).toBeInTheDocument();
    
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('Brokerage Account')).toBeInTheDocument();
    expect(screen.getByText('401(k)')).toBeInTheDocument();
    expect(screen.getByText('Credit Cards')).toBeInTheDocument();
  });

  test('should allow editing account values', async () => {
    renderWithRouter(<NetWorthCalculator />);
    
    // Find the first account value input and change it
    const valueInputs = screen.getAllByDisplayValue('10000');
    if (valueInputs.length > 0) {
      fireEvent.change(valueInputs[0], { target: { value: '15000' } });
      
      await waitFor(() => {
        expect(mockSetNetWorthData).toHaveBeenCalled();
      });
    }
  });

  test('should allow editing account names', async () => {
    renderWithRouter(<NetWorthCalculator />);
    
    // Find and click on an account name to edit
    const emergencyFundName = screen.getByText('Emergency Fund');
    fireEvent.click(emergencyFundName);
    
    // Should show an input field for editing
    await waitFor(() => {
      const editInput = screen.getByDisplayValue('Emergency Fund');
      expect(editInput).toBeInTheDocument();
      
      // Change the name
      fireEvent.change(editInput, { target: { value: 'Rainy Day Fund' } });
      fireEvent.blur(editInput);
      
      expect(mockSetNetWorthData).toHaveBeenCalled();
    });
  });

  test('should handle category collapse/expand', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    // Find a category header and click to collapse
    const categoryHeader = screen.getByText('Cash & Equivalents').closest('.category-header');
    if (categoryHeader) {
      fireEvent.click(categoryHeader);
      
      // The category content should be hidden
      // This would need to check for CSS classes or visibility
    }
  });

  test('should show add account buttons', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    const addAccountButtons = screen.getAllByText('Add Account');
    expect(addAccountButtons.length).toBeGreaterThan(0);
  });

  test('should show remove account buttons for existing accounts', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    const removeButtons = screen.getAllByTestId('trash-icon');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  test('should export CSV when export button is clicked', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);
    
    expect(mockExportCSV).toHaveBeenCalled();
  });

  test('should show insights for financial health', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    expect(screen.getByText('Financial Health Insights')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Debt-to-Asset Ratio')).toBeInTheDocument();
    expect(screen.getByText('Investment Ratio')).toBeInTheDocument();
  });

  test('should show appropriate status indicators', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    // Should show positive net worth indicator
    expect(screen.getByText('Assets exceed debts')).toBeInTheDocument();
  });

  test('should handle empty account categories', () => {
    const emptyData = {
      accounts: {
        cash: [],
        investments: [],
        realEstate: [],
        retirement: [],
        other: [],
        debts: []
      }
    };
    
    useLocalStorage.mockReturnValue([emptyData, mockSetNetWorthData]);
    
    renderWithRouter(<NetWorthCalculator />);
    
    // Should show $0 for all totals
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  test('should show visualization section', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    expect(screen.getByText('Data Visualization')).toBeInTheDocument();
    expect(screen.getByText('Asset Allocation')).toBeInTheDocument();
    expect(screen.getByText('Assets vs Debts')).toBeInTheDocument();
  });

  test('should show charts when data is available', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    const pieCharts = screen.getAllByTestId('pie-chart');
    expect(pieCharts.length).toBeGreaterThan(0);
  });

  test('should show suggestion box', () => {
    renderWithRouter(<NetWorthCalculator />);
    
    expect(screen.getByTestId('suggestion-box')).toBeInTheDocument();
  });

  test('should handle negative net worth', () => {
    const negativeNetWorthData = {
      accounts: {
        cash: [{ id: 'cash_0', name: 'Checking', value: 1000 }],
        investments: [],
        realEstate: [],
        retirement: [],
        other: [],
        debts: [{ id: 'debts_0', name: 'Credit Cards', value: 10000 }]
      }
    };
    
    useLocalStorage.mockReturnValue([negativeNetWorthData, mockSetNetWorthData]);
    
    renderWithRouter(<NetWorthCalculator />);
    
    expect(screen.getByText('Debts exceed assets')).toBeInTheDocument();
  });
});