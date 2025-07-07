import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  BarChart3, 
  Calculator,
  Download,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  DollarSign,
  Receipt,
  PiggyBank,
  TrendingUp,
  Home,
  CreditCard,
  Trash2
} from 'lucide-react';
import Navigation from '../shared/Navigation';
import { formatCurrency, formatPercent, decimalToPercent, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { calculateAllTaxes, getAllStates } from '../../lib/taxes';
import { useLocalStorage, useCSV } from '../../hooks';
import './FinancialDashboard.css';

const FinancialDashboard = () => {
  const [viewPeriod, setViewPeriod] = useState('monthly'); // daily, weekly, monthly, yearly
  const [showTable, setShowTable] = useState(false); // Toggle between chart and table
  const [projectionYears, setProjectionYears] = useState(10);
  const [timelineMonths, setTimelineMonths] = useState(12); // For slider: 1-360 months
  const [focusedChart, setFocusedChart] = useState('overview'); // Which chart is currently the main focus
  const [selectedCategory, setSelectedCategory] = useState('basic'); // Which category is selected
  

  // Use localStorage for data persistence
  const [financialData, setFinancialData] = useLocalStorage(STORAGE_KEYS.FINANCIAL_DASHBOARD, {
    // Basic Info
    age: 30, // keeping for backward compatibility
    birthdate: '', // new birthdate field
    retirementAge: 67,
    filingStatus: 'single',
    selectedState: 'MI',
    dependents: 0,
    
    // Income Sources (Static Fields)
    employmentType: 'salary', // 'salary' or 'hourly'
    salaryAmount: 100000,
    hourlyRate: 25,
    hoursPerWeek: 40,
    payFrequency: 'biweekly',
    lastPayDate: '',
    businessIncome: 0,
    otherIncome: 0,
    
    // Expenses
    expenses: [
      { id: 1, category: 'Housing', amount: 1800 },
      { id: 2, category: 'Food', amount: 600 },
      { id: 3, category: 'Transportation', amount: 400 },
      { id: 4, category: 'Utilities', amount: 200 },
      { id: 5, category: 'Entertainment', amount: 300 },
      { id: 6, category: 'Healthcare', amount: 200 }
    ],
    
    // Account Balances
    checkingBalance: 5000,
    savingsBalance: 10000,
    brokerageBalance: 15000,
    
    // Retirement Account Balances
    current401k: 0,
    currentRothIRA: 0,
    currentTraditionalIRA: 0,
    currentPension: 0,
    otherRetirementType: 'pension',
    
    // Assets
    homeValue: 0,
    carValue: 0,
    otherAssets: 0,
    
    // Debts
    mortgage: 0,
    carLoan: 0,
    creditCards: 0,
    studentLoans: 0,
    otherDebts: 0,
    
    // Paycheck Allocation Percentages (should total 100%)
    checkingAllocation: 60, // % of paycheck to checking
    savingsAllocation: 15, // % of paycheck to savings
    brokerageAllocation: 15, // % of paycheck to brokerage
    emergencyFundAllocation: 5, // % of paycheck to emergency fund
    
    // Retirement Contributions
    contribution401k: 6, // % of salary
    contributionRothIRA: 6000, // annual amount
    contributionTraditionalIRA: 0, // annual amount
    employerMatch: 3, // % of salary
    
    // Investment Returns (annual %)
    savingsReturn: 2.5, // High-yield savings rate
    brokerageReturn: 7, // Stock market average
    retirement401kReturn: 7, // Conservative retirement mix
    rothIRAReturn: 7, // Conservative retirement mix
    traditionalIRAReturn: 7, // Conservative retirement mix
    pensionReturn: 4, // Conservative pension growth
    
    // Asset Appreciation/Depreciation Rates (annual %)
    homeAppreciation: 3, // Home appreciation
    carDepreciation: -15, // Car depreciation
    otherAssetsReturn: 2, // Other assets return
    
    // Debt Interest Rates
    mortgageRate: 6.5,
    carLoanRate: 5.5,
    creditCardRate: 18.5,
    studentLoanRate: 4.5,
    otherDebtsRate: 8.0
  });

  // Calculate projections
  const [projections, setProjections] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({});

  // Calculate total gross income from all sources
  const calculateTotalIncome = useCallback(() => {
    let total = 0;
    
    // Employment Income (Salary or Hourly)
    if (financialData.employmentType === 'salary') {
      const salary = parseNumber(financialData.salaryAmount) || 0;
      total += salary;
    } else if (financialData.employmentType === 'hourly') {
      const hourlyRate = parseNumber(financialData.hourlyRate) || 0;
      const hoursPerWeek = parseNumber(financialData.hoursPerWeek) || 0;
      total += hourlyRate * hoursPerWeek * 52; // Annual calculation
    }
    
    // Business Income
    const monthlyBusiness = parseNumber(financialData.businessIncome) || 0;
    total += monthlyBusiness * 12;
    
    // Other Income
    const monthlyOther = parseNumber(financialData.otherIncome) || 0;
    total += monthlyOther * 12;
    
    return total;
  }, [financialData.employmentType, financialData.salaryAmount, financialData.hourlyRate, financialData.hoursPerWeek, financialData.businessIncome, financialData.otherIncome]);

  // Calculate tax rate based on income and location
  const calculateTaxRate = useCallback(() => {
    try {
      const totalIncome = calculateTotalIncome();
      if (totalIncome === 0) return 0;
      
      // Include pre-tax contributions for accurate tax calculation
      const annual401k = totalIncome * (parseNumber(financialData.contribution401k) / 100);
      const traditionalIRA = parseNumber(financialData.contributionTraditionalIRA);
      
      const taxInfo = calculateAllTaxes(
        totalIncome,
        financialData.filingStatus,
        financialData.selectedState,
        annual401k, // 401k contribution (pre-tax)
        traditionalIRA  // Traditional IRA contribution
      );
      return (taxInfo.totalTaxes / totalIncome) * 100;
    } catch (error) {
      return 25; // fallback to 25%
    }
  }, [calculateTotalIncome, financialData.filingStatus, financialData.selectedState, financialData.contribution401k, financialData.contributionTraditionalIRA]);

  // Render chart based on type and configuration
  const renderChart = (chartKey, data, config, isMainChart) => {
    if (!data || !config) {
      return null;
    }
    
    const commonProps = {
      data: data || [],
      margin: { top: 20, right: 20, left: 0, bottom: isMainChart ? 20 : 0 }
    };

    const xAxisProps = {
      dataKey: timelineMonths <= 24 ? 'month' : 'year',
      stroke: '#999',
      fontSize: isMainChart ? 12 : 10,
      tickFormatter: (value) => {
        if (timelineMonths <= 24) {
          const year = Math.floor(value / 12) + new Date().getFullYear();
          const month = (value % 12) + 1;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const yearShort = String(year).slice(-2);
          return `${monthNames[month - 1]} '${yearShort}`;
        }
        return `'${String(value).slice(-2)}`;
      }
    };

    const yAxisProps = {
      stroke: '#999',
      tickFormatter: formatChartCurrency,
      fontSize: isMainChart ? 12 : 10
    };

    const tooltipProps = {
      formatter: (value) => formatCurrency(value),
      contentStyle: {
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '4px',
        fontSize: '12px'
      },
      labelStyle: { color: '#fff' }
    };

    switch (config.type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {isMainChart && <Legend fontSize={12} />}
            {Object.keys(config.colors || {}).map(key => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config.colors[key]}
                fill={config.colors[key]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {isMainChart && <Legend fontSize={12} />}
            {Object.keys(config.colors || {}).map(key => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={config.colors[key]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            {isMainChart && <Legend fontSize={12} />}
            {Object.keys(config.colors || {}).map(key => (
              <Bar
                key={key}
                dataKey={key}
                fill={config.colors[key]}
              />
            ))}
          </BarChart>
        );

      default:
        return null;
    }
  };

  const calculateProjections = useCallback(() => {
    const data = [];
    const year = new Date().getFullYear();
    
    // Calculate timeline in months instead of years
    const totalMonths = Math.max(timelineMonths, projectionYears * 12);
    
    // Calculate current age from birthdate or use stored age as fallback
    const calculateAgeFromBirthdate = (birthdate) => {
      if (!birthdate) return parseNumber(financialData.age) || 30;
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return Math.max(0, age);
    };
    
    // Parse all numeric values at calculation time
    const parsedData = {
      age: calculateAgeFromBirthdate(financialData.birthdate),
      totalIncome: calculateTotalIncome(),
      
      // Account Balances
      checkingBalance: parseNumber(financialData.checkingBalance),
      savingsBalance: parseNumber(financialData.savingsBalance),
      brokerageBalance: parseNumber(financialData.brokerageBalance),
      
      // Retirement Balances
      current401k: parseNumber(financialData.current401k),
      currentRothIRA: parseNumber(financialData.currentRothIRA),
      currentTraditionalIRA: parseNumber(financialData.currentTraditionalIRA),
      currentPension: parseNumber(financialData.currentPension),
      
      // Assets
      homeValue: parseNumber(financialData.homeValue),
      carValue: parseNumber(financialData.carValue),
      otherAssets: parseNumber(financialData.otherAssets),
      
      // Debts
      mortgage: parseNumber(financialData.mortgage),
      carLoan: parseNumber(financialData.carLoan),
      creditCards: parseNumber(financialData.creditCards),
      studentLoans: parseNumber(financialData.studentLoans),
      otherDebts: parseNumber(financialData.otherDebts),
      
      // Paycheck Allocations
      checkingAllocation: parseNumber(financialData.checkingAllocation),
      savingsAllocation: parseNumber(financialData.savingsAllocation),
      brokerageAllocation: parseNumber(financialData.brokerageAllocation),
      
      // Retirement Contributions
      contribution401k: parseNumber(financialData.contribution401k),
      contributionRothIRA: parseNumber(financialData.contributionRothIRA),
      contributionTraditionalIRA: parseNumber(financialData.contributionTraditionalIRA),
      employerMatch: parseNumber(financialData.employerMatch),
      
      // Returns (convert annual to monthly)
      savingsReturn: parseNumber(financialData.savingsReturn) / 12 / 100,
      brokerageReturn: parseNumber(financialData.brokerageReturn) / 12 / 100,
      retirement401kReturn: parseNumber(financialData.retirement401kReturn) / 12 / 100,
      rothIRAReturn: parseNumber(financialData.rothIRAReturn) / 12 / 100,
      traditionalIRAReturn: parseNumber(financialData.traditionalIRAReturn) / 12 / 100,
      pensionReturn: parseNumber(financialData.pensionReturn) / 12 / 100,
      
      // Asset appreciation/depreciation (convert annual to monthly)
      homeAppreciation: parseNumber(financialData.homeAppreciation) / 12 / 100,
      carDepreciation: parseNumber(financialData.carDepreciation) / 12 / 100,
      otherAssetsReturn: parseNumber(financialData.otherAssetsReturn) / 12 / 100,
      
      // Debt Rates (convert annual to monthly)
      mortgageRate: parseNumber(financialData.mortgageRate) / 12 / 100,
      carLoanRate: parseNumber(financialData.carLoanRate) / 12 / 100,
      creditCardRate: parseNumber(financialData.creditCardRate) / 12 / 100,
      studentLoanRate: parseNumber(financialData.studentLoanRate) / 12 / 100,
      otherDebtsRate: parseNumber(financialData.otherDebtsRate) / 12 / 100
    };
    
    const currentAge = parsedData.age;
    let totalIncome = parsedData.totalIncome;
    const effectiveTaxRate = calculateTaxRate();
    
    // Calculate monthly income from all sources
    const getMonthlyIncome = () => {
      return totalIncome / 12; // Convert annual to monthly
    };
    
    // Calculate total monthly expenses
    const totalMonthlyExpenses = (financialData.expenses || []).reduce((sum, expense) => {
      return sum + parseNumber(expense.amount);
    }, 0);
    
    let monthlyIncome = getMonthlyIncome();
    let netMonthlyIncome = monthlyIncome * (1 - effectiveTaxRate / 100);
    
    // Initial account balances
    let checking = parsedData.checkingBalance;
    let savings = parsedData.savingsBalance;
    let brokerage = parsedData.brokerageBalance;
    
    // Retirement accounts
    let retirement401k = parsedData.current401k;
    let rothIRA = parsedData.currentRothIRA;
    let traditionalIRA = parsedData.currentTraditionalIRA;
    let pension = parsedData.currentPension;
    
    // Assets
    let homeValue = parsedData.homeValue;
    let carValue = parsedData.carValue;
    let otherAssets = parsedData.otherAssets;
    
    // Debts
    let mortgage = parsedData.mortgage;
    let carLoan = parsedData.carLoan;
    let creditCards = parsedData.creditCards;
    let studentLoans = parsedData.studentLoans;
    let otherDebts = parsedData.otherDebts;
    
    for (let month = 0; month <= totalMonths; month++) {
      // Monthly contributions from paycheck
      const monthlyContributions = {
        checking: netMonthlyIncome * (parsedData.checkingAllocation / 100),
        savings: netMonthlyIncome * (parsedData.savingsAllocation / 100),
        brokerage: netMonthlyIncome * (parsedData.brokerageAllocation / 100),
      };
      
      // Monthly retirement contributions
      const monthly401k = (totalIncome * (parsedData.contribution401k / 100)) / 12;
      const monthlyEmployerMatch = Math.min(monthly401k, (totalIncome * (parsedData.employerMatch / 100)) / 12);
      const monthlyRothIRA = parsedData.contributionRothIRA / 12;
      const monthlyTraditionalIRA = parsedData.contributionTraditionalIRA / 12;
      
      // Add monthly contributions
      checking += monthlyContributions.checking;
      savings += monthlyContributions.savings;
      brokerage += monthlyContributions.brokerage;
      
      // Deduct monthly expenses from checking
      checking -= totalMonthlyExpenses;
      
      // If checking goes negative, transfer from savings
      if (checking < 0) {
        const deficit = Math.abs(checking);
        savings = Math.max(0, savings - deficit);
        checking = Math.max(0, checking);
      }
      
      // Apply monthly investment growth (checking earns no interest)
      savings += savings * parsedData.savingsReturn;
      brokerage += brokerage * parsedData.brokerageReturn;
      
      // Retirement account growth
      retirement401k += monthly401k + monthlyEmployerMatch + (retirement401k * parsedData.retirement401kReturn);
      rothIRA += monthlyRothIRA + (rothIRA * parsedData.rothIRAReturn);
      traditionalIRA += monthlyTraditionalIRA + (traditionalIRA * parsedData.traditionalIRAReturn);
      pension += pension * parsedData.pensionReturn;
      
      // Asset appreciation/depreciation
      homeValue += homeValue * parsedData.homeAppreciation;
      carValue += carValue * parsedData.carDepreciation; // Apply actual depreciation rate
      carValue = Math.max(0, carValue); // Don't let car value go negative
      otherAssets += otherAssets * parsedData.otherAssetsReturn;
      
      // Debt payments and interest
      if (mortgage > 0) {
        const monthlyPayment = Math.min(mortgage * 0.005, mortgage); // 0.5% of balance or full balance
        mortgage = Math.max(0, mortgage + (mortgage * parsedData.mortgageRate) - monthlyPayment);
      }
      if (carLoan > 0) {
        const monthlyPayment = Math.min(carLoan * 0.02, carLoan); // 2% of balance or full balance
        carLoan = Math.max(0, carLoan + (carLoan * parsedData.carLoanRate) - monthlyPayment);
      }
      if (creditCards > 0) {
        const monthlyPayment = Math.min(creditCards * 0.03, creditCards); // 3% of balance or full balance
        creditCards = Math.max(0, creditCards + (creditCards * parsedData.creditCardRate) - monthlyPayment);
      }
      if (studentLoans > 0) {
        const monthlyPayment = Math.min(studentLoans * 0.01, studentLoans); // 1% of balance or full balance
        studentLoans = Math.max(0, studentLoans + (studentLoans * parsedData.studentLoanRate) - monthlyPayment);
      }
      if (otherDebts > 0) {
        const monthlyPayment = Math.min(otherDebts * 0.015, otherDebts); // 1.5% of balance or full balance
        otherDebts = Math.max(0, otherDebts + (otherDebts * parsedData.otherDebtsRate) - monthlyPayment);
      }
      
      // Calculate totals
      const totalLiquid = checking + savings + brokerage;
      const totalRetirement = retirement401k + rothIRA + traditionalIRA + pension;
      const totalAssets = totalLiquid + totalRetirement + homeValue + carValue + otherAssets;
      const totalDebts = mortgage + carLoan + creditCards + studentLoans + otherDebts;
      const netWorth = totalAssets - totalDebts;
      
      // Only save data points for display (every month, or every 3 months for longer timelines)
      const shouldSave = month === 0 || month % (totalMonths > 60 ? 3 : 1) === 0;
      if (shouldSave) {
        data.push({
          month: month,
          year: year + Math.floor(month / 12),
          age: Math.round((currentAge + month / 12) * 10) / 10,
          totalIncome: Math.round(totalIncome),
          checking: Math.round(checking),
          savings: Math.round(savings),
          brokerage: Math.round(brokerage),
          total401k: Math.round(retirement401k),
          rothIRA: Math.round(rothIRA),
          traditionalIRA: Math.round(traditionalIRA),
          pension: Math.round(pension),
          homeValue: Math.round(homeValue),
          carValue: Math.round(carValue),
          otherAssets: Math.round(otherAssets),
          mortgage: Math.round(mortgage),
          carLoan: Math.round(carLoan),
          creditCards: Math.round(creditCards),
          studentLoans: Math.round(studentLoans),
          otherDebts: Math.round(otherDebts),
          totalLiquid: Math.round(totalLiquid),
          totalRetirement: Math.round(totalRetirement),
          totalAssets: Math.round(totalAssets),
          totalDebts: Math.round(totalDebts),
          netWorth: Math.round(netWorth)
        });
      }
      
      // Annual income increase (every 12 months)
      if (month > 0 && month % 12 === 0) {
        totalIncome *= 1.03; // 3% annual increase
        monthlyIncome = getMonthlyIncome();
        netMonthlyIncome = monthlyIncome * (1 - effectiveTaxRate / 100);
      }
    }

    setProjections(data);
    
    // Calculate summary metrics
    const current = data[0];
    const final = data[data.length - 1];
    
    setSummaryMetrics({
      currentNetWorth: current.netWorth,
      projectedNetWorth: final.netWorth,
      totalGrowth: final.netWorth - current.netWorth,
      monthlyIncome: Math.round(current.totalIncome / 12),
      monthlyExpenses: totalMonthlyExpenses,
      monthlyCashFlow: Math.round(current.totalIncome / 12) - totalMonthlyExpenses,
      dailyIncome: Math.round(current.totalIncome / 365),
      weeklyIncome: Math.round(current.totalIncome / 52),
      effectiveTaxRate: effectiveTaxRate,
      debtToIncomeRatio: (current.totalDebts / current.totalIncome) * 100,
      savingsRate: ((parsedData.savingsAllocation + parsedData.brokerageAllocation + parsedData.contribution401k) / 100) * 100
    });
  }, [financialData, timelineMonths, projectionYears, calculateTaxRate]);

  const handleInputChange = useCallback((field, value) => {
    // Store all values as-is, no parsing until calculation
    setFinancialData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFinancialData]);

  // Controlled input that only updates parent on blur
  const BlurInput = ({ field, type = 'number', className, placeholder, ...props }) => {
    const [localValue, setLocalValue] = useState(financialData[field] || '');
    
    return (
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => handleInputChange(field, localValue)}
        className={className}
        placeholder={placeholder}
        {...props}
      />
    );
  };

  const handleReset = () => {
    setFinancialData({
      age: 30, // keeping for backward compatibility
      birthdate: '', // reset birthdate
      retirementAge: 67,
      filingStatus: 'single',
      selectedState: 'MI',
      dependents: 0,
      
      // Income Sources (Static Fields)
      employmentType: 'salary',
      salaryAmount: 100000,
      hourlyRate: 25,
      hoursPerWeek: 40,
      payFrequency: 'biweekly',
      lastPayDate: '',
      businessIncome: 0,
      otherIncome: 0,
      
      expenses: [
        { id: 1, category: 'Housing', amount: 1800 },
        { id: 2, category: 'Food', amount: 600 },
        { id: 3, category: 'Transportation', amount: 400 },
        { id: 4, category: 'Utilities', amount: 200 },
        { id: 5, category: 'Entertainment', amount: 300 },
        { id: 6, category: 'Healthcare', amount: 200 }
      ],
      
      checkingBalance: 5000,
      savingsBalance: 20000,
      brokerageBalance: 15000,
      
      current401k: 50000,
      currentRothIRA: 25000,
      currentTraditionalIRA: 0,
      currentPension: 0,
      otherRetirementType: 'pension',
      
      homeValue: 400000,
      carValue: 25000,
      otherAssets: 10000,
      
      mortgage: 300000,
      carLoan: 15000,
      creditCards: 8000,
      studentLoans: 25000,
      otherDebts: 2000,
      
      checkingAllocation: 60,
      savingsAllocation: 15,
      brokerageAllocation: 15,
      emergencyFundAllocation: 5,
      
      contribution401k: 6,
      contributionRothIRA: 6000,
      contributionTraditionalIRA: 0,
      employerMatch: 3,
      
      savingsReturn: 2.5,
      brokerageReturn: 7,
      retirement401kReturn: 7,
      rothIRAReturn: 7,
      traditionalIRAReturn: 7,
      pensionReturn: 4,
      
      homeAppreciation: 3,
      carDepreciation: -15,
      otherAssetsReturn: 2,
      
      mortgageRate: 6.5,
      carLoanRate: 5.5,
      creditCardRate: 18.5,
      studentLoanRate: 4.5,
      otherDebtsRate: 8.0
    });
  };

  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('financial-dashboard');

  const handleExport = () => {
    const exportData = {
      financialData,
      projections,
      summaryMetrics,
      projectionYears
    };
    exportCSV([exportData], 'financial-dashboard');
  };

  const handleImport = createFileInputHandler((importedData) => {
    if (importedData && importedData.length > 0 && importedData[0].financialData) {
      setFinancialData(importedData[0].financialData);
      if (importedData[0].projectionYears) {
        setProjectionYears(importedData[0].projectionYears);
        setTimelineMonths(importedData[0].projectionYears * 12);
      }
    }
  });

  // Format currency for chart axis - intuitive units
  const formatChartCurrency = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    } else {
      return `${value.toFixed(0)}`;
    }
  };

  // Chart data preparation - memoized for performance
  const chartDataSets = useMemo(() => ({
    overview: projections.map(item => ({
      month: item.month,
      year: item.year,
      'Physical Assets': (item.homeValue || 0) + (item.carValue || 0) + (item.otherAssets || 0),
      'Liquid Accounts': (item.checking || 0) + (item.savings || 0) + (item.brokerage || 0),
      'Retirement': (item.total401k || 0) + (item.rothIRA || 0) + (item.traditionalIRA || 0) + (item.pension || 0),
      'Total Debts': item.totalDebts || 0,
      'Net Worth': item.netWorth || 0
    })),
    liquid: projections.map(item => ({
      month: item.month,
      year: item.year,
      'Checking': item.checking || 0,
      'Savings': item.savings || 0,
      'Brokerage': item.brokerage || 0,
    })),
    retirement: projections.map(item => ({
      month: item.month,
      year: item.year,
      '401k': item.total401k || 0,
      'Roth IRA': item.rothIRA || 0,
      'Traditional IRA': item.traditionalIRA || 0,
      'Pension': item.pension || 0
    })),
    assets: projections.map(item => ({
      month: item.month,
      year: item.year,
      'Home': item.homeValue || 0,
      'Vehicle': item.carValue || 0,
      'Other Assets': item.otherAssets || 0
    })),
    debts: projections.map(item => ({
      month: item.month,
      year: item.year,
      'Mortgage': item.mortgage || 0,
      'Car Loan': item.carLoan || 0,
      'Credit Cards': item.creditCards || 0,
      'Student Loans': item.studentLoans || 0,
      'Other Debts': item.otherDebts || 0
    }))
  }), [projections]);

  // Chart configurations
  const chartConfigs = {
    overview: {
      title: 'Net Worth Overview',
      type: 'area',
      colors: { 
        'Physical Assets': '#059669', 
        'Liquid Accounts': '#06b6d4', 
        'Retirement': '#8b5cf6', 
        'Total Debts': '#ef4444', 
        'Net Worth': '#22c55e' 
      }
    },
    liquid: {
      title: 'Liquid Accounts',
      type: 'line',
      colors: { 'Checking': '#06b6d4', 'Savings': '#10b981', 'Brokerage': '#3b82f6' }
    },
    retirement: {
      title: 'Retirement Accounts',
      type: 'area',
      colors: { '401k': '#8b5cf6', 'Roth IRA': '#a855f7', 'Traditional IRA': '#c084fc', 'Pension': '#d8b4fe' }
    },
    assets: {
      title: 'Physical Assets',
      type: 'bar',
      colors: { 'Home': '#059669', 'Vehicle': '#0891b2', 'Other Assets': '#0d9488' }
    },
    debts: {
      title: 'Debts',
      type: 'bar',
      colors: { 'Mortgage': '#dc2626', 'Car Loan': '#ea580c', 'Credit Cards': '#ef4444', 'Student Loans': '#f87171', 'Other Debts': '#fca5a5' }
    }
  };

  // Initial calculation on mount and when timeline changes
  useEffect(() => {
    calculateProjections();
  }, [calculateProjections]);

  // Helper functions for expense management - memoized for performance
  const addExpense = useCallback(() => {
    const newId = Math.max(...(financialData.expenses || []).map(e => e.id), 0) + 1;
    const newExpense = { id: newId, category: 'New Category', amount: 0 };
    handleInputChange('expenses', [...(financialData.expenses || []), newExpense]);
  }, [financialData.expenses, handleInputChange]);
  
  const removeExpense = useCallback((id) => {
    const updatedExpenses = (financialData.expenses || []).filter(expense => expense.id !== id);
    handleInputChange('expenses', updatedExpenses);
  }, [financialData.expenses, handleInputChange]);
  
  const updateExpense = useCallback((id, field, value) => {
    const updatedExpenses = (financialData.expenses || []).map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    );
    handleInputChange('expenses', updatedExpenses);
  }, [financialData.expenses, handleInputChange]);


  // Handle category selection
  const selectCategory = useCallback((categoryKey) => {
    setSelectedCategory(categoryKey);
  }, []);

  // Memoized summary calculations for performance
  const sectionSummaries = useMemo(() => {
    // Calculate current age from birthdate or use stored age as fallback
    const calculateAgeFromBirthdate = (birthdate) => {
      if (!birthdate) return parseNumber(financialData.age) || 30;
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return Math.max(0, age);
    };
    
    const currentAge = calculateAgeFromBirthdate(financialData.birthdate);
    
    return {
      basic: `Age ${currentAge}, ${financialData.dependents || 0} deps, ${financialData.selectedState || 'MI'}`,
      income: formatCurrency(calculateTotalIncome()),
      expenses: formatCurrency((financialData.expenses || []).reduce((sum, expense) => sum + parseNumber(expense.amount), 0)),
      retirement: formatCurrency((parseNumber(financialData.current401k) + parseNumber(financialData.currentRothIRA) + parseNumber(financialData.currentTraditionalIRA) + parseNumber(financialData.currentPension)) || 0),
      liquid: formatCurrency((parseNumber(financialData.checkingBalance) + parseNumber(financialData.savingsBalance) + parseNumber(financialData.brokerageBalance)) || 0),
      assets: formatCurrency((parseNumber(financialData.homeValue) + parseNumber(financialData.carValue) + parseNumber(financialData.otherAssets)) || 0),
      debts: formatCurrency((parseNumber(financialData.mortgage) + parseNumber(financialData.carLoan) + parseNumber(financialData.creditCards) + parseNumber(financialData.studentLoans) + parseNumber(financialData.otherDebts)) || 0)
    };
  }, [financialData]);


  // Tab content components
  const BasicInfoTab = () => {
    const selectedStateData = getAllStates().find(state => state.code === financialData.selectedState);
    const stateTaxRate = selectedStateData ? selectedStateData.rate : 0;
    
    // Calculate current age from birthdate
    const calculateAgeFromBirthdate = (birthdate) => {
      if (!birthdate) return 30; // default age
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return Math.max(0, age);
    };
    
    const currentAge = financialData.birthdate ? calculateAgeFromBirthdate(financialData.birthdate) : parseNumber(financialData.age) || 30;
    const retirementAge = parseNumber(financialData.retirementAge) || 67;
    const yearsUntilRetirement = Math.max(0, retirementAge - currentAge);
    
    return (
          <div>
            <div className="age-fields-row">
              <div className="basic-input-field">
                <label>Birthdate</label>
                <BlurInput
                  field="birthdate"
                  type="date"
                  className="basic-field"
                  placeholder=""
                />
                <div className="input-sub-info">
                  Current Age: {currentAge}
                </div>
              </div>
              <div className="basic-input-field">
                <label>Retirement Age</label>
                <BlurInput
                  field="retirementAge"
                  type="number"
                  className="basic-field"
                  placeholder="67"
                />
                <div className="input-sub-info">
                  Years Until Retirement: {yearsUntilRetirement}
                </div>
              </div>
              
            </div>
            
            <div className="basic-input-field">
              <label>State</label>
              <select
                value={financialData.selectedState}
                onChange={(e) => handleInputChange('selectedState', e.target.value)}
                className="basic-field"
              >
                {getAllStates().map(state => (
                  <option key={state.code} value={state.code}>{state.name}</option>
                ))}
              </select>
              <div className="input-sub-info">
                State Tax Rate: {decimalToPercent(stateTaxRate)}
              </div>
            </div>
            
            <div className="age-fields-row">
              <div className="basic-input-field">
                <label>Filing Status</label>
                <select
                  value={financialData.filingStatus}
                  onChange={(e) => handleInputChange('filingStatus', e.target.value)}
                  className="basic-field"
                >
                  <option value="single">Single</option>
                  <option value="marriedFilingJointly">Married Filing Jointly</option>
                  <option value="marriedFilingSeparately">Married Filing Separately</option>
                  <option value="headOfHousehold">Head of Household</option>
                </select>
                <div className="input-sub-info">
                  {(() => {
                    const standardDeductions = {
                      single: '$13,850',
                      marriedFilingJointly: '$27,700',
                      marriedFilingSeparately: '$13,850',
                      headOfHousehold: '$20,800'
                    };
                    return `Standard Deduction: ${standardDeductions[financialData.filingStatus] || '$13,850'}`;
                  })()}
                </div>
              </div>
              <div className="basic-input-field">
                <label>Dependents</label>
                <BlurInput
                  field="dependents"
                  type="number"
                  className="basic-field"
                  placeholder="0"
                  min="0"
                />
                <div className="input-sub-info">
                  {(() => {
                    const dependents = parseNumber(financialData.dependents) || 0;
                    if (dependents === 0) return 'No dependent tax credits';
                    const childTaxCredit = Math.min(dependents, 10) * 2000; // $2,000 per child under 17
                    const dependentCredit = Math.max(0, dependents - 10) * 500; // $500 for other dependents
                    const totalCredit = childTaxCredit + dependentCredit;
                    return `Potential Tax Credits: ${formatCurrency(totalCredit)}`;
                  })()}
                </div>
              </div>
            </div>
        </div>
    );
  };
  
  const IncomeTab = () => {
    // Calculate total income from all static fields
    const calculateStaticTotalIncome = () => {
      let total = 0;
      
      // Employment Income (Salary or Hourly)
      if (financialData.employmentType === 'salary') {
        const salary = parseNumber(financialData.salaryAmount) || 0;
        total += salary;
      } else if (financialData.employmentType === 'hourly') {
        const hourlyRate = parseNumber(financialData.hourlyRate) || 0;
        const hoursPerWeek = parseNumber(financialData.hoursPerWeek) || 0;
        total += hourlyRate * hoursPerWeek * 52; // Annual calculation
      }
      
      // Business Income
      const monthlyBusiness = parseNumber(financialData.businessIncome) || 0;
      total += monthlyBusiness * 12;
      
      // Other Income
      const monthlyOther = parseNumber(financialData.otherIncome) || 0;
      total += monthlyOther * 12;
      
      return total;
    };
    
    const totalIncome = calculateStaticTotalIncome();
    
    // Calculate annual income from hourly for display
    const annualFromHourly = () => {
      const hourlyRate = parseNumber(financialData.hourlyRate) || 0;
      const hoursPerWeek = parseNumber(financialData.hoursPerWeek) || 0;
      return hourlyRate * hoursPerWeek * 52;
    };
    
    // Calculate next pay date for both employment types
    const calculateNextPayDate = () => {
      if (!financialData.lastPayDate) return 'Set last pay date';
      const lastPay = new Date(financialData.lastPayDate);
      const payFrequency = financialData.payFrequency || 'biweekly';
      
      let daysToAdd = 14; // biweekly default
      if (payFrequency === 'weekly') daysToAdd = 7;
      if (payFrequency === 'monthly') daysToAdd = 30;
      if (payFrequency === 'semimonthly') daysToAdd = 15;
      
      const nextPay = new Date(lastPay);
      nextPay.setDate(lastPay.getDate() + daysToAdd);
      return nextPay.toLocaleDateString();
    };
    
    
    return (
      <div>
        {/* Employment Income Section */}
        <div style={{marginBottom: '20px'}}>
          
          {/* Employment Type Toggle */}
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Employment Type</label>
              <select
                value={financialData.employmentType || 'salary'}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
                className="basic-field"
              >
                <option value="salary">Salary</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            
            {financialData.employmentType === 'salary' ? (
              <div className="basic-input-field">
                <label>Annual Salary</label>
                <BlurInput
                  field="salaryAmount"
                  type="number"
                  className="basic-field"
                  placeholder="0"
                />
                <div className="input-sub-info">
                  Monthly: {formatCurrency((parseNumber(financialData.salaryAmount) || 0) / 12)}
                </div>
              </div>
            ) : (
              <div className="basic-input-field">
                <label>Hourly Rate</label>
                <BlurInput
                  field="hourlyRate"
                  type="number"
                  className="basic-field"
                  placeholder="0"
                  step="0.01"
                />
              </div>
            )}
          </div>
          
          {/* Common pay fields for both employment types */}
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Pay Frequency</label>
              <select
                value={financialData.payFrequency || 'biweekly'}
                onChange={(e) => handleInputChange('payFrequency', e.target.value)}
                className="basic-field"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="semimonthly">Semi-monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="basic-input-field">
              <label>Last Pay Date</label>
              <BlurInput
                field="lastPayDate"
                type="date"
                className="basic-field"
              />
              <div className="input-sub-info">
                Next Pay: {calculateNextPayDate()}
              </div>
            </div>
          </div>
          
          {/* Hourly specific field */}
          {financialData.employmentType === 'hourly' && (
            <div className="basic-input-field">
              <label>Hours Per Week</label>
              <BlurInput
                field="hoursPerWeek"
                type="number"
                className="basic-field"
                placeholder="40"
              />
              <div className="input-sub-info">
                Annual Income From Employment: {formatCurrency(annualFromHourly())}
              </div>
            </div>
          )}
        </div>
        
        {/* Business Income Section */}
        <div style={{marginBottom: '20px'}}>
          <div className="basic-input-field">
            <label>Monthly Business Income</label>
            <BlurInput
              field="businessIncome"
              type="number"
              className="basic-field"
              placeholder="0"
            />
            <div className="input-sub-info">
              Annual Business Income: {formatCurrency((parseNumber(financialData.businessIncome) || 0) * 12)}
            </div>
          </div>
        </div>
        
        {/* Other Income Section */}
        <div style={{marginBottom: '20px'}}>
          <h4 style={{color: '#fff', marginBottom: '15px', fontSize: '14px'}}>Other Income</h4>
          <div className="basic-input-field">
            <label>Monthly Other Income</label>
            <BlurInput
              field="otherIncome"
              type="number"
              className="basic-field"
              placeholder="0"
            />
            <div className="input-sub-info">
              Side gigs, freelance, gifts, etc. (Excludes investment returns)
            </div>
          </div>
        </div>
        
        {/* Total Income Display */}
        <div className="table-total-footer income-total-footer">
          Total Annual Gross Income: {formatCurrency(totalIncome)}
        </div>
      </div>
    );
  };
  
  const ExpensesTab = () => {
    const totalExpenses = (financialData.expenses || []).reduce((sum, expense) => 
      sum + parseNumber(expense.amount), 0
    );
    
    return (
      <div className="expenses-section">
        <div className="generic-table-container">
          <table className="generic-table">
            <thead>
              <tr>
                <th>
                  <button className="add-table-btn" onClick={addExpense}>
                    + Add Expense
                  </button>
                </th>
                <th>Category</th>
                <th>Monthly Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(financialData.expenses || []).map((expense) => (
                <tr key={expense.id}>
                  <td></td>
                  <td>
                    <input
                      type="text"
                      value={expense.category}
                      onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                      className="table-input"
                      placeholder="Category name"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => updateExpense(expense.id, 'amount', e.target.value)}
                      className="table-input"
                      placeholder="0"
                    />
                  </td>
                  <td>
                    <button 
                      className="remove-table-btn"
                      onClick={() => removeExpense(expense.id)}
                      title="Remove expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-total-footer expenses-total-footer">
          Total Monthly Expenses: {formatCurrency(totalExpenses)}
        </div>
      </div>
    );
  };

  const RetirementTab = () => {
    // Calculate total retirement savings
    const totalRetirementBalance = () => {
      const current401k = parseNumber(financialData.current401k) || 0;
      const currentRothIRA = parseNumber(financialData.currentRothIRA) || 0;
      const currentTraditionalIRA = parseNumber(financialData.currentTraditionalIRA) || 0;
      const currentPension = parseNumber(financialData.currentPension) || 0;
      return current401k + currentRothIRA + currentTraditionalIRA + currentPension;
    };
    
    // Calculate total annual contributions
    const totalAnnualContributions = () => {
      const totalIncome = calculateTotalIncome();
      const contribution401k = (totalIncome * (parseNumber(financialData.contribution401k) / 100)) || 0;
      const contributionRothIRA = parseNumber(financialData.contributionRothIRA) || 0;
      const contributionTraditionalIRA = parseNumber(financialData.contributionTraditionalIRA) || 0;
      return contribution401k + contributionRothIRA + contributionTraditionalIRA;
    };
    
    // Calculate employer match amount
    const employerMatchAmount = () => {
      const totalIncome = calculateTotalIncome();
      const employerMatch = parseNumber(financialData.employerMatch) || 0;
      const contribution401kPercent = parseNumber(financialData.contribution401k) || 0;
      return Math.min(totalIncome * (employerMatch / 100), totalIncome * (contribution401kPercent / 100));
    };
    
    return (
      <div>
        {/* 401(k) Section */}
        <div style={{marginBottom: '20px'}}>
          <h4 style={{color: '#fff', marginBottom: '15px', fontSize: '14px'}}>401(k) Account</h4>
          
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Current Balance</label>
              <BlurInput
                field="current401k"
                type="number"
                className="basic-field"
                placeholder="0"
              />
            </div>
            <div className="basic-input-field">
              <label>Contribution %</label>
              <BlurInput
                field="contribution401k"
                type="number"
                className="basic-field"
                placeholder="6"
                step="0.1"
              />
              <div className="input-sub-info">
                Annual: {formatCurrency((calculateTotalIncome() * (parseNumber(financialData.contribution401k) / 100)) || 0)}
              </div>
            </div>
          </div>
          
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Expected Return %</label>
              <BlurInput
                field="retirement401kReturn"
                type="number"
                className="basic-field"
                placeholder="7"
                step="0.1"
              />
            </div>
            <div className="basic-input-field">
              <label>Employer Match %</label>
              <BlurInput
                field="employerMatch"
                type="number"
                className="basic-field"
                placeholder="3"
                step="0.1"
              />
              <div className="input-sub-info">
                Annual Match: {formatCurrency(employerMatchAmount())}
              </div>
            </div>
          </div>
        </div>
        
        {/* IRA Accounts Section */}
        <div style={{marginBottom: '20px'}}>
          <h4 style={{color: '#fff', marginBottom: '15px', fontSize: '14px'}}>IRA Accounts</h4>
          
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Roth IRA Balance</label>
              <BlurInput
                field="currentRothIRA"
                type="number"
                className="basic-field"
                placeholder="0"
              />
            </div>
            <div className="basic-input-field">
              <label>Annual Roth Contribution</label>
              <BlurInput
                field="contributionRothIRA"
                type="number"
                className="basic-field"
                placeholder="6500"
              />
              <div className="input-sub-info">
                2024 limit: $7,000 ($8,000 if 50+)
              </div>
            </div>
          </div>
          
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Traditional IRA Balance</label>
              <BlurInput
                field="currentTraditionalIRA"
                type="number"
                className="basic-field"
                placeholder="0"
              />
            </div>
            <div className="basic-input-field">
              <label>Annual Traditional Contribution</label>
              <BlurInput
                field="contributionTraditionalIRA"
                type="number"
                className="basic-field"
                placeholder="0"
              />
              <div className="input-sub-info">
                Same limit as Roth IRA
              </div>
            </div>
          </div>
          
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Roth IRA Return %</label>
              <BlurInput
                field="rothIRAReturn"
                type="number"
                className="basic-field"
                placeholder="7"
                step="0.1"
              />
            </div>
            <div className="basic-input-field">
              <label>Traditional IRA Return %</label>
              <BlurInput
                field="traditionalIRAReturn"
                type="number"
                className="basic-field"
                placeholder="7"
                step="0.1"
              />
            </div>
          </div>
        </div>
        
        {/* Other Retirement Section */}
        <div style={{marginBottom: '20px'}}>
          <h4 style={{color: '#fff', marginBottom: '15px', fontSize: '14px'}}>Other Retirement</h4>
          
          <div className="age-fields-row">
            <div className="basic-input-field">
              <label>Account Type</label>
              <select
                value={financialData.otherRetirementType || 'pension'}
                onChange={(e) => handleInputChange('otherRetirementType', e.target.value)}
                className="basic-field"
              >
                <option value="pension">Pension</option>
                <option value="sep">SEP-IRA</option>
                <option value="simple">SIMPLE IRA</option>
                <option value="solo401k">Solo 401(k)</option>
                <option value="annuity">Annuity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="basic-input-field">
              <label>Current Balance</label>
              <BlurInput
                field="currentPension"
                type="number"
                className="basic-field"
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="basic-input-field">
            <label>Expected Return %</label>
            <BlurInput
              field="pensionReturn"
              type="number"
              className="basic-field"
              placeholder="4"
              step="0.1"
            />
            <div className="input-sub-info">
              Conservative estimate for pension/annuity growth
            </div>
          </div>
        </div>
        
        {/* Total Retirement Display */}
        <div className="table-total-footer income-total-footer">
          Total Retirement Balance: {formatCurrency(totalRetirementBalance())} | Annual Contributions: {formatCurrency(totalAnnualContributions())}
        </div>
      </div>
    );
  };

  const InvestmentsTab = () => (
    <div className="generic-table-container">
      <table className="generic-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance</th>
            <th>% to Account</th>
            <th>Return %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="account-name">Checking</td>
            <td>
              <BlurInput
                field="checkingBalance"
                type="number"
                className="table-input"
                placeholder="5000"
              />
            </td>
            <td>
              <BlurInput
                field="checkingAllocation"
                type="number"
                className="table-input"
                placeholder="60"
              />
            </td>
            <td className="no-return">No Interest</td>
          </tr>
          <tr>
            <td className="account-name">Savings</td>
            <td>
              <BlurInput
                field="savingsBalance"
                type="number"
                className="table-input"
                placeholder="20000"
              />
            </td>
            <td>
              <BlurInput
                field="savingsAllocation"
                type="number"
                className="table-input"
                placeholder="15"
              />
            </td>
            <td>
              <BlurInput
                field="savingsReturn"
                type="number"
                className="table-input"
                placeholder="2.5"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name">Brokerage</td>
            <td>
              <BlurInput
                field="brokerageBalance"
                type="number"
                className="table-input"
                placeholder="15000"
              />
            </td>
            <td>
              <BlurInput
                field="brokerageAllocation"
                type="number"
                className="table-input"
                placeholder="15"
              />
            </td>
            <td>
              <BlurInput
                field="brokerageReturn"
                type="number"
                className="table-input"
                placeholder="7"
                step="0.1"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const AssetsTab = () => (
    <div className="generic-table-container">
      <table className="generic-table">
        <thead>
          <tr>
            <th>Asset Type</th>
            <th>Current Value</th>
            <th>Annual Rate %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="account-name asset-name">Home</td>
            <td>
              <BlurInput
                field="homeValue"
                type="number"
                className="table-input"
                placeholder="400000"
              />
            </td>
            <td>
              <BlurInput
                field="homeAppreciation"
                type="number"
                className="table-input"
                placeholder="3"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name asset-name">Vehicle</td>
            <td>
              <BlurInput
                field="carValue"
                type="number"
                className="table-input"
                placeholder="25000"
              />
            </td>
            <td>
              <BlurInput
                field="carDepreciation"
                type="number"
                className="table-input"
                placeholder="-15"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name asset-name">Other Assets</td>
            <td>
              <BlurInput
                field="otherAssets"
                type="number"
                className="table-input"
                placeholder="10000"
              />
            </td>
            <td>
              <BlurInput
                field="otherAssetsReturn"
                type="number"
                className="table-input"
                placeholder="2"
                step="0.1"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const DebtsTab = () => (
    <div className="generic-table-container">
      <table className="generic-table">
        <thead>
          <tr>
            <th>Debt Type</th>
            <th>Balance</th>
            <th>Interest Rate %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="account-name debt-name">Mortgage</td>
            <td>
              <BlurInput
                field="mortgage"
                type="number"
                className="table-input"
                placeholder="300000"
              />
            </td>
            <td>
              <BlurInput
                field="mortgageRate"
                type="number"
                className="table-input"
                placeholder="6.5"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name debt-name">Auto Loan</td>
            <td>
              <BlurInput
                field="carLoan"
                type="number"
                className="table-input"
                placeholder="15000"
              />
            </td>
            <td>
              <BlurInput
                field="carLoanRate"
                type="number"
                className="table-input"
                placeholder="5.5"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name debt-name">Credit Cards</td>
            <td>
              <BlurInput
                field="creditCards"
                type="number"
                className="table-input"
                placeholder="8000"
              />
            </td>
            <td>
              <BlurInput
                field="creditCardRate"
                type="number"
                className="table-input"
                placeholder="18.5"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name debt-name">Student Loans</td>
            <td>
              <BlurInput
                field="studentLoans"
                type="number"
                className="table-input"
                placeholder="25000"
              />
            </td>
            <td>
              <BlurInput
                field="studentLoanRate"
                type="number"
                className="table-input"
                placeholder="4.5"
                step="0.1"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name debt-name">Other Debt</td>
            <td>
              <BlurInput
                field="otherDebts"
                type="number"
                className="table-input"
                placeholder="2000"
              />
            </td>
            <td>
              <BlurInput
                field="otherDebtsRate"
                type="number"
                className="table-input"
                placeholder="8.0"
                step="0.1"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Category definitions (defined after all tab components)
  const categories = [
    { key: 'basic', title: 'Basic Info', icon: <User size={20} />, component: <BasicInfoTab /> },
    { key: 'income', title: 'Income', icon: <DollarSign size={20} />, component: <IncomeTab /> },
    { key: 'expenses', title: 'Expenses', icon: <Receipt size={20} />, component: <ExpensesTab /> },
    { key: 'retirement', title: 'Retirement', icon: <PiggyBank size={20} />, component: <RetirementTab /> },
    { key: 'liquid', title: 'Liquid Accounts', icon: <TrendingUp size={20} />, component: <InvestmentsTab /> },
    { key: 'assets', title: 'Assets', icon: <Home size={20} />, component: <AssetsTab /> },
    { key: 'debts', title: 'Debts', icon: <CreditCard size={20} />, component: <DebtsTab /> }
  ];

  // Get selected category details
  const selectedCategoryData = categories.find(cat => cat.key === selectedCategory);

  const navigationActions = [];

  return (
    <div className="dashboard-fullscreen">
      <Navigation pageTitle="Financial Dashboard" actions={navigationActions} />
      
      {/* New Layout: 3 sections - inputs left, charts/table right top, metrics right bottom */}
      <div className="dashboard-main-layout">
        {/* Left Side - Icon Sidebar + Input Content */}
        <div className="dashboard-left-panel">
          {/* Icon Sidebar */}
          <div className="category-sidebar">
            <div className="category-icons-group">
              {categories.map((category) => (
                <div
                  key={category.key}
                  className={`category-icon ${selectedCategory === category.key ? 'active' : ''}`}
                  data-category={category.key}
                  onClick={() => selectCategory(category.key)}
                  title={category.title}
                >
                  {category.icon}
                </div>
              ))}
            </div>
            
            {/* CSV Import/Export */}
            <div className="csv-actions">
              <button
                className="csv-btn"
                onClick={handleImport}
                title="Import CSV"
              >
                <Upload size={18} />
              </button>
              <button
                className="csv-btn"
                onClick={handleExport}
                title="Export CSV"
              >
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* Input Content Area */}
          <div className="input-content-area">
            <div className="category-header" data-category={selectedCategory}>
              <h3>{selectedCategoryData?.title}</h3>
            </div>
            <div className="category-content">
              {selectedCategoryData?.component}
            </div>
            
            {/* Action Buttons */}
            <div className="input-actions">
              <button className="action-btn reset-btn" onClick={handleReset} title="Reset to defaults">
                <RefreshCw size={16} />
                Reset
              </button>
              <button className="action-btn calculate-btn" onClick={calculateProjections} title="Recalculate projections">
                <Calculator size={16} />
                Calculate
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Charts/Table and Metrics */}
        <div className="dashboard-right-container">
          {/* Top: Charts/Table Section (3/4 height) */}
          <div className="dashboard-right-panel">

          {!showTable ? (
            /* Multi-Charts View */
            <div className="multi-chart-container">
              {/* Main Chart */}
              <div className="main-chart-container">
                <div className="chart-title">{chartConfigs[focusedChart].title}</div>
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(focusedChart, chartDataSets[focusedChart], chartConfigs[focusedChart], true)}
                </ResponsiveContainer>
              </div>
              
              {/* Small Charts Grid */}
              <div className="small-charts-grid">
                {Object.keys(chartConfigs).filter(key => key !== focusedChart).map(chartKey => (
                  <div 
                    key={chartKey} 
                    className="small-chart-container"
                    onClick={() => setFocusedChart(chartKey)}
                  >
                    <div className="chart-title-small">{chartConfigs[chartKey].title}</div>
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart(chartKey, chartDataSets[chartKey], chartConfigs[chartKey], false)}
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
              
              {/* Controls */}
              <div className="chart-bottom-controls">
                <div className="chart-controls">
                  <div className="timeline-slider">
                    <label>Timeline: {Math.round(timelineMonths/12*10)/10} years</label>
                    <input
                      type="range"
                      min="1"
                      max="360"
                      value={timelineMonths}
                      onChange={(e) => setTimelineMonths(Number(e.target.value))}
                      className="slider"
                      title="Drag to adjust timeline"
                    />
                    <div className="slider-labels">
                      <span>1mo</span>
                      <span>30yr</span>
                    </div>
                  </div>
                  <select 
                    value={projectionYears} 
                    onChange={(e) => {
                      const years = Number(e.target.value);
                      setProjectionYears(years);
                      setTimelineMonths(years * 12);
                    }}
                    className="compact-select"
                    title="Quick timeline presets"
                  >
                    <option value={1}>1 Year</option>
                    <option value={5}>5 Years</option>
                    <option value={10}>10 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                  <button 
                    className="toggle-btn"
                    onClick={() => setShowTable(!showTable)}
                  >
                    {showTable ? <BarChart3 size={16} /> : <Calculator size={16} />}
                    {showTable ? 'Show Chart' : 'Show Table'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="table-container-large">
              <div className="table-controls">
                <div className="table-view-controls">
                  <label>Income View:</label>
                  <select 
                    value={viewPeriod} 
                    onChange={(e) => setViewPeriod(e.target.value)}
                    className="compact-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="chart-controls">
                  <div className="timeline-slider">
                    <label>Timeline: {Math.round(timelineMonths/12*10)/10} years</label>
                    <input
                      type="range"
                      min="1"
                      max="360"
                      value={timelineMonths}
                      onChange={(e) => setTimelineMonths(Number(e.target.value))}
                      className="slider"
                      title="Drag to adjust timeline"
                    />
                    <div className="slider-labels">
                      <span>1mo</span>
                      <span>30yr</span>
                    </div>
                  </div>
                  <select 
                    value={projectionYears} 
                    onChange={(e) => {
                      const years = Number(e.target.value);
                      setProjectionYears(years);
                      setTimelineMonths(years * 12);
                    }}
                    className="compact-select"
                    title="Quick timeline presets"
                  >
                    <option value={1}>1 Year</option>
                    <option value={5}>5 Years</option>
                    <option value={10}>10 Years</option>
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                  <button 
                    className="toggle-btn"
                    onClick={() => setShowTable(!showTable)}
                  >
                    {showTable ? <BarChart3 size={16} /> : <Calculator size={16} />}
                    {showTable ? 'Show Chart' : 'Show Table'}
                  </button>
                </div>
              </div>
              <div className="table-scroll-area">
              <table className="large-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Date</th>
                    <th rowSpan={2}>Age</th>
                    <th rowSpan={2}>Total Income</th>
                    <th colSpan={5}>Liquid Accounts</th>
                    <th colSpan={5}>Retirement Accounts</th>
                    <th colSpan={4}>Assets</th>
                    <th colSpan={6}>Debts</th>
                    <th rowSpan={2}>Net Worth</th>
                  </tr>
                  <tr>
                    <th>Checking</th>
                    <th>Savings</th>
                    <th>Brokerage</th>
                    <th>Total Liquid</th>
                    <th>401k</th>
                    <th>Roth IRA</th>
                    <th>Trad IRA</th>
                    <th>Pension</th>
                    <th>Total Retire</th>
                    <th>Home</th>
                    <th>Car</th>
                    <th>Other</th>
                    <th>Total Assets</th>
                    <th>Mortgage</th>
                    <th>Car Loan</th>
                    <th>Credit</th>
                    <th>Student</th>
                    <th>Other</th>
                    <th>Total Debt</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((row, index) => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const displayDate = viewPeriod === 'monthly' || timelineMonths <= 24 ? 
                      `${monthNames[(row.month % 12)]} '${String(row.year).slice(-2)}` : 
                      `'${String(row.year).slice(-2)}`;
                    
                    return (
                      <tr key={index} className={row.month % 12 === 0 ? 'milestone-row' : ''}>
                        <td>{displayDate}</td>
                        <td>{row.age}</td>
                        <td>{formatCurrency(row.totalIncome)}</td>
                        <td>{formatCurrency(row.checking)}</td>
                        <td>{formatCurrency(row.savings)}</td>
                        <td>{formatCurrency(row.brokerage)}</td>
                        <td className="total-cell">{formatCurrency(row.totalLiquid)}</td>
                        <td>{formatCurrency(row.total401k)}</td>
                        <td>{formatCurrency(row.rothIRA)}</td>
                        <td>{formatCurrency(row.traditionalIRA)}</td>
                        <td>{formatCurrency(row.pension)}</td>
                        <td className="total-cell">{formatCurrency(row.totalRetirement)}</td>
                        <td>{formatCurrency(row.homeValue)}</td>
                        <td>{formatCurrency(row.carValue)}</td>
                        <td>{formatCurrency(row.otherAssets)}</td>
                        <td className="total-cell">{formatCurrency(row.totalAssets)}</td>
                        <td>{formatCurrency(row.mortgage)}</td>
                        <td>{formatCurrency(row.carLoan)}</td>
                        <td>{formatCurrency(row.creditCards)}</td>
                        <td>{formatCurrency(row.studentLoans)}</td>
                        <td>{formatCurrency(row.otherDebts)}</td>
                        <td className="total-cell debt-total">{formatCurrency(row.totalDebts)}</td>
                        <td className="net-worth-cell">{formatCurrency(row.netWorth)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
          </div>

          {/* Bottom: Financial Analysis Section (1/4 height) */}
          <div className="dashboard-metrics-section">
            <div className="analysis-grid">
              {/* Net Worth Progress */}
              <div className="analysis-card">
                <div className="analysis-header">
                  <span className="analysis-label">Net Worth</span>
                  <span className={`analysis-value ${summaryMetrics.currentNetWorth >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(summaryMetrics.currentNetWorth || 0)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill positive" 
                    style={{ width: `${Math.min(100, Math.max(0, (summaryMetrics.currentNetWorth || 0) / 1000000 * 100))}%` }}
                  ></div>
                </div>
                <div className="progress-label">Goal: $1M</div>
              </div>

              {/* Debt-to-Income Ratio */}
              <div className="analysis-card">
                <div className="analysis-header">
                  <span className="analysis-label">Debt-to-Income</span>
                  <span className={`analysis-value ${(summaryMetrics.debtToIncomeRatio || 0) > 36 ? 'negative' : (summaryMetrics.debtToIncomeRatio || 0) > 28 ? 'warning' : 'positive'}`}>
                    {formatPercent(summaryMetrics.debtToIncomeRatio || 0)}
                  </span>
                </div>
                <div className="gauge-container">
                  <div className="gauge">
                    <div className="gauge-fill" style={{ 
                      transform: `rotate(${Math.min(180, (summaryMetrics.debtToIncomeRatio || 0) * 3.6)}deg)`
                    }}></div>
                  </div>
                  <div className="gauge-labels">
                    <span>Good (&lt;28%)</span>
                    <span>High (&gt;36%)</span>
                  </div>
                </div>
              </div>

              {/* Savings Rate */}
              <div className="analysis-card">
                <div className="analysis-header">
                  <span className="analysis-label">Savings Rate</span>
                  <span className={`analysis-value ${(summaryMetrics.savingsRate || 0) >= 20 ? 'positive' : (summaryMetrics.savingsRate || 0) >= 10 ? 'warning' : 'negative'}`}>
                    {formatPercent(summaryMetrics.savingsRate || 0)}
                  </span>
                </div>
                <div className="bar-chart-mini">
                  <div className="bar-item">
                    <div className="bar-fill" style={{ height: `${Math.min(100, (summaryMetrics.savingsRate || 0) * 5)}%` }}></div>
                    <span className="bar-label">Current</span>
                  </div>
                  <div className="bar-item">
                    <div className="bar-fill target" style={{ height: '100%' }}></div>
                    <span className="bar-label">Target (20%)</span>
                  </div>
                </div>
              </div>

              {/* Monthly Cash Flow */}
              <div className="analysis-card">
                <div className="analysis-header">
                  <span className="analysis-label">Monthly Cash Flow</span>
                  <span className={`analysis-value ${(summaryMetrics.monthlyCashFlow || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(summaryMetrics.monthlyCashFlow || 0)}
                  </span>
                </div>
                <div className="flow-indicator">
                  <div className="flow-bar">
                    <div className="flow-income" style={{ width: '60%' }}>Income</div>
                    <div className="flow-expenses" style={{ width: '40%' }}>Expenses</div>
                  </div>
                  <div className="flow-labels">
                    <span>Income: {formatCurrency(summaryMetrics.monthlyIncome || 0)}</span>
                    <span>Expenses: {formatCurrency(summaryMetrics.monthlyExpenses || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;