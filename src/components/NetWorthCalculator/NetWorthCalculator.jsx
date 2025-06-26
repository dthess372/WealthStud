import React, { useState, useEffect } from 'react';
import Navigation from '../shared/Navigation';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import SuggestionBox from '../SuggestionBox/SuggestionBox';
import './NetWorthCalculator.css';
import '../../styles/shared-inputs.css';
import '../../styles/shared-page-styles.css';

// Import shared utilities and configurations
import { formatCurrency, formatPercent, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { NET_WORTH_CATEGORIES } from '../../config/netWorthConfig';
import { useLocalStorage, useCSV } from '../../hooks';

const NetWorthCalculator = () => {
  // Use localStorage for data persistence
  const [netWorthData, setNetWorthData] = useLocalStorage(STORAGE_KEYS.NET_WORTH_DATA, {
    accounts: (() => {
      const initialAccounts = {};
      Object.keys(NET_WORTH_CATEGORIES).forEach(category => {
        initialAccounts[category] = NET_WORTH_CATEGORIES[category].defaultAccounts.map((account, index) => ({
          id: `${category}_${index}`,
          ...account
        }));
      });
      return initialAccounts;
    })()
  });
  
  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('networth');
  
  // CSV handlers
  const exportToCSV = () => exportCSV(netWorthData);
  const importFromCSV = createFileInputHandler(setNetWorthData);
  
  // Local state for UI
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  
  // Destructure data for easier access
  const { accounts } = netWorthData;
  
  // Helper function to update net worth data
  const updateNetWorthData = (updates) => {
    setNetWorthData(prev => ({ ...prev, ...updates }));
  };

  // For backward compatibility, keep CATEGORY_CONFIG reference
  const CATEGORY_CONFIG = NET_WORTH_CATEGORIES;

  const calculateCategoryTotal = (category) => {
    return accounts[category].reduce((sum, account) => sum + (account.value || 0), 0);
  };

  const calculateTotalAssets = () => {
    const assetCategories = ['cash', 'investments', 'realEstate', 'retirement', 'other'];
    return assetCategories.reduce((sum, category) => sum + calculateCategoryTotal(category), 0);
  };

  const calculateTotalDebts = () => {
    return calculateCategoryTotal('debts');
  };

  const netWorth = calculateTotalAssets() - calculateTotalDebts();
  const totalAssets = calculateTotalAssets();
  const totalDebts = calculateTotalDebts();

  // Start editing an account name
  const startEditing = (categoryKey, accountIndex) => {
    setEditingAccount({ categoryKey, accountIndex });
    setEditingValue(accounts[categoryKey][accountIndex].name);
  };

  // Save edited account name
  const saveEdit = () => {
    if (!editingAccount || editingValue.trim() === '') return;

    const { categoryKey, accountIndex } = editingAccount;
    const newAccounts = { ...accounts };
    newAccounts[categoryKey][accountIndex].name = editingValue.trim();
    
    updateNetWorthData({ accounts: newAccounts });
    setEditingAccount(null);
    setEditingValue('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingAccount(null);
    setEditingValue('');
  };

  // Handle key press during editing
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Update account value
  const updateAccountValue = (categoryKey, accountIndex, value) => {
    const numValue = value === '' ? 0 : parseNumber(value);
    const newAccounts = { ...accounts };
    newAccounts[categoryKey][accountIndex].value = isNaN(numValue) ? 0 : numValue;
    
    updateNetWorthData({ accounts: newAccounts });
  };

  // Add new account to category
  const addAccount = (categoryKey) => {
    const name = window.prompt('Enter account name:');
    if (name && name.trim()) {
      const newAccounts = { ...accounts };
      newAccounts[categoryKey].push({
        id: `${categoryKey}_${Date.now()}`,
        name: name.trim(),
        value: 0
      });
      
      updateNetWorthData({ accounts: newAccounts });
    }
  };

  // Remove account from category
  const removeAccount = (categoryKey, accountIndex) => {
    const accountName = accounts[categoryKey][accountIndex].name;
    if (window.confirm(`Are you sure you want to remove "${accountName}"?`)) {
      const newAccounts = { ...accounts };
      newAccounts[categoryKey].splice(accountIndex, 1);
      
      updateNetWorthData({ accounts: newAccounts });
    }
  };

  // Toggle category collapse
  const toggleCategory = (categoryKey) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  // Export data to CSV
  const handleExportCSV = () => {
    const data = [];
    Object.entries(accounts).forEach(([categoryKey, categoryAccounts]) => {
      categoryAccounts.forEach(account => {
        data.push({
          Category: CATEGORY_CONFIG[categoryKey].name,
          Account: account.name,
          Value: account.value,
          Type: categoryKey === 'debts' ? 'Liability' : 'Asset'
        });
      });
    });
    
    // Add summary
    data.push(
      { Category: 'SUMMARY', Account: 'Total Assets', Value: totalAssets, Type: 'Asset' },
      { Category: 'SUMMARY', Account: 'Total Debts', Value: totalDebts, Type: 'Liability' },
      { Category: 'SUMMARY', Account: 'Net Worth', Value: netWorth, Type: 'Net' }
    );
    
    exportCSV(data, 'networth_data.csv');
  };

  // Import CSV data
  const handleImportCSV = createFileInputHandler(
    (result) => {
      const newAccounts = { ...accounts };
      
      // Clear existing accounts first
      Object.keys(newAccounts).forEach(category => {
        newAccounts[category] = [];
      });
      
      // Import data
      result.data.forEach(row => {
        const categoryName = row.Category;
        const accountName = row.Account;
        const value = parseNumber(row.Value);
        
        // Find category by name
        const categoryKey = Object.keys(CATEGORY_CONFIG).find(key => 
          CATEGORY_CONFIG[key].name === categoryName
        );
        
        if (categoryKey && accountName && accountName !== 'Total Assets' && accountName !== 'Total Debts' && accountName !== 'Net Worth') {
          newAccounts[categoryKey].push({
            id: `${categoryKey}_${Date.now()}_${Math.random()}`,
            name: accountName,
            value: value
          });
        }
      });
      
      updateNetWorthData({ accounts: newAccounts });
    },
    (error) => console.error('Error importing net worth data:', error),
    ['Category', 'Account', 'Value', 'Type']
  );

  // Calculate financial health score
  const calculateFinancialHealthScore = () => {
    let score = 0;
    const liquidAssets = calculateCategoryTotal('cash');
    
    // Net worth factor (40 points)
    if (netWorth > 500000) score += 40;
    else if (netWorth > 100000) score += 30;
    else if (netWorth > 25000) score += 20;
    else if (netWorth > 0) score += 10;
    else score -= 20;
    
    // Liquidity factor (20 points)
    const liquidityRatio = totalAssets > 0 ? (liquidAssets / totalAssets) * 100 : 0;
    if (liquidityRatio > 30) score += 20;
    else if (liquidityRatio > 20) score += 15;
    else if (liquidityRatio > 10) score += 10;
    else score += 5;
    
    // Debt ratio factor (20 points)
    const debtRatio = totalAssets > 0 ? (totalDebts / totalAssets) * 100 : 0;
    if (debtRatio < 10) score += 20;
    else if (debtRatio < 30) score += 15;
    else if (debtRatio < 50) score += 10;
    else if (debtRatio < 70) score += 5;
    else score -= 10;
    
    // Investment diversification (20 points)
    const investmentAssets = calculateCategoryTotal('investments') + calculateCategoryTotal('retirement');
    const diversificationRatio = totalAssets > 0 ? (investmentAssets / totalAssets) * 100 : 0;
    if (diversificationRatio > 60) score += 20;
    else if (diversificationRatio > 40) score += 15;
    else if (diversificationRatio > 20) score += 10;
    else if (diversificationRatio > 5) score += 5;
    else score += 0;
    
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateFinancialHealthScore();
  const getHealthScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Prepare data for charts
  const prepareAssetData = () => {
    const assetCategories = ['cash', 'investments', 'realEstate', 'retirement', 'other'];
    return assetCategories.map(key => {
      const total = calculateCategoryTotal(key);
      const percentage = totalAssets > 0 ? (total / totalAssets * 100) : 0;
      return {
        id: key,
        label: `${CATEGORY_CONFIG[key].name}: ${formatPercent(percentage)}%`,
        value: Math.max(0, percentage),
        color: CATEGORY_CONFIG[key].color,
        amount: total
      };
    }).filter(item => item.value > 0);
  };

  const prepareNetWorthData = () => {
    return [
      {
        id: 'assets',
        label: `Assets: ${formatCurrency(totalAssets)}`,
        value: totalAssets,
        color: '#22c55e'
      },
      {
        id: 'debts',
        label: `Debts: ${formatCurrency(totalDebts)}`,
        value: totalDebts,
        color: '#ef4444'
      }
    ].filter(item => item.value > 0);
  };

  const navigationActions = [
    {
      label: 'Export CSV',
      icon: <Download size={16} />,
      onClick: exportToCSV,
      variant: 'btn-ghost',
      hideTextOnMobile: true
    },
    {
      label: 'Import CSV',
      icon: <Upload size={16} />,
      onClick: () => document.getElementById('csv-upload').click(),
      variant: 'btn-ghost',
      hideTextOnMobile: true
    }
  ];

  return (
    <div className="page-container">
      <Navigation 
        actions={navigationActions}
      />
      
      {/* Hidden file input */}
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        onChange={importFromCSV}
        style={{ display: 'none' }}
      />
      
      {/* Header */}
      <div className="budget-header">
        <div className="budget-header-content">
          <h1 className="budget-title">Net Worth Calculator</h1>
          <p className="budget-subtitle">Track your assets, liabilities, and overall financial health</p>
        </div>
      </div>

      {/* Overview Section */}
      <div className="budget-intro-section">
        <h2 className="intro-title">Track Your Financial Health</h2>
        <p>
          Monitor your assets, liabilities, and net worth with detailed categorization and insightful analysis.
        </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Add your assets across different categories</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>Enter your debts and liabilities</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Review your net worth and financial health score</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Analyze insights and export your data</span>
          </div>
        </div>
        <p className="intro-note">
          💰 Real-time calculations • 📊 Visual insights • 💾 Export/import CSV files
        </p>
      </div>

      <div className="budget-content">
        {/* Summary Dashboard */}
        <div className="budget-dashboard">
        <div className="dashboard-card">
          <div className="dashboard-icon">
            <DollarSign size={24} />
          </div>
          <div className="dashboard-content">
            <div className="dashboard-value">{formatCurrency(netWorth)}</div>
            <div className="dashboard-label">Net Worth</div>
            <div className="dashboard-sublabel">
              {netWorth >= 0 ? (
                <span className="positive">
                  <TrendingUp size={16} />
                  Assets exceed debts
                </span>
              ) : (
                <span className="negative">
                  <TrendingDown size={16} />
                  Debts exceed assets
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            <TrendingUp size={24} />
          </div>
          <div className="dashboard-content">
            <div className="dashboard-value">{formatCurrency(totalAssets)}</div>
            <div className="dashboard-label">Total Assets</div>
            <div className="dashboard-sublabel">All your valuable holdings</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            <TrendingDown size={24} />
          </div>
          <div className="dashboard-content">
            <div className="dashboard-value">{formatCurrency(totalDebts)}</div>
            <div className="dashboard-label">Total Debts</div>
            <div className="dashboard-sublabel">All money you owe</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-icon">
            <Target size={24} />
          </div>
          <div className="dashboard-content">
            <div className="dashboard-value" style={{ color: getHealthScoreColor(healthScore) }}>
              {Math.round(healthScore)}
            </div>
            <div className="dashboard-label">Health Score</div>
            <div className="dashboard-sublabel">{getHealthScoreLabel(healthScore)}</div>
          </div>
        </div>
      </div>

        {/* Account Tables */}
        <div className="budget-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <DollarSign size={16} />
              </div>
              Your Accounts
            </h2>
            <div className="section-actions">
              <button className="btn-primary" onClick={handleExportCSV}>
                <Download size={16} />
                Export CSV
              </button>
              <label className="btn-primary">
                <Upload size={16} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
          <div className="section-content">

            <div className="accounts-grid">
            {Object.entries(CATEGORY_CONFIG).map(([categoryKey, categoryConfig]) => {
              const Icon = categoryConfig.icon;
              const categoryTotal = calculateCategoryTotal(categoryKey);
              const isCollapsed = collapsedCategories[categoryKey];
              
              return (
                <div key={categoryKey} className="account-category">
                  <div 
                    className="category-header"
                    onClick={() => toggleCategory(categoryKey)}
                    style={{ borderColor: categoryConfig.color }}
                  >
                    <div className="category-header-left">
                      <div 
                        className="category-icon"
                        style={{ backgroundColor: categoryConfig.color }}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="category-info">
                        <h3 className="category-name">{categoryConfig.name}</h3>
                        <p className="category-description">{categoryConfig.description}</p>
                      </div>
                    </div>
                    <div className="category-total">
                      <span className="total-amount">{formatCurrency(categoryTotal)}</span>
                      <span className="collapse-icon">
                        {isCollapsed ? '+' : '−'}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="category-content">
                      <div className="accounts-table">
                        <div className="table-header">
                          <span>Account Name</span>
                          <span>Value</span>
                          <span>Actions</span>
                        </div>
                        {accounts[categoryKey].map((account, index) => (
                          <div key={account.id} className="table-row">
                            <div className="account-name">
                              {editingAccount?.categoryKey === categoryKey && editingAccount?.accountIndex === index ? (
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={handleKeyDown}
                                  className="edit-input"
                                  autoFocus
                                />
                              ) : (
                                <span onClick={() => startEditing(categoryKey, index)}>
                                  {account.name}
                                </span>
                              )}
                            </div>
                            <div className="account-value">
                              <div className="input-wrapper">
                                <span className="input-prefix">$</span>
                                <input
                                  type="number"
                                  value={account.value || ''}
                                  onChange={(e) => updateAccountValue(categoryKey, index, e.target.value)}
                                  className="value-input"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="account-actions">
                              <button
                                className="action-btn edit"
                                onClick={() => startEditing(categoryKey, index)}
                                title="Edit name"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => removeAccount(categoryKey, index)}
                                title="Remove account"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="table-footer">
                          <button
                            className="add-account-btn"
                            onClick={() => addAccount(categoryKey)}
                          >
                            <Plus size={16} />
                            Add Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="budget-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <PieChartIcon size={16} />
              </div>
              Data Visualization
            </h2>
          </div>
          <div className="section-content">
            <div className="charts-section">
          <div className="chart-container">
            <h3 className="chart-title">Asset Allocation</h3>
            {totalAssets > 0 ? (
              <div className="chart-wrapper">
                <PieChart
                  series={[{
                    data: prepareAssetData(),
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                  }]}
                  height={300}
                  slotProps={{
                    legend: { hidden: true }
                  }}
                />
                <div className="chart-legend">
                  {prepareAssetData().map(item => (
                    <div key={item.id} className="legend-item">
                      <div 
                        className="legend-color"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="legend-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart">
                <AlertTriangle size={48} />
                <p>Add some assets to see your allocation</p>
              </div>
            )}
          </div>

          <div className="chart-container">
            <h3 className="chart-title">Assets vs Debts</h3>
            {(totalAssets > 0 || totalDebts > 0) ? (
              <div className="chart-wrapper">
                <PieChart
                  series={[{
                    data: prepareNetWorthData(),
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                  }]}
                  height={300}
                  slotProps={{
                    legend: { hidden: true }
                  }}
                />
                <div className="chart-legend">
                  {prepareNetWorthData().map(item => (
                    <div key={item.id} className="legend-item">
                      <div 
                        className="legend-color"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="legend-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart">
                <AlertTriangle size={48} />
                <p>Add assets or debts to see the breakdown</p>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>

        {/* Financial Health Insights */}
        <div className="budget-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Lightbulb size={16} />
              </div>
              Financial Health Insights
            </h2>
          </div>
          <div className="section-content">
          
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-header">
                <h4>Emergency Fund</h4>
                <Info size={16} />
              </div>
              <div className="insight-content">
                <div className="insight-value">
                  {formatCurrency(calculateCategoryTotal('cash'))}
                </div>
                <div className="insight-description">
                  {calculateCategoryTotal('cash') >= 15000 ? (
                    <span className="status-good">
                      <CheckCircle size={16} />
                      Great emergency fund!
                    </span>
                  ) : (
                    <span className="status-warning">
                      <AlertTriangle size={16} />
                      Consider building emergency fund
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>Debt-to-Asset Ratio</h4>
                <Info size={16} />
              </div>
              <div className="insight-content">
                <div className="insight-value">
                  {totalAssets > 0 ? formatPercent((totalDebts / totalAssets) * 100) : '0'}%
                </div>
                <div className="insight-description">
                  {totalAssets > 0 && (totalDebts / totalAssets) < 0.3 ? (
                    <span className="status-good">
                      <CheckCircle size={16} />
                      Low debt ratio
                    </span>
                  ) : (
                    <span className="status-warning">
                      <AlertTriangle size={16} />
                      Consider reducing debt
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-header">
                <h4>Investment Ratio</h4>
                <Info size={16} />
              </div>
              <div className="insight-content">
                <div className="insight-value">
                  {totalAssets > 0 ? formatPercent(((calculateCategoryTotal('investments') + calculateCategoryTotal('retirement')) / totalAssets) * 100) : '0'}%
                </div>
                <div className="insight-description">
                  {totalAssets > 0 && ((calculateCategoryTotal('investments') + calculateCategoryTotal('retirement')) / totalAssets) > 0.4 ? (
                    <span className="status-good">
                      <CheckCircle size={16} />
                      Well diversified
                    </span>
                  ) : (
                    <span className="status-warning">
                      <AlertTriangle size={16} />
                      Consider more investments
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <SuggestionBox />
    </div>
  );
};

export default NetWorthCalculator;