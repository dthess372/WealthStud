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

// Shared loan details object for tests
const loanDetails30yr = { principal: 200000, downPayment: 0, interestRate: 6, loanTerm: 30 };
const loanDetails15yr = { principal: 100000, downPayment: 0, interestRate: 5, loanTerm: 5 };

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
      expect(payment).toBeCloseTo(369.84, 1);
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
      expect(calculatePMI(300000, 0)).toBe(0); // homeValue=0 should return 0
      expect(calculatePMI(300000, 300000)).toBeCloseTo(1500, 1); // 100% LTV
    });
  });

  describe('calculateTotalMonthlyPayment', () => {
    test('should calculate total payment with all components', () => {
      const loanDets = {
        principal: 400000,
        downPayment: 80000,
        interestRate: 6.5,
        loanTerm: 30,
        propertyTax: 6000,
        homeInsurance: 1200,
        pmi: 1600,
        hoaFees: 300
      };

      const result = calculateTotalMonthlyPayment(loanDets);

      expect(result.principalAndInterest).toBeCloseTo(2022.62, 1);
      expect(result.propertyTax).toBe(500); // 6000/12
      expect(result.insurance).toBe(100); // 1200/12
      expect(result.pmi).toBeCloseTo(133.33, 1); // 1600/12
      expect(result.hoa).toBe(25); // 300/12
      expect(result.total).toBeCloseTo(2780.95, 1);
    });

    test('should handle loans without PMI', () => {
      const loanDets = {
        principal: 300000,
        downPayment: 60000, // 20% down, no PMI
        interestRate: 5.5,
        loanTerm: 30,
        propertyTax: 3600,
        homeInsurance: 800,
        pmi: 0,
        hoaFees: 0
      };

      const result = calculateTotalMonthlyPayment(loanDets);

      expect(result.pmi).toBe(0);
      expect(result.hoa).toBe(0);
      expect(result.total).toBeCloseTo(result.principalAndInterest + 300 + 66.67, 1);
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate complete amortization schedule', () => {
      const schedule = generateAmortizationSchedule(loanDetails30yr);

      expect(schedule).toHaveLength(360); // 30 years * 12 months

      // First payment
      expect(parseFloat(schedule[0].payment)).toBeCloseTo(1199.10, 1);
      expect(parseFloat(schedule[0].interest)).toBeCloseTo(1000, 1); // 200000 * 0.06 / 12
      expect(parseFloat(schedule[0].principal)).toBeCloseTo(199.10, 1);
      expect(parseFloat(schedule[0].balance)).toBeCloseTo(199800.90, 1);

      // Last payment
      const lastPayment = schedule[359];
      expect(parseFloat(lastPayment.balance)).toBeCloseTo(0, 2);
    });

    test('should handle zero interest rate', () => {
      const schedule = generateAmortizationSchedule({ principal: 120000, downPayment: 0, interestRate: 0, loanTerm: 10 });

      expect(schedule).toHaveLength(120);
      expect(parseFloat(schedule[0].interest)).toBe(0);
      expect(parseFloat(schedule[0].principal)).toBeCloseTo(1000, 1); // 120000 / 120
      expect(parseFloat(schedule[0].balance)).toBeCloseTo(119000, 1);
    });

    test('should calculate cumulative totals correctly', () => {
      const schedule = generateAmortizationSchedule({ principal: 100000, downPayment: 0, interestRate: 5, loanTerm: 15 });

      // Check that cumulative interest increases
      expect(parseFloat(schedule[0].totalInterest)).toBeCloseTo(parseFloat(schedule[0].interest), 2);
      expect(parseFloat(schedule[1].totalInterest)).toBeCloseTo(
        parseFloat(schedule[0].interest) + parseFloat(schedule[1].interest), 1
      );

      // Final payment should have paid off the loan
      const finalPayment = schedule[schedule.length - 1];
      expect(parseFloat(finalPayment.balance)).toBeCloseTo(0, 2);
    });
  });

  describe('calculateAffordability', () => {
    test('should return affordability analysis shape', () => {
      const result = calculateAffordability(
        { annualIncome: 100000, monthlyDebts: 500, creditScore: 'good' },
        2000
      );

      expect(result).toHaveProperty('maxAffordable');
      expect(result).toHaveProperty('currentDTI');
      expect(result).toHaveProperty('affordabilityRating');
      expect(result).toHaveProperty('monthlyIncome');
      expect(result.monthlyIncome).toBeCloseTo(100000 / 12, 0);
    });

    test('should handle different debt-to-income ratios', () => {
      // Low DTI (good)
      const lowDTI = calculateAffordability(
        { annualIncome: 100000, monthlyDebts: 200, creditScore: 'good' },
        1000
      );
      // High DTI (poor)
      const highDTI = calculateAffordability(
        { annualIncome: 60000, monthlyDebts: 1000, creditScore: 'good' },
        2500
      );

      expect(lowDTI.currentDTI).toBeLessThan(highDTI.currentDTI);
    });
  });

  describe('calculatePaymentSavings', () => {
    test('should calculate savings from extra principal payments', () => {
      const result = calculatePaymentSavings(
        { principal: 300000, downPayment: 0, interestRate: 6.5, loanTerm: 30 },
        { monthlyExtra: 200 }
      );

      expect(result.totalInterestBase).toBeGreaterThan(result.totalInterestCurrent);
      expect(result.interestSavings).toBeGreaterThan(0);
      expect(result.timeSavings).toBeGreaterThan(0);
    });

    test('should handle no extra payment', () => {
      const result = calculatePaymentSavings(
        { principal: 200000, downPayment: 0, interestRate: 5.5, loanTerm: 30 },
        {}
      );

      expect(result.interestSavings).toBeCloseTo(0, 1);
      expect(result.timeSavings).toBe(0);
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
      expect(calculateLoanToValue(300000, 0)).toBe(0); // homeValue=0 should return 0
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
      const schedule = generateAmortizationSchedule(loanDetails30yr);
      const chartData = getAmortizationChartData(schedule, 200000);

      expect(chartData.length).toBeGreaterThan(0);
      expect(chartData.length).toBeLessThanOrEqual(360);

      // Should have required properties
      expect(chartData[0]).toHaveProperty('year');
      expect(chartData[0]).toHaveProperty('balance');
      expect(chartData[0]).toHaveProperty('principal');
      expect(chartData[0]).toHaveProperty('interest');
    });

    test('should handle short loan terms', () => {
      const schedule = generateAmortizationSchedule({ principal: 100000, downPayment: 0, interestRate: 5, loanTerm: 5 });
      const chartData = getAmortizationChartData(schedule, 100000);

      expect(chartData.length).toBeLessThanOrEqual(60);
      expect(chartData[chartData.length - 1].balance).toBeCloseTo(0, 2);
    });
  });
});
