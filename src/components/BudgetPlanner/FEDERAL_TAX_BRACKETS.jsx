// src/components/BudgetPlanner/data/FederalTaxBrackets.js

// 2024 Federal tax brackets
export const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  married: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ]
};

// 2024 Standard deductions
export const STANDARD_DEDUCTIONS = {
  single: 14600,
  married: 29200
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