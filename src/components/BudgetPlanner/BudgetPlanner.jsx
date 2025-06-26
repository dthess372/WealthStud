import React, { useState } from 'react';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts';
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  DiamondPlus, 
  Pencil,
  DollarSign,
  TrendingUp,
  Calculator,
  Download,
  Upload,
  Shield,
  AlertCircle,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import Navigation from '../shared/Navigation';
import SuggestionBox from '../SuggestionBox/SuggestionBox';
import './BudgetPlanner.css';
import '../../styles/shared-inputs.css';
import '../../styles/shared-page-styles.css';

// Import shared utilities and configurations
import { 
  parseNumber, 
  formatCurrency, 
  formatPercent
} from '../../lib/utils';
import { 
  calculateAllTaxes,
  calculateTaxableIncome,
  getAllStates
} from '../../lib/taxes';
import { STORAGE_KEYS } from '../../lib/constants';
import { getDefaultCategories } from '../../config/budgetConfig';
import { useLocalStorage, useCSV } from '../../hooks';

const BudgetPlanner = () => {
  // Use localStorage for data persistence
  const [budgetData, setBudgetData] = useLocalStorage(STORAGE_KEYS.BUDGET_DATA, {
    grossIncome: '',
    k401Contribution: '',
    isRoth401k: false,
    iraContribution: '',
    isRothIra: false,
    filingStatus: 'single',
    selectedState: 'MI',
    categories: getDefaultCategories()
  });
  
  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('budget');
  
  // Local state for UI
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Destructure budget data for easier access
  const {
    grossIncome,
    k401Contribution,
    isRoth401k,
    iraContribution,
    isRothIra,
    filingStatus,
    selectedState,
    categories
  } = budgetData;
  
  // Helper function to update budget data
  const updateBudgetData = (updates) => {
    setBudgetData(prev => ({ ...prev, ...updates }));
  };

  // Get available states for dropdown
  const availableStates = getAllStates();


  // Expand/Collapse all categories
  const expandAllCategories = () => {
    setCollapsedCategories({});
  };

  const collapseAllCategories = () => {
    const allCollapsed = Object.keys(categories).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setCollapsedCategories(allCollapsed);
  };

  // Handle input changes with proper clearing
  const handleIncomeChange = (field) => (e) => {
    const value = e.target.value;
    // If the field is empty or just contains 0, clear it
    const newValue = (value === '' || value === '0') ? '' : value;
    updateBudgetData({ [field]: newValue });
  };

  const startEditing = (categoryKey, subcategoryKey) => {
    setEditingSubcategory({ categoryKey, subcategoryKey });
    setEditingValue(subcategoryKey);
  };

  const saveEdit = () => {
    if (!editingSubcategory || editingValue.trim() === '') return;

    const { categoryKey, subcategoryKey } = editingSubcategory;
    
    const newCategories = { ...categories };
    const currentValue = newCategories[categoryKey].subcategories[subcategoryKey];
    
    delete newCategories[categoryKey].subcategories[subcategoryKey];
    newCategories[categoryKey].subcategories[editingValue] = currentValue;
    
    updateBudgetData({ categories: newCategories });

    setEditingSubcategory(null);
    setEditingValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingSubcategory(null);
      setEditingValue('');
    }
  };

  const toggleCategory = (categoryKey) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  function lightenColor(hex, opacity = 0.2) {
    const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  // Tax calculations using centralized tax system
  const grossIncomeNum = parseNumber(grossIncome);
  const k401ContributionNum = parseNumber(k401Contribution);
  const iraContributionNum = parseNumber(iraContribution);
  
  // Calculate pre-tax deductions
  const traditionalRetirementContributions = (isRoth401k ? 0 : k401ContributionNum) + (isRothIra ? 0 : iraContributionNum);
  
  // Calculate taxable income
  const taxableIncome = calculateTaxableIncome(grossIncomeNum, filingStatus, traditionalRetirementContributions);
  
  // Calculate all taxes using centralized system
  const taxDetails = calculateAllTaxes(grossIncomeNum, taxableIncome, filingStatus, selectedState);
  
  const totalRetirementContributions = k401ContributionNum + iraContributionNum;
  const netIncome = taxDetails.net - (k401ContributionNum + iraContributionNum - traditionalRetirementContributions);
  
  // Calculate effective rates
  const _effectiveFederalRate = taxDetails.effectiveRate;
  const effectiveTotalRate = grossIncomeNum > 0 ? taxDetails.total / grossIncomeNum : 0;

  const calculateTotalExpenses = () => {
    return Object.values(categories).reduce((total, category) => {
      // Don't count savings as expenses
      if (category.label.includes('Savings')) return total;
      return total + Object.values(category.subcategories).reduce((catTotal, subcat) =>
        catTotal + (subcat.monthly * 12), 0);
    }, 0);
  };

  const calculateTotalSavings = () => {
    const savingsCategory = categories['Savings'];
    if (!savingsCategory) return 0;
    return Object.values(savingsCategory.subcategories).reduce((total, subcat) => 
      total + (subcat.monthly * 12), 0);
  };

  const totalExpenses = calculateTotalExpenses();
  const totalSavings = calculateTotalSavings();
  const availableAfterExpenses = netIncome - totalExpenses;
  const excessSavings = Math.max(0, availableAfterExpenses - totalSavings);
  const totalSavingsWithExcess = totalSavings + excessSavings;
  const savingsRate = netIncome > 0 ? (totalSavingsWithExcess / netIncome * 100) : 0;

  // Calculate budget health score
  const calculateBudgetHealth = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    Object.entries(categories).forEach(([_key, category]) => {
      // Skip savings from penalty calculation
      if (category.label.includes('Savings')) return;
      
      const totals = getCategoryTotals(category);
      const actualPercent = parseFloat(totals.percentage);
      const recommendedPercent = category.recommended * 100;
      const weight = recommendedPercent;
      
      let categoryScore = 100;
      if (actualPercent > recommendedPercent) {
        const overage = actualPercent - recommendedPercent;
        categoryScore = Math.max(0, 100 - (overage * 3));
      } else if (actualPercent < recommendedPercent * 0.5) {
        categoryScore = 90;
      }
      
      totalWeightedScore += categoryScore * weight;
      totalWeight += weight;
    });

    // Add savings bonus
    let savingsBonus = 0;
    if (savingsRate >= 20) savingsBonus = 10;
    else if (savingsRate >= 15) savingsBonus = 5;

    const baseScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 100;
    return Math.min(100, Math.max(0, Math.round(baseScore + savingsBonus)));
  };

  const getBudgetHealthInfo = (score) => {
    if (score >= 90) return { label: 'Excellent', icon: CheckCircle, class: 'health-excellent' };
    if (score >= 75) return { label: 'Good', icon: Shield, class: 'health-good' };
    if (score >= 60) return { label: 'Fair', icon: AlertCircle, class: 'health-fair' };
    return { label: 'Needs Work', icon: TrendingDown, class: 'health-poor' };
  };

  // Handlers
  const handleExpenseChange = (categoryKey, subcategoryKey, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    const newCategories = {
      ...categories,
      [categoryKey]: {
        ...categories[categoryKey],
        subcategories: {
          ...categories[categoryKey].subcategories,
          [subcategoryKey]: { monthly: isNaN(numValue) ? 0 : numValue }
        }
      }
    };
    updateBudgetData({ categories: newCategories });
  };

  const addSubcategory = (categoryKey) => {
    const name = window.prompt('Enter subcategory name:');
    if (name && name.trim()) {
      const newCategories = {
        ...categories,
        [categoryKey]: {
          ...categories[categoryKey],
          subcategories: {
            ...categories[categoryKey].subcategories,
            [name.trim()]: { monthly: 0 }
          }
        }
      };
      updateBudgetData({ categories: newCategories });
    }
  };

  const removeSubcategory = (categoryKey, subcategoryKey) => {
    if (window.confirm(`Are you sure you want to remove "${subcategoryKey}"?`)) {
      const newCategories = { ...categories };
      delete newCategories[categoryKey].subcategories[subcategoryKey];
      updateBudgetData({ categories: newCategories });
    }
  };

  // CSV Export/Import using shared hook
  const handleExportCSV = () => {
    const data = [];
    Object.entries(categories).forEach(([catKey, category]) => {
      Object.entries(category.subcategories).forEach(([subKey, subcat]) => {
        data.push({
          Category: catKey,
          Subcategory: subKey,
          'Monthly Cost': subcat.monthly,
          'Annual Cost': subcat.monthly * 12
        });
      });
    });
    
    // Add income summary
    data.push(
      { Category: 'Income', Subcategory: 'Gross Income', 'Monthly Cost': grossIncomeNum / 12, 'Annual Cost': grossIncomeNum },
      { Category: 'Income', Subcategory: 'Net Income', 'Monthly Cost': netIncome / 12, 'Annual Cost': netIncome },
      { Category: 'Taxes', Subcategory: 'Federal Tax', 'Monthly Cost': taxDetails.federal / 12, 'Annual Cost': taxDetails.federal },
      { Category: 'Taxes', Subcategory: 'State Tax', 'Monthly Cost': taxDetails.state / 12, 'Annual Cost': taxDetails.state },
      { Category: 'Taxes', Subcategory: 'Payroll Tax', 'Monthly Cost': taxDetails.payroll.totalPayroll / 12, 'Annual Cost': taxDetails.payroll.totalPayroll }
    );
    
    exportCSV(data, 'budget_data.csv');
  };
  
  const handleImportCSV = createFileInputHandler(
    (result) => {
      const newCategories = { ...categories };
      result.data.forEach(row => {
        const category = row.Category;
        const subcategory = row.Subcategory;
        const monthly = parseFloat(row['Monthly Cost']) || 0;
        
        if (category && subcategory && newCategories[category]?.subcategories) {
          newCategories[category].subcategories[subcategory] = { monthly };
        }
      });
      updateBudgetData({ categories: newCategories });
    },
    (error) => console.error('Error importing budget data:', error),
    ['Category', 'Subcategory', 'Monthly Cost', 'Annual Cost']
  );

  // Prepare data for pie charts
  const prepareCategoryData = () => {
    const categoryData = Object.entries(categories).map(([key, category]) => {
      const categoryTotal = Object.values(category.subcategories).reduce((sum, subcat) => sum + (subcat.monthly * 12), 0);
      const actualTotal = category.label.includes('Savings') ? categoryTotal + (key === 'Savings' ? excessSavings : 0) : categoryTotal;
      const percentage = netIncome > 0 ? (actualTotal / netIncome * 100) : 0;
      return {
        id: key,
        label: `${key}: ${formatPercent(percentage)}%`,
        value: Math.max(0, percentage),
        color: category.color
      };
    }).filter(item => item.value > 0);

    return categoryData;
  };

  const prepareSubcategoryData = () => {
    const data = [];
    Object.entries(categories).forEach(([catKey, category]) => {
      Object.entries(category.subcategories).forEach(([subKey, subcat]) => {
        if (subcat.monthly > 0) {
          const percentage = netIncome > 0 ? ((subcat.monthly * 12) / netIncome * 100) : 0;
          data.push({
            id: `${catKey}-${subKey}`,
            label: `${subKey}: ${formatPercent(percentage)}%`,
            value: Math.max(0, percentage),
            color: lightenColor(category.color, 0.7)
          });
        }
      });
    });

    if (excessSavings > 0) {
      const percentage = netIncome > 0 ? (excessSavings / netIncome * 100) : 0;
      data.push({
        id: 'excess-savings',
        label: `Extra Savings: ${formatPercent(percentage)}%`,
        value: Math.max(0, percentage),
        color: lightenColor('#27A25B', 0.4)
      });
    }
    return data;
  };

  // Calculate category totals
  const getCategoryTotals = (category) => {
    const subcategoryTotal = Object.values(category.subcategories)
      .reduce((sum, subcat) => sum + (subcat.monthly * 12), 0);
    
    const actualTotal = category.label.includes('Savings') ? subcategoryTotal + excessSavings : subcategoryTotal;
    const actualPercentage = netIncome > 0 ? (actualTotal / netIncome * 100) : 0;
    const recommendedPercentage = category.recommended * 100;
    
    return {
      annual: actualTotal,
      monthly: actualTotal / 12,
      percentage: formatPercent(actualPercentage),
      recommendedPercentage,
      status: getStatus(actualPercentage, recommendedPercentage, actualTotal)
    };
  };

  const getStatus = (actual, recommended, total) => {
    if (total === 0) return 'zero';
    return actual > recommended ? 'over' : 'under';
  };

  // Progress bar component
  const ProgressBar = ({ actual, target, className = '' }) => {
    const maxScale = Math.max(target * 1.1, actual * 1.1);
    const actualWidth = Math.min(100, (actual / maxScale) * 100);
    const targetPosition = Math.min(90, (target / maxScale) * 100);
    const isOver = actual > target;
    
    return (
      <div className={`budget-progress ${className}`}>
        <div className="progress-info">
          <span>Actual: {formatPercent(actual)}%</span>
          <span>Target: {formatPercent(target)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${isOver ? 'over' : 'under'}`}
            style={{ width: `${actualWidth}%` }}
          />
          <div
            className="progress-target"
            style={{ left: `${targetPosition}%` }}
          />
        </div>
      </div>
    );
  };

  const budgetHealth = calculateBudgetHealth();
  const healthInfo = getBudgetHealthInfo(budgetHealth);

  const navigationActions = [
    {
      label: 'Export CSV',
      icon: <Download size={16} />,
      onClick: exportCSV,
      variant: 'btn-ghost',
      hideTextOnMobile: true
    },
    {
      label: 'Import CSV',
      icon: <Upload size={16} />,
      onClick: () => document.getElementById('csv-import').click(),
      variant: 'btn-ghost',
      hideTextOnMobile: true
    }
  ];

  return (
    <div className="budget-creator">
      <Navigation 
        actions={navigationActions}
      />
      
      {/* Hidden file input for CSV import */}
      <input
        id="csv-import"
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        style={{ display: 'none' }}
      />
      
      {/* Main Content */}
      <div className="budget-content">
        <div className="budget-intro-section">
          <h2 className="intro-title">Smart Budget Planning Made Simple</h2>
          <p>
            Track income, calculate taxes automatically, manage expenses, and visualize your financial health with real-time insights.
          </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Enter your income and retirement contributions</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>Review your calculated net income and taxes</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Add monthly expenses by category</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Monitor your budget health score and tips</span>
          </div>
        </div>
        <p className="intro-note">
          📊 Uses 2024 tax rates • 🔒 All data stays in your browser • 💾 Export/import CSV files
        </p>
      </div>
      
      <div className="page-content">
        {/* Income Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <DollarSign size={16} />
              </div>
              Income & Tax Calculator
            </h2>
          </div>
          <div className="section-content">
            <div className="income-layout-grid">
              {/* Input Section */}
              <div className="income-inputs-container">
                <div className="input-section-wide">
                  <div className="input-group">
                    <label className="input-label">Annual Gross Income</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field with-prefix width-xl"
                        value={grossIncome}
                        onChange={handleIncomeChange('grossIncome')}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                  
                  <div className="retirement-inputs-grid">
                    <div className="retirement-section">
                      <h4 className="retirement-title">401(k) Contributions</h4>
                      <div className="input-group">
                        <label className="input-label">Annual Contribution</label>
                        <div className="input-wrapper">
                          <span className="input-prefix">$</span>
                          <input 
                            type="number" 
                            className="input-field with-prefix width-lg"
                            value={k401Contribution}
                            onChange={handleIncomeChange('k401Contribution')}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div className="checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            id="roth401k"
                            checked={isRoth401k}
                            onChange={(e) => updateBudgetData({ isRoth401k: e.target.checked })}
                          />
                          <label htmlFor="roth401k">Roth 401(k) (after-tax)</label>
                        </div>
                      </div>
                    </div>

                    <div className="retirement-section">
                      <h4 className="retirement-title">IRA Contributions</h4>
                      <div className="input-group">
                        <label className="input-label">Annual Contribution</label>
                        <div className="input-wrapper">
                          <span className="input-prefix">$</span>
                          <input 
                            type="number" 
                            className="input-field with-prefix width-lg"
                            value={iraContribution}
                            onChange={handleIncomeChange('iraContribution')}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div className="checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            id="rothIra"
                            checked={isRothIra}
                            onChange={(e) => updateBudgetData({ isRothIra: e.target.checked })}
                          />
                          <label htmlFor="rothIra">Roth IRA (after-tax)</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="tax-inputs-grid">
                    <div className="input-group">
                      <label className="input-label">Filing Status</label>
                      <select 
                        className="input-field no-prefix width-md"
                        value={filingStatus}
                        onChange={(e) => updateBudgetData({ filingStatus: e.target.value })}
                      >
                        <option value="single">Single</option>
                        <option value="married">Married Filing Jointly</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">State</label>
                      <select 
                        className="input-field no-prefix width-md"
                        value={selectedState}
                        onChange={(e) => updateBudgetData({ selectedState: e.target.value })}
                      >
                        {availableStates.map((state) => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Income Breakdown Table */}
              <div className="table-container">
                <table className="income-table">
                  <thead>
                    <tr>
                      <th>Income Summary</th>
                      <th>Monthly</th>
                      <th>Annual</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="income-row">
                      <td style={{ fontWeight: 'bold' }}>Gross Income</td>
                      <td>${formatCurrency(grossIncomeNum / 12)}</td>
                      <td>${formatCurrency(grossIncomeNum)}</td>
                    </tr>
                    <tr className="income-row positive">
                      <td style={{ color: '#22c55e', fontWeight: 'bold' }}>
                        Total Retirement Contributions
                      </td>
                      <td>${formatCurrency(totalRetirementContributions / 12)}</td>
                      <td>${formatCurrency(totalRetirementContributions)}</td>
                    </tr>
                    <tr className="income-row negative">
                      <td style={{ color: '#e63946', fontWeight: 'bold' }}>
                        Total Tax ({formatPercent(effectiveTotalRate * 100)}%)
                      </td>
                      <td>${formatCurrency(taxDetails.total / 12)}</td>
                      <td>${formatCurrency(taxDetails.total)}</td>
                    </tr>
                    <tr className="income-row net">
                      <td style={{ color: '#af953e', fontWeight: 'bold' }}>Net Income</td>
                      <td>${formatCurrency(netIncome / 12)}</td>
                      <td>${formatCurrency(netIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tax Breakdown */}
            <div className="tax-breakdown-container">
              <div className="table-container">
                <table className="tax-table">
                  <thead>
                    <tr>
                      <th>Tax Breakdown</th>
                      <th>Amount</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="tax-row">
                      <td>Federal Income Tax</td>
                      <td>${formatCurrency(taxDetails.federal)}</td>
                      <td>{formatPercent(taxDetails.effectiveRate * 100)} (marginal: {formatPercent(taxDetails.marginalRate * 100)})</td>
                    </tr>
                    <tr className="tax-row">
                      <td>Social Security</td>
                      <td>${formatCurrency(taxDetails.payroll.socialSecurity)}</td>
                      <td>6.2%</td>
                    </tr>
                    <tr className="tax-row">
                      <td>Medicare</td>
                      <td>${formatCurrency(taxDetails.payroll.medicare.total)}</td>
                      <td>1.45%{taxDetails.payroll.medicare.additional > 0 && ' + 0.9%'}</td>
                    </tr>
                    <tr className="tax-row">
                      <td>{availableStates.find(s => s.code === selectedState)?.name} State Tax</td>
                      <td>${formatCurrency(taxDetails.state)}</td>
                      <td>{formatPercent(availableStates.find(s => s.code === selectedState)?.rate * 100)}%</td>
                    </tr>
                    <tr className="tax-total">
                      <td>Total Tax</td>
                      <td>${formatCurrency(taxDetails.total)}</td>
                      <td>{formatPercent(effectiveTotalRate * 100)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="income-note">
              💡 Standard deduction included in calculation | 
              Traditional retirement contributions reduce taxable income
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="budget-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <TrendingUp size={16} />
              </div>
              Expense Categories
            </h2>
            <div className="category-controls">
              <button className="control-btn" onClick={expandAllCategories}>
                Expand All
              </button>
              <button className="control-btn" onClick={collapseAllCategories}>
                Collapse All
              </button>
            </div>
          </div>
          <div className="section-content">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th className="firstCol">Category</th>
                  <th className="centeredCol">Annual</th>
                  <th className="centeredCol">Monthly</th>
                  <th className="centeredCol">Budget Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categories).map(([categoryKey, category]) => {
                  const totals = getCategoryTotals(category);
                  const isCollapsed = collapsedCategories[categoryKey];
                  const isSavings = category.label.includes('Savings');
                  
                  return (
                    <React.Fragment key={categoryKey}>
                      <tr className={`category-row ${isSavings && excessSavings > 0 ? 'savings-boost-row' : ''}`} style={{ 
                        backgroundColor: lightenColor(category.color, 0.3),
                        borderLeftColor: category.color 
                      }}>
                        <td>
                          <button 
                            className="collapse-btn"
                            onClick={() => toggleCategory(categoryKey)}
                          >
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            {category.label}
                            {isSavings && excessSavings > 0 && (
                              <span style={{ marginLeft: '0.5rem', color: '#22c55e', fontSize: '0.75rem' }}>
                                +${formatCurrency(excessSavings)} auto
                              </span>
                            )}
                            <DiamondPlus 
                              size={16} 
                              onClick={(e) => {
                                e.stopPropagation();
                                addSubcategory(categoryKey);
                              }}
                              className="action-icon plusIcon"
                            />
                          </button>
                        </td>
                        <td className="centeredCol">${formatCurrency(totals.annual)}</td>
                        <td className="centeredCol">${formatCurrency(totals.monthly)}</td>
                        <td className="centeredCol">
                          <ProgressBar 
                            actual={parseFloat(totals.percentage)} 
                            target={category.recommended * 100}
                          />
                        </td>
                        <td></td>
                      </tr>
                      {!isCollapsed && Object.entries(category.subcategories).map(([subKey, subcat]) => (
                        <tr key={`${categoryKey}-${subKey}`}
                            className="subcategory-row"
                            style={{ backgroundColor: lightenColor(category.color, 0.1) }}
                        >
                          <td className="subcategory-name">
                            {editingSubcategory?.categoryKey === categoryKey && 
                            editingSubcategory?.subcategoryKey === subKey ? (
                               <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={handleKeyDown}
                                  className="table-input text"
                                  autoFocus
                                />
                            ) : (
                              <>
                                {subKey}
                                <Pencil
                                  size={14}
                                  onClick={() => startEditing(categoryKey, subKey)}
                                  className="action-icon pencilIcon"
                                />
                              </>
                            )}
                          </td>
                          <td className="centeredCol">${formatCurrency(subcat.monthly * 12)}</td>
                          <td className="centeredCol">
                            <div className="input-wrapper" style={{ display: 'inline-block', width: '120px' }}>
                              <span className="input-prefix compact">$</span>
                              <input 
                                type="number"
                                value={subcat.monthly || ''}
                                onChange={(e) => handleExpenseChange(categoryKey, subKey, e.target.value)}
                                placeholder="0"
                                className="table-input with-prefix"
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                          </td>
                          <td className="centeredCol">
                            {formatPercent(netIncome > 0 ? ((subcat.monthly * 12 / netIncome) * 100) : 0)}%
                          </td>
                          <td className="rightCol">
                            <Trash2 
                              size={14} 
                              onClick={() => removeSubcategory(categoryKey, subKey)}
                              className="action-icon trashIcon"
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            
            <div className="category-controls-bottom">
              <button className="control-btn" onClick={expandAllCategories}>
                Expand All
              </button>
              <button className="control-btn" onClick={collapseAllCategories}>
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Budget Tips */}
        {budgetHealth < 80 && (
          <div className="budget-tips">
            <h4>💡 Budget Improvement Tips</h4>
            <p>
              {budgetHealth < 60 && 'Consider reviewing your largest expense categories to identify areas for reduction. '}
              {savingsRate < 15 && 'Aim for a savings rate of at least 15-20% of your income for healthy financial growth. '}
              {availableAfterExpenses < 0 && 'Your expenses exceed your income - consider reducing spending or increasing income. '}
              {savingsRate >= 15 && budgetHealth < 80 && 'Good savings rate! Try optimizing spending categories to match recommended percentages.'}
            </p>
          </div>
        )}

        {/* Budget Dashboard & Visualization */}
        <div className="budget-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Calculator size={16} />
              </div>
              Budget Dashboard & Visualization
            </h2>
          </div>
          <div className="section-content">
            {/* Dashboard Summary */}
            <div className="budget-dashboard">
              <div className={`dashboard-card ${budgetHealth >= 80 ? 'success' : budgetHealth >= 60 ? '' : 'danger'}`}>
                <div className="dashboard-value">
                  <span className="financial-health-indicator">
                    <healthInfo.icon size={20} className={healthInfo.class} />
                    {budgetHealth}/100
                  </span>
                </div>
                <div className="dashboard-label">Budget Health</div>
              </div>
              <div className="dashboard-card">
                <div className="dashboard-value">${formatCurrency(netIncome)}</div>
                <div className="dashboard-label">Annual Net Income</div>
              </div>
              <div className="dashboard-card">
                <div className="dashboard-value">${formatCurrency(totalExpenses)}</div>
                <div className="dashboard-label">Total Expenses</div>
              </div>
              <div className={`dashboard-card ${availableAfterExpenses < 0 ? 'danger' : 'success'}`}>
                <div className="dashboard-value">${formatCurrency(availableAfterExpenses)}</div>
                <div className="dashboard-label">Available for Savings</div>
              </div>
              <div className="dashboard-card success">
                <div className="dashboard-value">{formatPercent(savingsRate)}%</div>
                <div className="dashboard-label">Savings Rate</div>
              </div>
            </div>

            {/* Chart Visualization */}
            <div className="chart-container-large">
              <PieChart
                series={[
                  {
                    data: prepareCategoryData(),
                    arcLabel: (item) => `${item.value.toFixed(1)}%`,
                    arcLabelMinAngle: 25,
                    outerRadius: 180,
                    highlightScope: { fade: 'global', highlight: 'item' }
                  },
                  {
                    cornerRadius: 5,
                    data: prepareSubcategoryData(),
                    arcLabel: (item) => item.value > 4 ? `${item.value.toFixed(1)}%` : '',
                    arcLabelMinAngle: 40,
                    innerRadius: 180,
                    outerRadius: 240,
                    highlightScope: { fade: 'global', highlight: 'item' }
                  },
                ]}
                width={800}
                height={500}
                sx={{
                  [`& .${pieArcLabelClasses.root}`]: {
                    fill: '#f1faee',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }
                }}
                margin={{ top: 50, bottom: 50, left: 100, right: 100 }}
                slotProps={{ legend: { hidden: true } }}
              />
            </div>
          </div>
        </div>

        {/* Export/Import Section */}
        <div className="actions-section">
          <button className="btn-primary" onClick={handleExportCSV}>
            <Download size={16} />
            Export Budget
          </button>
          <label className="btn-primary">
            <Upload size={16} />
            Import Budget
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden-input"
            />
          </label>
        </div>

        <SuggestionBox />
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;