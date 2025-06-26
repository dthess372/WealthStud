import { 
  Banknote, 
  TrendingUp, 
  Home, 
  Shield, 
  Target, 
  CreditCard 
} from 'lucide-react';

export const NET_WORTH_CATEGORIES = {
  cash: {
    name: 'Cash & Equivalents',
    color: '#22c55e',
    icon: Banknote,
    description: 'Liquid assets readily available',
    defaultAccounts: [
      { name: 'Emergency Fund', value: 0 },
      { name: 'Checking Account', value: 0 },
      { name: 'Savings Account', value: 0 },
      { name: 'Money Market', value: 0 },
    ]
  },
  investments: {
    name: 'Investments',
    color: '#3b82f6',
    icon: TrendingUp,
    description: 'Stocks, bonds, and other securities',
    defaultAccounts: [
      { name: 'Brokerage Account', value: 0 },
      { name: 'Index Funds', value: 0 },
      { name: 'Individual Stocks', value: 0 },
      { name: 'Cryptocurrency', value: 0 },
      { name: 'Stock Options', value: 0 },
    ]
  },
  realEstate: {
    name: 'Real Estate',
    color: '#8b5cf6',
    icon: Home,
    description: 'Property and real estate investments',
    defaultAccounts: [
      { name: 'Primary Residence', value: 0 },
      { name: 'Rental Property', value: 0 },
      { name: 'REIT Investments', value: 0 },
    ]
  },
  retirement: {
    name: 'Retirement Accounts',
    color: '#f59e0b',
    icon: Shield,
    description: 'Tax-advantaged retirement savings',
    defaultAccounts: [
      { name: '401(k)', value: 0 },
      { name: 'Traditional IRA', value: 0 },
      { name: 'Roth IRA', value: 0 },
      { name: 'Pension Value', value: 0 },
    ]
  },
  other: {
    name: 'Other Assets',
    color: '#6b7280',
    icon: Target,
    description: 'Vehicles, collectibles, and other assets',
    defaultAccounts: [
      { name: 'Vehicles', value: 0 },
      { name: 'Collectibles', value: 0 },
      { name: 'Business Value', value: 0 },
      { name: 'Other Assets', value: 0 },
    ]
  },
  debts: {
    name: 'Debts & Liabilities',
    color: '#ef4444',
    icon: CreditCard,
    description: 'Money owed to creditors',
    defaultAccounts: [
      { name: 'Mortgage', value: 0 },
      { name: 'Car Loans', value: 0 },
      { name: 'Credit Cards', value: 0 },
      { name: 'Student Loans', value: 0 },
      { name: 'Personal Loans', value: 0 },
    ]
  },
};