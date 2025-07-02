// Financial presets for quick-start scenarios
export const FINANCIAL_PRESETS = {
  youngProfessional: {
    label: 'Young Professional',
    description: 'Fresh graduate, entry-level salary',
    data: {
      salary: 65000,
      age: 25,
      retirementAge: 67,
      filingStatus: 'single',
      selectedState: 'CA',
      payFrequency: 'biweekly',
      nextPayDate: new Date().toISOString().split('T')[0],
      monthlyExpenses: 3500,
      
      checkingBalance: 5000,
      savingsBalance: 8000,
      brokerageBalance: 2000,
      cryptoBalance: 500,
      
      current401k: 3000,
      currentRothIRA: 5000,
      currentTraditionalIRA: 0,
      currentPension: 0,
      
      homeValue: 0,
      carValue: 18000,
      otherAssets: 0,
      
      mortgage: 0,
      carLoan: 15000,
      creditCards: 2500,
      studentLoans: 35000,
      otherDebts: 0,
      
      checkingAllocation: 60,
      savingsAllocation: 25,
      brokerageAllocation: 15,
      cryptoAllocation: 0,
      emergencyFundAllocation: 0,
      
      contribution401k: 6,
      contributionRothIRA: 6000,
      contributionTraditionalIRA: 0,
      employerMatch: 3,
      
      savingsReturn: 4.5,
      brokerageReturn: 8,
      cryptoReturn: 12,
      retirement401kReturn: 7,
      rothIRAReturn: 7,
      traditionalIRAReturn: 7,
      pensionReturn: 4,
      
      homeAppreciation: 3,
      carDepreciation: -12,
      otherAssetsReturn: 2,
      
      mortgageRate: 0,
      carLoanRate: 5,
      creditCardRate: 22,
      studentLoanRate: 4.5,
      otherDebtRate: 0,
      
      mortgagePayment: 0,
      carLoanPayment: 350,
      creditCardPayment: 125,
      studentLoanPayment: 400,
      otherDebtPayment: 0
    }
  },
  
  establishedFamily: {
    label: 'Established Family',
    description: 'Mid-career, family with home',
    data: {
      salary: 120000,
      age: 35,
      retirementAge: 67,
      filingStatus: 'marriedFilingJointly',
      selectedState: 'TX',
      payFrequency: 'biweekly',
      nextPayDate: new Date().toISOString().split('T')[0],
      monthlyExpenses: 7500,
      
      checkingBalance: 15000,
      savingsBalance: 45000,
      brokerageBalance: 85000,
      cryptoBalance: 8000,
      
      current401k: 180000,
      currentRothIRA: 35000,
      currentTraditionalIRA: 25000,
      currentPension: 0,
      
      homeValue: 450000,
      carValue: 35000,
      otherAssets: 15000,
      
      mortgage: 320000,
      carLoan: 25000,
      creditCards: 5000,
      studentLoans: 15000,
      otherDebts: 0,
      
      checkingAllocation: 50,
      savingsAllocation: 20,
      brokerageAllocation: 25,
      cryptoAllocation: 5,
      emergencyFundAllocation: 0,
      
      contribution401k: 12,
      contributionRothIRA: 6000,
      contributionTraditionalIRA: 0,
      employerMatch: 6,
      
      savingsReturn: 4.2,
      brokerageReturn: 7.5,
      cryptoReturn: 15,
      retirement401kReturn: 7,
      rothIRAReturn: 7,
      traditionalIRAReturn: 7,
      pensionReturn: 4,
      
      homeAppreciation: 3.5,
      carDepreciation: -10,
      otherAssetsReturn: 3,
      
      mortgageRate: 6.5,
      carLoanRate: 4.5,
      creditCardRate: 19.5,
      studentLoanRate: 4,
      otherDebtRate: 0,
      
      mortgagePayment: 2200,
      carLoanPayment: 520,
      creditCardPayment: 250,
      studentLoanPayment: 175,
      otherDebtPayment: 0
    }
  },
  
  preRetiree: {
    label: 'Pre-Retiree',
    description: 'Peak earning years, nearing retirement',
    data: {
      salary: 150000,
      age: 55,
      retirementAge: 67,
      filingStatus: 'marriedFilingJointly',
      selectedState: 'FL',
      payFrequency: 'biweekly',
      nextPayDate: new Date().toISOString().split('T')[0],
      monthlyExpenses: 8500,
      
      checkingBalance: 25000,
      savingsBalance: 120000,
      brokerageBalance: 450000,
      cryptoBalance: 15000,
      
      current401k: 850000,
      currentRothIRA: 125000,
      currentTraditionalIRA: 180000,
      currentPension: 85000,
      
      homeValue: 650000,
      carValue: 45000,
      otherAssets: 85000,
      
      mortgage: 125000,
      carLoan: 0,
      creditCards: 0,
      studentLoans: 0,
      otherDebts: 0,
      
      checkingAllocation: 40,
      savingsAllocation: 15,
      brokerageAllocation: 40,
      cryptoAllocation: 5,
      emergencyFundAllocation: 0,
      
      contribution401k: 15,
      contributionRothIRA: 7000,
      contributionTraditionalIRA: 0,
      employerMatch: 6,
      
      savingsReturn: 4.0,
      brokerageReturn: 6.5,
      cryptoReturn: 10,
      retirement401kReturn: 6.5,
      rothIRAReturn: 6.5,
      traditionalIRAReturn: 6.5,
      pensionReturn: 4,
      
      homeAppreciation: 2.5,
      carDepreciation: -8,
      otherAssetsReturn: 4,
      
      mortgageRate: 3.5,
      carLoanRate: 0,
      creditCardRate: 0,
      studentLoanRate: 0,
      otherDebtRate: 0,
      
      mortgagePayment: 850,
      carLoanPayment: 0,
      creditCardPayment: 0,
      studentLoanPayment: 0,
      otherDebtPayment: 0
    }
  }
};