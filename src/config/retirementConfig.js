import { 
  Shield, 
  Landmark, 
  TrendingUp, 
  BarChart3, 
  Heart, 
  Building 
} from 'lucide-react';

export const RETIREMENT_ACCOUNT_TYPES = {
  '401k': {
    name: 'Traditional 401(k)',
    icon: Shield,
    color: '#10b981',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      employeeContribution: { label: 'Your Annual Contribution', type: 'currency', required: true },
      employeeContributionPercent: { label: 'Or as % of Salary', type: 'percent', alternateFor: 'employeeContribution' },
      employerMatch: { label: 'Employer Match %', type: 'percent', tooltip: '% of salary your employer matches' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'roth401k': {
    name: 'Roth 401(k)',
    icon: Shield,
    color: '#8b5cf6',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      employeeContribution: { label: 'Your Annual Contribution', type: 'currency', required: true },
      employeeContributionPercent: { label: 'Or as % of Salary', type: 'percent', alternateFor: 'employeeContribution' },
      employerMatch: { label: 'Employer Match %', type: 'percent', tooltip: '% of salary your employer matches' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'ira': {
    name: 'Traditional IRA',
    icon: Landmark,
    color: '#f59e0b',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency', required: true },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'rothIra': {
    name: 'Roth IRA',
    icon: Landmark,
    color: '#ec4899',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency', required: true },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'companyStock': {
    name: 'Company Stock/RSUs',
    icon: TrendingUp,
    color: '#ef4444',
    fields: {
      currentBalance: { label: 'Current Value', type: 'currency', required: true },
      annualGrant: { label: 'Annual Grant Value', type: 'currency', tooltip: 'Value of stock grants per year' },
      vestingPeriod: { label: 'Vesting Period (Years)', type: 'number', default: 4 },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 10 }
    }
  },
  'brokerage': {
    name: 'Brokerage Account',
    icon: BarChart3,
    color: '#06b6d4',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 8 }
    }
  },
  'hsa': {
    name: 'HSA (Health Savings)',
    icon: Heart,
    color: '#22c55e',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency' },
      employerContribution: { label: 'Employer Contribution', type: 'currency' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 6 }
    }
  },
  '403b': {
    name: '403(b)',
    icon: Building,
    color: '#3b82f6',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      employeeContribution: { label: 'Your Annual Contribution', type: 'currency', required: true },
      employerMatch: { label: 'Employer Match %', type: 'percent' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  }
};