/**
 * Input validation rules for financial data.
 * Generic numeric bounds are sourced from VALIDATION_BOUNDS in src/lib/constants.js
 * to keep shared limits (age, percentage, etc.) in one place.
 */
import { VALIDATION_BOUNDS } from '../lib/constants';

export const VALIDATION_RULES = {
  // Personal Information
  salary: { min: VALIDATION_BOUNDS.INCOME.MIN, max: VALIDATION_BOUNDS.INCOME.MAX, message: 'Salary must be between $0 and $10M' },
  age: { min: VALIDATION_BOUNDS.AGE.MIN, max: VALIDATION_BOUNDS.AGE.MAX, message: 'Age must be between 18 and 100' },
  retirementAge: { min: 50, max: VALIDATION_BOUNDS.AGE.MAX, message: 'Retirement age must be between 50 and 100' },
  monthlyExpenses: { min: 0, max: 50000, message: 'Monthly expenses must be between $0 and $50K' },
  
  // Account Balances
  checkingBalance: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  savingsBalance: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  brokerageBalance: { min: 0, max: 100000000, message: 'Balance must be between $0 and $100M' },
  cryptoBalance: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  
  // Retirement Accounts
  current401k: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  currentRothIRA: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  currentTraditionalIRA: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  currentPension: { min: 0, max: 10000000, message: 'Balance must be between $0 and $10M' },
  
  // Assets
  homeValue: { min: 0, max: 50000000, message: 'Home value must be between $0 and $50M' },
  carValue: { min: 0, max: 1000000, message: 'Car value must be between $0 and $1M' },
  otherAssets: { min: 0, max: 50000000, message: 'Other assets must be between $0 and $50M' },
  
  // Debts
  mortgage: { min: 0, max: 10000000, message: 'Mortgage must be between $0 and $10M' },
  carLoan: { min: 0, max: 1000000, message: 'Car loan must be between $0 and $1M' },
  creditCards: { min: 0, max: 500000, message: 'Credit cards must be between $0 and $500K' },
  studentLoans: { min: 0, max: 1000000, message: 'Student loans must be between $0 and $1M' },
  otherDebts: { min: 0, max: 1000000, message: 'Other debts must be between $0 and $1M' },
  
  // Allocation Percentages
  checkingAllocation: { min: VALIDATION_BOUNDS.PERCENTAGE.MIN, max: VALIDATION_BOUNDS.PERCENTAGE.MAX, message: 'Allocation must be between 0% and 100%' },
  savingsAllocation: { min: VALIDATION_BOUNDS.PERCENTAGE.MIN, max: VALIDATION_BOUNDS.PERCENTAGE.MAX, message: 'Allocation must be between 0% and 100%' },
  brokerageAllocation: { min: VALIDATION_BOUNDS.PERCENTAGE.MIN, max: VALIDATION_BOUNDS.PERCENTAGE.MAX, message: 'Allocation must be between 0% and 100%' },
  cryptoAllocation: { min: VALIDATION_BOUNDS.PERCENTAGE.MIN, max: VALIDATION_BOUNDS.PERCENTAGE.MAX, message: 'Allocation must be between 0% and 100%' },

  // Contribution Percentages
  contribution401k: { min: VALIDATION_BOUNDS.PERCENTAGE.MIN, max: VALIDATION_BOUNDS.PERCENTAGE.MAX, message: 'Contribution must be between 0% and 100%' },
  contributionRothIRA: { min: 0, max: 100000, message: 'Contribution must be between $0 and $100K' },
  contributionTraditionalIRA: { min: 0, max: 100000, message: 'Contribution must be between $0 and $100K' },
  employerMatch: { min: VALIDATION_BOUNDS.PERCENTAGE.MIN, max: VALIDATION_BOUNDS.PERCENTAGE.MAX, message: 'Match must be between 0% and 100%' },
  
  // Return Rates
  savingsReturn: { min: 0, max: 50, message: 'Return must be between 0% and 50%' },
  brokerageReturn: { min: -50, max: 100, message: 'Return must be between -50% and 100%' },
  cryptoReturn: { min: -95, max: 1000, message: 'Return must be between -95% and 1000%' },
  retirement401kReturn: { min: -50, max: 50, message: 'Return must be between -50% and 50%' },
  rothIRAReturn: { min: -50, max: 50, message: 'Return must be between -50% and 50%' },
  traditionalIRAReturn: { min: -50, max: 50, message: 'Return must be between -50% and 50%' },
  
  // Interest Rates
  mortgageRate: { min: 0, max: 30, message: 'Rate must be between 0% and 30%' },
  carLoanRate: { min: 0, max: 50, message: 'Rate must be between 0% and 50%' },
  creditCardRate: { min: 0, max: 100, message: 'Rate must be between 0% and 100%' },
  studentLoanRate: { min: 0, max: 50, message: 'Rate must be between 0% and 50%' },
  otherDebtRate: { min: 0, max: 100, message: 'Rate must be between 0% and 100%' },
  
  // Payment Amounts
  mortgagePayment: { min: 0, max: 50000, message: 'Payment must be between $0 and $50K' },
  carLoanPayment: { min: 0, max: 10000, message: 'Payment must be between $0 and $10K' },
  creditCardPayment: { min: 0, max: 10000, message: 'Payment must be between $0 and $10K' },
  studentLoanPayment: { min: 0, max: 10000, message: 'Payment must be between $0 and $10K' },
  otherDebtPayment: { min: 0, max: 10000, message: 'Payment must be between $0 and $10K' }
};