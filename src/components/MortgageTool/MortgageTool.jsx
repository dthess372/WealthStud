import { useState, useEffect, useCallback } from 'react';
import Navigation from '../shared/Navigation';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Home,
  Calculator,
  TrendingUp,
  Download,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatCurrency, formatPercent, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS, COLORS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';
import {
  calculateTotalMonthlyPayment,
  generateAmortizationSchedule,
  calculateAffordability,
  calculatePaymentSavings,
  calculateLoanToValue,
  calculatePMI,
  getPaymentBreakdownChartData,
  getAmortizationChartData
} from '../../lib/mortgageCalculations';
import './MortgageTool.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

const MortgageTool = () => {
  // Initialize data with localStorage persistence
  const [mortgageData, setMortgageData] = useLocalStorage(STORAGE_KEYS.MORTGAGE_DATA, {
    loanDetails: {
      principal: 400000,
      interestRate: 6.5,
      loanTerm: 30,
      downPayment: 80000,
      propertyTax: 8000,
      homeInsurance: 1200,
      pmi: 0,
      hoaFees: 0
    },
    extraPayments: {
      monthlyExtra: 0,
      yearlyExtra: 0,
      oneTimeExtra: 0,
      biWeekly: false
    },
    affordabilityData: {
      annualIncome: 100000,
      monthlyDebts: 500,
      creditScore: 740
    }
  });

  // Extract data for easier access
  const { loanDetails, extraPayments, affordabilityData } = mortgageData;

  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('mortgage');

  const [activeTab, setActiveTab] = useState('calculator');
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);

  // Helper function to update mortgage data
  const updateMortgageData = useCallback((updates) => {
    setMortgageData(prev => ({ ...prev, ...updates }));
  }, [setMortgageData]);

  const calculateMortgageDetails = useCallback(() => {
    // Auto-calculate PMI if not manually set
    const loanAmount = loanDetails.principal - loanDetails.downPayment;
    const calculatedPMI = calculatePMI(loanAmount, loanDetails.principal);
    
    if (loanDetails.pmi === 0 && calculatedPMI > 0) {
      setMortgageData(prev => ({
        ...prev,
        loanDetails: { ...loanDetails, pmi: calculatedPMI }
      }));
      return; // Let the effect run again with updated PMI
    }

    // Calculate payment breakdown
    const paymentBreakdown = calculateTotalMonthlyPayment(loanDetails);
    setMonthlyPayment(paymentBreakdown.principalAndInterest);
    setTotalMonthlyPayment(paymentBreakdown.total);

    // Generate amortization schedule
    const schedule = generateAmortizationSchedule(loanDetails, extraPayments);
    setAmortizationSchedule(schedule);
  }, [loanDetails, extraPayments, setMortgageData]);

  useEffect(() => {
    calculateMortgageDetails();
  }, [calculateMortgageDetails]);

  const handleInputChange = (section, field) => (e) => {
    const value = e.target.value;
    if (section === 'loan') {
      updateMortgageData({
        loanDetails: {
          ...loanDetails,
          [field]: value === '' ? 0 : parseNumber(value)
        }
      });
    } else if (section === 'extra') {
      updateMortgageData({
        extraPayments: {
          ...extraPayments,
          [field]: field === 'biWeekly' ? e.target.checked : (value === '' ? 0 : parseNumber(value))
        }
      });
    } else if (section === 'affordability') {
      updateMortgageData({
        affordabilityData: {
          ...affordabilityData,
          [field]: value === '' ? 0 : parseNumber(value)
        }
      });
    }
  };

  const getAffordabilityData = () => {
    const affordability = calculateAffordability(affordabilityData, totalMonthlyPayment);
    
    let ratingIcon;
    if (affordability.currentDTI <= 36) {
      ratingIcon = CheckCircle;
    } else {
      ratingIcon = AlertCircle;
    }
    
    return {
      ...affordability,
      ratingIcon
    };
  };

  const getSavingsData = () => {
    return calculatePaymentSavings(loanDetails, extraPayments);
  };

  const exportAmortizationSchedule = () => {
    const scheduleData = amortizationSchedule.map(row => ({
      'Month': row.month,
      'Year': row.year,
      'Payment': row.payment,
      'Principal': row.principal,
      'Interest': row.interest,
      'Total Interest': row.totalInterest,
      'Remaining Balance': row.balance
    }));
    
    exportCSV(scheduleData, 'mortgage_amortization_schedule');
  };

  const exportMortgageData = () => {
    const exportData = [{
      'Home Price': loanDetails.principal,
      'Down Payment': loanDetails.downPayment,
      'Interest Rate': loanDetails.interestRate,
      'Loan Term': loanDetails.loanTerm,
      'Property Tax': loanDetails.propertyTax,
      'Home Insurance': loanDetails.homeInsurance,
      'PMI': loanDetails.pmi,
      'HOA Fees': loanDetails.hoaFees,
      'Monthly Extra Payment': extraPayments.monthlyExtra,
      'Yearly Extra Payment': extraPayments.yearlyExtra,
      'Bi-Weekly Payments': extraPayments.biWeekly,
      'Annual Income': affordabilityData.annualIncome,
      'Monthly Debts': affordabilityData.monthlyDebts,
      'Credit Score': affordabilityData.creditScore
    }];
    
    exportCSV(exportData, 'mortgage_calculator_data');
  };

  const handleCSVImport = createFileInputHandler(
    (result) => {
      const data = result.data[0];
      if (data && data['Home Price']) {
        // Import mortgage calculator data
        updateMortgageData({
          loanDetails: {
            principal: parseNumber(data['Home Price']),
            downPayment: parseNumber(data['Down Payment']),
            interestRate: parseNumber(data['Interest Rate']),
            loanTerm: parseNumber(data['Loan Term']),
            propertyTax: parseNumber(data['Property Tax']),
            homeInsurance: parseNumber(data['Home Insurance']),
            pmi: parseNumber(data['PMI']),
            hoaFees: parseNumber(data['HOA Fees'])
          },
          extraPayments: {
            monthlyExtra: parseNumber(data['Monthly Extra Payment']),
            yearlyExtra: parseNumber(data['Yearly Extra Payment']),
            oneTimeExtra: 0,
            biWeekly: data['Bi-Weekly Payments'] === 'true'
          },
          affordabilityData: {
            annualIncome: parseNumber(data['Annual Income']),
            monthlyDebts: parseNumber(data['Monthly Debts']),
            creditScore: parseNumber(data['Credit Score'])
          }
        });
      }
    },
    (error) => {
      console.error('CSV import error:', error);
      alert('Error importing CSV file. Please check the format and try again.');
    }
  );

  const getChartData = () => {
    const loanAmount = loanDetails.principal - loanDetails.downPayment;
    return getAmortizationChartData(amortizationSchedule, loanAmount);
  };

  const getPaymentBreakdownData = () => {
    const paymentBreakdown = calculateTotalMonthlyPayment(loanDetails);
    return getPaymentBreakdownChartData(paymentBreakdown, COLORS);
  };

  const affordability = getAffordabilityData();
  const savings = getSavingsData();
  const loanToValue = calculateLoanToValue(loanDetails.principal - loanDetails.downPayment, loanDetails.principal);
  const totalLoanCost = amortizationSchedule.reduce((sum, payment) => sum + parseFloat(payment.payment), 0);

  const navigationActions = [
    {
      label: 'Export Data',
      icon: <Download size={16} />,
      onClick: exportMortgageData,
      variant: 'btn-ghost',
      hideTextOnMobile: true
    },
    {
      label: 'Export Schedule',
      icon: <Download size={16} />,
      onClick: exportAmortizationSchedule,
      variant: 'btn-ghost',
      hideTextOnMobile: true
    },
    {
      label: 'Import Data',
      icon: <Upload size={16} />,
      onClick: () => document.getElementById('mortgage-csv-import').click(),
      variant: 'btn-ghost',
      hideTextOnMobile: true
    }
  ];

  return (
    <div className="page-container">
      <Navigation 
        actions={navigationActions}
      />
      
      {/* Hidden file input for CSV import */}
      <input
        id="mortgage-csv-import"
        type="file"
        accept=".csv"
        onChange={handleCSVImport}
        style={{ display: 'none' }}
      />
      
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Smart Mortgage Calculator</h1>
          <p className="page-subtitle">Comprehensive mortgage analysis with payment strategies and affordability insights</p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="page-intro-section">
        <h2 className="intro-title">Complete Mortgage Planning Solution</h2>
        <p>
          Calculate payments, analyze affordability, explore payment strategies, and visualize your mortgage journey with detailed amortization schedules.
        </p>
        <div className="intro-steps">
          <div className="step">
            <span className="step-number">1</span>
            <span>Enter loan details and costs</span>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <span>Review affordability analysis</span>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <span>Explore payment strategies</span>
          </div>
          <div className="step">
            <span className="step-number">4</span>
            <span>Analyze amortization schedule</span>
          </div>
        </div>
        <p className="intro-note">
          🏠 Complete mortgage analysis • 💰 Payment optimization • 📊 Visual insights • 💾 Export capabilities
        </p>
      </div>

      <div className="page-content">

        {/* Dashboard */}
        <div className="summary-grid">
          <div className="dashboard-card">
            <div className="dashboard-value">${formatCurrency(totalMonthlyPayment)}</div>
            <div className="dashboard-label">Total Monthly Payment</div>
          </div>
          <div className={`dashboard-card ${affordability.currentDTI > 36 ? 'danger' : affordability.currentDTI > 28 ? 'warning' : 'success'}`}>
            <div className="dashboard-value">
              <div className="affordability-indicator">
                <affordability.ratingIcon size={20} className={affordability.ratingClass} />
                {formatPercent(affordability.currentDTI)}%
              </div>
            </div>
            <div className="dashboard-label">Debt-to-Income Ratio</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">${formatCurrency(totalLoanCost)}</div>
            <div className="dashboard-label">Total Loan Cost</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">{formatPercent(loanToValue)}%</div>
            <div className="dashboard-label">Loan-to-Value</div>
          </div>
        </div>

        {/* Input Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Home size={16} />
              </div>
              Loan Details & Costs
            </h2>
          </div>
            <div className="mortgage-input-layout">
              {/* Loan Details */}
              <div className="input-section-wide">
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Loan Information</h3>
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">Home Price</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field"
                        value={loanDetails.principal || ''}
                        onChange={handleInputChange('loan', 'principal')}
                        placeholder="400,000"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Down Payment</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field"
                        value={loanDetails.downPayment || ''}
                        onChange={handleInputChange('loan', 'downPayment')}
                        placeholder="80,000"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      className="input-field no-prefix"
                      value={loanDetails.interestRate || ''}
                      onChange={handleInputChange('loan', 'interestRate')}
                      placeholder="6.5"
                      step="0.01"
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Loan Term (years)</label>
                    <input 
                      type="number" 
                      className="input-field no-prefix"
                      value={loanDetails.loanTerm || ''}
                      onChange={handleInputChange('loan', 'loanTerm')}
                      placeholder="30"
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Costs */}
              <div className="input-section-wide">
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Additional Costs</h3>
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">Property Tax (annual)</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field"
                        value={loanDetails.propertyTax || ''}
                        onChange={handleInputChange('loan', 'propertyTax')}
                        placeholder="8,000"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Home Insurance (annual)</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field"
                        value={loanDetails.homeInsurance || ''}
                        onChange={handleInputChange('loan', 'homeInsurance')}
                        placeholder="1,200"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label className="input-label">PMI (annual)</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field"
                        value={loanDetails.pmi || ''}
                        onChange={handleInputChange('loan', 'pmi')}
                        placeholder="Auto-calculated"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">HOA Fees (annual)</label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input 
                        type="number" 
                        className="input-field"
                        value={loanDetails.hoaFees || ''}
                        onChange={handleInputChange('loan', 'hoaFees')}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Result */}
            <div className="payment-result">
              <div className="payment-amount">${formatCurrency(totalMonthlyPayment)}</div>
              <div style={{ color: 'var(--secondary-text-color)', marginBottom: '1rem' }}>Total Monthly Payment</div>
              <div className="payment-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-value">${formatCurrency(monthlyPayment)}</div>
                  <div className="breakdown-label">Principal & Interest</div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-value">${formatCurrency(loanDetails.propertyTax / 12)}</div>
                  <div className="breakdown-label">Property Tax</div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-value">${formatCurrency(loanDetails.homeInsurance / 12)}</div>
                  <div className="breakdown-label">Insurance</div>
                </div>
                {loanDetails.pmi > 0 && (
                  <div className="breakdown-item">
                    <div className="breakdown-value">${formatCurrency(loanDetails.pmi / 12)}</div>
                    <div className="breakdown-label">PMI</div>
                  </div>
                )}
                {loanDetails.hoaFees > 0 && (
                  <div className="breakdown-item">
                    <div className="breakdown-value">${formatCurrency(loanDetails.hoaFees / 12)}</div>
                    <div className="breakdown-label">HOA</div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Tabs Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <Calculator size={16} />
              </div>
              Analysis & Strategies
            </h2>
          </div>
            <div className="tabs-container">
              <div className="tabs-nav">
                <button 
                  className={`tab-button ${activeTab === 'calculator' ? 'active' : ''}`}
                  onClick={() => setActiveTab('calculator')}
                >
                  Payment Breakdown
                </button>
                <button 
                  className={`tab-button ${activeTab === 'affordability' ? 'active' : ''}`}
                  onClick={() => setActiveTab('affordability')}
                >
                  Affordability
                </button>
                <button 
                  className={`tab-button ${activeTab === 'strategies' ? 'active' : ''}`}
                  onClick={() => setActiveTab('strategies')}
                >
                  Payment Strategies
                </button>
                <button 
                  className={`tab-button ${activeTab === 'schedule' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Amortization
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'calculator' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Monthly Payment Breakdown</h4>
                        <div style={{ height: '300px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getPaymentBreakdownData()}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {getPaymentBreakdownData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${formatCurrency(value)}`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Loan Summary</h4>
                        <div style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Loan Amount:</span>
                            <span>${formatCurrency(loanDetails.principal - loanDetails.downPayment)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Interest:</span>
                            <span>${formatCurrency(totalLoanCost - (loanDetails.principal - loanDetails.downPayment))}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total Payments:</span>
                            <span>${formatCurrency(totalLoanCost)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Payoff Time:</span>
                            <span>{Math.round(savings.payoffDate)} years</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            <span>LTV Ratio:</span>
                            <span>{formatPercent(loanToValue)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'affordability' && (
                  <div>
                    <div className="mortgage-input-layout">
                      <div className="input-section-wide">
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Income & Debt Information</h4>
                        <div className="input-group">
                          <label className="input-label">Annual Income</label>
                          <div className="input-wrapper">
                            <span className="input-prefix">$</span>
                            <input 
                              type="number" 
                              className="input-field"
                              value={affordabilityData.annualIncome || ''}
                              onChange={handleInputChange('affordability', 'annualIncome')}
                              placeholder="100,000"
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Monthly Debt Payments</label>
                          <div className="input-wrapper">
                            <span className="input-prefix">$</span>
                            <input 
                              type="number" 
                              className="input-field"
                              value={affordabilityData.monthlyDebts || ''}
                              onChange={handleInputChange('affordability', 'monthlyDebts')}
                              placeholder="500"
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Credit Score</label>
                          <input 
                            type="number" 
                            className="input-field no-prefix"
                            value={affordabilityData.creditScore || ''}
                            onChange={handleInputChange('affordability', 'creditScore')}
                            placeholder="740"
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Affordability Analysis</h4>
                        <div className="strategy-card">
                          <div className="strategy-title">
                            Debt-to-Income Ratio: {affordability.affordabilityRating}
                            <div className="affordability-indicator">
                              <affordability.ratingIcon size={20} className={affordability.ratingClass} />
                            </div>
                          </div>
                          <div className="strategy-result">{formatPercent(affordability.currentDTI)}%</div>
                          <div className="strategy-description">
                            Current total debt payments as percentage of income. 
                            Recommended: ≤28% housing, ≤36% total debt.
                          </div>
                        </div>
                        <div className="strategy-card">
                          <div className="strategy-title">Maximum Affordable Payment</div>
                          <div className="strategy-result">${formatCurrency(affordability.maxAffordable)}</div>
                          <div className="strategy-description">
                            Based on 28/36 rule and current debt obligations.
                            {totalMonthlyPayment > affordability.maxAffordable ? 
                              ' Current payment exceeds recommendation.' : 
                              ' Current payment is within guidelines.'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'strategies' && (
                  <div>
                    <div className="mortgage-input-layout">
                      <div className="input-section-wide">
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Payment Strategies</h4>
                        <div className="input-group">
                          <label className="input-label">Extra Monthly Payment</label>
                          <div className="input-wrapper">
                            <span className="input-prefix">$</span>
                            <input 
                              type="number" 
                              className="input-field"
                              value={extraPayments.monthlyExtra || ''}
                              onChange={handleInputChange('extra', 'monthlyExtra')}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Extra Yearly Payment</label>
                          <div className="input-wrapper">
                            <span className="input-prefix">$</span>
                            <input 
                              type="number" 
                              className="input-field"
                              value={extraPayments.yearlyExtra || ''}
                              onChange={handleInputChange('extra', 'yearlyExtra')}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                          <input 
                            type="checkbox" 
                            id="biweekly"
                            checked={extraPayments.biWeekly}
                            onChange={handleInputChange('extra', 'biWeekly')}
                            style={{ accentColor: 'var(--primary-color)' }}
                          />
                          <label htmlFor="biweekly" style={{ color: 'var(--secondary-text-color)' }}>
                            Bi-weekly payments (26 payments/year)
                          </label>
                        </div>
                      </div>
                      <div>
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Savings Analysis</h4>
                        <div className="strategy-grid">
                          <div className="strategy-card">
                            <div className="strategy-title">Interest Savings</div>
                            <div className="strategy-result">${formatCurrency(savings.interestSavings)}</div>
                            <div className="strategy-description">
                              Total interest saved with current payment strategy.
                            </div>
                          </div>
                          <div className="strategy-card">
                            <div className="strategy-title">Time Savings</div>
                            <div className="strategy-result">{savings.timeSavings} years</div>
                            <div className="strategy-description">
                              Years saved on loan term with extra payments.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div>
                    <div className="controls-row">
                      <button className="control-btn" onClick={exportAmortizationSchedule}>
                        Export Schedule
                      </button>
                      <button className="control-btn" onClick={exportMortgageData}>
                        Export Data
                      </button>
                      <label className="control-btn">
                        Import Data
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVImport}
                          className="hidden-input"
                        />
                      </label>
                    </div>
                    <div className="table-container">
                      <table className="amortization-table">
                        <thead>
                          <tr>
                            <th>Payment #</th>
                            <th>Year</th>
                            <th>Payment</th>
                            <th>Principal</th>
                            <th>Interest</th>
                            <th>Total Interest</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {amortizationSchedule.map((payment, index) => (
                            <tr key={index} className={payment.isYearEnd ? 'year-row' : ''}>
                              <td>{payment.month}</td>
                              <td>{payment.year}</td>
                              <td>${payment.payment}</td>
                              <td>${payment.principal}</td>
                              <td>${payment.interest}</td>
                              <td>${payment.totalInterest}</td>
                              <td>${payment.balance}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Charts Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon">
                <TrendingUp size={16} />
              </div>
              Payment Analysis Charts
            </h2>
          </div>
            <div className="chart-container">
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Principal vs Interest Over Time</h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="year" stroke="#fff" />
                  <YAxis stroke="#fff" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value) => `${formatCurrency(value)}`}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Legend />
                  <Bar dataKey="interest" stackId="a" fill={COLORS.chart.expenses} name="Total Interest Paid" />
                  <Bar dataKey="principal" stackId="a" fill={COLORS.chart.income} name="Principal Paid" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h4 style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>Remaining Balance Over Time</h4>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="year" stroke="#fff" />
                  <YAxis stroke="#fff" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value) => `${formatCurrency(value)}`}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: 'white' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke={COLORS.chart.assets} 
                    strokeWidth={3}
                    name="Remaining Balance" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mortgage-tips">
          <h4>💡 Mortgage Tips & Strategies</h4>
          <div className="tips-grid">
            <div className="tip-item">
              <div className="tip-title">💰 Lower Your Rate</div>
              <div className="tip-description">
                Improve your credit score, shop multiple lenders, and consider paying points to reduce your interest rate.
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-title">🏠 PMI Removal</div>
              <div className="tip-description">
                Once you reach 20% equity, request PMI removal to reduce monthly payments by ${formatCurrency(loanDetails.pmi / 12)}.
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-title">📅 Payment Timing</div>
              <div className="tip-description">
                Bi-weekly payments can save ${formatCurrency(savings.interestSavings)} in interest and {savings.timeSavings} years.
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-title">🎯 Extra Payments</div>
              <div className="tip-description">
                Even small extra payments toward principal can significantly reduce total interest paid over the loan term.
              </div>
            </div>
        </div>

      </div>
      
      <SuggestionBox />
    </div>
  );
};

export default MortgageTool;