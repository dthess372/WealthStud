// src/components/BudgetPlanner/data/StateTaxRates.js

// State tax data (2024 rates)
export const STATE_TAX_RATES = {
  'AL': { rate: 0.05, name: 'Alabama' },
  'AK': { rate: 0, name: 'Alaska' },
  'AZ': { rate: 0.0459, name: 'Arizona' },
  'AR': { rate: 0.059, name: 'Arkansas' },
  'CA': { rate: 0.093, name: 'California' },
  'CO': { rate: 0.044, name: 'Colorado' },
  'CT': { rate: 0.0635, name: 'Connecticut' },
  'DE': { rate: 0.066, name: 'Delaware' },
  'FL': { rate: 0, name: 'Florida' },
  'GA': { rate: 0.0575, name: 'Georgia' },
  'HI': { rate: 0.082, name: 'Hawaii' },
  'ID': { rate: 0.058, name: 'Idaho' },
  'IL': { rate: 0.0495, name: 'Illinois' },
  'IN': { rate: 0.0323, name: 'Indiana' },
  'IA': { rate: 0.086, name: 'Iowa' },
  'KS': { rate: 0.057, name: 'Kansas' },
  'KY': { rate: 0.05, name: 'Kentucky' },
  'LA': { rate: 0.0425, name: 'Louisiana' },
  'ME': { rate: 0.0715, name: 'Maine' },
  'MD': { rate: 0.0575, name: 'Maryland' },
  'MA': { rate: 0.05, name: 'Massachusetts' },
  'MI': { rate: 0.0425, name: 'Michigan' },
  'MN': { rate: 0.0785, name: 'Minnesota' },
  'MS': { rate: 0.05, name: 'Mississippi' },
  'MO': { rate: 0.054, name: 'Missouri' },
  'MT': { rate: 0.069, name: 'Montana' },
  'NE': { rate: 0.0684, name: 'Nebraska' },
  'NV': { rate: 0, name: 'Nevada' },
  'NH': { rate: 0, name: 'New Hampshire' },
  'NJ': { rate: 0.0897, name: 'New Jersey' },
  'NM': { rate: 0.049, name: 'New Mexico' },
  'NY': { rate: 0.0685, name: 'New York' },
  'NC': { rate: 0.049, name: 'North Carolina' },
  'ND': { rate: 0.029, name: 'North Dakota' },
  'OH': { rate: 0.0399, name: 'Ohio' },
  'OK': { rate: 0.05, name: 'Oklahoma' },
  'OR': { rate: 0.099, name: 'Oregon' },
  'PA': { rate: 0.0307, name: 'Pennsylvania' },
  'RI': { rate: 0.0599, name: 'Rhode Island' },
  'SC': { rate: 0.07, name: 'South Carolina' },
  'SD': { rate: 0, name: 'South Dakota' },
  'TN': { rate: 0, name: 'Tennessee' },
  'TX': { rate: 0, name: 'Texas' },
  'UT': { rate: 0.0495, name: 'Utah' },
  'VT': { rate: 0.0875, name: 'Vermont' },
  'VA': { rate: 0.0575, name: 'Virginia' },
  'WA': { rate: 0, name: 'Washington' },
  'WV': { rate: 0.065, name: 'West Virginia' },
  'WI': { rate: 0.0765, name: 'Wisconsin' },
  'WY': { rate: 0, name: 'Wyoming' },
  'DC': { rate: 0.0895, name: 'District of Columbia' }
};

// Payroll tax constants (2024)
export const PAYROLL_TAX_RATES = {
  socialSecurity: {
    rate: 0.062,
    cap: 168600 // 2024 cap
  },
  medicare: {
    rate: 0.0145,
    additionalRate: 0.009, // Additional Medicare tax
    additionalThreshold: {
      single: 200000,
      married: 250000
    }
  }
};

// Helper function to calculate all taxes
export const calculateAllTaxes = (grossIncome, taxableIncome, filingStatus, stateCode) => {
  const state = STATE_TAX_RATES[stateCode];
  const payroll = PAYROLL_TAX_RATES;
  
  // Social Security tax (has cap)
  const socialSecurityTax = Math.min(grossIncome * payroll.socialSecurity.rate, 
    payroll.socialSecurity.cap * payroll.socialSecurity.rate);
  
  // Medicare tax
  const medicareTax = grossIncome * payroll.medicare.rate;
  
  // Additional Medicare tax (for high earners)
  const additionalMedicareThreshold = payroll.medicare.additionalThreshold[filingStatus];
  const additionalMedicareTax = grossIncome > additionalMedicareThreshold 
    ? (grossIncome - additionalMedicareThreshold) * payroll.medicare.additionalRate 
    : 0;
  
  // State tax
  const stateTax = taxableIncome * state.rate;
  
  return {
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    stateTax,
    totalPayrollTax: socialSecurityTax + medicareTax + additionalMedicareTax,
    totalStateTax: stateTax
  };
};