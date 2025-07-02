import {
  calculateMonthlyPayment,
  calculatePMI,
  calculateTotalMonthlyPayment,
  generateAmortizationSchedule,
  calculateAffordability,
  calculatePaymentSavings,
  calculateLoanToValue,
  getPaymentBreakdownChartData,
  getAmortizationChartData
} from '../mortgageCalculations';

describe('Mortgage Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    test('should calculate monthly payment with interest', () => {
      const payment = calculateMonthlyPayment(300000, 0.065, 30);
      expect(payment).toBeCloseTo(1896.20, 1);
    });

    test('should handle zero interest rate', () => {
      const payment = calculateMonthlyPayment(300000, 0, 30);
      expect(payment).toBeCloseTo(833.33, 2); // 300000 / 360 months
    });

    test('should handle short-term loans', () => {
      const payment = calculateMonthlyPayment(100000, 0.05, 5);
      expect(payment).toBeCloseTo(1887.12, 1);
    });

    test('should handle small loan amounts', () => {
      const payment = calculateMonthlyPayment(50000, 0.04, 15);
      expect(payment).toBeCloseTo(369.65, 1);
    });
  });

  describe('calculatePMI', () => {
    test('should calculate PMI when loan-to-value > 80%', () => {
      const pmi = calculatePMI(240000, 300000); // 80% LTV
      expect(pmi).toBe(0); // Exactly 80%, no PMI

      const pmiRequired = calculatePMI(250000, 300000); // 83.33% LTV
      expect(pmiRequired).toBeCloseTo(1250, 1); // 0.5% of loan amount
    });

    test('should not calculate PMI when loan-to-value <= 80%', () => {
      const pmi = calculatePMI(200000, 300000); // 66.67% LTV
      expect(pmi).toBe(0);
    });

    test('should handle custom PMI rates', () => {
      const pmi = calculatePMI(250000, 300000, 0.008); // 0.8% rate
      expect(pmi).toBeCloseTo(2000, 1);
    });

    test('should handle edge cases', () => {
      expect(calculatePMI(0, 300000)).toBe(0);
      expect(calculatePMI(300000, 0)).toBe(0);
      expect(calculatePMI(300000, 300000)).toBeCloseTo(1500, 1); // 100% LTV
    });
  });

  describe('calculateTotalMonthlyPayment', () => {
    test('should calculate total payment with all components', () => {
      const loanDetails = {
        principal: 400000,
        downPayment: 80000,
        interestRate: 6.5,
        loanTerm: 30,
        propertyTax: 6000,
        homeInsurance: 1200,
        pmi: 1600,
        hoaFees: 300
      };

      const result = calculateTotalMonthlyPayment(loanDetails);
      
      expect(result.principalAndInterest).toBeCloseTo(2021.64, 1);
      expect(result.propertyTax).toBe(500); // 6000/12
      expect(result.insurance).toBe(100); // 1200/12
      expect(result.pmi).toBeCloseTo(133.33, 1); // 1600/12
      expect(result.hoa).toBe(25); // 300/12
      expect(result.totalMonthly).toBeCloseTo(2779.97, 1);
    });

    test('should handle loans without PMI', () => {
      const loanDetails = {
        principal: 300000,
        downPayment: 60000, // 20% down, no PMI
        interestRate: 5.5,
        loanTerm: 30,
        propertyTax: 3600,
        homeInsurance: 800,
        pmi: 0,
        hoaFees: 0
      };

      const result = calculateTotalMonthlyPayment(loanDetails);
      
      expect(result.pmi).toBe(0);
      expect(result.hoa).toBe(0);
      expect(result.totalMonthly).toBeCloseTo(result.principalAndInterest + 300 + 66.67, 1);
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate complete amortization schedule', () => {
      const schedule = generateAmortizationSchedule(200000, 0.06, 30);
      
      expect(schedule).toHaveLength(360); // 30 years * 12 months
      
      // First payment
      expect(schedule[0].payment).toBeCloseTo(1199.10, 1);
      expect(schedule[0].interest).toBeCloseTo(1000, 1); // 200000 * 0.06 / 12
      expect(schedule[0].principal).toBeCloseTo(199.10, 1);
      expect(schedule[0].balance).toBeCloseTo(199800.90, 1);
      
      // Last payment
      const lastPayment = schedule[359];
      expect(lastPayment.balance).toBeCloseTo(0, 2);
    });

    test('should handle zero interest rate', () => {
      const schedule = generateAmortizationSchedule(120000, 0, 10);
      
      expect(schedule).toHaveLength(120);
      expect(schedule[0].interest).toBe(0);
      expect(schedule[0].principal).toBeCloseTo(1000, 1); // 120000 / 120
      expect(schedule[0].balance).toBeCloseTo(119000, 1);
    });

    test('should calculate cumulative totals correctly', () => {
      const schedule = generateAmortizationSchedule(100000, 0.05, 15);
      
      // Check that cumulative interest increases
      expect(schedule[0].cumulativeInterest).toBeCloseTo(schedule[0].interest, 2);
      expect(schedule[1].cumulativeInterest).toBeCloseTo(
        schedule[0].interest + schedule[1].interest, 2
      );
      
      // Final payment should have paid off the loan
      const finalPayment = schedule[schedule.length - 1];
      expect(finalPayment.balance).toBeCloseTo(0, 2);
      expect(finalPayment.cumulativePrincipal).toBeCloseTo(100000, 1);
    });
  });

  describe('calculateAffordability', () => {
    test('should calculate maximum affordable home price', () => {
      const result = calculateAffordability({
        monthlyIncome: 8000,
        monthlyDebts: 500,
        downPaymentPercent: 20,
        interestRate: 6.0,
        loanTerm: 30,
        propertyTaxRate: 1.2,
        insuranceRate: 0.3,
        hoaFees: 200,
        debtToIncomeRatio: 28
      });

      expect(result.maxMonthlyPayment).toBeCloseTo(1740, 0); // 28% of 8000 - 500 debts
      expect(result.maxHomePrice).toBeGreaterThan(250000);
      expect(result.maxLoanAmount).toBe(result.maxHomePrice * 0.8); // 80% of home price
      expect(result.requiredDownPayment).toBe(result.maxHomePrice * 0.2);
    });

    test('should handle different debt-to-income ratios', () => {
      const conservative = calculateAffordability({
        monthlyIncome: 6000,
        monthlyDebts: 300,
        downPaymentPercent: 20,
        interestRate: 5.5,
        loanTerm: 30,
        propertyTaxRate: 1.0,
        insuranceRate: 0.25,
        hoaFees: 0,
        debtToIncomeRatio: 25 // Conservative
      });

      const aggressive = calculateAffordability({
        monthlyIncome: 6000,
        monthlyDebts: 300,
        downPaymentPercent: 20,
        interestRate: 5.5,
        loanTerm: 30,
        propertyTaxRate: 1.0,
        insuranceRate: 0.25,
        hoaFees: 0,
        debtToIncomeRatio: 36 // More aggressive
      });

      expect(aggressive.maxHomePrice).toBeGreaterThan(conservative.maxHomePrice);
    });
  });

  describe('calculatePaymentSavings', () => {
    test('should calculate savings from extra principal payments', () => {
      const result = calculatePaymentSavings({
        loanAmount: 300000,
        interestRate: 6.5,
        loanTerm: 30,
        extraPayment: 200
      });

      expect(result.standardTotalInterest).toBeGreaterThan(result.extraPaymentTotalInterest);
      expect(result.interestSavings).toBeGreaterThan(0);
      expect(result.timeSavingsMonths).toBeGreaterThan(0);
      expect(result.newLoanTermMonths).toBeLessThan(360);
    });

    test('should handle no extra payment', () => {
      const result = calculatePaymentSavings({
        loanAmount: 200000,
        interestRate: 5.5,
        loanTerm: 30,
        extraPayment: 0
      });

      expect(result.interestSavings).toBe(0);
      expect(result.timeSavingsMonths).toBe(0);
      expect(result.newLoanTermMonths).toBe(360);
    });
  });

  describe('calculateLoanToValue', () => {
    test('should calculate LTV ratio correctly', () => {
      expect(calculateLoanToValue(240000, 300000)).toBeCloseTo(80, 1);
      expect(calculateLoanToValue(180000, 300000)).toBeCloseTo(60, 1);
      expect(calculateLoanToValue(300000, 300000)).toBeCloseTo(100, 1);
    });

    test('should handle edge cases', () => {
      expect(calculateLoanToValue(0, 300000)).toBe(0);
      expect(calculateLoanToValue(300000, 0)).toBe(0);
    });
  });

  describe('getPaymentBreakdownChartData', () => {
    test('should generate chart data for payment breakdown', () => {
      const data = getPaymentBreakdownChartData({
        principalAndInterest: 1500,
        propertyTax: 400,
        insurance: 100,
        pmi: 150,
        hoa: 50
      });

      expect(data).toHaveLength(5);
      expect(data.find(item => item.name === 'Principal & Interest').value).toBe(1500);
      expect(data.find(item => item.name === 'Property Tax').value).toBe(400);
      expect(data.find(item => item.name === 'Insurance').value).toBe(100);
      expect(data.find(item => item.name === 'PMI').value).toBe(150);
      expect(data.find(item => item.name === 'HOA').value).toBe(50);
    });

    test('should filter out zero values', () => {
      const data = getPaymentBreakdownChartData({
        principalAndInterest: 1500,
        propertyTax: 400,
        insurance: 100,
        pmi: 0,
        hoa: 0
      });

      expect(data).toHaveLength(3);
      expect(data.find(item => item.name === 'PMI')).toBeUndefined();
      expect(data.find(item => item.name === 'HOA')).toBeUndefined();
    });
  });

  describe('getAmortizationChartData', () => {
    test('should generate chart data for amortization schedule', () => {
      const schedule = generateAmortizationSchedule(200000, 0.06, 30);
      const chartData = getAmortizationChartData(schedule);

      expect(chartData.length).toBeGreaterThan(0);
      expect(chartData.length).toBeLessThanOrEqual(360); // May be sampled

      // Should have required properties
      expect(chartData[0]).toHaveProperty('year');
      expect(chartData[0]).toHaveProperty('balance');
      expect(chartData[0]).toHaveProperty('cumulativePrincipal');
      expect(chartData[0]).toHaveProperty('cumulativeInterest');
    });

    test('should handle short loan terms', () => {
      const schedule = generateAmortizationSchedule(100000, 0.05, 5);
      const chartData = getAmortizationChartData(schedule);

      expect(chartData.length).toBeLessThanOrEqual(60);
      expect(chartData[chartData.length - 1].balance).toBeCloseTo(0, 2);
    });
  });
});