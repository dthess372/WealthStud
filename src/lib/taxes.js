// Centralized tax calculations and data for 2024 tax year

// Federal tax brackets for 2024
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

// Standard deductions for 2024
export const STANDARD_DEDUCTIONS = {
  single: 14600,
  married: 29200
};

// State income tax rates (2024 approximate rates)
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

// Payroll tax rates and caps for 2024
export const PAYROLL_TAX_RATES = {
  socialSecurity: {
    rate: 0.062,
    cap: 168600 // 2024 Social Security wage base
  },
  medicare: {
    rate: 0.0145,
    additionalRate: 0.009, // Additional Medicare tax for high earners
    additionalThreshold: {
      single: 200000,
      married: 250000
    }
  }
};

// ===== TAX CALCULATION FUNCTIONS =====

/**
 * Calculate federal income tax using progressive tax brackets
 * @param {number} taxableIncome - Income after deductions
 * @param {string} filingStatus - 'single' or 'married'
 * @returns {number} Federal tax owed
 */
export function calculateFederalTax(taxableIncome, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  if (!brackets) {
    throw new Error(`Invalid filing status: ${filingStatus}`);
  }
  
  let tax = 0;
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableInThisBracket = Math.min(
        taxableIncome - bracket.min, 
        bracket.max - bracket.min
      );
      tax += taxableInThisBracket * bracket.rate;
    }
  }
  
  return tax;
}

/**
 * Get marginal tax rate for given income and filing status
 * @param {number} taxableIncome - Income after deductions
 * @param {string} filingStatus - 'single' or 'married'
 * @returns {number} Marginal tax rate (decimal)
 */
export function getMarginalTaxRate(taxableIncome, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  if (!brackets) {
    throw new Error(`Invalid filing status: ${filingStatus}`);
  }
  
  // Find the bracket that applies to this income level
  for (const bracket of [...brackets].reverse()) {
    if (taxableIncome > bracket.min) {
      return bracket.rate;
    }
  }
  
  return brackets[0].rate; // Lowest bracket if income is very low
}

/**
 * Calculate effective tax rate
 * @param {number} tax - Total tax owed
 * @param {number} income - Total income
 * @returns {number} Effective tax rate (decimal)
 */
export function getEffectiveTaxRate(tax, income) {
  return income > 0 ? tax / income : 0;
}

/**
 * Calculate state income tax
 * @param {number} taxableIncome - Income after deductions
 * @param {string} stateCode - Two-letter state code
 * @returns {number} State tax owed
 */
export function calculateStateTax(taxableIncome, stateCode) {
  const state = STATE_TAX_RATES[stateCode];
  if (!state) {
    throw new Error(`Invalid state code: ${stateCode}`);
  }
  
  return taxableIncome * state.rate;
}

/**
 * Calculate Social Security tax
 * @param {number} grossIncome - Total gross income
 * @returns {number} Social Security tax owed
 */
export function calculateSocialSecurityTax(grossIncome) {
  const { rate, cap } = PAYROLL_TAX_RATES.socialSecurity;
  const taxableWages = Math.min(grossIncome, cap);
  return taxableWages * rate;
}

/**
 * Calculate Medicare taxes (regular + additional for high earners)
 * @param {number} grossIncome - Total gross income
 * @param {string} filingStatus - 'single' or 'married'
 * @returns {object} Medicare tax breakdown
 */
export function calculateMedicareTax(grossIncome, filingStatus) {
  const { rate, additionalRate, additionalThreshold } = PAYROLL_TAX_RATES.medicare;
  
  // Regular Medicare tax (no cap)
  const regularMedicareTax = grossIncome * rate;
  
  // Additional Medicare tax for high earners
  const threshold = additionalThreshold[filingStatus];
  const additionalMedicareTax = grossIncome > threshold 
    ? (grossIncome - threshold) * additionalRate 
    : 0;
  
  return {
    regular: regularMedicareTax,
    additional: additionalMedicareTax,
    total: regularMedicareTax + additionalMedicareTax
  };
}

/**
 * Calculate all payroll taxes
 * @param {number} grossIncome - Total gross income
 * @param {string} filingStatus - 'single' or 'married'
 * @returns {object} Payroll tax breakdown
 */
export function calculatePayrollTaxes(grossIncome, filingStatus) {
  const socialSecurityTax = calculateSocialSecurityTax(grossIncome);
  const medicareTax = calculateMedicareTax(grossIncome, filingStatus);
  
  return {
    socialSecurity: socialSecurityTax,
    medicare: medicareTax,
    totalPayroll: socialSecurityTax + medicareTax.total
  };
}

/**
 * Calculate all taxes (federal, state, payroll)
 * @param {number} grossIncome - Total gross income
 * @param {number} taxableIncome - Income after pre-tax deductions
 * @param {string} filingStatus - 'single' or 'married'
 * @param {string} stateCode - Two-letter state code
 * @returns {object} Complete tax breakdown
 */
export function calculateAllTaxes(grossIncome, taxableIncome, filingStatus, stateCode) {
  const federalTax = calculateFederalTax(taxableIncome, filingStatus);
  const stateTax = calculateStateTax(taxableIncome, stateCode);
  const payrollTaxes = calculatePayrollTaxes(grossIncome, filingStatus);
  
  const totalTax = federalTax + stateTax + payrollTaxes.totalPayroll;
  const netIncome = grossIncome - totalTax;
  
  return {
    gross: grossIncome,
    taxable: taxableIncome,
    federal: federalTax,
    state: stateTax,
    payroll: payrollTaxes,
    total: totalTax,
    net: netIncome,
    effectiveRate: getEffectiveTaxRate(totalTax, grossIncome),
    marginalRate: getMarginalTaxRate(taxableIncome, filingStatus)
  };
}

/**
 * Calculate taxable income after standard deduction and pre-tax contributions
 * @param {number} grossIncome - Total gross income
 * @param {string} filingStatus - 'single' or 'married'
 * @param {number} preTaxDeductions - 401k, health insurance, etc.
 * @returns {number} Taxable income
 */
export function calculateTaxableIncome(grossIncome, filingStatus, preTaxDeductions = 0) {
  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus];
  if (!standardDeduction) {
    throw new Error(`Invalid filing status: ${filingStatus}`);
  }
  
  const taxableIncome = grossIncome - preTaxDeductions - standardDeduction;
  return Math.max(0, taxableIncome); // Cannot be negative
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get list of all states with their tax information
 * @returns {Array} Array of state objects
 */
export function getAllStates() {
  return Object.entries(STATE_TAX_RATES).map(([code, data]) => ({
    code,
    name: data.name,
    rate: data.rate
  }));
}

/**
 * Get states with no income tax
 * @returns {Array} Array of no-tax state objects
 */
export function getNoTaxStates() {
  return getAllStates().filter(state => state.rate === 0);
}

/**
 * Get state information by code
 * @param {string} stateCode - Two-letter state code
 * @returns {object|null} State information or null if not found
 */
export function getStateInfo(stateCode) {
  const state = STATE_TAX_RATES[stateCode];
  return state ? { code: stateCode, ...state } : null;
}