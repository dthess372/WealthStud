/**
 * Chart configuration constants
 */

export const CHART_MARGINS = {
  top: 2,
  right: 2,
  left: 2,
  bottom: {
    main: 25,
    small: 10
  }
};

export const TOOLTIP_STYLES = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '4px',
  fontSize: '12px'
};

export const CHART_STROKE_PROPS = {
  grid: '#333',
  axis: '#999'
};

export const CHART_CONFIGS = {
  overview: {
    title: 'Net Worth Overview',
    type: 'area',
    colors: {
      'Total Assets': '#10b981',
      'Net Worth': '#3b82f6',
      'Total Debts': '#ef4444'
    }
  },
  liquid: {
    title: 'Liquid Accounts',
    type: 'area',
    colors: {
      'Checking': '#06b6d4',
      'Savings': '#10b981',
      'Brokerage': '#8b5cf6',
      'Crypto': '#f59e0b'
    }
  },
  retirement: {
    title: 'Retirement Accounts',
    type: 'area',
    colors: {
      '401(k)': '#3b82f6',
      'Roth IRA': '#10b981',
      'Traditional IRA': '#f59e0b',
      'Pension': '#8b5cf6'
    }
  },
  assets: {
    title: 'Physical Assets',
    type: 'line',
    colors: {
      'Home Value': '#10b981',
      'Car Value': '#3b82f6',
      'Other Assets': '#8b5cf6'
    }
  },
  debts: {
    title: 'Debt Balances',
    type: 'area',
    colors: {
      'Mortgage': '#ef4444',
      'Car Loan': '#f59e0b',
      'Credit Cards': '#ec4899',
      'Student Loans': '#8b5cf6',
      'Other Debts': '#6b7280'
    }
  }
};