/**
 * Utility functions for debt calculations
 */

/**
 * Calculate remaining debt balance after payment
 * @param {number} balance - Current debt balance
 * @param {number} monthlyRate - Monthly interest rate (annual rate / 12 / 100)
 * @param {number} payment - Monthly payment amount
 * @returns {number} New balance after payment
 */
export const calculateDebtPayment = (balance, monthlyRate, payment) => {
  if (balance <= 0) return balance;
  
  const monthlyInterest = balance * monthlyRate;
  const principalPayment = payment - monthlyInterest;
  
  // If payment is less than interest, balance increases
  if (principalPayment < 0) {
    return balance - principalPayment; // principalPayment is negative, so this increases balance
  }
  
  // Normal case: reduce balance by principal payment, but not below 0
  return Math.max(0, balance - Math.min(principalPayment, balance));
};

/**
 * Calculate all debt balances for a single month
 * @param {Object} debts - Current debt balances
 * @param {Object} rates - Monthly interest rates for each debt
 * @param {Object} payments - Monthly payment amounts for each debt
 * @returns {Object} Updated debt balances
 */
export const calculateAllDebtPayments = (debts, rates, payments) => {
  return {
    mortgage: calculateDebtPayment(debts.mortgage, rates.mortgage, payments.mortgage),
    carLoan: calculateDebtPayment(debts.carLoan, rates.carLoan, payments.carLoan),
    creditCards: calculateDebtPayment(debts.creditCards, rates.creditCards, payments.creditCards),
    studentLoans: calculateDebtPayment(debts.studentLoans, rates.studentLoans, payments.studentLoans),
    otherDebts: calculateDebtPayment(debts.otherDebts, rates.otherDebts, payments.otherDebts)
  };
};