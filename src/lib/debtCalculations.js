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

/**
 * Simulate paying off a list of debts using avalanche or snowball strategy.
 *
 * @param {Array<{id: string, name: string, balance: number, annualRate: number, minPayment: number}>} debts
 * @param {number} extraPayment - Extra monthly amount to apply on top of all minimum payments
 * @param {'avalanche'|'snowball'} strategy
 *   - avalanche: apply extra to highest-interest debt first (minimises total interest)
 *   - snowball: apply extra to lowest-balance debt first (builds momentum)
 * @param {number} [maxMonths=600] - Safety cap (50 years)
 * @returns {{ months: number, totalInterestPaid: number, totalPaid: number,
 *             schedule: Array<{month: number, debts: Array, totalBalance: number, interestPaid: number}> }}
 */
export const calculatePayoffStrategy = (debts, extraPayment = 0, strategy = 'avalanche', maxMonths = 600) => {
  // Deep copy so we don't mutate caller's data
  let current = debts.map(d => ({ ...d, balance: Math.max(0, d.balance) }));
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let month = 0;
  const schedule = [];

  while (current.some(d => d.balance > 0) && month < maxMonths) {
    month++;

    // Sort to find which debt gets the extra payment this month
    const active = current.filter(d => d.balance > 0);
    let priorityId = null;
    if (active.length > 0) {
      const sorted = [...active].sort((a, b) =>
        strategy === 'avalanche'
          ? b.annualRate - a.annualRate   // highest rate first
          : a.balance - b.balance         // lowest balance first
      );
      priorityId = sorted[0].id;
    }

    let remainingExtra = extraPayment;

    current = current.map(d => {
      if (d.balance <= 0) return d;

      const monthlyRate = d.annualRate / 12 / 100;
      const interest = d.balance * monthlyRate;
      let payment = d.minPayment;

      // Apply extra payment to the priority debt; if it pays off, carry remainder forward
      if (d.id === priorityId && remainingExtra > 0) {
        payment += remainingExtra;
        remainingExtra = 0;
      }

      // Don't overpay
      const actualPayment = Math.min(payment, d.balance + interest);
      const newBalance = Math.max(0, d.balance + interest - actualPayment);

      totalInterestPaid += interest;
      totalPaid += actualPayment;

      // If this debt just paid off, carry any overpayment as extra to next priority
      if (newBalance === 0 && payment > d.balance + interest) {
        remainingExtra += payment - (d.balance + interest);
      }

      return { ...d, balance: newBalance };
    });

    const totalBalance = current.reduce((sum, d) => sum + d.balance, 0);
    const interestThisMonth = current.reduce((sum, d) => {
      const monthlyRate = d.annualRate / 12 / 100;
      return sum + Math.min(d.balance, d.balance * monthlyRate); // already applied above
    }, 0);

    schedule.push({
      month,
      debts: current.map(d => ({ id: d.id, name: d.name, balance: d.balance })),
      totalBalance,
      interestPaid: totalInterestPaid
    });
  }

  return { months: month, totalInterestPaid, totalPaid, schedule };
};

/**
 * Calculate minimum-payment-only payoff (no extra payment).
 * Convenience wrapper around calculatePayoffStrategy.
 *
 * @param {Array} debts
 * @returns {{ months: number, totalInterestPaid: number, totalPaid: number }}
 */
export const calculateMinimumPayoff = (debts) => {
  const { months, totalInterestPaid, totalPaid } = calculatePayoffStrategy(debts, 0, 'avalanche');
  return { months, totalInterestPaid, totalPaid };
};

/**
 * Compare avalanche, snowball, and minimum-only strategies side by side.
 *
 * @param {Array} debts
 * @param {number} extraPayment - Extra monthly amount (applied to avalanche and snowball)
 * @returns {{ avalanche: object, snowball: object, minimumOnly: object }}
 *   Each strategy result has: { months, totalInterestPaid, totalPaid }
 */
export const comparePayoffStrategies = (debts, extraPayment = 0) => {
  const avalanche = calculatePayoffStrategy(debts, extraPayment, 'avalanche');
  const snowball = calculatePayoffStrategy(debts, extraPayment, 'snowball');
  const minimumOnly = calculateMinimumPayoff(debts);

  return {
    avalanche: { months: avalanche.months, totalInterestPaid: avalanche.totalInterestPaid, totalPaid: avalanche.totalPaid },
    snowball: { months: snowball.months, totalInterestPaid: snowball.totalInterestPaid, totalPaid: snowball.totalPaid },
    minimumOnly: { months: minimumOnly.months, totalInterestPaid: minimumOnly.totalInterestPaid, totalPaid: minimumOnly.totalPaid }
  };
};

