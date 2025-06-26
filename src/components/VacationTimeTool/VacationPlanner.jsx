import React, { useState, useEffect } from 'react';
import Navigation from '../shared/Navigation';
import { 
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Plus,
  BarChart3,
  Shield
} from 'lucide-react';
import './VacationPlanner.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

const VacationPlanner = () => {
  const [settings, setSettings] = useState({
    ptoDaysPerYear: 20,
    payFrequency: 14,
    mostRecentPayDate: new Date().toISOString().split('T')[0],
    ptoAccrual: 'accrual',
    currentPtoBalance: 15,
    ptoRolloverLimit: 5,
    enableCompTime: false,
    currentCompBalance: 0,
    compRolloverLimit: null,
    allowHolidayBanking: false,
    currentHolidayBalance: 0,
    holidayRolloverLimit: null,
    policyType: 'standard'
  });

  const [tableData, setTableData] = useState([]);
  const [displayedRows, setDisplayedRows] = useState(10);
  const [dashboardData, setDashboardData] = useState({
    currentBalance: 0,
    projectedBalance: 0,
    usageRate: 0,
    burnoutRisk: 'Low',
    healthScore: 100
  });

  useEffect(() => {
    updateTable();
  }, [settings, displayedRows]);

  const updateTable = () => {
    const newTableData = [];
    let paydate = new Date(settings.mostRecentPayDate);

    const totalPtoPerYear = settings.ptoDaysPerYear;
    const payPeriodsPerYear = Math.ceil(365 / settings.payFrequency);
    let ptoPerPeriod;

    switch(settings.ptoAccrual) {
      case 'accrual':
        ptoPerPeriod = totalPtoPerYear / payPeriodsPerYear;
        break;
      case 'lumpSum':
        ptoPerPeriod = totalPtoPerYear;
        break;
      case 'frontloaded':
        ptoPerPeriod = totalPtoPerYear;
        break;
      default:
        ptoPerPeriod = totalPtoPerYear / payPeriodsPerYear;
    }

    let accumulatedPto = settings.currentPtoBalance;
    let accumulatedComp = settings.currentCompBalance;
    let accumulatedHoliday = settings.currentHolidayBalance;

    for (let i = 0; i < displayedRows; i++) {
      let ptoGained;
      
      if (settings.ptoAccrual === 'accrual') {
        ptoGained = ptoPerPeriod;
      } else if (settings.ptoAccrual === 'lumpSum' || settings.ptoAccrual === 'frontloaded') {
        ptoGained = i === 0 ? totalPtoPerYear : 0;
      } else {
        ptoGained = ptoPerPeriod;
      }

      const existingRow = tableData[i] || {};
      const ptoUsed = existingRow.ptoUsed || 0;
      const compUsed = existingRow.compUsed || 0;
      const holidayUsed = existingRow.holidayUsed || 0;
      const holidayGained = existingRow.holidayGained || 0;

      accumulatedPto = Math.max(0, accumulatedPto + ptoGained - ptoUsed);
      
      if (settings.enableCompTime) {
        accumulatedComp = Math.max(0, accumulatedComp - compUsed);
      }
      
      if (settings.allowHolidayBanking) {
        accumulatedHoliday = Math.max(0, accumulatedHoliday + holidayGained - holidayUsed);
      }

      const totalBalance = accumulatedPto + 
        (settings.enableCompTime ? accumulatedComp : 0) + 
        (settings.allowHolidayBanking ? accumulatedHoliday : 0);
      
      const usageRate = settings.ptoDaysPerYear > 0 ? 
        ((settings.ptoDaysPerYear - accumulatedPto) / settings.ptoDaysPerYear * 100) : 0;

      newTableData[i] = {
        paydate: paydate.toLocaleDateString('en-US'),
        ptoGained: ptoGained.toFixed(1),
        ptoUsed: ptoUsed,
        ptoBalance: accumulatedPto.toFixed(1),
        compGained: settings.enableCompTime ? '0.0' : null,
        compUsed: compUsed,
        compBalance: settings.enableCompTime ? accumulatedComp.toFixed(1) : null,
        holidayGained: holidayGained,
        holidayUsed: holidayUsed,
        holidayBalance: settings.allowHolidayBanking ? accumulatedHoliday.toFixed(1) : null,
        totalBalance: totalBalance.toFixed(1),
        usageRate: Math.max(0, Math.min(100, usageRate))
      };

      paydate.setDate(paydate.getDate() + settings.payFrequency);
    }

    setTableData(newTableData);
    updateDashboard(newTableData);
  };

  const updateDashboard = (data) => {
    const currentBalance = settings.currentPtoBalance;
    const totalUsed = data.reduce((sum, row) => sum + (row.ptoUsed || 0), 0);
    const usageRate = settings.ptoDaysPerYear > 0 ? (totalUsed / settings.ptoDaysPerYear * 100) : 0;
    
    const projectedBalance = Math.max(0, settings.ptoDaysPerYear - totalUsed + currentBalance);
    
    let burnoutRisk = 'Low';
    if (usageRate < 40) {
      burnoutRisk = 'High';
    } else if (usageRate < 60) {
      burnoutRisk = 'Medium';
    }
    
    let healthScore = 100;
    if (usageRate < 40) healthScore -= 30;
    else if (usageRate < 50) healthScore -= 15;
    if (projectedBalance > settings.ptoRolloverLimit * 2) healthScore -= 20;
    if (currentBalance < 5) healthScore -= 25;
    
    healthScore = Math.max(0, Math.min(100, healthScore));

    setDashboardData({
      currentBalance,
      projectedBalance,
      usageRate,
      burnoutRisk,
      healthScore
    });
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleRowChange = (index, field, value) => {
    const updatedData = [...tableData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: parseFloat(value) || 0
    };
    setTableData(updatedData);
    updateTable();
  };

  const loadMoreRows = () => {
    setDisplayedRows(prev => prev + 10);
  };

  const addVacationPlan = () => {
    const days = window.prompt('How many days would you like to plan for vacation?');
    const startDate = window.prompt('What date would you like to start? (YYYY-MM-DD)');
    
    if (days && startDate) {
      const vacationDays = parseFloat(days);
      const start = new Date(startDate);
      
      let closestIndex = 0;
      let closestDiff = Infinity;
      
      tableData.forEach((row, index) => {
        const rowDate = new Date(row.paydate);
        const diff = Math.abs(rowDate - start);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIndex = index;
        }
      });
      
      const updatedData = [...tableData];
      updatedData[closestIndex] = {
        ...updatedData[closestIndex],
        ptoUsed: (updatedData[closestIndex].ptoUsed || 0) + vacationDays
      };
      
      setTableData(updatedData);
      alert(`Added ${vacationDays} vacation days starting around ${startDate}!`);
    }
  };

  const exportToCSV = () => {
    const headers = ['Pay Date', 'PTO Earned', 'PTO Used', 'PTO Balance'];
    
    if (settings.enableCompTime) {
      headers.push('Comp Earned', 'Comp Used', 'Comp Balance');
    }
    if (settings.allowHolidayBanking) {
      headers.push('Holiday Earned', 'Holiday Used', 'Holiday Balance');
    }
    headers.push('Total Balance', 'Usage Rate');
    
    const csvContent = [
      headers.join(','),
      ...tableData.map(row => {
        let rowData = [
          row.paydate,
          row.ptoGained,
          row.ptoUsed,
          row.ptoBalance
        ];
        
        if (settings.enableCompTime) {
          rowData.push(row.compGained || 0, row.compUsed, row.compBalance || 0);
        }
        if (settings.allowHolidayBanking) {
          rowData.push(row.holidayGained || 0, row.holidayUsed, row.holidayBalance || 0);
        }
        rowData.push(row.totalBalance, row.usageRate.toFixed(1));
        
        return rowData.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pto-projections.csv';
    link.click();
  };

  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const [headers, ...rows] = text.split('\n');
        
        const updatedData = [...tableData];
        rows.forEach((row, index) => {
          if (row.trim() && index < updatedData.length) {
            const values = row.split(',');
            if (values.length >= 4) {
              updatedData[index] = {
                ...updatedData[index],
                ptoUsed: parseFloat(values[2]) || 0
              };
            }
          }
        });
        
        setTableData(updatedData);
        alert('PTO data imported successfully!');
      } catch (error) {
        alert('Error importing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const getUsageProgressClass = (usageRate) => {
    if (usageRate > 80) return 'danger';
    if (usageRate > 60) return 'warning';
    return 'healthy';
  };

  const getBurnoutCardClass = () => {
    if (dashboardData.burnoutRisk === 'High') return 'danger';
    if (dashboardData.burnoutRisk === 'Medium') return 'warning';
    return 'success';
  };

  const getHealthCardClass = () => {
    if (dashboardData.healthScore < 60) return 'danger';
    if (dashboardData.healthScore < 80) return 'warning';
    return 'success';
  };

  const getRecommendations = () => {
    const recommendations = [];
    const totalUsed = tableData.reduce((sum, row) => sum + (row.ptoUsed || 0), 0);
    const usageRate = settings.ptoDaysPerYear > 0 ? (totalUsed / settings.ptoDaysPerYear * 100) : 0;
    
    if (usageRate < 40) {
      recommendations.push("🚨 High burnout risk detected! Consider planning a vacation soon to maintain work-life balance.");
    }
    
    if (dashboardData.currentBalance > settings.ptoRolloverLimit && settings.ptoRolloverLimit > 0) {
      recommendations.push(`⚠️ You're approaching the rollover limit (${settings.ptoRolloverLimit} days). Plan vacation time to avoid losing PTO.`);
    }
    
    if (usageRate > 80) {
      recommendations.push("✅ Great job using your PTO! You're maintaining a healthy work-life balance.");
    }
    
    if (dashboardData.currentBalance < 5) {
      recommendations.push("📈 Your PTO balance is running low. Consider saving some upcoming accrued time for emergencies.");
    }
    
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 10 || currentMonth <= 1) {
      recommendations.push("❄️ Winter season: Great time for year-end vacation or holiday time off!");
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      recommendations.push("☀️ Summer season: Peak vacation time! Book popular destinations early.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("✨ Your PTO usage looks healthy! Keep maintaining a good work-life balance.");
    }
    
    return recommendations;
  };

  const ProgressBar = ({ usageRate, className = '' }) => {
    const progressClass = getUsageProgressClass(usageRate);
    
    return (
      <div className={`usage-progress ${className}`}>
        <div className="progress-info">
          <span>Used: {usageRate.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${progressClass}`}
            style={{ width: `${Math.min(100, usageRate)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <Navigation />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">PTO Vacation Planner</h1>
          <p className="page-subtitle">Optimize your time off strategy and work-life balance</p>
        </div>
      </div>

      {/* Overview Section */}
      <div className="page-intro-section">
        <h2 className="intro-title">Optimize Your Time Off Strategy</h2>
        <p>
          Plan vacations strategically, track PTO balances, avoid burnout, and maximize your work-life balance with intelligent insights.
        </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Configure your PTO benefits and accrual rates</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>Track usage and plan future time off</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Get smart recommendations for optimal vacation timing</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Monitor your work-life balance health score</span>
          </div>
        </div>
        <p className="intro-note">
          📅 Includes major holidays • ⚖️ Work-life balance scoring • 📊 Usage analytics • 💾 Export/import capabilities
        </p>
      </div>

      <div className="page-content">
        {/* Dashboard */}
        <div className="summary-grid">
          <div className="dashboard-card">
            <div className="dashboard-value">{dashboardData.currentBalance.toFixed(1)}</div>
            <div className="dashboard-label">Current PTO Balance</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">{dashboardData.projectedBalance.toFixed(1)}</div>
            <div className="dashboard-label">Projected End-of-Year</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">{dashboardData.usageRate.toFixed(1)}%</div>
            <div className="dashboard-label">Usage Rate</div>
          </div>
          <div className={`dashboard-card ${getBurnoutCardClass()}`}>
            <div className="dashboard-value">{dashboardData.burnoutRisk}</div>
            <div className="dashboard-label">Burnout Risk</div>
          </div>
          <div className={`dashboard-card ${getHealthCardClass()}`}>
            <div className="dashboard-value">{Math.round(dashboardData.healthScore)}</div>
            <div className="dashboard-label">Balance Health Score</div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <CheckCircle size={16} />
              </div>
              PTO Configuration & Benefits
            </h2>
          </div>
          <div className="section-content">
            <div className="settings-grid">
              <div className="input-section-wide">
                <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Basic PTO Settings</h4>
                
                <div className="input-group">
                  <label className="input-label">PTO Days Per Year</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    name="ptoDaysPerYear"
                    value={settings.ptoDaysPerYear}
                    onChange={handleSettingsChange}
                    min="0" 
                    max="365"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Current PTO Balance</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    name="currentPtoBalance"
                    value={settings.currentPtoBalance}
                    onChange={handleSettingsChange}
                    min="0" 
                    step="0.1"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Pay Frequency</label>
                  <select 
                    className="input-field" 
                    name="payFrequency"
                    value={settings.payFrequency}
                    onChange={handleSettingsChange}
                  >
                    <option value="7">Weekly (7 days)</option>
                    <option value="14">Bi-weekly (14 days)</option>
                    <option value="30">Monthly (30 days)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Most Recent Pay Date</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    name="mostRecentPayDate"
                    value={settings.mostRecentPayDate}
                    onChange={handleSettingsChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">PTO Accrual Method</label>
                  <select 
                    className="input-field" 
                    name="ptoAccrual"
                    value={settings.ptoAccrual}
                    onChange={handleSettingsChange}
                  >
                    <option value="accrual">Gradual Accrual</option>
                    <option value="lumpSum">Annual Lump Sum</option>
                    <option value="frontloaded">Front-loaded</option>
                  </select>
                </div>
              </div>

              <div className="input-section-wide">
                <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Advanced Options</h4>
                
                <div className="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    id="enableCompTime"
                    name="enableCompTime"
                    checked={settings.enableCompTime}
                    onChange={handleSettingsChange}
                  />
                  <label htmlFor="enableCompTime">Enable Compensatory Time</label>
                </div>

                {settings.enableCompTime && (
                  <div className="input-group">
                    <label className="input-label">Current Comp Time Balance</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      name="currentCompBalance"
                      value={settings.currentCompBalance}
                      onChange={handleSettingsChange}
                      min="0" 
                      step="0.1"
                    />
                  </div>
                )}

                <div className="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    id="allowHolidayBanking"
                    name="allowHolidayBanking"
                    checked={settings.allowHolidayBanking}
                    onChange={handleSettingsChange}
                  />
                  <label htmlFor="allowHolidayBanking">Allow Holiday Banking</label>
                </div>

                {settings.allowHolidayBanking && (
                  <div className="input-group">
                    <label className="input-label">Current Holiday Balance</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      name="currentHolidayBalance"
                      value={settings.currentHolidayBalance}
                      onChange={handleSettingsChange}
                      min="0" 
                      step="0.1"
                    />
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">PTO Rollover Limit</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    name="ptoRolloverLimit"
                    value={settings.ptoRolloverLimit}
                    onChange={handleSettingsChange}
                    min="0" 
                    step="0.1"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Vacation Policy Type</label>
                  <select 
                    className="input-field" 
                    name="policyType"
                    value={settings.policyType}
                    onChange={handleSettingsChange}
                  >
                    <option value="standard">Standard Accrual</option>
                    <option value="unlimited">Unlimited PTO</option>
                    <option value="use-or-lose">Use-or-Lose</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PTO Projections */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Calendar size={16} />
              </div>
              PTO Projections & Planning
            </h2>
            <div className="section-controls">
              <button className="btn-secondary" onClick={loadMoreRows}>
                Load More
              </button>
              <button className="btn-secondary" onClick={addVacationPlan}>
                <Plus size={14} />
                Plan Vacation
              </button>
            </div>
          </div>
          <div className="section-content">
            <div className="table-container">
              <table className="vacation-table">
                <thead>
                  <tr>
                    <th>Pay Date</th>
                    <th>PTO Earned</th>
                    <th>PTO Used</th>
                    <th>PTO Balance</th>
                    {settings.enableCompTime && (
                      <>
                        <th>Comp Earned</th>
                        <th>Comp Used</th>
                        <th>Comp Balance</th>
                      </>
                    )}
                    {settings.allowHolidayBanking && (
                      <>
                        <th>Holiday Earned</th>
                        <th>Holiday Used</th>
                        <th>Holiday Balance</th>
                      </>
                    )}
                    <th>Total Balance</th>
                    <th>Usage Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.paydate}</td>
                      <td>{row.ptoGained}</td>
                      <td>
                        <input
                          type="number"
                          value={row.ptoUsed || ''}
                          onChange={(e) => handleRowChange(index, 'ptoUsed', e.target.value)}
                          step="0.1"
                          min="0"
                          placeholder="0"
                        />
                      </td>
                      <td><strong>{row.ptoBalance}</strong></td>
                      {settings.enableCompTime && (
                        <>
                          <td>{row.compGained || '0.0'}</td>
                          <td>
                            <input
                              type="number"
                              value={row.compUsed || ''}
                              onChange={(e) => handleRowChange(index, 'compUsed', e.target.value)}
                              step="0.1"
                              min="0"
                              placeholder="0"
                            />
                          </td>
                          <td>{row.compBalance || '0.0'}</td>
                        </>
                      )}
                      {settings.allowHolidayBanking && (
                        <>
                          <td>
                            <input
                              type="number"
                              value={row.holidayGained || ''}
                              onChange={(e) => handleRowChange(index, 'holidayGained', e.target.value)}
                              step="0.1"
                              min="0"
                              placeholder="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={row.holidayUsed || ''}
                              onChange={(e) => handleRowChange(index, 'holidayUsed', e.target.value)}
                              step="0.1"
                              min="0"
                              placeholder="0"
                            />
                          </td>
                          <td>{row.holidayBalance || '0.0'}</td>
                        </>
                      )}
                      <td><strong>{row.totalBalance}</strong></td>
                      <td>
                        <ProgressBar usageRate={row.usageRate} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Analytics & Insights */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <BarChart3 size={16} />
              </div>
              Usage Analytics & Insights
            </h2>
          </div>
          <div className="section-content">
            <div className="vacation-tips">
              <h4>🎯 Smart Vacation Recommendations</h4>
              <div>
                {getRecommendations().map((recommendation, index) => (
                  <p key={index}>{recommendation}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export/Import */}
        <div className="actions-section">
          <button className="btn-primary" onClick={exportToCSV}>
            <Download size={16} />
            Export PTO Data
          </button>
          <label className="btn-primary">
            <Upload size={16} />
            Import PTO Data
            <input
              type="file"
              accept=".csv"
              onChange={importCSV}
              className="hidden-input"
            />
          </label>
        </div>
      </div>
      
      <SuggestionBox />
    </div>
  );
};

export default VacationPlanner;