import React, { useState, useEffect } from 'react';
import Navigation from '../shared/Navigation';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, Download, Upload, Target, PiggyBank, Shield, 
  Zap, AlertCircle, CheckCircle, Plus, X, DollarSign,
  Calculator, BarChart3, Lightbulb, Percent, Calendar
} from 'lucide-react';
import './SavingPlanner.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

// Import shared utilities and configurations
import { 
  parseNumber, 
  formatCurrency, 
  formatPercent
} from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';

// Investment return rates by scenario
const INVESTMENT_SCENARIOS = {
  conservative: {
    name: 'Conservative',
    description: 'Low risk with bonds and stable investments',
    returnRate: 4,
    icon: Shield,
    allocation: '20% Stocks, 70% Bonds, 10% Cash'
  },
  moderate: {
    name: 'Moderate',
    description: 'Balanced risk with mixed portfolio',
    returnRate: 7,
    icon: BarChart3,
    allocation: '60% Stocks, 30% Bonds, 10% Cash'
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Higher risk with growth-focused investments',
    returnRate: 10,
    icon: Zap,
    allocation: '90% Stocks, 10% Bonds'
  }
};

const SavingPlanner = () => {
  // Use localStorage for data persistence
  const [savingsData, setSavingsData] = useLocalStorage(STORAGE_KEYS.SAVINGS_DATA, {
    currentAge: 30,
    retirementAge: 65,
    currentSavings: 10000,
    monthlyIncome: 5000,
    savingsRate: 20,
    annualRaise: 3,
    inflationRate: 2.5,
    scenario: 'moderate'
  });
  
  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('savings');
  
  // Helper function to update savings data
  const updateSavingsData = (updates) => {
    setSavingsData(prev => ({ ...prev, ...updates }));
  };

  const [goalsData, setGoalsData] = useLocalStorage(STORAGE_KEYS.SAVINGS_GOALS, [
    {
      id: 1,
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 5000,
      targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      priority: 'high',
      icon: Shield
    },
    {
      id: 2,
      name: 'Vacation Fund',
      targetAmount: 5000,
      currentAmount: 1000,
      targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      priority: 'medium',
      icon: Calendar
    }
  ]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    priority: 'medium'
  });

  const [projections, setProjections] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalAtRetirement: 0,
    monthlyRetirementIncome: 0,
    totalContributions: 0,
    totalInterestEarned: 0,
    yearsToRetirement: 0,
    effectiveSavingsRate: 0
  });

  // Calculate projections with compound interest
  const calculateProjections = () => {
    const { 
      currentAge, retirementAge, currentSavings, monthlyIncome, 
      savingsRate, annualRaise, inflationRate, scenario 
    } = savingsData;
    
    const yearsToRetirement = retirementAge - currentAge;
    const monthlyContribution = (monthlyIncome * savingsRate) / 100;
    const annualReturn = INVESTMENT_SCENARIOS[scenario].returnRate / 100;
    const monthlyReturn = annualReturn / 12;
    const inflationMonthly = inflationRate / 100 / 12;
    
    const projectionData = [];
    let balance = currentSavings;
    let totalContributions = currentSavings;
    let currentIncome = monthlyIncome * 12;
    let realBalance = currentSavings; // Inflation-adjusted
    
    for (let year = 0; year <= yearsToRetirement; year++) {
      const yearData = {
        year: currentAge + year,
        age: currentAge + year,
        nominalBalance: Math.round(balance),
        realBalance: Math.round(realBalance),
        yearlyContribution: Math.round(currentIncome * savingsRate / 100),
        cumulativeContributions: Math.round(totalContributions),
        annualIncome: Math.round(currentIncome)
      };
      
      projectionData.push(yearData);
      
      // Calculate year's growth
      for (let month = 0; month < 12; month++) {
        const monthlyContrib = (currentIncome / 12) * (savingsRate / 100);
        balance += monthlyContrib;
        balance *= (1 + monthlyReturn);
        realBalance += monthlyContrib;
        realBalance *= (1 + monthlyReturn - inflationMonthly);
        totalContributions += monthlyContrib;
      }
      
      currentIncome *= (1 + annualRaise / 100);
    }
    
    // Calculate summary metrics
    const finalBalance = projectionData[projectionData.length - 1].nominalBalance;
    const finalRealBalance = projectionData[projectionData.length - 1].realBalance;
    const totalInterest = finalBalance - totalContributions;
    const monthlyRetirement = (finalRealBalance * 0.04) / 12; // 4% withdrawal rate
    
    setSummaryMetrics({
      totalAtRetirement: finalBalance,
      monthlyRetirementIncome: monthlyRetirement,
      totalContributions: totalContributions,
      totalInterestEarned: totalInterest,
      yearsToRetirement: yearsToRetirement,
      effectiveSavingsRate: (monthlyContribution * 12 / (monthlyIncome * 12)) * 100
    });
    
    setProjections(projectionData);
  };

  useEffect(() => {
    calculateProjections();
  }, [savingsData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateSavingsData({
      [name]: value === '' ? 0 : parseNumber(value)
    });
  };

  const handleScenarioChange = (scenario) => {
    updateSavingsData({ scenario });
  };

  // Goal management
  const addGoal = () => {
    if (newGoal.name && newGoal.targetAmount) {
      const goal = {
        id: Date.now(),
        name: newGoal.name,
        targetAmount: parseNumber(newGoal.targetAmount),
        currentAmount: parseNumber(newGoal.currentAmount),
        targetDate: newGoal.targetDate,
        priority: newGoal.priority,
        icon: Target
      };
      setGoalsData([...goalsData, goal]);
      setNewGoal({
        name: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        priority: 'medium'
      });
      setShowGoalModal(false);
    }
  };

  const removeGoal = (id) => {
    if (window.confirm('Are you sure you want to remove this goal?')) {
      setGoalsData(goalsData.filter(goal => goal.id !== id));
    }
  };

  const calculateGoalProgress = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const calculateMonthlyGoalContribution = (goal) => {
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const monthsRemaining = Math.max(1, 
      (targetDate.getFullYear() - today.getFullYear()) * 12 + 
      (targetDate.getMonth() - today.getMonth())
    );
    const amountNeeded = Math.max(0, goal.targetAmount - goal.currentAmount);
    return amountNeeded / monthsRemaining;
  };

  // Export using shared functionality
  const handleExportCSV = () => {
    const data = projections.map(row => ({
      Year: row.year,
      Age: row.age,
      Balance: row.nominalBalance,
      'Real Balance': row.realBalance,
      'Yearly Contribution': row.yearlyContribution,
      'Total Contributions': row.cumulativeContributions
    }));
    
    exportCSV(data, 'savings_plan_data.csv');
  };

  // Import using shared functionality
  const handleImportCSV = createFileInputHandler(
    (result) => {
      if (result.data.length > 0) {
        const firstRow = result.data[0];
        const lastRow = result.data[result.data.length - 1];
        
        updateSavingsData({
          currentAge: parseNumber(firstRow.Age),
          retirementAge: parseNumber(lastRow.Age),
          currentSavings: parseNumber(firstRow.Balance)
        });
      }
    },
    (error) => console.error('Error importing savings data:', error),
    ['Year', 'Age', 'Balance', 'Real Balance', 'Yearly Contribution', 'Total Contributions']
  );

  // Generate savings tips based on current situation
  const getSavingsTips = () => {
    const tips = [];
    
    if (savingsData.savingsRate < 15) {
      tips.push({
        icon: AlertCircle,
        type: 'warning',
        text: "Consider increasing your savings rate to at least 15% for a comfortable retirement."
      });
    }
    
    if (savingsData.scenario === 'conservative' && savingsData.currentAge < 40) {
      tips.push({
        icon: TrendingUp,
        type: 'info',
        text: "At your age, you might consider a more aggressive investment strategy for potentially higher returns."
      });
    }
    
    if (summaryMetrics.monthlyRetirementIncome < savingsData.monthlyIncome * 0.7) {
      tips.push({
        icon: Target,
        type: 'warning',
        text: "Your projected retirement income is below 70% of current income. Consider increasing contributions."
      });
    }
    
    if (goalsData.some(g => calculateMonthlyGoalContribution(g) > savingsData.monthlyIncome * 0.1)) {
      tips.push({
        icon: Calculator,
        type: 'danger',
        text: "Some goals require high monthly contributions. Consider extending target dates or increasing income."
      });
    }
    
    tips.push({
      icon: CheckCircle,
      type: 'success',
      text: "Automate your savings to ensure consistent contributions and take advantage of dollar-cost averaging."
    });
    
    return tips;
  };

  const chartData = projections.map(item => ({
    age: item.age,
    'Nominal Value': item.nominalBalance,
    'Real Value (Inflation Adjusted)': item.realBalance,
    'Total Contributions': item.cumulativeContributions
  }));

  const navigationActions = [
    {
      label: 'Export CSV',
      icon: <Download size={16} />,
      onClick: exportCSV,
      variant: 'btn-ghost',
      hideTextOnMobile: true
    }
  ];

  return (
    <div className="page-container">
      <Navigation 
        actions={navigationActions}
      />
      
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Smart Savings Planner</h1>
          <p className="page-subtitle">Build wealth with intelligent projections and goal tracking</p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="page-intro-section">
        <h2 className="intro-title">Plan Your Financial Future</h2>
        <p>
          Visualize your savings growth, track multiple goals, and explore different investment scenarios 
          with real-time compound interest calculations.
        </p>
        <div className="intro-features">
          <div className="feature">
            <div className="feature-icon">
              <TrendingUp size={20} />
            </div>
            <span>Compound interest projections</span>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <Target size={20} />
            </div>
            <span>Multiple savings goals</span>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <Shield size={20} />
            </div>
            <span>Investment scenarios</span>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <Calculator size={20} />
            </div>
            <span>Inflation adjustment</span>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Dashboard */}
        <div className="summary-grid">
          <div className="dashboard-card primary">
            <div className="dashboard-value">
              {formatCurrency(summaryMetrics.totalAtRetirement)}
            </div>
            <div className="dashboard-label">Projected at Retirement</div>
            <div className="dashboard-sublabel">In {summaryMetrics.yearsToRetirement} years</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">
              {formatCurrency(summaryMetrics.monthlyRetirementIncome)}
            </div>
            <div className="dashboard-label">Monthly Retirement Income</div>
            <div className="dashboard-sublabel">Using 4% withdrawal rate</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">
              {formatCurrency(summaryMetrics.totalInterestEarned)}
            </div>
            <div className="dashboard-label">Total Interest Earned</div>
            <div className="dashboard-sublabel">From investments</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">
              {formatPercent(summaryMetrics.effectiveSavingsRate)}
            </div>
            <div className="dashboard-label">Current Savings Rate</div>
            <div className="dashboard-sublabel">Of monthly income</div>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Calculator size={16} />
              </div>
              Savings Parameters
            </h2>
          </div>
          <div className="section-content">
            <div className="input-grid">
              <div className="input-section">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-text-color)' }}>
                  Personal Information
                </h3>
                <div className="input-group">
                  <label className="input-label">Current Age</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      name="currentAge"
                      value={savingsData.currentAge}
                      onChange={handleInputChange}
                      className="input-field"
                      min="18"
                      max="100"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Retirement Age</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      name="retirementAge"
                      value={savingsData.retirementAge}
                      onChange={handleInputChange}
                      className="input-field"
                      min="50"
                      max="100"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Current Savings</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      name="currentSavings"
                      value={savingsData.currentSavings}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="input-section">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-text-color)' }}>
                  Income & Contributions
                </h3>
                <div className="input-group">
                  <label className="input-label">Monthly Income</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      name="monthlyIncome"
                      value={savingsData.monthlyIncome}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Savings Rate</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      name="savingsRate"
                      value={savingsData.savingsRate}
                      onChange={handleInputChange}
                      className="input-field with-suffix"
                      min="0"
                      max="100"
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Annual Raise</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      name="annualRaise"
                      value={savingsData.annualRaise}
                      onChange={handleInputChange}
                      className="input-field with-suffix"
                      min="0"
                      max="20"
                      step="0.1"
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
              </div>

              <div className="input-section">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-text-color)' }}>
                  Economic Assumptions
                </h3>
                <div className="input-group">
                  <label className="input-label">Expected Inflation Rate</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      name="inflationRate"
                      value={savingsData.inflationRate}
                      onChange={handleInputChange}
                      className="input-field with-suffix"
                      min="0"
                      max="10"
                      step="0.1"
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Monthly Contribution</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="text"
                      value={(savingsData.monthlyIncome * savingsData.savingsRate / 100).toFixed(0)}
                      className="input-field"
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Scenarios */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <BarChart3 size={16} />
              </div>
              Investment Strategy
            </h2>
          </div>
          <div className="section-content">
            <div className="scenarios-grid">
              {Object.entries(INVESTMENT_SCENARIOS).map(([key, scenario]) => {
                const Icon = scenario.icon;
                return (
                  <div
                    key={key}
                    className={`scenario-card ${savingsData.scenario === key ? 'active' : ''}`}
                    onClick={() => handleScenarioChange(key)}
                  >
                    <div className="scenario-header">
                      <div className="scenario-icon">
                        <Icon size={24} />
                      </div>
                      <h3 className="scenario-title">{scenario.name}</h3>
                    </div>
                    <p className="scenario-description">{scenario.description}</p>
                    <div className="scenario-metrics">
                      <div className="metric">
                        <div className="metric-value">{scenario.returnRate}%</div>
                        <div className="metric-label">Annual Return</div>
                      </div>
                      <div className="metric">
                        <div className="metric-value" style={{ fontSize: '0.875rem' }}>
                          {scenario.allocation}
                        </div>
                        <div className="metric-label">Allocation</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Savings Goals */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Target size={16} />
              </div>
              Savings Goals
            </h2>
          </div>
          <div className="section-content">
            <div className="goals-grid">
              {goalsData.map(goal => {
                const progress = calculateGoalProgress(goal);
                const monthlyNeeded = calculateMonthlyGoalContribution(goal);
                const priorityColors = {
                  high: '#ef4444',
                  medium: '#f59e0b',
                  low: '#3b82f6'
                };
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <h3 className="goal-title">{goal.name}</h3>
                      <X
                        size={20}
                        className="goal-remove"
                        onClick={() => removeGoal(goal.id)}
                      />
                    </div>
                    <div className="goal-details">
                      <div className="goal-stat">
                        <span className="goal-stat-label">Target</span>
                        <span className="goal-stat-value">{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="goal-stat">
                        <span className="goal-stat-label">Current</span>
                        <span className="goal-stat-value">{formatCurrency(goal.currentAmount)}</span>
                      </div>
                      <div className="goal-stat">
                        <span className="goal-stat-label">Monthly Need</span>
                        <span className="goal-stat-value">{formatCurrency(monthlyNeeded)}</span>
                      </div>
                      <div className="goal-stat">
                        <span className="goal-stat-label">Target Date</span>
                        <span className="goal-stat-value">
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-center text-muted mt-1">
                        {progress.toFixed(0)}% Complete
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="goal-card">
                <button 
                  className="add-goal-btn"
                  onClick={() => setShowGoalModal(true)}
                >
                  <Plus size={32} />
                  <span>Add New Goal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projections Chart */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <TrendingUp size={16} />
              </div>
              Savings Growth Projection
            </h2>
          </div>
          <div className="section-content">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#27A25B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#27A25B" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="age" 
                    stroke="#999"
                    label={{ value: 'Age', position: 'bottom', fill: '#999' }} 
                  />
                  <YAxis 
                    stroke="#999"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', fill: '#999' }} 
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 17, 17, 0.95)', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Nominal Value"
                    stroke="#27A25B"
                    fillOpacity={1}
                    fill="url(#colorNominal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Real Value (Inflation Adjusted)"
                    stroke="#60a5fa"
                    fillOpacity={1}
                    fill="url(#colorReal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Total Contributions"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorContributions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#27A25B' }}></div>
                  <span>Nominal Value (Future Dollars)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#60a5fa' }}></div>
                  <span>Real Value (Today&apos;s Dollars)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Total Contributions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Projections Table */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <BarChart3 size={16} />
              </div>
              Detailed Projections
            </h2>
          </div>
          <div className="section-content">
            <div style={{ overflowX: 'auto' }}>
              <table className="projections-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th>Year</th>
                    <th>Annual Income</th>
                    <th>Annual Contribution</th>
                    <th>Balance (Nominal)</th>
                    <th>Balance (Real)</th>
                    <th>Total Contributed</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((row, index) => {
                    const isMilestone = row.age % 10 === 0 || row.age === savingsData.retirementAge;
                    return (
                      <tr key={index} className={isMilestone ? 'milestone-row' : ''}>
                        <td>{row.age}</td>
                        <td>{row.year}</td>
                        <td>{formatCurrency(row.annualIncome)}</td>
                        <td>{formatCurrency(row.yearlyContribution)}</td>
                        <td>{formatCurrency(row.nominalBalance)}</td>
                        <td>{formatCurrency(row.realBalance)}</td>
                        <td>{formatCurrency(row.cumulativeContributions)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Savings Tips */}
        <div className="savings-tips">
          <h3 className="tips-title">
            <Lightbulb size={20} />
            Smart Savings Tips
          </h3>
          <div className="tips-list">
            {getSavingsTips().map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="tip-item">
                  <div className={`tip-icon ${tip.type}`}>
                    <Icon size={20} />
                  </div>
                  <p className="tip-text">{tip.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export/Import Section */}
        <div className="actions-section">
          <button className="btn-primary" onClick={handleExportCSV}>
            <Download size={16} />
            Export Projections
          </button>
          <label className="btn-primary">
            <Upload size={16} />
            Import Data
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden-input"
            />
          </label>
        </div>

        {/* Goal Modal */}
        {showGoalModal && (
          <div className="goal-modal">
            <div className="goal-modal-content">
              <div className="goal-modal-header">
                <h2 className="goal-modal-title">Add New Savings Goal</h2>
                <button 
                  className="goal-modal-close"
                  onClick={() => setShowGoalModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="goal-modal-body">
                <div className="input-group">
                  <label className="input-label">Goal Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Down Payment, Vacation"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Target Amount</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={newGoal.targetAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Current Amount</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0"
                      value={newGoal.currentAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Target Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select
                    className="input-field"
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="goal-modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowGoalModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={addGoal}
                  disabled={!newGoal.name || !newGoal.targetAmount}
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <SuggestionBox />
    </div>
  );
};

export default SavingPlanner;