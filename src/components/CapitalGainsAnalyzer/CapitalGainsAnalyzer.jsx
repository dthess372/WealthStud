import { useState } from 'react';
import Navigation from '../shared/Navigation';
import { 
  TrendingUp, 
  Calculator,
  Download,
  Upload,
  Plus,
  Trash2,
  BarChart3,
  Edit2
} from 'lucide-react';
import { PieChart } from '@mui/x-charts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import SuggestionBox from '../SuggestionBox/SuggestionBox';
import './CapitalGainsAnalyzer.css';
import '../../styles/shared-page-styles.css';

// Import shared utilities and configurations
import { 
  parseNumber, 
  formatCurrency, 
  formatPercent
} from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';

// Tax brackets for capital gains (2024)
const CAPITAL_GAINS_BRACKETS = {
  longTerm: {
    single: [
      { min: 0, max: 47025, rate: 0 },
      { min: 47025, max: 518900, rate: 0.15 },
      { min: 518900, max: Infinity, rate: 0.20 }
    ],
    married: [
      { min: 0, max: 94050, rate: 0 },
      { min: 94050, max: 583750, rate: 0.15 },
      { min: 583750, max: Infinity, rate: 0.20 }
    ]
  },
  shortTerm: {
    // Short-term gains are taxed as ordinary income
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ],
    married: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 }
    ]
  }
};

// State capital gains tax rates
const STATE_CAPITAL_GAINS = {
  'AL': { rate: 0.05, name: 'Alabama' },
  'AK': { rate: 0, name: 'Alaska' },
  'AZ': { rate: 0.025, name: 'Arizona' },
  'AR': { rate: 0.059, name: 'Arkansas' },
  'CA': { rate: 0.133, name: 'California' },
  'CO': { rate: 0.044, name: 'Colorado' },
  'CT': { rate: 0.0699, name: 'Connecticut' },
  'DE': { rate: 0.066, name: 'Delaware' },
  'FL': { rate: 0, name: 'Florida' },
  'GA': { rate: 0.0575, name: 'Georgia' },
  'HI': { rate: 0.079, name: 'Hawaii' },
  'ID': { rate: 0.058, name: 'Idaho' },
  'IL': { rate: 0.0495, name: 'Illinois' },
  'IN': { rate: 0.0323, name: 'Indiana' },
  'IA': { rate: 0.086, name: 'Iowa' },
  'KS': { rate: 0.057, name: 'Kansas' },
  'KY': { rate: 0.05, name: 'Kentucky' },
  'LA': { rate: 0.0425, name: 'Louisiana' },
  'ME': { rate: 0.0715, name: 'Maine' },
  'MD': { rate: 0.0575, name: 'Maryland' },
  'MA': { rate: 0.05, name: 'Massachusetts' },
  'MI': { rate: 0.0425, name: 'Michigan' },
  'MN': { rate: 0.0985, name: 'Minnesota' },
  'MS': { rate: 0.05, name: 'Mississippi' },
  'MO': { rate: 0.054, name: 'Missouri' },
  'MT': { rate: 0.069, name: 'Montana' },
  'NE': { rate: 0.0684, name: 'Nebraska' },
  'NV': { rate: 0, name: 'Nevada' },
  'NH': { rate: 0, name: 'New Hampshire' },
  'NJ': { rate: 0.1075, name: 'New Jersey' },
  'NM': { rate: 0.059, name: 'New Mexico' },
  'NY': { rate: 0.0882, name: 'New York' },
  'NC': { rate: 0.0525, name: 'North Carolina' },
  'ND': { rate: 0.029, name: 'North Dakota' },
  'OH': { rate: 0.0399, name: 'Ohio' },
  'OK': { rate: 0.05, name: 'Oklahoma' },
  'OR': { rate: 0.099, name: 'Oregon' },
  'PA': { rate: 0.0307, name: 'Pennsylvania' },
  'RI': { rate: 0.0599, name: 'Rhode Island' },
  'SC': { rate: 0.07, name: 'South Carolina' },
  'SD': { rate: 0, name: 'South Dakota' },
  'TN': { rate: 0, name: 'Tennessee' },
  'TX': { rate: 0, name: 'Texas' },
  'UT': { rate: 0.0485, name: 'Utah' },
  'VT': { rate: 0.0875, name: 'Vermont' },
  'VA': { rate: 0.0575, name: 'Virginia' },
  'WA': { rate: 0.07, name: 'Washington' }, // Only on high earners
  'WV': { rate: 0.065, name: 'West Virginia' },
  'WI': { rate: 0.0765, name: 'Wisconsin' },
  'WY': { rate: 0, name: 'Wyoming' },
  'DC': { rate: 0.0895, name: 'District of Columbia' }
};

