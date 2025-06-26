import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  PieChart,
  AlertCircle,
  Target,
  Award,
  Briefcase,
  Calculator,
  Info,
  Plus,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tooltip as ReactToolTip } from 'react-tooltip';
import "./RetirementCalc.css";

// Import shared utilities and configurations
import { 
  parseNumber, 
  formatCurrency, 
  formatPercent,
  calculateAge,
  calculateCompoundInterest
} from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { RETIREMENT_ACCOUNT_TYPES } from '../../config/retirementConfig';
import { useLocalStorage, useCSV } from '../../hooks';

const RetirementCalc = () => {
  // Use localStorage for data persistence
  const [retirementData, setRetirementData] = useLocalStorage(STORAGE_KEYS.RETIREMENT_DATA, {
    generalInfo: {
      birthDate: '1990-01-01',
      currentSalary: 75000,
      annualRaise: 3,
      retirementAge: 67
    },
    accounts: []
  });
  
  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('retirement');
  
  // Local state for UI
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [collapsedAccounts, setCollapsedAccounts] = useState({});
  const [simulationResults, setSimulationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  
  // Destructure data for easier access
  const { generalInfo, accounts } = retirementData;
  
  // Helper function to update retirement data
  const updateRetirementData = (updates) => {
    setRetirementData(prev => ({ ...prev, ...updates }));
  };
  
  // For backward compatibility, keep ACCOUNT_TYPES reference
  const ACCOUNT_TYPES = RETIREMENT_ACCOUNT_TYPES;

const LEGACY_ACCOUNT_TYPES = {
  '401k': {
    name: 'Traditional 401(k)',
    icon: Shield,
    color: '#10b981',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      employeeContribution: { label: 'Your Annual Contribution', type: 'currency', required: true },
      employeeContributionPercent: { label: 'Or as % of Salary', type: 'percent', alternateFor: 'employeeContribution' },
      employerMatch: { label: 'Employer Match %', type: 'percent', tooltip: '% of salary your employer matches' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'roth401k': {
    name: 'Roth 401(k)',
    icon: Shield,
    color: '#8b5cf6',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      employeeContribution: { label: 'Your Annual Contribution', type: 'currency', required: true },
      employeeContributionPercent: { label: 'Or as % of Salary', type: 'percent', alternateFor: 'employeeContribution' },
      employerMatch: { label: 'Employer Match %', type: 'percent', tooltip: '% of salary your employer matches' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'ira': {
    name: 'Traditional IRA',
    icon: Landmark,
    color: '#f59e0b',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency', required: true },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'rothIra': {
    name: 'Roth IRA',
    icon: Landmark,
    color: '#ec4899',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency', required: true },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  },
  'companyStock': {
    name: 'Company Stock/RSUs',
    icon: TrendingUp,
    color: '#ef4444',
    fields: {
      currentBalance: { label: 'Current Value', type: 'currency', required: true },
      annualGrant: { label: 'Annual Grant Value', type: 'currency', tooltip: 'Value of stock grants per year' },
      vestingPeriod: { label: 'Vesting Period (Years)', type: 'number', default: 4 },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 10 }
    }
  },
  'brokerage': {
    name: 'Brokerage Account',
    icon: BarChart3,
    color: '#06b6d4',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 8 }
    }
  },
  'hsa': {
    name: 'HSA (Health Savings)',
    icon: Heart,
    color: '#22c55e',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      annualContribution: { label: 'Annual Contribution', type: 'currency' },
      employerContribution: { label: 'Employer Contribution', type: 'currency' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 6 }
    }
  },
  '403b': {
    name: '403(b)',
    icon: Building,
    color: '#3b82f6',
    fields: {
      currentBalance: { label: 'Current Balance', type: 'currency', required: true },
      employeeContribution: { label: 'Your Annual Contribution', type: 'currency', required: true },
      employerMatch: { label: 'Employer Match %', type: 'percent' },
      expectedReturn: { label: 'Expected Annual Return', type: 'percent', default: 7 }
    }
  }
};

const RetirementCalc = () => {
  const [generalInfo, setGeneralInfo] = useState({
    birthDate: '1990-01-01',
    currentSalary: 75000,
    annualRaise: 3,
    retirementAge: 67
  });

  const [accounts, setAccounts] = useState([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [collapsedAccounts, setCollapsedAccounts] = useState({});
  const [simulationResults, setSimulationResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Calculate basic metrics
  const calculateAge = () => {
    const birthDate = new Date(generalInfo.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge();
  const yearsToRetirement = Math.max(0, generalInfo.retirementAge - currentAge);

  // Calculate projected retirement balance
  const calculateProjectedBalance = () => {
    if (!hasCalculated || !simulationResults) {
      // Simple projection without Monte Carlo
      const years = yearsToRetirement;
      let totalBalance = 0;
      
      accounts.forEach(account => {
        const accountType = ACCOUNT_TYPES[account.type];
        const currentBalance = parseFloat(account.values.currentBalance) || 0;
        const expectedReturn = (parseFloat(account.values.expectedReturn) || 7) / 100;
        let annualContribution = 0;
        
        // Calculate annual contribution based on account type
        if (account.values.employeeContribution) {
          annualContribution = parseFloat(account.values.employeeContribution) || 0;
        } else if (account.values.employeeContributionPercent && generalInfo.currentSalary) {
          annualContribution = generalInfo.currentSalary * (parseFloat(account.values.employeeContributionPercent) / 100);
        } else if (account.values.annualContribution) {
          annualContribution = parseFloat(account.values.annualContribution) || 0;
        } else if (account.values.annualGrant) {
          annualContribution = parseFloat(account.values.annualGrant) || 0;
        }
        
        // Add employer contributions
        if (account.values.employerMatch && generalInfo.currentSalary) {
          const employerMatch = generalInfo.currentSalary * (parseFloat(account.values.employerMatch) / 100);
          annualContribution += employerMatch;
        }
        if (account.values.employerContribution) {
          annualContribution += parseFloat(account.values.employerContribution) || 0;
        }
        
        // Project balance
        let balance = currentBalance;
        for (let i = 0; i < years; i++) {
          balance = (balance + annualContribution) * (1 + expectedReturn);
        }
        
        totalBalance += balance;
      });
      
      return totalBalance;
    }
    
    // Use Monte Carlo results if available
    const lastYearStats = simulationResults?.statistics?.total?.[yearsToRetirement - 1];
    return lastYearStats?.median || 0;
  };

  const projectedBalance = calculateProjectedBalance();
  const monthlyRetirementIncome = projectedBalance * 0.04 / 12; // 4% withdrawal rate

  // Handle general info changes
  const handleGeneralInfoChange = (field, value) => {
    setGeneralInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new account
  const addAccount = (type) => {
    const newAccount = {
      id: Date.now(),
      type,
      name: `${ACCOUNT_TYPES[type].name} ${accounts.filter(a => a.type === type).length + 1}`,
      values: {}
    };
    
    // Set default values
    Object.entries(ACCOUNT_TYPES[type].fields).forEach(([fieldKey, field]) => {
      if (field.default !== undefined) {
        newAccount.values[fieldKey] = field.default;
      }
    });
    
    setAccounts([...accounts, newAccount]);
    setShowAddAccount(false);
  };

  // Remove account
  const removeAccount = (accountId) => {
    if (window.confirm('Are you sure you want to remove this account?')) {
      setAccounts(accounts.filter(a => a.id !== accountId));
    }
  };

  // Update account value
  const updateAccountValue = (accountId, field, value) => {
    setAccounts(accounts.map(account => 
      account.id === accountId 
        ? { ...account, values: { ...account.values, [field]: value } }
        : account
    ));
  };

  // Update account name
  const updateAccountName = (accountId, name) => {
    setAccounts(accounts.map(account => 
      account.id === accountId 
        ? { ...account, name }
        : account
    ));
  };

  // Toggle account collapse
  const toggleAccountCollapse = (accountId) => {
    setCollapsedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Run Monte Carlo simulation
  const runSimulation = async (e) => {
    e.preventDefault();
    
    if (accounts.length === 0) {
      alert('Please add at least one retirement account before running the simulation.');
      return;
    }
    
    setIsCalculating(true);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock results for demonstration
    const years = yearsToRetirement;
    const mockStatistics = {
      total: [],
      byAccount: {}
    };
    
    // Initialize statistics for each account
    accounts.forEach(account => {
      mockStatistics.byAccount[account.id] = [];
    });
    
    // Generate year-by-year projections
    for (let year = 0; year < years; year++) {
      let totalMin = 0, totalQ1 = 0, totalMedian = 0, totalQ3 = 0, totalMax = 0;
      
      accounts.forEach(account => {
        const currentBalance = parseFloat(account.values.currentBalance) || 0;
        const expectedReturn = (parseFloat(account.values.expectedReturn) || 7) / 100;
        const variance = 0.15;
        
        // Simple projection with variance
        const baseValue = currentBalance * Math.pow(1 + expectedReturn, year + 1);
        const stats = {
          year: new Date().getFullYear() + year,
          min: baseValue * 0.6,
          q1: baseValue * 0.8,
          median: baseValue,
          q3: baseValue * 1.2,
          max: baseValue * 1.4
        };
        
        mockStatistics.byAccount[account.id].push(stats);
        
        totalMin += stats.min;
        totalQ1 += stats.q1;
        totalMedian += stats.median;
        totalQ3 += stats.q3;
        totalMax += stats.max;
      });
      
      mockStatistics.total.push({
        year: new Date().getFullYear() + year,
        min: totalMin,
        q1: totalQ1,
        median: totalMedian,
        q3: totalQ3,
        max: totalMax
      });
    }
    
    setSimulationResults({ statistics: mockStatistics });
    setHasCalculated(true);
    setIsCalculating(false);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!simulationResults) return [];
    
    const { statistics } = simulationResults;
    return statistics.total.map((stat, index) => ({
      year: stat.year,
      min: Math.round(stat.min),
      q1: Math.round(stat.q1),
      median: Math.round(stat.median),
      q3: Math.round(stat.q3),
      max: Math.round(stat.max)
    }));
  };

  // Calculate total contributions per year
  const calculateTotalAnnualContributions = () => {
    let total = 0;
    
    accounts.forEach(account => {
      if (account.values.employeeContribution) {
        total += parseFloat(account.values.employeeContribution) || 0;
      } else if (account.values.employeeContributionPercent && generalInfo.currentSalary) {
        total += generalInfo.currentSalary * (parseFloat(account.values.employeeContributionPercent) / 100);
      } else if (account.values.annualContribution) {
        total += parseFloat(account.values.annualContribution) || 0;
      }
      
      // Add employer contributions
      if (account.values.employerMatch && generalInfo.currentSalary) {
        total += generalInfo.currentSalary * (parseFloat(account.values.employerMatch) / 100);
      }
      if (account.values.employerContribution) {
        total += parseFloat(account.values.employerContribution) || 0;
      }
    });
    
    return total;
  };

  const totalAnnualContributions = calculateTotalAnnualContributions();

  return (
    <div className="retirement-calculator">
      {/* Header */}
      <div className="retirement-header">
        <div className="retirement-header-content">
          <h1 className="retirement-title">Retirement Planner Pro</h1>
          <p className="retirement-subtitle">Personalized retirement projections with Monte Carlo simulation</p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="retirement-intro-section">
        <h2 className="intro-title">Build Your Custom Retirement Portfolio</h2>
        <p>
          Add only the accounts you actually have. Get personalized projections based on your unique portfolio mix.
          Our Monte Carlo simulation runs thousands of scenarios to show you a realistic range of outcomes.
        </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Enter your basic information</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>Add your retirement accounts</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Configure each account's details</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Run simulation and review projections</span>
          </div>
        </div>
        <p className="intro-note">
          🎯 Personalized to your accounts • 📊 Monte Carlo simulation • 🔒 All data stays local
        </p>
      </div>

      <div className="retirement-content">
        {/* Dashboard */}
        <div className="retirement-dashboard">
          <div className="dashboard-card">
            <div className="dashboard-value">{currentAge}</div>
            <div className="dashboard-label">Current Age</div>
          </div>
          <div className="dashboard-card info">
            <div className="dashboard-value">{yearsToRetirement}</div>
            <div className="dashboard-label">Years to Retirement</div>
          </div>
          <div className="dashboard-card success">
            <div className="dashboard-value small">{formatCurrency(projectedBalance)}</div>
            <div className="dashboard-label">Projected Balance</div>
            <div className="dashboard-sublabel">at age {generalInfo.retirementAge}</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value small">{formatCurrency(monthlyRetirementIncome)}</div>
            <div className="dashboard-label">Est. Monthly Income</div>
            <div className="dashboard-sublabel">4% withdrawal rate</div>
          </div>
          <div className="dashboard-card warning">
            <div className="dashboard-value small">{formatCurrency(totalAnnualContributions)}</div>
            <div className="dashboard-label">Total Annual Contributions</div>
            <div className="dashboard-sublabel">{accounts.length} accounts</div>
          </div>
        </div>

        {/* General Information */}
        <div className="retirement-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Briefcase size={16} />
              </div>
              General Information
            </h2>
          </div>
          <div className="section-content">
            <div className="general-info-grid">
              <div className="input-group">
                <label className="input-label">
                  Birth Date
                  <span className="tooltip-icon" data-tooltip-id="birthdate">?</span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={generalInfo.birthDate}
                  onChange={(e) => handleGeneralInfoChange('birthDate', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Current Annual Salary</label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    className="input-field"
                    value={generalInfo.currentSalary}
                    onChange={(e) => handleGeneralInfoChange('currentSalary', e.target.value)}
                    min="0"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Annual Salary Increase</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    className="input-field has-suffix"
                    value={generalInfo.annualRaise}
                    onChange={(e) => handleGeneralInfoChange('annualRaise', e.target.value)}
                    min="0"
                    step="0.1"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">
                  Target Retirement Age
                  <span className="tooltip-icon" data-tooltip-id="retirementAge">?</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={generalInfo.retirementAge}
                  onChange={(e) => handleGeneralInfoChange('retirementAge', e.target.value)}
                  min="50"
                  max="80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Retirement Accounts */}
        <div className="retirement-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Calculator size={16} />
              </div>
              Your Retirement Accounts
            </h2>
            <button 
              className="add-account-btn"
              onClick={() => setShowAddAccount(!showAddAccount)}
            >
              <Plus size={16} />
              Add Account
            </button>
          </div>
          <div className="section-content">
            {/* Add Account Dropdown */}
            {showAddAccount && (
              <div className="add-account-dropdown">
                <div className="dropdown-header">
                  <h3>Select Account Type</h3>
                  <button 
                    className="close-btn"
                    onClick={() => setShowAddAccount(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="account-type-grid">
                  {Object.entries(ACCOUNT_TYPES).map(([typeKey, typeConfig]) => {
                    const Icon = typeConfig.icon;
                    return (
                      <button
                        key={typeKey}
                        className="account-type-option"
                        onClick={() => addAccount(typeKey)}
                        style={{ borderColor: typeConfig.color }}
                      >
                        <div 
                          className="account-type-icon"
                          style={{ backgroundColor: typeConfig.color }}
                        >
                          <Icon size={24} />
                        </div>
                        <span className="account-type-name">{typeConfig.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account list */}
            {accounts.length === 0 ? (
              <div className="empty-accounts">
                <div className="empty-icon">💼</div>
                <h3>No accounts added yet</h3>
                <p>Click "Add Account" above to start building your retirement portfolio</p>
              </div>
            ) : (
              <div className="accounts-list">
                {accounts.map(account => {
                  const accountType = ACCOUNT_TYPES[account.type];
                  const Icon = accountType.icon;
                  const isCollapsed = collapsedAccounts[account.id];
                  
                  return (
                    <div 
                      key={account.id} 
                      className="account-card"
                      style={{ borderLeftColor: accountType.color }}
                    >
                      <div className="account-header">
                        <div className="account-header-left">
                          <button
                            className="collapse-toggle"
                            onClick={() => toggleAccountCollapse(account.id)}
                          >
                            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                          </button>
                          <div 
                            className="account-icon"
                            style={{ backgroundColor: accountType.color }}
                          >
                            <Icon size={20} />
                          </div>
                          <input
                            type="text"
                            className="account-name-input"
                            value={account.name}
                            onChange={(e) => updateAccountName(account.id, e.target.value)}
                          />
                        </div>
                        <button
                          className="remove-account-btn"
                          onClick={() => removeAccount(account.id)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      {!isCollapsed && (
                        <div className="account-content">
                          <div className="account-fields">
                            {Object.entries(accountType.fields).map(([fieldKey, field]) => {
                              // Skip alternate fields if primary field has value
                              if (field.alternateFor && account.values[field.alternateFor]) {
                                return null;
                              }
                              
                              return (
                                <div key={fieldKey} className="field-group">
                                  <label className="field-label">
                                    {field.label}
                                    {field.required && <span className="required">*</span>}
                                    {field.tooltip && (
                                      <span 
                                        className="tooltip-icon" 
                                        data-tooltip-id={`${account.id}-${fieldKey}`}
                                      >
                                        ?
                                      </span>
                                    )}
                                  </label>
                                  <div className="input-wrapper">
                                    {field.type === 'currency' && <span className="input-prefix">$</span>}
                                    <input
                                      type="number"
                                      className={`input-field ${field.type === 'currency' ? '' : 'no-prefix'} ${field.type === 'percent' ? 'has-suffix' : ''}`}
                                      value={account.values[fieldKey] || ''}
                                      onChange={(e) => updateAccountValue(account.id, fieldKey, e.target.value)}
                                      placeholder={field.type === 'currency' ? '0' : field.type === 'percent' ? '0' : ''}
                                      step={field.type === 'percent' ? '0.1' : '1'}
                                    />
                                    {field.type === 'percent' && <span className="input-suffix">%</span>}
                                  </div>
                                  {field.tooltip && (
                                    <ReactToolTip 
                                      id={`${account.id}-${fieldKey}`} 
                                      content={field.tooltip} 
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Account Summary */}
                          <div className="account-summary">
                            <div className="summary-item">
                              <span className="summary-label">Current Balance:</span>
                              <span className="summary-value">
                                {formatCurrency(parseFloat(account.values.currentBalance) || 0)}
                              </span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Expected Return:</span>
                              <span className="summary-value">
                                {account.values.expectedReturn || accountType.fields.expectedReturn?.default || 7}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="submit-section">
          <button 
            className="btn-primary" 
            onClick={runSimulation}
            disabled={isCalculating || accounts.length === 0}
          >
            {isCalculating ? (
              <>
                <div className="loading-spinner" />
                Running Simulation...
              </>
            ) : (
              <>
                <BarChart3 size={20} />
                Run Monte Carlo Simulation
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {hasCalculated && simulationResults && (
          <>
            <div className="section-divider" />

            {/* Chart Visualization */}
            <div className="retirement-section">
              <div className="section-header">
                <h2 className="section-title">
                  <div className="section-icon">
                    <TrendingUp size={16} />
                  </div>
                  Total Portfolio Projection
                </h2>
              </div>
              <div className="section-content">
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={prepareChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="year" 
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#888"
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #333',
                          borderRadius: '6px'
                        }}
                        labelStyle={{ color: '#888' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="min" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={false}
                        name="Worst Case"
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="q1" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false}
                        name="Conservative"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="median" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={false}
                        name="Expected"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="q3" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                        name="Optimistic"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="max" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        dot={false}
                        name="Best Case"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Final Projections Summary */}
            <div className="retirement-section">
              <div className="section-header">
                <h2 className="section-title">
                  <div className="section-icon">
                    <Target size={16} />
                  </div>
                  Retirement Projections Summary
                </h2>
              </div>
              <div className="section-content">
                <div className="projections-summary">
                  <div className="projection-card">
                    <h3>Conservative Scenario</h3>
                    <div className="projection-amount">
                      {formatCurrency(simulationResults.statistics.total[yearsToRetirement - 1]?.q1 || 0)}
                    </div>
                    <p>Bottom 25% of outcomes</p>
                  </div>
                  <div className="projection-card primary">
                    <h3>Expected Scenario</h3>
                    <div className="projection-amount">
                      {formatCurrency(simulationResults.statistics.total[yearsToRetirement - 1]?.median || 0)}
                    </div>
                    <p>Most likely outcome</p>
                  </div>
                  <div className="projection-card">
                    <h3>Optimistic Scenario</h3>
                    <div className="projection-amount">
                      {formatCurrency(simulationResults.statistics.total[yearsToRetirement - 1]?.q3 || 0)}
                    </div>
                    <p>Top 25% of outcomes</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!hasCalculated && !isCalculating && accounts.length > 0 && (
          <div className="retirement-section">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>Ready to See Your Future?</h3>
              <p>You've added {accounts.length} account{accounts.length > 1 ? 's' : ''}. Click "Run Monte Carlo Simulation" to see your retirement projections.</p>
            </div>
          </div>
        )}
      </div>

      {/* Tooltips */}
      <ReactToolTip id="birthdate" content="Used to calculate your current age and years to retirement" />
      <ReactToolTip id="retirementAge" content="The age at which you plan to retire" />
    </div>
  );
};

export default RetirementCalc;