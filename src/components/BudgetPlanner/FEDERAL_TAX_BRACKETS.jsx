// src/components/BudgetPlanner/data/FederalTaxBrackets.js
// NOTE: This file is no longer imported. BudgetPlanner uses src/lib/taxes.js directly.
// Kept for reference only — do not use these values in calculations.

// 2025 Federal tax brackets
export const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 }
  ],
  married: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 }
  ]
};

// 2025 Standard deductions
export const STANDARD_DEDUCTIONS = {
  single: 15000,
  married: 30000
};

// Tax calculation helper functions
export const calculateFederalTax = (taxableIncome, status) => {
  const brackets = FEDERAL_TAX_BRACKETS[status];
  let tax = 0;
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableInThisBracket = Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
      tax += taxableInThisBracket * bracket.rate;
    }
  }
  
  return tax;
};

export const getMarginalRate = (taxableIncome, status) => {
  const brackets = [...FEDERAL_TAX_BRACKETS[status]].reverse();
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      return bracket.rate;
    }
  }
  return 0.10;
};