const CapitalGainsAnalyzer = () => {
  // Use localStorage for data persistence
  const [capitalGainsData, setCapitalGainsData] = useLocalStorage(STORAGE_KEYS.CAPITAL_GAINS_DATA, {
    trades: [],
    taxSettings: {
      filingStatus: 'single',
      state: 'MI',
      taxableIncome: 100000,
      niitApplies: false // Net Investment Income Tax
    }
  });
  
  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('capital_gains');
  
  // Destructure data for easier access
  const { trades, taxSettings } = capitalGainsData;
  
  // Helper function to update capital gains data
  const updateCapitalGainsData = (updates) => {
    setCapitalGainsData(prev => ({ ...prev, ...updates }));
  };
  
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [newTrade, setNewTrade] = useState({
    asset: '',
    purchaseDate: '',
    purchasePrice: '',
    quantity: '',
    saleDate: '',
    salePrice: '',
    fees: 0
  });

  const calculateDaysHeld = (purchaseDate, saleDate) => {
    const purchase = new Date(purchaseDate);
    const sale = new Date(saleDate);
    const diffTime = Math.abs(sale - purchase);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isLongTerm = (purchaseDate, saleDate) => {
    return calculateDaysHeld(purchaseDate, saleDate) > 365;
  };

  const calculateGainLoss = (trade) => {
    const totalPurchase = (trade.purchasePrice * trade.quantity) + (trade.fees || 0);
    const totalSale = trade.salePrice * trade.quantity;
    return totalSale - totalPurchase;
  };

  const calculateTaxRate = (income, isLongTermGain, filingStatus) => {
    const brackets = isLongTermGain 
      ? CAPITAL_GAINS_BRACKETS.longTerm[filingStatus]
      : CAPITAL_GAINS_BRACKETS.shortTerm[filingStatus];
    
    for (const bracket of brackets) {
      if (income >= bracket.min && income < bracket.max) {
        return bracket.rate;
      }
    }
    return 0;
  };

  // Calculate totals
  const calculateTotals = () => {
    let shortTermGains = 0;
    let shortTermLosses = 0;
    let longTermGains = 0;
    let longTermLosses = 0;

    trades.forEach(trade => {
      const gainLoss = calculateGainLoss(trade);
      const isLT = isLongTerm(trade.purchaseDate, trade.saleDate);
      
      if (isLT) {
        if (gainLoss > 0) longTermGains += gainLoss;
        else longTermLosses += Math.abs(gainLoss);
      } else {
        if (gainLoss > 0) shortTermGains += gainLoss;
        else shortTermLosses += Math.abs(gainLoss);
      }
    });

    // Net out gains and losses
    const netShortTerm = shortTermGains - shortTermLosses;
    const netLongTerm = longTermGains - longTermLosses;
    
    // Apply loss limitations
    let taxableShortTerm = netShortTerm;
    let taxableLongTerm = netLongTerm;
    let carryforwardLoss = 0;
    
    if (netShortTerm < 0 && netLongTerm < 0) {
      const totalLoss = netShortTerm + netLongTerm;
      const maxDeductible = -3000;
      if (totalLoss < maxDeductible) {
        carryforwardLoss = totalLoss - maxDeductible;
        taxableShortTerm = maxDeductible * (netShortTerm / totalLoss);
        taxableLongTerm = maxDeductible * (netLongTerm / totalLoss);
      }
    }

    // Calculate taxes
    const shortTermRate = calculateTaxRate(
      taxSettings.taxableIncome + Math.max(0, taxableShortTerm),
      false,
      taxSettings.filingStatus
    );
    const longTermRate = calculateTaxRate(
      taxSettings.taxableIncome,
      true,
      taxSettings.filingStatus
    );
    
    const federalShortTermTax = Math.max(0, taxableShortTerm) * shortTermRate;
    const federalLongTermTax = Math.max(0, taxableLongTerm) * longTermRate;
    const stateTax = (Math.max(0, taxableShortTerm) + Math.max(0, taxableLongTerm)) * 
                     STATE_CAPITAL_GAINS[taxSettings.state].rate;
    
    // Net Investment Income Tax (3.8% on investment income for high earners)
    let niitTax = 0;
    if (taxSettings.niitApplies) {
      const niitThreshold = taxSettings.filingStatus === 'married' ? 250000 : 200000;
      if (taxSettings.taxableIncome > niitThreshold) {
        niitTax = (Math.max(0, taxableShortTerm) + Math.max(0, taxableLongTerm)) * 0.038;
      }
    }
    
    const totalTax = federalShortTermTax + federalLongTermTax + stateTax + niitTax;
    const effectiveRate = (taxableShortTerm + taxableLongTerm) > 0 
      ? totalTax / (taxableShortTerm + taxableLongTerm) 
      : 0;

    return {
      shortTermGains,
      shortTermLosses,
      longTermGains,
      longTermLosses,
      netShortTerm,
      netLongTerm,
      taxableShortTerm,
      taxableLongTerm,
      carryforwardLoss,
      federalShortTermTax,
      federalLongTermTax,
      shortTermRate,
      longTermRate,
      stateTax,
      niitTax,
      totalTax,
      effectiveRate,
      totalGainLoss: taxableShortTerm + taxableLongTerm,
      afterTaxProfit: (taxableShortTerm + taxableLongTerm) - totalTax
    };
  };

  // Trade management
  const handleAddTrade = () => {
    if (newTrade.asset && newTrade.purchaseDate && newTrade.saleDate && 
        newTrade.purchasePrice && newTrade.salePrice && newTrade.quantity) {
      
      const trade = {
        id: editingTrade ? editingTrade.id : Date.now(),
        ...newTrade,
        purchasePrice: parseNumber(newTrade.purchasePrice),
        salePrice: parseNumber(newTrade.salePrice),
        quantity: parseNumber(newTrade.quantity),
        fees: parseNumber(newTrade.fees)
      };
      
      if (editingTrade) {
        updateCapitalGainsData({ 
          trades: trades.map(t => t.id === editingTrade.id ? trade : t) 
        });
      } else {
        updateCapitalGainsData({ 
          trades: [...trades, trade] 
        });
      }
      
      setNewTrade({
        asset: '',
        purchaseDate: '',
        purchasePrice: '',
        quantity: '',
        saleDate: '',
        salePrice: '',
        fees: 0
      });
      setEditingTrade(null);
      setShowTradeModal(false);
    }
  };

  const handleEditTrade = (trade) => {
    setNewTrade({
      asset: trade.asset,
      purchaseDate: trade.purchaseDate,
      purchasePrice: trade.purchasePrice.toString(),
      quantity: trade.quantity.toString(),
      saleDate: trade.saleDate,
      salePrice: trade.salePrice.toString(),
      fees: trade.fees.toString()
    });
    setEditingTrade(trade);
    setShowTradeModal(true);
  };

  const handleDeleteTrade = (id) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      updateCapitalGainsData({ 
        trades: trades.filter(t => t.id !== id) 
      });
    }
  };

  // CSV Export using shared functionality
  const handleExportCSV = () => {
    const data = trades.map(trade => {
      const gainLoss = calculateGainLoss(trade);
      const type = isLongTerm(trade.purchaseDate, trade.saleDate) ? 'Long-term' : 'Short-term';
      return {
        Asset: trade.asset,
        'Purchase Date': trade.purchaseDate,
        'Purchase Price': trade.purchasePrice,
        Quantity: trade.quantity,
        'Sale Date': trade.saleDate,
        'Sale Price': trade.salePrice,
        Fees: trade.fees || 0,
        'Gain/Loss': gainLoss.toFixed(2),
        Type: type
      };
    });
    
    exportCSV(data, 'capital_gains_data.csv');
  };

  // CSV Import using shared functionality
  const handleImportCSV = createFileInputHandler(
    (result) => {
      const importedTrades = result.data.map(row => ({
        id: Date.now() + Math.random(),
        asset: row.Asset || '',
        purchaseDate: row['Purchase Date'] || '',
        purchasePrice: parseNumber(row['Purchase Price']),
        quantity: parseNumber(row.Quantity),
        saleDate: row['Sale Date'] || '',
        salePrice: parseNumber(row['Sale Price']),
        fees: parseNumber(row.Fees)
      })).filter(trade => trade.asset && trade.purchaseDate && trade.saleDate);
      
      updateCapitalGainsData({ 
        trades: [...trades, ...importedTrades] 
      });
    },
    (error) => console.error('Error importing capital gains data:', error),
    ['Asset', 'Purchase Date', 'Purchase Price', 'Quantity', 'Sale Date', 'Sale Price', 'Fees']
  );

  // Chart data preparation
  // const prepareMonthlyData = () => {
  //   const monthlyData = {};
    
  //     trades.forEach(trade => {
  //       const saleMonth = new Date(trade.saleDate).toISOString().slice(0, 7);
  //       const gainLoss = calculateGainLoss(trade);
  //       const type = isLongTerm(trade.purchaseDate, trade.saleDate) ? 'longTerm' : 'shortTerm';
  //       
  //       if (!monthlyData[saleMonth]) {
  //         monthlyData[saleMonth] = { month: saleMonth, shortTerm: 0, longTerm: 0 };
  //       }
  //       
  //       monthlyData[saleMonth][type] += gainLoss;
  //     });
  //     
  //     return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  // };

  // Get calculated values
  const {
    shortTermGains,
    longTermGains
    // totalTax,
    // longTermRate,
    // effectiveRate
  } = calculateTotals();

  // Calculate capital gains tax for display
  const calculateCapitalGainsTax = () => {
    const totals = calculateTotals();
    return {
      shortTermTax: totals.federalShortTermTax,
      longTermTax: totals.federalLongTermTax,
      stateTax: totals.stateTax,
      niitTax: totals.niitTax,
      totalTax: totals.totalTax,
      longTermRate: totals.longTermRate,
      shortTermRate: totals.shortTermRate
    };
  };

  // Chart data functions
  const getChartData = () => {
    return trades.map(trade => ({
      asset: trade.asset,
      gainLoss: calculateGainLoss(trade),
      type: isLongTerm(trade.purchaseDate, trade.saleDate) ? 'Long-term' : 'Short-term'
    }));
  };

  const getPieChartData = () => {
    const data = [];
    if (shortTermGains > 0) {
      data.push({ id: 0, value: shortTermGains, label: 'Short-term Gains' });
    }
    if (longTermGains > 0) {
      data.push({ id: 1, value: longTermGains, label: 'Long-term Gains' });
    }
    return data;
  };

  // Function aliases for the JSX
  const addTrade = handleAddTrade;
  const updateTrade = handleAddTrade;
  const importCSV = handleImportCSV;

  // const prepareAssetData = () => {
  //     const assetData = {};
  //     
  //     trades.forEach(trade => {
  //       const gainLoss = calculateGainLoss(trade);
  //       if (!assetData[trade.asset]) {
  //         assetData[trade.asset] = { gains: 0, losses: 0 };
  //       }
  //       
  //       if (gainLoss > 0) {
  //         assetData[trade.asset].gains += gainLoss;
  //       } else {
  //         assetData[trade.asset].losses += Math.abs(gainLoss);
  //       }
  //     });
  //     
  //     return Object.entries(assetData).map(([asset, data]) => ({
  //       asset,
  //       gains: data.gains,
  //       losses: -data.losses,
  //       net: data.gains - data.losses
  //     }));
  // };

  const totals = calculateTotals();
  // const monthlyData = prepareMonthlyData();
  // const assetData = prepareAssetData();

  // Tax optimization tips
  // const getTaxOptimizationTips = () => {
  //   const tips = [];
  //     
  //     if (totals.netShortTerm > 0 && totals.shortTermRate > totals.longTermRate) {
  //       tips.push({
  //         icon: AlertCircle,
  //         type: 'warning',
  //         text: `Consider holding assets for over 1 year to qualify for lower long-term capital gains rates (${formatPercent(totals.longTermRate * 100)} vs ${formatPercent(totals.shortTermRate * 100)}).`
  //       });
  //     }
  //     
  //     if (totals.carryforwardLoss < 0) {
  //       tips.push({
  //         icon: Info,
  //         type: 'info',
  //         text: `You have ${formatCurrency(Math.abs(totals.carryforwardLoss))} in losses that will carry forward to next year.`
  //       });
  //     }
  //     
  //     if (totals.netLongTerm > 0 && totals.netShortTerm < 0) {
  //       tips.push({
  //         icon: CheckCircle,
  //         type: 'success',
  //         text: 'Your short-term losses are offsetting some long-term gains, reducing your overall tax liability.'
  //       });
  //     }
  //     
  //     if (STATE_CAPITAL_GAINS[taxSettings.state].rate === 0) {
  //       tips.push({
  //         icon: CheckCircle,
  //         type: 'success',
  //         text: `${STATE_CAPITAL_GAINS[taxSettings.state].name} has no state capital gains tax, saving you money.`
  //       });
  //     }
  //     
  //     if (totals.netShortTerm > 10000) {
  //       tips.push({
  //         icon: Info,
  //         type: 'info',
  //         text: 'Consider tax-loss harvesting strategies to offset some of your short-term gains.'
  //       });
  //     }
  //     
  //   //   return tips;
  // };

  return (
    <div className="page-container">
      <Navigation 
        actions={[
          { label: 'Export CSV', onClick: handleExportCSV, icon: Download },
          { label: 'Import CSV', onClick: importCSV, icon: Upload }
        ]}
      />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Capital Gains Analyzer</h1>
          <p className="page-subtitle">Track trades and calculate tax obligations with smart analysis</p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="page-intro-section">
        <h2 className="intro-title">Smart Capital Gains Management</h2>
        <p>
          Track your investment trades, calculate short-term and long-term capital gains, 
          and understand your tax obligations with comprehensive analysis tools.
        </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Add your stock, crypto, or asset trades</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>View automatic gain/loss calculations</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>See federal and state tax implications</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Get tax optimization strategies</span>
          </div>
        </div>
        <p className="intro-note">
          📊 Real-time tax calculations • 📈 Short vs long-term analysis • 💡 Tax optimization tips • 💾 Export capabilities
        </p>
      </div>

      <div className="page-content">
        {/* Dashboard */}
        <div className="summary-grid">
          <div className={`dashboard-card ${totals.totalGainLoss >= 0 ? 'success' : 'danger'}`}>
            <div className="dashboard-value">
              ${formatCurrency(Math.abs(totals.totalGainLoss))}
            </div>
            <div className="dashboard-label">
              Net {totals.totalGainLoss >= 0 ? 'Gain' : 'Loss'}
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">${formatCurrency(totals.totalTax)}</div>
            <div className="dashboard-label">Estimated Tax</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">${formatCurrency(totals.afterTaxProfit)}</div>
            <div className="dashboard-label">After-Tax Profit</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">{formatPercent(totals.effectiveRate * 100)}%</div>
            <div className="dashboard-label">Effective Tax Rate</div>
          </div>
          <div className={`dashboard-card ${totals.carryforwardLoss < 0 ? 'warning' : ''}`}>
            <div className="dashboard-value">${formatCurrency(Math.abs(totals.carryforwardLoss))}</div>
            <div className="dashboard-label">Loss Carryforward</div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Calculator size={16} />
              </div>
              Tax Settings
            </h2>
          </div>
            <div className="settings-grid">
              <div className="input-group">
                <label className="input-label">Filing Status</label>
                <select 
                  className="input-field no-prefix"
                  value={taxSettings.filingStatus}
                  onChange={(e) => updateCapitalGainsData({
                    taxSettings: { ...taxSettings, filingStatus: e.target.value }
                  })}
                >
                  <option value="single">Single</option>
                  <option value="married">Married Filing Jointly</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">State</label>
                <select 
                  className="input-field no-prefix"
                  value={taxSettings.state}
                  onChange={(e) => updateCapitalGainsData({
                    taxSettings: { ...taxSettings, state: e.target.value }
                  })}
                >
                  {Object.entries(STATE_CAPITAL_GAINS).map(([code, data]) => (
                    <option key={code} value={code}>{data.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Taxable Income (for rate calculation)</label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input 
                    type="number" 
                    className="input-field"
                    value={taxSettings.taxableIncome}
                    onChange={(e) => updateCapitalGainsData({
                      taxSettings: { ...taxSettings, taxableIncome: parseNumber(e.target.value) }
                    })}
                    placeholder="100000"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    checked={taxSettings.niitApplies}
                    onChange={(e) => updateCapitalGainsData({
                      taxSettings: { ...taxSettings, niitApplies: e.target.checked }
                    })}
                  />
                  <span>Subject to Net Investment Income Tax (3.8%)</span>
                </label>
              </div>
            </div>
        </div>

        {/* Trades Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <TrendingUp size={16} />
              </div>
              Investment Trades
            </h2>
            <button className="btn-primary" onClick={() => setShowTradeModal(true)}>
              <Plus size={16} />
              Add Trade
            </button>
          </div>
            {trades.length === 0 ? (
              <div className="empty-state">
                <p>No trades added yet. Click &quot;Add Trade&quot; to get started.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="trades-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Purchase Date</th>
                      <th>Sale Date</th>
                      <th>Quantity</th>
                      <th>Purchase Price</th>
                      <th>Sale Price</th>
                      <th>Gain/Loss</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => {
                      const gainLoss = calculateGainLoss(trade);
                      const isLT = isLongTerm(trade.purchaseDate, trade.saleDate);
                      const daysHeld = calculateDaysHeld(trade.purchaseDate, trade.saleDate);
                      
                      return (
                        <tr key={trade.id} className={gainLoss >= 0 ? 'gain-row' : 'loss-row'}>
                          <td className="asset-cell">{trade.asset}</td>
                          <td>{new Date(trade.purchaseDate).toLocaleDateString()}</td>
                          <td>{new Date(trade.saleDate).toLocaleDateString()}</td>
                          <td>{trade.quantity}</td>
                          <td>${formatCurrency(trade.purchasePrice)}</td>
                          <td>${formatCurrency(trade.salePrice)}</td>
                          <td className={gainLoss >= 0 ? 'gain-amount' : 'loss-amount'}>
                            {gainLoss >= 0 ? '+' : '-'}${formatCurrency(Math.abs(gainLoss))}
                          </td>
                          <td>
                            <span className={`type-badge ${isLT ? 'long-term' : 'short-term'}`}>
                              {isLT ? 'Long-term' : 'Short-term'}
                              <span className="days-held">({daysHeld} days)</span>
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Edit2 
                                size={16} 
                                className="action-icon edit"
                                onClick={() => handleEditTrade(trade)}
                              />
                              <Trash2 
                                size={16} 
                                className="action-icon delete"
                                onClick={() => handleDeleteTrade(trade.id)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* Tax Analysis Section */}
        {trades.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <div className="section-icon">
                  <Calculator size={16} />
                </div>
                Tax Analysis
              </h2>
            </div>
                <div className="tax-summary-grid">
                <div className="tax-card">
                  <h3>Short-term Gains</h3>
                  <div className="tax-amount">${formatCurrency(Math.abs(shortTermGains))}</div>
                  <div className="tax-rate">Taxed as ordinary income</div>
                </div>
                <div className="tax-card">
                  <h3>Long-term Gains</h3>
                  <div className="tax-amount">${formatCurrency(Math.abs(longTermGains))}</div>
                  <div className="tax-rate">{(calculateCapitalGainsTax().longTermRate * 100).toFixed(1)}% rate</div>
                </div>
                <div className="tax-card total">
                  <h3>Total Tax Owed</h3>
                  <div className="tax-amount">${formatCurrency(calculateCapitalGainsTax().totalTax)}</div>
                  <div className="tax-rate">Federal + State + NIIT</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {trades.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <div className="section-icon">
                  <BarChart3 size={16} />
                </div>
                Performance Charts
              </h2>
            </div>
                <div className="charts-grid">
                <div className="chart-container">
                  <h3>Gains vs Losses</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="asset" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${formatCurrency(Math.abs(value))}`, value >= 0 ? 'Gain' : 'Loss']} />
                      <Bar dataKey="gainLoss" fill={(entry) => entry.gainLoss >= 0 ? '#10b981' : '#ef4444'} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="chart-container">
                  <h3>Tax Type Distribution</h3>
                  <div className="pie-chart-wrapper">
                    <PieChart
                      series={[
                        {
                          data: getPieChartData(),
                          innerRadius: 40,
                          outerRadius: 120,
                          cx: 150,
                          cy: 150
                        }
                      ]}
                      width={300}
                      height={300}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export/Import Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Download size={16} />
              </div>
              Data Management
            </h2>
          </div>
            <div className="action-buttons-row">
              <button className="btn-secondary" onClick={handleExportCSV}>
                <Download size={16} />
                Export Trades
              </button>
              <label className="btn-secondary">
                <Upload size={16} />
                Import Trades
                <input
                  type="file"
                  accept=".csv"
                  onChange={importCSV}
                  className="hidden-input"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Trade Modal */}
        {showTradeModal && (
          <div className="modal-overlay" onClick={() => setShowTradeModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingTrade ? 'Edit Trade' : 'Add New Trade'}</h3>
                <button 
                  className="close-button"
                  onClick={() => setShowTradeModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">Asset Name</label>
                    <input
                      type="text"
                      className="input-field no-prefix"
                      value={newTrade.asset}
                      onChange={(e) => setNewTrade({ ...newTrade, asset: e.target.value })}
                      placeholder="e.g., AAPL, Bitcoin, Real Estate"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Quantity</label>
                    <input
                      type="number"
                      className="input-field no-prefix"
                      value={newTrade.quantity}
                      onChange={(e) => setNewTrade({ ...newTrade, quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="100"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Purchase Date</label>
                    <input
                      type="date"
                      className="input-field no-prefix"
                      value={newTrade.purchaseDate}
                      onChange={(e) => setNewTrade({ ...newTrade, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sale Date</label>
                    <input
                      type="date"
                      className="input-field no-prefix"
                      value={newTrade.saleDate}
                      onChange={(e) => setNewTrade({ ...newTrade, saleDate: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Purchase Price</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={newTrade.purchasePrice}
                        onChange={(e) => setNewTrade({ ...newTrade, purchasePrice: parseFloat(e.target.value) || 0 })}
                        placeholder="150.00"
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sale Price</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={newTrade.salePrice}
                        onChange={(e) => setNewTrade({ ...newTrade, salePrice: parseFloat(e.target.value) || 0 })}
                        placeholder="175.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-secondary"
                  onClick={() => setShowTradeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={editingTrade ? updateTrade : addTrade}
                  disabled={!newTrade.asset || !newTrade.purchaseDate || !newTrade.saleDate}
                >
                  {editingTrade ? 'Update Trade' : 'Add Trade'}
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

export default CapitalGainsAnalyzer;