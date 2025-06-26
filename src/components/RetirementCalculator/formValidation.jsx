export function validateForm(state) {
  const {
    birthDate, currentTenure, currentSalary, yearlyRaise,
    initialBalance401k, personal401KContribution, employer401KMatch,
    initialContributionsRothIRA, initialEarningsRothIRA, RothIRAContribution,
    initialBalanceStock, allocationStock, allocationStockVariance, vestingPeriod
  } = state;

  const birthDateObj = new Date(birthDate);
  const currentDate = new Date();
  const age = currentDate.getFullYear() - birthDateObj.getFullYear();

  if (isNaN(birthDateObj.getTime()) || age < 10 || age > 100) {
    console.error("Invalid birth date: Please enter a valid date within a reasonable age range (10-100 years).");
    return false;
  }

  const numericFields = [
    { value: currentTenure, name: "Current Tenure", min: 0, max: 50 },
    { value: currentSalary, name: "Current Salary", min: 1000, max: 1_000_000 },
    { value: yearlyRaise, name: "Yearly Raise (%)", min: 0, max: 50 },
    { value: initialBalance401k, name: "Initial 401(k) Balance", min: 0, max: 10_000_000 },
    { value: personal401KContribution, name: "Personal 401(k) Contribution (%)", min: 0, max: 100 },
    { value: employer401KMatch, name: "Employer 401(k) Match (%)", min: 0, max: 100 },
    { value: initialContributionsRothIRA, name: "Initial Roth IRA Contributions", min: 0, max: 500_000 },
    { value: initialEarningsRothIRA, name: "Initial Roth IRA Earnings", min: 0, max: 500_000 },
    { value: RothIRAContribution, name: "Roth IRA Contribution (%)", min: 0, max: 100 },
    { value: initialBalanceStock, name: "Initial Stock Balance", min: 0, max: 100_000_000 },
    { value: allocationStock, name: "Stock Allocation (%)", min: 0, max: 100 },
    { value: allocationStockVariance, name: "Stock Allocation Variance (%)", min: 0, max: 50 },
    { value: vestingPeriod, name: "Vesting Period (years)", min: 0, max: 50 },
  ];

  for (const field of numericFields) {
    const value = parseFloat(field.value);
    if (isNaN(value) || value < field.min || value > field.max) {
      console.error(`Invalid value for ${field.name}: Must be between ${field.min} and ${field.max}.`);
      return false;
    }
  }

  return true; // all fields are valid
}