/**
 * Calculate whether consolidating debts into a single loan is beneficial.
 *
 * @param {Array<{balance: number, annualRate: number, minPayment: number}>} debts - Debts to consolidate
 * @param {number} consolidatedAnnualRate - Interest rate on the new consolidated loan (percentage, e.g. 8)
 * @param {number} termMonths - Repayment term for the consolidated loan in months
 * @param {number} [consolidationFee=0] - Upfront fee (flat amount) charged to consolidate
 * @returns {{
 *   consolidatedBalance: number,
 *   consolidatedMonthlyPayment: number,
 *   totalInterestBefore: number,
 *   totalInterestAfter: number,
 *   interestSavings: number,
 *   netSavings: number,
 *   breakEvenMonths: number|null,
 *   isWorthIt: boolean
 * }}
 */
export const calculateConsolidation = (debts, consolidatedAnnualRate, termMonths, consolidationFee = 0) => {
  const activDebts = debts.filter(d => d.balance > 0);
  const consolidatedBalance = activDebts.reduce((sum, d) => sum + d.balance, 0) + consolidationFee;

  // Monthly payment on the consolidated loan (standard amortisation formula)
  const monthlyRate = consolidatedAnnualRate / 12 / 100;
  let consolidatedMonthlyPayment;
  if (monthlyRate === 0) {
    consolidatedMonthlyPayment = consolidatedBalance / termMonths;
  } else {
    consolidatedMonthlyPayment =
      (consolidatedBalance * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  // Interest paid on the consolidated loan (fee is financed, so subtract full balance)
  const totalInterestAfter = consolidatedMonthlyPayment * termMonths - consolidatedBalance;

  // Total interest if each debt is paid with minimum payments only
  const { totalInterestPaid: totalInterestBefore } = calculateMinimumPayoff(
    activDebts.map((d, i) => ({ ...d, id: String(i), name: d.name || String(i), annualRate: d.annualRate }))
  );

  const interestSavings = totalInterestBefore - totalInterestAfter;
  const netSavings = interestSavings - consolidationFee;

  // Break-even: month-by-month cumulative savings vs. the consolidation fee.
  // Run simulation beyond the consolidated loan term so we capture savings that occur
  // after the consolidated loan is paid off but original debts would still be accruing.
  let breakEvenMonths = null;
  if (consolidationFee === 0) {
    breakEvenMonths = 0;
  } else if (interestSavings > 0) {
    // Simulate both the original minimum-payment schedule and the consolidated loan
    // month by month, accumulating the interest differential until it covers the fee.
    let origBalances = activDebts.map(d => d.balance);
    const origRates = activDebts.map(d => d.annualRate / 12 / 100);
    const origPayments = activDebts.map(d => d.minPayment);

    let consBalance = consolidatedBalance;

    let cumulativeSavings = 0;
    const maxSimMonths = Math.max(termMonths * 3, 360);
    for (let m = 0; m < maxSimMonths; m++) {
      // Interest on original debts this month
      let origInterestThisMonth = 0;
      origBalances = origBalances.map((bal, i) => {
        if (bal <= 0) return 0;
        const interest = bal * origRates[i];
        origInterestThisMonth += interest;
        const payment = Math.min(origPayments[i], bal + interest);
        return Math.max(0, bal + interest - payment);
      });

      // Interest on consolidated loan this month (0 once paid off)
      const consInterestThisMonth = consBalance * monthlyRate;
      const consPayment = Math.min(consolidatedMonthlyPayment, consBalance + consInterestThisMonth);
      consBalance = Math.max(0, consBalance + consInterestThisMonth - consPayment);

      cumulativeSavings += origInterestThisMonth - consInterestThisMonth;

      if (cumulativeSavings >= consolidationFee) {
        breakEvenMonths = m + 1;
        break;
      }

      // Stop early if both scenarios are fully paid off
      if (consBalance <= 0 && origBalances.every(b => b <= 0)) break;
    }
  }

  return {
    consolidatedBalance,
    consolidatedMonthlyPayment,
    totalInterestBefore,
    totalInterestAfter,
    interestSavings,
    netSavings,
    breakEvenMonths,
    isWorthIt: netSavings > 0
  };
};
