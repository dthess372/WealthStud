import { useState, useEffect, useCallback } from 'react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  BarChart3, 
  Calculator,
  Download,
  RefreshCw
} from 'lucide-react';
import Navigation from '../shared/Navigation';
import { formatCurrency, formatPercent, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { calculateAllTaxes, getAllStates } from '../../lib/taxes';
import { useLocalStorage, useCSV } from '../../hooks';
import './FinancialDashboard.css';
import '../../styles/shared-inputs.css';
import '../../styles/shared-page-styles.css';

const FinancialDashboard = () => {
  const [viewPeriod, setViewPeriod] = useState('monthly'); // daily, weekly, monthly, yearly
  const [showTable, setShowTable] = useState(false); // Toggle between chart and table
  const [projectionYears, setProjectionYears] = useState(10);
  const [timelineMonths, setTimelineMonths] = useState(12); // For slider: 1-360 months
  const [focusedChart, setFocusedChart] = useState('overview'); // Which chart is currently the main focus
  

  // Use localStorage for data persistence
  const [financialData, setFinancialData] = useLocalStorage(STORAGE_KEYS.FINANCIAL_DASHBOARD, {
    // Basic Info
    salary: 100000,
    age: 30,
    retirementAge: 67,
    filingStatus: 'single',
    selectedState: 'MI',
    payFrequency: 'biweekly', // weekly, biweekly, semimonthly, monthly
    nextPayDate: new Date().toISOString().split('T')[0],
    monthlyExpenses: 4500,
    
    // Account Balances
    checkingBalance: 5000,
    savingsBalance: 20000,
    brokerageBalance: 15000,
    cryptoBalance: 5000,
    
    // Retirement Account Balances
    current401k: 50000,
    currentRothIRA: 25000,
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
    cryptoAllocation: 5, // % of paycheck to crypto
    emergencyFundAllocation: 5, // % of paycheck to emergency fund
    
    // Retirement Contributions
    contribution401k: 6, // % of salary
    contributionRothIRA: 6000, // annual amount
    contributionTraditionalIRA: 0, // annual amount
    employerMatch: 3, // % of salary
    
    // Investment Returns (annual %)
    savingsReturn: 2.5, // High-yield savings rate
    brokerageReturn: 7, // Stock market average
    cryptoReturn: 15, // Volatile crypto estimate
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

  // Calculate tax rate based on income and location
  const calculateTaxRate = useCallback(() => {
    try {
      const taxInfo = calculateAllTaxes(
        financialData.salary,
        financialData.filingStatus,
        financialData.selectedState,
        0, // 401k contribution (pre-tax)
        0  // IRA contribution
      );
      return (taxInfo.totalTaxes / financialData.salary) * 100;
    } catch (error) {
      return 25; // fallback to 25%
    }
  }, [financialData.salary, financialData.filingStatus, financialData.selectedState]);

  // Render chart based on type and configuration
  const renderChart = (chartKey, data, config, isMainChart) => {
    if (!data || !config) {
      return null;
    }
    
    const commonProps = {
      data: data || [],
      margin: { top: 20, right: 30, left: 20, bottom: isMainChart ? 80 : 40 }
    };

    const xAxisProps = {
      dataKey: timelineMonths <= 24 ? 'month' : 'year',
      stroke: '#999',
      fontSize: isMainChart ? 12 : 10,
      tickFormatter: (value) => {
        if (timelineMonths <= 24) {
          const year = Math.floor(value / 12) + new Date().getFullYear();
          const month = (value % 12) + 1;
          return `${year}-${String(month).padStart(2, '0')}`;
        }
        return value;
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

  const calculateProjections = () => {
    const data = [];
    const year = new Date().getFullYear();
    
    // Calculate timeline in months instead of years
    const totalMonths = Math.max(timelineMonths, projectionYears * 12);
    
    // Parse all numeric values at calculation time
    const parsedData = {
      age: parseNumber(financialData.age),
      salary: parseNumber(financialData.salary),
      monthlyExpenses: parseNumber(financialData.monthlyExpenses),
      
      // Account Balances
      checkingBalance: parseNumber(financialData.checkingBalance),
      savingsBalance: parseNumber(financialData.savingsBalance),
      brokerageBalance: parseNumber(financialData.brokerageBalance),
      cryptoBalance: parseNumber(financialData.cryptoBalance),
      
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
      cryptoAllocation: parseNumber(financialData.cryptoAllocation),
      
      // Retirement Contributions
      contribution401k: parseNumber(financialData.contribution401k),
      contributionRothIRA: parseNumber(financialData.contributionRothIRA),
      contributionTraditionalIRA: parseNumber(financialData.contributionTraditionalIRA),
      employerMatch: parseNumber(financialData.employerMatch),
      
      // Returns (convert annual to monthly)
      savingsReturn: parseNumber(financialData.savingsReturn) / 12 / 100,
      brokerageReturn: parseNumber(financialData.brokerageReturn) / 12 / 100,
      cryptoReturn: parseNumber(financialData.cryptoReturn) / 12 / 100,
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
    let salary = parsedData.salary;
    const effectiveTaxRate = calculateTaxRate();
    
    // Calculate monthly income based on pay frequency
    const getMonthlyIncome = () => {
      const payFrequency = financialData.payFrequency;
      switch (payFrequency) {
        case 'weekly': return salary / 52 * 4.33;
        case 'biweekly': return salary / 26 * 2.17;
        case 'semimonthly': return salary / 24 * 2;
        case 'monthly': return salary / 12;
        default: return salary / 26 * 2.17; // Default to biweekly
      }
    };
    
    let monthlyIncome = getMonthlyIncome();
    let netMonthlyIncome = monthlyIncome * (1 - effectiveTaxRate / 100);
    
    // Initial account balances
    let checking = parsedData.checkingBalance;
    let savings = parsedData.savingsBalance;
    let brokerage = parsedData.brokerageBalance;
    let crypto = parsedData.cryptoBalance;
    
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
        crypto: netMonthlyIncome * (parsedData.cryptoAllocation / 100)
      };
      
      // Monthly retirement contributions
      const monthly401k = (salary * (parsedData.contribution401k / 100)) / 12;
      const monthlyEmployerMatch = Math.min(monthly401k, (salary * (parsedData.employerMatch / 100)) / 12);
      const monthlyRothIRA = parsedData.contributionRothIRA / 12;
      const monthlyTraditionalIRA = parsedData.contributionTraditionalIRA / 12;
      
      // Add monthly contributions
      checking += monthlyContributions.checking;
      savings += monthlyContributions.savings;
      brokerage += monthlyContributions.brokerage;
      crypto += monthlyContributions.crypto;
      
      // Deduct monthly expenses from checking
      checking -= parsedData.monthlyExpenses;
      
      // If checking goes negative, transfer from savings
      if (checking < 0) {
        const deficit = Math.abs(checking);
        savings = Math.max(0, savings - deficit);
        checking = Math.max(0, checking);
      }
      
      // Apply monthly investment growth (checking earns no interest)
      savings += savings * parsedData.savingsReturn;
      brokerage += brokerage * parsedData.brokerageReturn;
      crypto += crypto * parsedData.cryptoReturn;
      
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
      const totalLiquid = checking + savings + brokerage + crypto;
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
          salary: Math.round(salary),
          checking: Math.round(checking),
          savings: Math.round(savings),
          brokerage: Math.round(brokerage),
          crypto: Math.round(crypto),
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
      
      // Annual salary increase (every 12 months)
      if (month > 0 && month % 12 === 0) {
        salary *= 1.03; // 3% annual increase
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
      monthlyIncome: Math.round(current.salary / 12),
      monthlyExpenses: parsedData.monthlyExpenses,
      monthlyCashFlow: Math.round(current.salary / 12) - parsedData.monthlyExpenses,
      dailyIncome: Math.round(current.salary / 365),
      weeklyIncome: Math.round(current.salary / 52),
      effectiveTaxRate: effectiveTaxRate,
      debtToIncomeRatio: (current.totalDebts / current.salary) * 100,
      savingsRate: ((parsedData.savingsAllocation + parsedData.brokerageAllocation + parsedData.cryptoAllocation + parsedData.contribution401k) / 100) * 100
    });
  };

  const handleInputChange = (field, value) => {
    // Store all values as-is, no parsing until calculation
    setFinancialData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  const handleExport = () => {
    const exportData = {
      financialData,
      projections,
      summaryMetrics,
      projectionYears
    };
    exportCSV([exportData], 'financial-dashboard');
  };

  const handleReset = () => {
    setFinancialData({
      salary: 100000,
      age: 30,
      retirementAge: 67,
      filingStatus: 'single',
      selectedState: 'MI',
      payFrequency: 'biweekly',
      nextPayDate: new Date().toISOString().split('T')[0],
      monthlyExpenses: 4500,
      
      checkingBalance: 5000,
      savingsBalance: 20000,
      brokerageBalance: 15000,
      cryptoBalance: 5000,
      
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
      cryptoAllocation: 5,
      emergencyFundAllocation: 5,
      
      contribution401k: 6,
      contributionRothIRA: 6000,
      contributionTraditionalIRA: 0,
      employerMatch: 3,
      
      savingsReturn: 2.5,
      brokerageReturn: 7,
      cryptoReturn: 15,
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
  const { exportCSV } = useCSV('financial-dashboard');

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

  // Chart data preparation - organized by category
  const chartDataSets = {
    overview: projections.map(item => ({
      month: item.month,
      year: item.year,
      'Total Assets': item.totalAssets || 0,
      'Net Worth': item.netWorth || 0,
      'Total Debts': item.totalDebts || 0
    })),
    liquid: projections.map(item => ({
      month: item.month,
      year: item.year,
      'Checking': item.checking || 0,
      'Savings': item.savings || 0,
      'Brokerage': item.brokerage || 0,
      'Crypto': item.crypto || 0
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
  };

  // Chart configurations
  const chartConfigs = {
    overview: {
      title: 'Net Worth Overview',
      type: 'area',
      colors: { 'Total Assets': '#3b82f6', 'Net Worth': '#22c55e', 'Total Debts': '#ef4444' }
    },
    liquid: {
      title: 'Liquid Accounts',
      type: 'line',
      colors: { 'Checking': '#06b6d4', 'Savings': '#10b981', 'Brokerage': '#3b82f6', 'Crypto': '#f59e0b' }
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
  }, [projectionYears, timelineMonths]); // Recalculate when timeline changes
  
  // Run initial calculation
  useEffect(() => {
    calculateProjections();
  }, []);

  // Tab content components
  const BasicInfoTab = () => (
    <div className="optimized-input-grid">
      <div className="input-row">
        <div className="input-mini">
          <label>Annual Salary</label>
          <BlurInput
            field="salary"
            type="number"
            className="mini-field"
            placeholder="100000"
          />
        </div>
        <div className="input-mini">
          <label>Current Age</label>
          <BlurInput
            field="age"
            type="number"
            className="mini-field"
            placeholder="30"
          />
        </div>
        <div className="input-mini">
          <label>Retirement Age</label>
          <BlurInput
            field="retirementAge"
            type="number"
            className="mini-field"
            placeholder="67"
          />
        </div>
      </div>
      <div className="input-row">
        <div className="input-mini wide">
          <label>Filing Status</label>
          <select
            value={financialData.filingStatus}
            onChange={(e) => handleInputChange('filingStatus', e.target.value)}
            className="mini-field"
          >
            <option value="single">Single</option>
            <option value="marriedFilingJointly">Married Joint</option>
            <option value="marriedFilingSeparately">Married Separate</option>
            <option value="headOfHousehold">Head of Household</option>
          </select>
        </div>
        <div className="input-mini">
          <label>State</label>
          <select
            value={financialData.selectedState}
            onChange={(e) => handleInputChange('selectedState', e.target.value)}
            className="mini-field"
          >
            {getAllStates().map(state => (
              <option key={state.code} value={state.code}>{state.code}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="input-row">
        <div className="input-mini">
          <label>How Often Paid</label>
          <select
            value={financialData.payFrequency}
            onChange={(e) => handleInputChange('payFrequency', e.target.value)}
            className="mini-field"
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 Weeks</option>
            <option value="semimonthly">Twice Monthly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="input-mini">
          <label>Next Payday</label>
          <input
            type="date"
            value={financialData.nextPayDate}
            onChange={(e) => handleInputChange('nextPayDate', e.target.value)}
            className="mini-field"
          />
        </div>
        <div className="input-mini">
          <label>Monthly Expenses</label>
          <BlurInput
            field="monthlyExpenses"
            type="number"
            className="mini-field"
            placeholder="4500"
          />
        </div>
      </div>
    </div>
  );

  const RetirementTab = () => (
    <div className="investments-table-container">
      <table className="investments-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance</th>
            <th>Annual Contribution</th>
            <th>Return %</th>
            <th>Employer Match %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="account-name retirement-name">401(k)</td>
            <td>
              <BlurInput
                field="current401k"
                type="number"
                className="table-input"
                placeholder="0"
              />
            </td>
            <td>
              <BlurInput
                field="contribution401k"
                type="number"
                className="table-input"
                placeholder="6"
              />
            </td>
            <td>
              <BlurInput
                field="retirement401kReturn"
                type="number"
                className="table-input"
                placeholder="7"
                step="0.1"
              />
            </td>
            <td>
              <BlurInput
                field="employerMatch"
                type="number"
                className="table-input"
                placeholder="3"
              />
            </td>
          </tr>
          <tr>
            <td className="account-name retirement-name">Roth IRA</td>
            <td>
              <BlurInput
                field="currentRothIRA"
                type="number"
                className="table-input"
                placeholder="0"
              />
            </td>
            <td>
              <BlurInput
                field="contributionRothIRA"
                type="number"
                className="table-input"
                placeholder="6000"
              />
            </td>
            <td>
              <BlurInput
                field="rothIRAReturn"
                type="number"
                className="table-input"
                placeholder="7"
                step="0.1"
              />
            </td>
            <td className="no-return">N/A</td>
          </tr>
          <tr>
            <td className="account-name retirement-name">Trad IRA</td>
            <td>
              <BlurInput
                field="currentTraditionalIRA"
                type="number"
                className="table-input"
                placeholder="0"
              />
            </td>
            <td>
              <BlurInput
                field="contributionTraditionalIRA"
                type="number"
                className="table-input"
                placeholder="0"
              />
            </td>
            <td>
              <BlurInput
                field="traditionalIRAReturn"
                type="number"
                className="table-input"
                placeholder="7"
                step="0.1"
              />
            </td>
            <td className="no-return">N/A</td>
          </tr>
          <tr>
            <td className="account-name retirement-name">
              <select
                value={financialData.otherRetirementType || 'pension'}
                onChange={(e) => handleInputChange('otherRetirementType', e.target.value)}
                className="table-select"
              >
                <option value="pension">Pension</option>
                <option value="sep">SEP-IRA</option>
                <option value="simple">SIMPLE IRA</option>
                <option value="solo401k">Solo 401(k)</option>
                <option value="annuity">Annuity</option>
                <option value="other">Other</option>
              </select>
            </td>
            <td>
              <BlurInput
                field="currentPension"
                type="number"
                className="table-input"
                placeholder="0"
              />
            </td>
            <td className="no-return">Manual</td>
            <td>
              <BlurInput
                field="pensionReturn"
                type="number"
                className="table-input"
                placeholder="4"
                step="0.1"
              />
            </td>
            <td className="no-return">N/A</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const InvestmentsTab = () => (
    <div className="investments-table-container">
      <table className="investments-table">
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
          <tr>
            <td className="account-name">Crypto</td>
            <td>
              <BlurInput
                field="cryptoBalance"
                type="number"
                className="table-input"
                placeholder="5000"
              />
            </td>
            <td>
              <BlurInput
                field="cryptoAllocation"
                type="number"
                className="table-input"
                placeholder="5"
              />
            </td>
            <td>
              <BlurInput
                field="cryptoReturn"
                type="number"
                className="table-input"
                placeholder="15"
                step="0.1"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const AssetsTab = () => (
    <div className="investments-table-container">
      <table className="investments-table">
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
    <div className="investments-table-container">
      <table className="investments-table">
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

  const navigationActions = [
    {
      label: "Export CSV",
      icon: <Download size={16} />,
      onClick: handleExport,
      variant: "btn-ghost"
    }
  ];

  return (
    <div className="dashboard-fullscreen">
      <Navigation pageTitle="Financial Dashboard" actions={navigationActions} />
      
      {/* New Layout: 3 sections - inputs left, charts/table right top, metrics right bottom */}
      <div className="dashboard-main-layout">
        {/* Left Side - Input Sections Only */}
        <div className="dashboard-left-panel">

          {/* Input Sections in Optimized Grid */}
          <div className="input-sections-optimized">
            {/* Basic Info Section */}
            <div className="input-section-compact">
              <h3 className="section-header-mini">Basic Info</h3>
              <BasicInfoTab />
            </div>
            
            {/* Retirement Section */}
            <div className="input-section-compact">
              <h3 className="section-header-mini">Retirement</h3>
              <RetirementTab />
            </div>
            
            {/* Investments Section */}
            <div className="input-section-compact">
              <h3 className="section-header-mini">Liquid Accounts</h3>
              <InvestmentsTab />
            </div>
            
            {/* Assets Section */}
            <div className="input-section-compact">
              <h3 className="section-header-mini">Assets</h3>
              <AssetsTab />
            </div>
            
            {/* Debts Section */}
            <div className="input-section-compact">
              <h3 className="section-header-mini">Debts</h3>
              <DebtsTab />
            </div>
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
                    <th rowSpan={2}>Salary</th>
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
                    <th>Crypto</th>
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
                    const displayDate = viewPeriod === 'monthly' || timelineMonths <= 24 ? 
                      `${row.year}-${String(((row.month % 12) + 1)).padStart(2, '0')}` : 
                      row.year;
                    
                    return (
                      <tr key={index} className={row.month % 12 === 0 ? 'milestone-row' : ''}>
                        <td>{displayDate}</td>
                        <td>{row.age}</td>
                        <td>{formatCurrency(row.salary)}</td>
                        <td>{formatCurrency(row.checking)}</td>
                        <td>{formatCurrency(row.savings)}</td>
                        <td>{formatCurrency(row.brokerage)}</td>
                        <td>{formatCurrency(row.crypto)}</td>
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