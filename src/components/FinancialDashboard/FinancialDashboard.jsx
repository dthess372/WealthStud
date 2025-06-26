import { useState, useEffect, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, BarChart3, 
  Calculator, Shield, Home, Briefcase,
  Download, Settings,
  Eye, EyeOff, RefreshCw
} from 'lucide-react';
import Navigation from '../shared/Navigation';
import SuggestionBox from '../SuggestionBox/SuggestionBox';
import { formatCurrency, formatPercent, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';
import './FinancialDashboard.css';
import '../../styles/shared-inputs.css';
import '../../styles/shared-page-styles.css';

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [showDetails, setShowDetails] = useState(true);
  const [projectionYears, setProjectionYears] = useState(10);

  // Use localStorage for data persistence
  const [financialData, setFinancialData] = useLocalStorage(STORAGE_KEYS.FINANCIAL_DASHBOARD, {
    // Basic Info
    salary: 100000,
    age: 30,
    retirementAge: 67,
    taxRate: 25,
    
    // 401k
    current401k: 50000,
    contribution401k: 6,
    employerMatch: 3,
    
    // Other Retirement
    currentRothIRA: 25000,
    contributionRothIRA: 6000,
    currentPension: 0,
    
    // Savings & Investments
    savings: 20000,
    brokerage: 15000,
    crypto: 5000,
    otherInvestments: 0,
    
    // Assets
    homeValue: 400000,
    homeEquity: 100000,
    carValue: 25000,
    otherAssets: 10000,
    
    // Debts
    mortgage: 300000,
    carLoan: 15000,
    creditCards: 8000,
    studentLoans: 25000,
    otherDebts: 2000,
    
    // Monthly Expenses
    monthlyExpenses: 4500,
    
    // Allocation percentages
    savingsAllocation: 20, // % of paycheck to savings
    brokerageAllocation: 10, // % of paycheck to brokerage
    cryptoAllocation: 5, // % of paycheck to crypto
    
    // Returns
    stockReturn: 7,
    bondReturn: 4,
    cryptoReturn: 15,
    realEstateReturn: 3
  });

  // Calculate projections
  const [projections, setProjections] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({});

  const calculateProjections = useCallback(() => {
    const data = [];
    const year = new Date().getFullYear();
    let currentAge = financialData.age;
    let salary = financialData.salary;
    
    // Initial balances
    let savings = financialData.savings;
    let brokerage = financialData.brokerage;
    let crypto = financialData.crypto;
    let retirement401k = financialData.current401k;
    let rothIRA = financialData.currentRothIRA;
    let homeValue = financialData.homeValue;
    
    // Debts
    let mortgage = financialData.mortgage;
    let carLoan = financialData.carLoan;
    let creditCards = financialData.creditCards;
    let studentLoans = financialData.studentLoans;
    
    for (let i = 0; i <= projectionYears; i++) {
      // Annual contributions
      const annual401k = salary * (financialData.contribution401k / 100);
      const employerMatch = Math.min(annual401k, salary * (financialData.employerMatch / 100));
      const annualSavings = salary * (financialData.savingsAllocation / 100);
      const annualBrokerage = salary * (financialData.brokerageAllocation / 100);
      const annualCrypto = salary * (financialData.cryptoAllocation / 100);
      
      // Investment growth
      savings += annualSavings + (savings * (financialData.bondReturn / 100));
      brokerage += annualBrokerage + (brokerage * (financialData.stockReturn / 100));
      crypto += annualCrypto + (crypto * (financialData.cryptoReturn / 100));
      retirement401k += (annual401k + employerMatch) + (retirement401k * (financialData.stockReturn / 100));
      rothIRA += financialData.contributionRothIRA + (rothIRA * (financialData.stockReturn / 100));
      homeValue += homeValue * (financialData.realEstateReturn / 100);
      
      // Debt reduction (simplified)
      if (mortgage > 0) mortgage = Math.max(0, mortgage - (salary * 0.15)); // Assuming 15% goes to mortgage
      if (carLoan > 0) carLoan = Math.max(0, carLoan - 5000); // $5k/year
      if (creditCards > 0) creditCards = Math.max(0, creditCards - 2000); // $2k/year
      if (studentLoans > 0) studentLoans = Math.max(0, studentLoans - 3000); // $3k/year
      
      const totalAssets = savings + brokerage + crypto + retirement401k + rothIRA + homeValue + financialData.carValue + financialData.otherAssets;
      const totalDebts = mortgage + carLoan + creditCards + studentLoans + financialData.otherDebts;
      const netWorth = totalAssets - totalDebts;
      
      data.push({
        year: year + i,
        age: currentAge + i,
        salary: Math.round(salary),
        savings: Math.round(savings),
        checking: Math.round(savings * 0.1), // Assume 10% in checking
        brokerage: Math.round(brokerage),
        crypto: Math.round(crypto),
        total401k: Math.round(retirement401k),
        rothIRA: Math.round(rothIRA),
        esop: Math.round(financialData.otherInvestments),
        assets: Math.round(totalAssets),
        mortgage: Math.round(mortgage),
        carLoan: Math.round(carLoan),
        creditCards: Math.round(creditCards),
        studentLoans: Math.round(studentLoans),
        totalDebts: Math.round(totalDebts),
        netWorth: Math.round(netWorth),
        totalMoney: Math.round(savings + brokerage + crypto),
        totalRetirement: Math.round(retirement401k + rothIRA)
      });
      
      // Salary growth
      salary *= 1.03; // 3% annual increase
      currentAge++;
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
      monthlyExpenses: financialData.monthlyExpenses,
      monthlyCashFlow: Math.round(current.salary / 12) - financialData.monthlyExpenses,
      debtToIncomeRatio: (current.totalDebts / current.salary) * 100,
      savingsRate: ((financialData.savingsAllocation + financialData.brokerageAllocation + financialData.cryptoAllocation + financialData.contribution401k) / 100) * 100
    });
  }, [financialData, projectionYears]);

  const handleInputChange = (field, value) => {
    setFinancialData(prev => ({
      ...prev,
      [field]: parseNumber(value)
    }));
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
      taxRate: 25,
      current401k: 50000,
      contribution401k: 6,
      employerMatch: 3,
      currentRothIRA: 25000,
      contributionRothIRA: 6000,
      currentPension: 0,
      savings: 20000,
      brokerage: 15000,
      crypto: 5000,
      otherInvestments: 0,
      homeValue: 400000,
      homeEquity: 100000,
      carValue: 25000,
      otherAssets: 10000,
      mortgage: 300000,
      carLoan: 15000,
      creditCards: 8000,
      studentLoans: 25000,
      otherDebts: 2000,
      monthlyExpenses: 4500,
      savingsAllocation: 20,
      brokerageAllocation: 10,
      cryptoAllocation: 5,
      stockReturn: 7,
      bondReturn: 4,
      cryptoReturn: 15,
      realEstateReturn: 3
    });
  };

  // CSV functionality
  const { exportCSV } = useCSV('financial-dashboard');

  // Chart data preparation
  const chartData = projections.map(item => ({
    year: item.year,
    'Total Assets': item.assets,
    'Net Worth': item.netWorth,
    'Liquid Money': item.totalMoney,
    'Retirement': item.totalRetirement,
    'Debts': -item.totalDebts
  }));

  useEffect(() => {
    calculateProjections();
  }, [financialData, projectionYears, calculateProjections]);

  // Tab content components
  const BasicInfoTab = () => (
    <div className="input-grid compact">
      <div className="input-group">
        <label>Annual Salary</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.salary}
            onChange={(e) => handleInputChange('salary', e.target.value)}
            className="input-field with-prefix width-lg"
          />
        </div>
      </div>
      <div className="input-group">
        <label>Current Age</label>
        <input
          type="number"
          value={financialData.age}
          onChange={(e) => handleInputChange('age', e.target.value)}
          className="input-field no-prefix width-sm number"
        />
      </div>
      <div className="input-group">
        <label>Retirement Age</label>
        <input
          type="number"
          value={financialData.retirementAge}
          onChange={(e) => handleInputChange('retirementAge', e.target.value)}
          className="input-field no-prefix width-sm number"
        />
      </div>
      <div className="input-group">
        <label>Tax Rate (%)</label>
        <div className="input-wrapper">
          <input
            type="number"
            value={financialData.taxRate}
            onChange={(e) => handleInputChange('taxRate', e.target.value)}
            className="input-field with-suffix width-sm"
          />
          <span className="input-suffix">%</span>
        </div>
      </div>
      <div className="input-group">
        <label>Monthly Expenses</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.monthlyExpenses}
            onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
            className="input-field with-prefix width-lg"
          />
        </div>
      </div>
    </div>
  );

  const RetirementTab = () => (
    <div className="input-grid compact">
      <div className="input-group">
        <label>Current 401(k) Balance</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.current401k}
            onChange={(e) => handleInputChange('current401k', e.target.value)}
            className="input-field with-prefix width-lg"
          />
        </div>
      </div>
      <div className="input-group">
        <label>401(k) Contribution (%)</label>
        <div className="input-wrapper">
          <input
            type="number"
            value={financialData.contribution401k}
            onChange={(e) => handleInputChange('contribution401k', e.target.value)}
            className="input-field with-suffix width-sm"
          />
          <span className="input-suffix">%</span>
        </div>
      </div>
      <div className="input-group">
        <label>Employer Match (%)</label>
        <div className="input-wrapper">
          <input
            type="number"
            value={financialData.employerMatch}
            onChange={(e) => handleInputChange('employerMatch', e.target.value)}
            className="input-field with-suffix width-sm"
          />
          <span className="input-suffix">%</span>
        </div>
      </div>
      <div className="input-group">
        <label>Current Roth IRA</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.currentRothIRA}
            onChange={(e) => handleInputChange('currentRothIRA', e.target.value)}
            className="input-field with-prefix width-lg"
          />
        </div>
      </div>
      <div className="input-group">
        <label>Annual Roth IRA Contribution</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.contributionRothIRA}
            onChange={(e) => handleInputChange('contributionRothIRA', e.target.value)}
            className="input-field with-prefix width-md"
          />
        </div>
      </div>
    </div>
  );

  const InvestmentsTab = () => (
    <div className="input-grid">
      <div className="input-group">
        <label>Current Savings</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.savings}
            onChange={(e) => handleInputChange('savings', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <div className="input-group">
        <label>Savings Allocation (%)</label>
        <input
          type="number"
          value={financialData.savingsAllocation}
          onChange={(e) => handleInputChange('savingsAllocation', e.target.value)}
          className="input-field no-prefix"
        />
      </div>
      <div className="input-group">
        <label>Current Brokerage</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.brokerage}
            onChange={(e) => handleInputChange('brokerage', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <div className="input-group">
        <label>Brokerage Allocation (%)</label>
        <input
          type="number"
          value={financialData.brokerageAllocation}
          onChange={(e) => handleInputChange('brokerageAllocation', e.target.value)}
          className="input-field no-prefix"
        />
      </div>
      <div className="input-group">
        <label>Current Crypto</label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="number"
            value={financialData.crypto}
            onChange={(e) => handleInputChange('crypto', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
      <div className="input-group">
        <label>Crypto Allocation (%)</label>
        <input
          type="number"
          value={financialData.cryptoAllocation}
          onChange={(e) => handleInputChange('cryptoAllocation', e.target.value)}
          className="input-field no-prefix"
        />
      </div>
    </div>
  );

  const AssetsDebtsTab = () => (
    <div className="input-grid">
      <div className="input-section">
        <h4 style={{ color: '#22c55e', marginBottom: '1rem' }}>Assets</h4>
        <div className="input-group">
          <label>Home Value</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.homeValue}
              onChange={(e) => handleInputChange('homeValue', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="input-group">
          <label>Car Value</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.carValue}
              onChange={(e) => handleInputChange('carValue', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="input-group">
          <label>Other Assets</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.otherAssets}
              onChange={(e) => handleInputChange('otherAssets', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>
      
      <div className="input-section">
        <h4 style={{ color: '#ef4444', marginBottom: '1rem' }}>Debts</h4>
        <div className="input-group">
          <label>Mortgage Balance</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.mortgage}
              onChange={(e) => handleInputChange('mortgage', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="input-group">
          <label>Car Loan</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.carLoan}
              onChange={(e) => handleInputChange('carLoan', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="input-group">
          <label>Credit Cards</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.creditCards}
              onChange={(e) => handleInputChange('creditCards', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="input-group">
          <label>Student Loans</label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              value={financialData.studentLoans}
              onChange={(e) => handleInputChange('studentLoans', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <Navigation />
      
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Complete Financial Dashboard</h1>
          <p className="page-subtitle">Your comprehensive financial command center</p>
        </div>
      </div>

      {/* Overview Section */}
      <div className="page-intro-section">
        <h2 className="intro-title">Unified Financial Planning & Analysis</h2>
        <p>
          Monitor all aspects of your financial life in one place. Track assets, debts, investments, and retirement planning with real-time projections.
        </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Input your complete financial picture</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>View real-time projections and analytics</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Track progress toward financial goals</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Optimize your financial strategy</span>
          </div>
        </div>
        <p className="intro-note">
          📊 Real-time calculations • 🎯 Goal tracking • 📈 Multi-year projections • 💡 Smart recommendations
        </p>
      </div>

      <div className="page-content">
        {/* Summary Dashboard */}
        <div className="summary-grid">
          <div className={`dashboard-card ${summaryMetrics.currentNetWorth >= 0 ? 'positive' : 'negative'}`}>
            <div className="dashboard-value">{formatCurrency(summaryMetrics.currentNetWorth || 0)}</div>
            <div className="dashboard-label">Current Net Worth</div>
          </div>
          <div className="dashboard-card positive">
            <div className="dashboard-value">{formatCurrency(summaryMetrics.projectedNetWorth || 0)}</div>
            <div className="dashboard-label">Projected Net Worth ({projectionYears}Y)</div>
          </div>
          <div className={`dashboard-card ${summaryMetrics.monthlyCashFlow >= 0 ? 'positive' : 'negative'}`}>
            <div className="dashboard-value">{formatCurrency(summaryMetrics.monthlyCashFlow || 0)}</div>
            <div className="dashboard-label">Monthly Cash Flow</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">{formatPercent(summaryMetrics.savingsRate || 0)}</div>
            <div className="dashboard-label">Total Savings Rate</div>
          </div>
          <div className={`dashboard-card ${summaryMetrics.debtToIncomeRatio < 30 ? 'positive' : summaryMetrics.debtToIncomeRatio < 50 ? 'warning' : 'negative'}`}>
            <div className="dashboard-value">{formatPercent(summaryMetrics.debtToIncomeRatio || 0)}</div>
            <div className="dashboard-label">Debt-to-Income</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Input Panel */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <Settings size={20} />
                Financial Inputs
              </h3>
              <div className="panel-controls">
                <select 
                  value={projectionYears} 
                  onChange={(e) => setProjectionYears(Number(e.target.value))}
                  className="projection-select"
                >
                  <option value={5}>5 Years</option>
                  <option value={10}>10 Years</option>
                  <option value={15}>15 Years</option>
                  <option value={20}>20 Years</option>
                  <option value={30}>30 Years</option>
                </select>
              </div>
            </div>
            
            <div className="panel-content">
              <div className="tabs-nav">
                <button 
                  className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('basic')}
                >
                  <Briefcase size={16} />
                  Basic
                </button>
                <button 
                  className={`tab-button ${activeTab === 'retirement' ? 'active' : ''}`}
                  onClick={() => setActiveTab('retirement')}
                >
                  <Shield size={16} />
                  Retirement
                </button>
                <button 
                  className={`tab-button ${activeTab === 'investments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('investments')}
                >
                  <TrendingUp size={16} />
                  Investments
                </button>
                <button 
                  className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assets')}
                >
                  <Home size={16} />
                  Assets & Debts
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'basic' && <BasicInfoTab />}
                {activeTab === 'retirement' && <RetirementTab />}
                {activeTab === 'investments' && <InvestmentsTab />}
                {activeTab === 'assets' && <AssetsDebtsTab />}
              </div>
            </div>
          </div>

          {/* Charts Panel */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <BarChart3 size={20} />
                Financial Projections
              </h3>
              <button 
                className="detail-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>

            <div className="panel-content">
              <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="netWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="assets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="retirement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="year" stroke="#999" />
                  <YAxis stroke="#999" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Total Assets"
                    stroke="#3b82f6"
                    fill="url(#assets)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="Net Worth"
                    stroke="#22c55e"
                    fill="url(#netWorth)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="Retirement"
                    stroke="#8b5cf6"
                    fill="url(#retirement)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Projections Table */}
        {showDetails && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <Calculator size={20} />
                Detailed Financial Projections
              </h2>
            </div>
            <div className="table-container">
              <table className="projections-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Year</th>
                    <th rowSpan={2}>Age</th>
                    <th rowSpan={2}>Salary</th>
                    <th colSpan={4}>Money</th>
                    <th colSpan={3}>Retirement and Assets</th>
                    <th colSpan={4}>Debt (Liability)</th>
                    <th rowSpan={2}>Net Worth</th>
                  </tr>
                  <tr>
                    <th>Savings</th>
                    <th>Checking</th>
                    <th>Brokerage</th>
                    <th>Crypto</th>
                    <th>401k</th>
                    <th>Roth IRA</th>
                    <th>ESOP</th>
                    <th>Mortgage</th>
                    <th>Car</th>
                    <th>Credit Card</th>
                    <th>Student Loans</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((row, index) => (
                    <tr key={index} className={index % 5 === 0 ? 'milestone-row' : ''}>
                      <td>{row.year}</td>
                      <td>{row.age}</td>
                      <td>{formatCurrency(row.salary)}</td>
                      <td>{formatCurrency(row.savings)}</td>
                      <td>{formatCurrency(row.checking)}</td>
                      <td>{formatCurrency(row.brokerage)}</td>
                      <td>{formatCurrency(row.crypto)}</td>
                      <td>{formatCurrency(row.total401k)}</td>
                      <td>{formatCurrency(row.rothIRA)}</td>
                      <td>{formatCurrency(row.esop)}</td>
                      <td>{formatCurrency(row.mortgage)}</td>
                      <td>{formatCurrency(row.carLoan)}</td>
                      <td>{formatCurrency(row.creditCards)}</td>
                      <td>{formatCurrency(row.studentLoans)}</td>
                      <td className="net-worth-cell">{formatCurrency(row.netWorth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="actions-section">
          <button className="btn-primary" onClick={handleExport}>
            <Download size={16} />
            Export Complete Report
          </button>
          <button className="btn-secondary" onClick={handleReset}>
            <RefreshCw size={16} />
            Reset to Defaults
          </button>
        </div>
      </div>
      
      <SuggestionBox />

    </div>
  );
};

export default FinancialDashboard;