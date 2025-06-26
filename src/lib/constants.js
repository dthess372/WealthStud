// Application-wide constants and configuration

// Application Info
export const APP_INFO = {
  name: 'WealthStud',
  domain: 'wealthstud.io',
  description: 'Financial wellness tools for smart money management',
  homepage: 'https://dthess372.github.io/RetirementCalc'
};

// Routes and Navigation
export const ROUTES = {
  HOME: '/',
  BUDGET_PLANNER: '/BudgetPlanner',
  RETIREMENT_CALCULATOR: '/RetirementCalculator',
  NET_WORTH_CALCULATOR: '/NetWorthCalculator',
  SAVING_PLANNER: '/SavingPlanner',
  VACATION_PLANNER: '/VacationPlanner',
  MORTGAGE_TOOL: '/MortgageTool',
  INSURANCE_ANALYZER: '/InsuranceAnalyzer',
  FINANCIAL_DASHBOARD: '/FinancialDashboard'
};

// Common Colors for Charts and UI
export const COLORS = {
  primary: {
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#8b5cf6',
    orange: '#f97316',
    cyan: '#06b6d4',
    teal: '#14b8a6',
    yellow: '#eab308'
  },
  chart: {
    income: '#22c55e',
    expenses: '#ef4444',
    savings: '#3b82f6',
    investments: '#8b5cf6',
    debt: '#f97316',
    assets: '#06b6d4'
  },
  status: {
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    info: '#3b82f6'
  }
};

// Currency and Number Formatting
export const FORMATTING = {
  currency: {
    locale: 'en-US',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  percentage: {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }
};

// Financial Constants
export const FINANCIAL_CONSTANTS = {
  // Retirement contribution limits (2024)
  RETIREMENT_LIMITS: {
    IRA_LIMIT: 7000,
    IRA_CATCHUP_AGE: 50,
    IRA_CATCHUP_ADDITIONAL: 1000,
    K401_LIMIT: 23000,
    K401_CATCHUP_AGE: 50,
    K401_CATCHUP_ADDITIONAL: 7500
  },
  
  // Common investment return assumptions
  MARKET_ASSUMPTIONS: {
    AVERAGE_STOCK_RETURN: 0.10,
    AVERAGE_BOND_RETURN: 0.04,
    INFLATION_RATE: 0.03,
    SAFE_WITHDRAWAL_RATE: 0.04
  },
  
  // Typical expense ratios
  EXPENSE_RATIOS: {
    LOW_COST_INDEX: 0.0003,
    AVERAGE_MUTUAL_FUND: 0.005,
    ACTIVE_FUND: 0.01
  }
};

// Default categories for various tools
export const DEFAULT_CATEGORIES = {
  NET_WORTH: {
    CASH: 'cash',
    INVESTMENTS: 'investments', 
    RETIREMENT: 'retirement',
    ASSETS: 'assets',
    DEBT: 'debt'
  },
  
  BUDGET: {
    INCOME: 'income',
    HOUSING: 'housing',
    TRANSPORTATION: 'transportation',
    FOOD: 'food',
    UTILITIES: 'utilities',
    ENTERTAINMENT: 'entertainment',
    SAVINGS: 'savings',
    DEBT_PAYMENTS: 'debt_payments'
  }
};

// File Export/Import Settings
export const FILE_SETTINGS = {
  CSV_DELIMITER: ',',
  DATE_FORMAT: 'YYYY-MM-DD',
  DEFAULT_FILENAME_PREFIX: 'wealthstud_export_',
  SUPPORTED_FILE_TYPES: ['.csv']
};

// Common Input Validation Rules
export const VALIDATION_RULES = {
  INCOME: {
    MIN: 0,
    MAX: 10000000
  },
  AGE: {
    MIN: 18,
    MAX: 100
  },
  PERCENTAGE: {
    MIN: 0,
    MAX: 100
  },
  INTEREST_RATE: {
    MIN: 0,
    MAX: 50
  }
};

// API Configuration (if needed in future)
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '',
  TIMEOUT: 10000,
  ENDPOINTS: {
    TAX_CALCULATOR: '/api/tax-calculator',
    MARKET_DATA: '/api/market-data'
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  BUDGET_DATA: 'wealthstud_budget_data',
  NET_WORTH_DATA: 'wealthstud_networth_data',
  RETIREMENT_DATA: 'wealthstud_retirement_data',
  SAVINGS_DATA: 'wealthstud_savings_data',
  SAVINGS_GOALS: 'wealthstud_savings_goals',
  CAPITAL_GAINS_DATA: 'wealthstud_capital_gains_data',
  INSURANCE_DATA: 'wealthstud_insurance_data',
  MORTGAGE_DATA: 'wealthstud_mortgage_data',
  VACATION_DATA: 'wealthstud_vacation_data',
  FINANCIAL_DASHBOARD: 'wealthstud_financial_dashboard',
  USER_PREFERENCES: 'wealthstud_preferences'
};

// Chart Configuration Defaults
export const CHART_DEFAULTS = {
  height: 400,
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  animationDuration: 300,
  fontSize: 12,
  fontFamily: 'inherit'
};

// Common Error Messages
export const ERROR_MESSAGES = {
  INVALID_NUMBER: 'Please enter a valid number',
  REQUIRED_FIELD: 'This field is required',
  NEGATIVE_VALUE: 'Value cannot be negative',
  FILE_UPLOAD_ERROR: 'Error uploading file. Please check format and try again.',
  CALCULATION_ERROR: 'Error performing calculation. Please check your inputs.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  DATA_SAVED: 'Data saved successfully',
  FILE_EXPORTED: 'File exported successfully',
  FILE_IMPORTED: 'File imported successfully',
  CALCULATION_COMPLETE: 'Calculation completed successfully'
};