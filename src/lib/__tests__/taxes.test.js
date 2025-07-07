import {
  calculateFederalTax,
  getMarginalTaxRate,
  getEffectiveTaxRate,
  calculateStateTax,
  calculateSocialSecurityTax,
  calculateMedicareTax,
  calculatePayrollTaxes,
  calculateAllTaxes,
  calculateTaxableIncome,
  getAllStates,
  getNoTaxStates,
  getStateInfo
} from '../taxes';

describe('Federal Tax Calculations', () => {
  describe('calculateFederalTax', () => {
    test('should calculate federal tax for single filer correctly', () => {
      // Test 2024 tax brackets for single filer (using taxable income, not gross)
      expect(calculateFederalTax(10000, 'single')).toBeCloseTo(1000, 0); // 10% bracket
      expect(calculateFederalTax(50000, 'single')).toBeCloseTo(6053, 0); // Multiple brackets
      expect(calculateFederalTax(100000, 'single')).toBeCloseTo(17053, 0); // Higher brackets (actual calculation)
    });

    test('should calculate federal tax for married filing jointly', () => {
      expect(calculateFederalTax(50000, 'married')).toBeCloseTo(5536, 0); // Actual calculation
      expect(calculateFederalTax(100000, 'married')).toBeCloseTo(12106, 0); // Actual calculation: $2,320 + $8,532 + $1,254
    });

    test('should handle zero income', () => {
      expect(calculateFederalTax(0, 'single')).toBe(0);
      expect(calculateFederalTax(0, 'married')).toBe(0);
    });

    test('should handle negative income', () => {
      expect(calculateFederalTax(-1000, 'single')).toBe(0);
    });

    test('should handle very high income', () => {
      const tax = calculateFederalTax(1000000, 'single');
      expect(tax).toBeGreaterThan(300000);
      expect(tax).toBeLessThan(400000);
    });

    test('should handle different filing statuses', () => {
      const income = 75000;
      const singleTax = calculateFederalTax(income, 'single');
      const marriedTax = calculateFederalTax(income, 'married');
      
      // Married filing jointly should generally have lower tax
      expect(marriedTax).toBeLessThan(singleTax);
    });
  });

  describe('getMarginalTaxRate', () => {
    test('should return correct marginal tax rate', () => {
      expect(getMarginalTaxRate(10000, 'single')).toBe(0.10);
      expect(getMarginalTaxRate(50000, 'single')).toBe(0.22);
      expect(getMarginalTaxRate(200000, 'single')).toBe(0.32);
      expect(getMarginalTaxRate(600000, 'single')).toBe(0.35);
    });

    test('should handle edge cases', () => {
      expect(getMarginalTaxRate(0, 'single')).toBe(0.10);
      expect(getMarginalTaxRate(-1000, 'single')).toBe(0.10);
    });
  });

  describe('getEffectiveTaxRate', () => {
    test('should calculate effective tax rate correctly', () => {
      expect(getEffectiveTaxRate(10000, 100000)).toBe(10); // Returns percentage
      expect(getEffectiveTaxRate(25000, 100000)).toBe(25);
      expect(getEffectiveTaxRate(0, 100000)).toBe(0);
    });

    test('should handle zero income', () => {
      expect(getEffectiveTaxRate(1000, 0)).toBe(0);
    });

    test('should handle edge cases', () => {
      expect(getEffectiveTaxRate(0, 0)).toBe(0);
      expect(getEffectiveTaxRate(-1000, 100000)).toBe(-1); // Allow negative tax credits (percentage)
    });
  });
});

