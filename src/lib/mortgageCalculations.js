// Mortgage calculation utilities

/**
 * Calculate monthly mortgage payment (Principal & Interest only)
 * @param {number} principal - Loan amount
 * @param {number} rate - Annual interest rate (as decimal, e.g. 0.065 for 6.5%)
 * @param {number} years - Loan term in years
 * @returns {number} Monthly payment amount
 */
export function calculateMonthlyPayment(principal, rate, years) {
  if (rate === 0) return principal / (years * 12);
  
  const monthlyRate = rate / 12;
  const numPayments = years * 12;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Calculate PMI (Private Mortgage Insurance) amount
 * @param {number} loanAmount - Principal loan amount
 * @param {number} homeValue - Total home value
 * @param {number} pmiRate - PMI rate (default 0.5%)
 * @returns {number} Annual PMI amount
 */
export function calculatePMI(loanAmount, homeValue, pmiRate = 0.005) {
  const loanToValue = loanAmount / homeValue;
  return loanToValue > 0.8 ? loanAmount * pmiRate : 0;
}

/**
 * Calculate total monthly payment including all costs
 * @param {object} loanDetails - Loan details object
 * @returns {object} Payment breakdown
 */
export function calculateTotalMonthlyPayment(loanDetails) {
  const {
    principal,
    downPayment,
    interestRate,
    loanTerm,
    propertyTax,
    homeInsurance,
    pmi,
    hoaFees
  } = loanDetails;

  const loanAmount = principal - downPayment;
  const rate = interestRate / 100;
  
  // Calculate base monthly payment (P&I)
  const monthlyPI = calculateMonthlyPayment(loanAmount, rate, loanTerm);
  
  // Calculate monthly escrow amounts
  const monthlyPropertyTax = propertyTax / 12;
  const monthlyInsurance = homeInsurance / 12;
  const monthlyPMI = pmi / 12;
  const monthlyHOA = hoaFees / 12;
  
  const totalMonthly = monthlyPI + monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
  
  return {
    principalAndInterest: monthlyPI,
    propertyTax: monthlyPropertyTax,
    insurance: monthlyInsurance,
    pmi: monthlyPMI,
    hoa: monthlyHOA,
    total: totalMonthly
  };
}

/**
 * Generate complete amortization schedule
 * @param {object} loanDetails - Loan details
 * @param {object} extraPayments - Extra payment options
 * @returns {array} Amortization schedule array
 */
export function generateAmortizationSchedule(loanDetails, extraPayments = {}) {
  const { principal, downPayment, interestRate, loanTerm } = loanDetails;
  const { monthlyExtra = 0, biWeekly = false } = extraPayments;
  
  const loanAmount = principal - downPayment;
  const rate = interestRate / 100;
  const monthlyRate = rate / 12;
  const numberOfPayments = loanTerm * 12;
  
  // Calculate base payment
  const basePayment = calculateMonthlyPayment(loanAmount, rate, loanTerm);
  
  let remainingBalance = loanAmount;
  const schedule = [];
  let totalInterestPaid = 0;
  let month = 1;
  
  const adjustedPayment = biWeekly ? basePayment / 2 : basePayment;
  const adjustedExtra = biWeekly ? monthlyExtra / 2 : monthlyExtra;
  const maxPayments = numberOfPayments * (biWeekly ? 2 : 1);

  while (remainingBalance > 0.01 && month <= maxPayments) {
    const interestPayment = remainingBalance * (biWeekly ? monthlyRate / 2 : monthlyRate);
    let principalPayment = adjustedPayment - interestPayment + adjustedExtra;
    
    // Don't overpay
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
    }
    
    totalInterestPaid += interestPayment;
    remainingBalance -= principalPayment;
    
    const actualMonth = biWeekly ? Math.ceil(month / 2) : month;
    const year = Math.ceil(actualMonth / 12);
    
    schedule.push({
      month: actualMonth,
      year,
      payment: (interestPayment + principalPayment).toFixed(2),
      principal: principalPayment.toFixed(2),
      interest: interestPayment.toFixed(2),
      totalInterest: totalInterestPaid.toFixed(2),
      balance: Math.max(0, remainingBalance).toFixed(2),
      isYearEnd: actualMonth % 12 === 0
    });
    
    month++;
  }

  return schedule;
}

/**
 * Calculate affordability metrics
 * @param {object} incomeData - Income and debt information
 * @param {number} monthlyPayment - Proposed monthly payment
 * @returns {object} Affordability analysis
 */
