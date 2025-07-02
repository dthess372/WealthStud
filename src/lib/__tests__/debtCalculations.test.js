import {
  calculateDebtPayment,
  calculateAllDebtPayments
} from '../debtCalculations';

describe('Debt Calculations', () => {
  describe('calculateDebtPayment', () => {
    test('should calculate debt payment correctly for normal scenario', () => {
      // $10,000 balance, 5% annual rate (0.417% monthly), $500 payment
      const balance = 10000;
      const monthlyRate = 0.05 / 12; // 5% annual rate
      const payment = 500;
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // Monthly interest = 10000 * (0.05/12) = $41.67
      // Principal payment = 500 - 41.67 = $458.33
      // New balance = 10000 - 458.33 = $9541.67
      expect(newBalance).toBeCloseTo(9541.67, 2);
    });

    test('should handle high interest rate scenario', () => {
      // Credit card scenario: $5000 balance, 18% annual rate, $200 payment
      const balance = 5000;
      const monthlyRate = 0.18 / 12; // 1.5% monthly
      const payment = 200;
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // Monthly interest = 5000 * 0.015 = $75
      // Principal payment = 200 - 75 = $125
      // New balance = 5000 - 125 = $4875
      expect(newBalance).toBeCloseTo(4875, 2);
    });

    test('should handle payment barely covering interest', () => {
      const balance = 10000;
      const monthlyRate = 0.12 / 12; // 12% annual rate = 1% monthly
      const payment = 100; // Exactly the monthly interest
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // Monthly interest = 10000 * 0.01 = $100
      // Principal payment = 100 - 100 = $0
      // Balance should remain the same
      expect(newBalance).toBeCloseTo(10000, 2);
    });

    test('should handle payment less than interest', () => {
      const balance = 10000;
      const monthlyRate = 0.12 / 12; // 1% monthly
      const payment = 50; // Less than the $100 monthly interest
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // When payment < interest, balance should increase
      // New balance = 10000 + (100 - 50) = $10050
      expect(newBalance).toBeCloseTo(10050, 2);
    });

    test('should handle final payment that pays off debt', () => {
      const balance = 100;
      const monthlyRate = 0.05 / 12;
      const payment = 500; // More than enough to pay off
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // Should pay off completely to $0
      expect(newBalance).toBe(0);
    });

    test('should handle zero balance', () => {
      const balance = 0;
      const monthlyRate = 0.05 / 12;
      const payment = 100;
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      expect(newBalance).toBe(0);
    });

    test('should handle zero payment', () => {
      const balance = 1000;
      const monthlyRate = 0.05 / 12;
      const payment = 0;
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // With no payment, balance should increase by interest
      const expectedBalance = balance * (1 + monthlyRate);
      expect(newBalance).toBeCloseTo(expectedBalance, 2);
    });

    test('should handle zero interest rate', () => {
      const balance = 1000;
      const monthlyRate = 0;
      const payment = 100;
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      // With no interest, payment goes entirely to principal
      expect(newBalance).toBe(900);
    });

    test('should handle negative inputs gracefully', () => {
      expect(calculateDebtPayment(-1000, 0.05, 100)).toBe(-1000);
      // Negative payment should be treated as payment less than interest
      const result = calculateDebtPayment(1000, 0.05 / 12, -100);
      expect(result).toBeGreaterThan(1000); // Balance should increase
    });

    test('should handle very small balances', () => {
      const balance = 0.01;
      const monthlyRate = 0.05 / 12;
      const payment = 10;
      
      const newBalance = calculateDebtPayment(balance, monthlyRate, payment);
      
      expect(newBalance).toBe(0);
    });
  });

  describe('calculateAllDebtPayments', () => {
    const sampleDebts = {
      mortgage: 200000,
      carLoan: 15000,
      creditCards: 5000,
      studentLoans: 25000,
      otherDebts: 2000
    };

    const sampleRates = {
      mortgage: 0.065 / 12,     // 6.5% annual
      carLoan: 0.055 / 12,      // 5.5% annual
      creditCards: 0.185 / 12,  // 18.5% annual
      studentLoans: 0.045 / 12, // 4.5% annual
      otherDebts: 0.08 / 12     // 8% annual
    };

    const samplePayments = {
      mortgage: 1500,
      carLoan: 350,
      creditCards: 200,
      studentLoans: 300,
      otherDebts: 100
    };

    test('should calculate all debt payments correctly', () => {
      const newBalances = calculateAllDebtPayments(sampleDebts, sampleRates, samplePayments);
      
      expect(newBalances).toHaveProperty('mortgage');
      expect(newBalances).toHaveProperty('carLoan');
      expect(newBalances).toHaveProperty('creditCards');
      expect(newBalances).toHaveProperty('studentLoans');
      expect(newBalances).toHaveProperty('otherDebts');
      
      // All balances should be lower than original (assuming payments > interest)
      expect(newBalances.mortgage).toBeLessThan(sampleDebts.mortgage);
      expect(newBalances.carLoan).toBeLessThan(sampleDebts.carLoan);
      expect(newBalances.creditCards).toBeLessThan(sampleDebts.creditCards);
      expect(newBalances.studentLoans).toBeLessThan(sampleDebts.studentLoans);
      expect(newBalances.otherDebts).toBeLessThan(sampleDebts.otherDebts);
    });

    test('should handle individual debt types correctly', () => {
      const newBalances = calculateAllDebtPayments(sampleDebts, sampleRates, samplePayments);
      
      // Test mortgage calculation specifically
      const expectedMortgage = calculateDebtPayment(
        sampleDebts.mortgage, 
        sampleRates.mortgage, 
        samplePayments.mortgage
      );
      expect(newBalances.mortgage).toBeCloseTo(expectedMortgage, 2);
      
      // Test credit card calculation (high interest)
      const expectedCC = calculateDebtPayment(
        sampleDebts.creditCards,
        sampleRates.creditCards,
        samplePayments.creditCards
      );
      expect(newBalances.creditCards).toBeCloseTo(expectedCC, 2);
    });

    test('should handle zero balances', () => {
      const zeroDebts = {
        mortgage: 0,
        carLoan: 0,
        creditCards: 0,
        studentLoans: 0,
        otherDebts: 0
      };
      
      const newBalances = calculateAllDebtPayments(zeroDebts, sampleRates, samplePayments);
      
      expect(newBalances.mortgage).toBe(0);
      expect(newBalances.carLoan).toBe(0);
      expect(newBalances.creditCards).toBe(0);
      expect(newBalances.studentLoans).toBe(0);
      expect(newBalances.otherDebts).toBe(0);
    });

    test('should handle mixed scenarios', () => {
      const mixedDebts = {
        mortgage: 100000,
        carLoan: 0,
        creditCards: 1000,
        studentLoans: 50000,
        otherDebts: 0
      };
      
      const newBalances = calculateAllDebtPayments(mixedDebts, sampleRates, samplePayments);
      
      expect(newBalances.mortgage).toBeLessThan(mixedDebts.mortgage);
      expect(newBalances.carLoan).toBe(0);
      expect(newBalances.creditCards).toBeLessThan(mixedDebts.creditCards);
      expect(newBalances.studentLoans).toBeLessThan(mixedDebts.studentLoans);
      expect(newBalances.otherDebts).toBe(0);
    });

    test('should handle zero payments', () => {
      const zeroPayments = {
        mortgage: 0,
        carLoan: 0,
        creditCards: 0,
        studentLoans: 0,
        otherDebts: 0
      };
      
      const newBalances = calculateAllDebtPayments(sampleDebts, sampleRates, zeroPayments);
      
      // With zero payments, all balances should increase due to interest
      expect(newBalances.mortgage).toBeGreaterThan(sampleDebts.mortgage);
      expect(newBalances.carLoan).toBeGreaterThan(sampleDebts.carLoan);
      expect(newBalances.creditCards).toBeGreaterThan(sampleDebts.creditCards);
      expect(newBalances.studentLoans).toBeGreaterThan(sampleDebts.studentLoans);
      expect(newBalances.otherDebts).toBeGreaterThan(sampleDebts.otherDebts);
    });

    test('should handle very large payments that pay off debts', () => {
      const largePayments = {
        mortgage: 300000,
        carLoan: 20000,
        creditCards: 10000,
        studentLoans: 30000,
        otherDebts: 5000
      };
      
      const newBalances = calculateAllDebtPayments(sampleDebts, sampleRates, largePayments);
      
      // All debts should be paid off
      expect(newBalances.mortgage).toBe(0);
      expect(newBalances.carLoan).toBe(0);
      expect(newBalances.creditCards).toBe(0);
      expect(newBalances.studentLoans).toBe(0);
      expect(newBalances.otherDebts).toBe(0);
    });
  });

  describe('Real-world Debt Scenarios', () => {
    test('should model typical mortgage amortization', () => {
      // $300k mortgage at 6.5% for 30 years
      const balance = 300000;
      const monthlyRate = 0.065 / 12;
      const payment = 1896; // Approximate payment for 30-year mortgage
      
      let currentBalance = balance;
      
      // Test first few payments
      for (let month = 1; month <= 12; month++) {
        currentBalance = calculateDebtPayment(currentBalance, monthlyRate, payment);
      }
      
      // After 1 year, should have paid down some principal
      expect(currentBalance).toBeLessThan(balance);
      expect(currentBalance).toBeGreaterThan(balance * 0.98); // But not too much in year 1
    });

    test('should model credit card minimum payments', () => {
      // $5000 credit card debt at 18.5% with minimum payments
      let balance = 5000;
      const monthlyRate = 0.185 / 12;
      
      // Minimum payment is typically 2-3% of balance
      for (let month = 1; month <= 12; month++) {
        const minPayment = Math.max(25, balance * 0.02); // 2% of balance, minimum $25
        balance = calculateDebtPayment(balance, monthlyRate, minPayment);
      }
      
      // With minimum payments, balance should decrease very slowly
      expect(balance).toBeLessThan(5000);
      expect(balance).toBeGreaterThan(4500); // Very slow paydown
    });

    test('should model aggressive debt payoff strategy', () => {
      // Pay extra on highest interest debt (avalanche method)
      const debts = {
        mortgage: 200000,    // 6.5%
        carLoan: 15000,      // 5.5%
        creditCards: 5000,   // 18.5%
        studentLoans: 25000, // 4.5%
        otherDebts: 0
      };
      
      const rates = {
        mortgage: 0.065 / 12,
        carLoan: 0.055 / 12,
        creditCards: 0.185 / 12,
        studentLoans: 0.045 / 12,
        otherDebts: 0
      };
      
      // Regular payments plus $500 extra on credit cards (highest rate)
      const payments = {
        mortgage: 1500,
        carLoan: 350,
        creditCards: 700, // $200 minimum + $500 extra
        studentLoans: 300,
        otherDebts: 0
      };
      
      let currentDebts = { ...debts };
      
      // Simulate 6 months of aggressive paydown
      for (let month = 1; month <= 6; month++) {
        currentDebts = calculateAllDebtPayments(currentDebts, rates, payments);
      }
      
      // Credit card should be significantly reduced
      expect(currentDebts.creditCards).toBeLessThan(debts.creditCards * 0.5);
      
      // Other debts should have normal reduction
      expect(currentDebts.mortgage).toBeLessThan(debts.mortgage);
      expect(currentDebts.mortgage).toBeGreaterThan(debts.mortgage * 0.95);
    });

    test('should model debt snowball vs avalanche methods', () => {
      const initialDebts = {
        mortgage: 0,
        carLoan: 2000,       // Smallest balance
        creditCards: 5000,   // Highest rate (18.5%)
        studentLoans: 10000, // Medium balance, low rate
        otherDebts: 0
      };
      
      const rates = {
        mortgage: 0,
        carLoan: 0.055 / 12,
        creditCards: 0.185 / 12,
        studentLoans: 0.045 / 12,
        otherDebts: 0
      };
      
      // Snowball method: extra payment to smallest balance (car loan)
      const snowballPayments = {
        mortgage: 0,
        carLoan: 700,  // $200 minimum + $500 extra
        creditCards: 150,
        studentLoans: 150,
        otherDebts: 0
      };
      
      // Avalanche method: extra payment to highest rate (credit cards)
      const avalanchePayments = {
        mortgage: 0,
        carLoan: 200,
        creditCards: 650, // $150 minimum + $500 extra
        studentLoans: 150,
        otherDebts: 0
      };
      
      let snowballDebts = { ...initialDebts };
      let avalancheDebts = { ...initialDebts };
      
      // Simulate 12 months
      for (let month = 1; month <= 12; month++) {
        snowballDebts = calculateAllDebtPayments(snowballDebts, rates, snowballPayments);
        avalancheDebts = calculateAllDebtPayments(avalancheDebts, rates, avalanchePayments);
      }
      
      // Calculate total remaining debt for each method
      const snowballTotal = Object.values(snowballDebts).reduce((sum, debt) => sum + debt, 0);
      const avalancheTotal = Object.values(avalancheDebts).reduce((sum, debt) => sum + debt, 0);
      
      // Avalanche method should result in less total debt (saves more on interest)
      expect(avalancheTotal).toBeLessThan(snowballTotal);
    });
  });
});