describe('State Tax Calculations', () => {
  describe('calculateStateTax', () => {
    test('should calculate state tax for states with income tax', () => {
      // California has state income tax
      const caTax = calculateStateTax(100000, 'CA');
      expect(caTax).toBeGreaterThan(0);
      
      // New York has state income tax
      const nyTax = calculateStateTax(100000, 'NY');
      expect(nyTax).toBeGreaterThan(0);
    });

    test('should return zero for no-tax states', () => {
      expect(calculateStateTax(100000, 'TX')).toBe(0); // Texas
      expect(calculateStateTax(100000, 'FL')).toBe(0); // Florida
      expect(calculateStateTax(100000, 'WA')).toBe(0); // Washington
      expect(calculateStateTax(100000, 'NV')).toBe(0); // Nevada
    });

    test('should handle zero income', () => {
      expect(calculateStateTax(0, 'CA')).toBe(0);
      expect(calculateStateTax(0, 'NY')).toBe(0);
    });

    test('should handle invalid state codes', () => {
      expect(calculateStateTax(100000, 'XX')).toBe(0);
      expect(calculateStateTax(100000, '')).toBe(0);
      expect(calculateStateTax(100000, null)).toBe(0);
    });
  });
});

describe('Payroll Tax Calculations', () => {
  describe('calculateSocialSecurityTax', () => {
    test('should calculate Social Security tax up to wage base', () => {
      expect(calculateSocialSecurityTax(50000)).toBeCloseTo(3100, 1); // 6.2% of 50k
      expect(calculateSocialSecurityTax(100000)).toBeCloseTo(6200, 1); // 6.2% of 100k
    });

    test('should cap at Social Security wage base', () => {
      const wageBase = 168600; // 2024 wage base
      const maxTax = wageBase * 0.062;
      
      expect(calculateSocialSecurityTax(200000)).toBeCloseTo(maxTax, 1);
      expect(calculateSocialSecurityTax(500000)).toBeCloseTo(maxTax, 1);
    });

    test('should handle zero income', () => {
      expect(calculateSocialSecurityTax(0)).toBe(0);
    });

    test('should handle negative income', () => {
      expect(calculateSocialSecurityTax(-1000)).toBe(0);
    });
  });

  describe('calculateMedicareTax', () => {
    test('should calculate Medicare tax at 1.45%', () => {
      expect(calculateMedicareTax(50000, 'single').total).toBeCloseTo(725, 1); // 1.45% of 50k
      expect(calculateMedicareTax(100000, 'single').total).toBeCloseTo(1450, 1); // 1.45% of 100k
    });

    test('should include additional Medicare tax for high earners', () => {
      // Single filer over $200k threshold
      const higherTax = calculateMedicareTax(250000, 'single').total;
      const lowerTax = calculateMedicareTax(150000, 'single').total;
      
      // Should be more than just 1.45% due to additional 0.9% tax
      expect(higherTax / 250000).toBeGreaterThan(0.0145);
      expect(lowerTax / 150000).toBeCloseTo(0.0145, 4);
    });

    test('should handle different filing statuses for additional Medicare tax', () => {
      const income = 250000;
      const singleTax = calculateMedicareTax(income, 'single');
      const marriedTax = calculateMedicareTax(income, 'married');
      
      // Married threshold is higher, so should have lower effective rate
      expect(marriedTax.total / income).toBeLessThanOrEqual(singleTax.total / income);
    });
  });

  describe('calculatePayrollTaxes', () => {
    test('should combine Social Security and Medicare taxes', () => {
      const income = 100000;
      const payrollTax = calculatePayrollTaxes(income, 'single');
      const ssTax = calculateSocialSecurityTax(income);
      const medicareTax = calculateMedicareTax(income, 'single');
      
      expect(payrollTax.socialSecurity).toBeCloseTo(ssTax, 1);
      expect(payrollTax.medicare).toBeCloseTo(medicareTax.total, 1);
      expect(payrollTax.total).toBeCloseTo(ssTax + medicareTax.total, 1);
    });

    test('should provide detailed breakdown', () => {
      const result = calculatePayrollTaxes(100000, 'single');
      
      expect(result).toHaveProperty('socialSecurity');
      expect(result).toHaveProperty('medicare');
      expect(result).toHaveProperty('total');
      expect(typeof result.socialSecurity).toBe('number');
      expect(typeof result.medicare).toBe('number');
      expect(typeof result.total).toBe('number');
    });
  });
});