export function calculateAffordability(incomeData, monthlyPayment) {
  const { annualIncome, monthlyDebts, creditScore } = incomeData;
  const monthlyIncome = annualIncome / 12;
  
  // DTI calculations (28/36 rule)
  const maxHousingPayment = monthlyIncome * 0.28;
  const maxTotalDebt = monthlyIncome * 0.36;
  const maxPaymentWithDebts = maxTotalDebt - monthlyDebts;
  
  const affordablePayment = Math.min(maxHousingPayment, maxPaymentWithDebts);
  const currentDTI = ((monthlyPayment + monthlyDebts) / monthlyIncome) * 100;
  
  let affordabilityRating;
  let ratingClass;
  
  if (currentDTI <= 28) {
    affordabilityRating = 'Excellent';
    ratingClass = 'affordability-excellent';
  } else if (currentDTI <= 36) {
    affordabilityRating = 'Good';
    ratingClass = 'affordability-good';
  } else if (currentDTI <= 43) {
    affordabilityRating = 'Fair';
    ratingClass = 'affordability-fair';
  } else {
    affordabilityRating = 'Poor';
    ratingClass = 'affordability-poor';
  }

  return {
    maxAffordable: affordablePayment,
    currentDTI,
    affordabilityRating,
    ratingClass,
    creditScore,
    monthlyIncome,
    maxHousingPayment,
    maxTotalDebt
  };
}

/**
 * Calculate savings from extra payments or bi-weekly strategy
 * @param {object} loanDetails - Loan details
 * @param {object} extraPayments - Extra payment strategy
 * @returns {object} Savings analysis
 */
export function calculatePaymentSavings(loanDetails, extraPayments = {}) {
  // Base schedule (no extra payments)
  const baseSchedule = generateAmortizationSchedule(loanDetails, {});
  
  // Current schedule with extra payments
  const currentSchedule = generateAmortizationSchedule(loanDetails, extraPayments);
  
  const baseTotalInterest = baseSchedule.reduce((sum, payment) => sum + parseFloat(payment.interest), 0);
  const currentTotalInterest = currentSchedule.reduce((sum, payment) => sum + parseFloat(payment.interest), 0);
  
  const interestSavings = baseTotalInterest - currentTotalInterest;
  const timeSavings = baseSchedule.length - currentSchedule.length;
  
  return {
    interestSavings,
    timeSavings: Math.round(timeSavings / 12 * 10) / 10, // Convert to years with 1 decimal
    payoffDate: currentSchedule.length > 0 ? currentSchedule[currentSchedule.length - 1].year : loanDetails.loanTerm,
    basePayoffDate: baseSchedule.length > 0 ? baseSchedule[baseSchedule.length - 1].year : loanDetails.loanTerm,
    totalInterestBase: baseTotalInterest,
    totalInterestCurrent: currentTotalInterest
  };
}

/**
 * Calculate loan-to-value ratio
 * @param {number} loanAmount - Principal loan amount
 * @param {number} homeValue - Total home value
 * @returns {number} LTV ratio as percentage
 */
export function calculateLoanToValue(loanAmount, homeValue) {
  return (loanAmount / homeValue) * 100;
}

/**
 * Get payment breakdown for visualization
 * @param {object} paymentBreakdown - Monthly payment breakdown
 * @param {object} colors - Color configuration
 * @returns {array} Chart data array
 */
export function getPaymentBreakdownChartData(paymentBreakdown, colors) {
  const data = [
    { name: 'Principal & Interest', value: paymentBreakdown.principalAndInterest, color: colors.chart.income },
    { name: 'Property Tax', value: paymentBreakdown.propertyTax, color: colors.chart.expenses },
    { name: 'Insurance', value: paymentBreakdown.insurance, color: colors.chart.assets },
    { name: 'PMI', value: paymentBreakdown.pmi, color: colors.chart.debt },
    { name: 'HOA', value: paymentBreakdown.hoa, color: colors.primary.purple }
  ];
  
  return data.filter(item => item.value > 0);
}

/**
 * Get chart data for amortization visualization
 * @param {array} schedule - Amortization schedule
 * @param {number} loanAmount - Original loan amount
 * @returns {array} Chart data for yearly breakdown
 */
export function getAmortizationChartData(schedule, loanAmount) {
  return schedule
    .filter(data => data.month % 12 === 0 || data.month === schedule.length)
    .map(data => ({
      year: data.year,
      interest: Number(data.totalInterest),
      principal: loanAmount - Number(data.balance),
      balance: Number(data.balance)
    }));
}