describe('Comprehensive Tax Calculations', () => {
  describe('calculateAllTaxes', () => {
    test('should calculate all tax types for typical scenario', () => {
      const result = calculateAllTaxes(100000, 100000, 'single', 'CA');
      
      expect(result).toHaveProperty('federalIncomeTax');
      expect(result).toHaveProperty('stateIncomeTax');
      expect(result).toHaveProperty('socialSecurityTax');
      expect(result).toHaveProperty('medicareTax');
      expect(result).toHaveProperty('totalTaxes');
      expect(result).toHaveProperty('effectiveRate');
      expect(result).toHaveProperty('marginalRate');
      
      expect(result.federalIncomeTax).toBeGreaterThan(0);
      expect(result.stateIncomeTax).toBeGreaterThan(0); // CA has state tax
      expect(result.socialSecurityTax).toBeGreaterThan(0);
      expect(result.medicareTax).toBeGreaterThan(0);
      expect(result.totalTaxes).toBeGreaterThan(0);
    });

    test('should handle no-tax state', () => {
      const result = calculateAllTaxes(100000, 100000, 'single', 'TX');
      
      expect(result.stateIncomeTax).toBe(0);
      expect(result.federalIncomeTax).toBeGreaterThan(0);
      expect(result.totalTaxes).toBe(
        result.federalIncomeTax + result.socialSecurityTax + result.medicareTax
      );
    });

    test('should calculate effective rate correctly', () => {
      const result = calculateAllTaxes(100000, 100000, 'single', 'TX');
      const expectedRate = (result.totalTaxes / 100000) * 100;
      
      expect(result.effectiveRate).toBeCloseTo(expectedRate, 2);
    });

    test('should handle pre-tax deductions', () => {
      const withDeductions = calculateAllTaxes(100000, 80000, 'single', 'CA');
      const withoutDeductions = calculateAllTaxes(100000, 100000, 'single', 'CA');
      
      // With deductions should have lower federal and state tax
      expect(withDeductions.federalIncomeTax).toBeLessThan(withoutDeductions.federalIncomeTax);
      expect(withDeductions.stateIncomeTax).toBeLessThan(withoutDeductions.stateIncomeTax);
      
      // But same payroll taxes (based on gross income)
      expect(withDeductions.socialSecurityTax).toBeCloseTo(withoutDeductions.socialSecurityTax, 1);
      expect(withDeductions.medicareTax).toBeCloseTo(withoutDeductions.medicareTax, 1);
    });
  });

  describe('calculateTaxableIncome', () => {
    test('should apply standard deduction correctly', () => {
      const taxableIncome = calculateTaxableIncome(100000, 'single');
      
      // Should be gross income minus standard deduction
      expect(taxableIncome).toBeLessThan(100000);
      expect(taxableIncome).toBeGreaterThan(85000); // Approximate standard deduction
    });

    test('should handle additional pre-tax deductions', () => {
      const withoutDeductions = calculateTaxableIncome(100000, 'single');
      const withDeductions = calculateTaxableIncome(100000, 'single', 10000);
      
      expect(withDeductions).toBe(withoutDeductions - 10000);
    });

    test('should not go below zero', () => {
      const taxableIncome = calculateTaxableIncome(5000, 'single', 1000);
      expect(taxableIncome).toBeGreaterThanOrEqual(0);
    });

    test('should handle different filing statuses', () => {
      const singleTaxable = calculateTaxableIncome(100000, 'single');
      const marriedTaxable = calculateTaxableIncome(100000, 'married');
      
      // Married filing jointly has higher standard deduction
      expect(marriedTaxable).toBeLessThan(singleTaxable);
    });
  });
});

describe('State Information Utilities', () => {
  describe('getAllStates', () => {
    test('should return all 50 states plus DC', () => {
      const states = getAllStates();
      expect(states).toHaveLength(51); // 50 states + DC
      expect(states[0]).toHaveProperty('code');
      expect(states[0]).toHaveProperty('name');
      expect(states[0]).toHaveProperty('rate');
    });

    test('should include major states', () => {
      const states = getAllStates();
      const stateCodes = states.map(s => s.code);
      
      expect(stateCodes).toContain('CA');
      expect(stateCodes).toContain('NY');
      expect(stateCodes).toContain('TX');
      expect(stateCodes).toContain('FL');
    });
  });

  describe('getNoTaxStates', () => {
    test('should return states with no income tax', () => {
      const noTaxStates = getNoTaxStates();
      expect(noTaxStates.length).toBeGreaterThan(5);
      
      const noTaxCodes = noTaxStates.map(s => s.code);
      expect(noTaxCodes).toContain('TX');
      expect(noTaxCodes).toContain('FL');
      expect(noTaxCodes).toContain('WA');
      expect(noTaxCodes).toContain('NV');
    });

    test('should have zero tax rates', () => {
      const noTaxStates = getNoTaxStates();
      noTaxStates.forEach(state => {
        expect(state.rate).toBe(0);
      });
    });
  });

  describe('getStateInfo', () => {
    test('should return correct state information', () => {
      const california = getStateInfo('CA');
      expect(california.name).toBe('California');
      expect(california.code).toBe('CA');
      expect(california.rate).toBeGreaterThan(0);
      
      const texas = getStateInfo('TX');
      expect(texas.name).toBe('Texas');
      expect(texas.code).toBe('TX');
      expect(texas.rate).toBe(0);
    });

    test('should handle invalid state codes', () => {
      expect(getStateInfo('XX')).toBeNull();
      expect(getStateInfo('')).toBeNull();
      expect(getStateInfo(null)).toBeNull();
    });

    test('should handle case insensitive lookups', () => {
      const upperCase = getStateInfo('CA');
      const lowerCase = getStateInfo('ca');
      
      expect(upperCase).toEqual(lowerCase);
    });
  });
});

describe('Tax Integration Tests', () => {
  test('should handle complete tax calculation scenario', () => {
    // Scenario: $75k salary, single filer in California
    const grossIncome = 75000;
    const filingStatus = 'single';
    const state = 'CA';
    
    const taxableIncome = calculateTaxableIncome(grossIncome, filingStatus);
    const allTaxes = calculateAllTaxes(grossIncome, taxableIncome, filingStatus, state);
    
    expect(allTaxes.totalTaxes).toBeLessThan(grossIncome * 0.4); // Under 40% total
    expect(allTaxes.totalTaxes).toBeGreaterThan(grossIncome * 0.15); // Over 15% total
    expect(allTaxes.effectiveRate).toBeGreaterThan(15);
    expect(allTaxes.effectiveRate).toBeLessThan(40);
  });

  test('should handle high income scenario with additional Medicare tax', () => {
    const grossIncome = 300000;
    const allTaxes = calculateAllTaxes(grossIncome, grossIncome, 'single', 'NY');
    
    // Should include additional Medicare tax
    expect(allTaxes.medicareTax / grossIncome).toBeGreaterThan(0.0145);
    expect(allTaxes.totalTaxes).toBeGreaterThan(grossIncome * 0.25);
  });

  test('should show tax benefits of marriage', () => {
    const income = 100000;
    const singleTaxes = calculateAllTaxes(income, income, 'single', 'CA');
    const marriedTaxes = calculateAllTaxes(income, income, 'married', 'CA');
    
    // Married filing jointly should generally result in lower taxes for this income level
    expect(marriedTaxes.federalIncomeTax).toBeLessThan(singleTaxes.federalIncomeTax);
    expect(marriedTaxes.totalTaxes).toBeLessThan(singleTaxes.totalTaxes);
  });

  test('should demonstrate state tax differences', () => {
    const income = 100000;
    const caTaxes = calculateAllTaxes(income, income, 'single', 'CA');
    const txTaxes = calculateAllTaxes(income, income, 'single', 'TX');
    
    // California should have higher total taxes due to state income tax
    expect(caTaxes.totalTaxes).toBeGreaterThan(txTaxes.totalTaxes);
    expect(caTaxes.stateIncomeTax).toBeGreaterThan(0);
    expect(txTaxes.stateIncomeTax).toBe(0);
  });
});