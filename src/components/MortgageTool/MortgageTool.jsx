import React, { useState, useEffect } from 'react';
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
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import './MortgageTool.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

const MortgageTool = () => {
  const [loanDetails, setLoanDetails] = useState({
    principal: 400000,
    interestRate: 6.5,
    loanTerm: 30,
    downPayment: 80000,
    propertyTax: 8000,
    homeInsurance: 1200,
    pmi: 0,
    hoaFees: 0
  });

  const [extraPayments, setExtraPayments] = useState({
    monthlyExtra: 0,
    yearlyExtra: 0,
    oneTimeExtra: 0,
    biWeekly: false
  });

  const [affordabilityData, setAffordabilityData] = useState({
    annualIncome: 100000,
    monthlyDebts: 500,
    creditScore: 740
  });

  const [activeTab, setActiveTab] = useState('calculator');
  const [amortizationSchedule, setAmortizationSchedule] = useState([]);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);

  // Helper function to safely parse numbers
  const parseNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (isNaN(value) || !isFinite(value)) return '0';
    return Math.round(value).toLocaleString();
  };

  // Helper function to format percentage
  const formatPercent = (value) => {
    if (isNaN(value) || !isFinite(value)) return '0.0';
    return value.toFixed(1);
  };

  const calculateAmortizationSchedule = () => {
    const { principal, interestRate, loanTerm } = loanDetails;
    const { monthlyExtra, biWeekly } = extraPayments;
    
    const actualPrincipal = principal - loanDetails.downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate base payment
    const basePayment = actualPrincipal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    setMonthlyPayment(basePayment);

    // Calculate PMI if down payment is less than 20%
    const loanToValue = actualPrincipal / principal;
    const calculatedPMI = loanToValue > 0.8 ? (actualPrincipal * 0.005 / 12) : 0;
    
    // Update PMI in loan details if not manually set
    if (loanDetails.pmi === 0) {
      setLoanDetails(prev => ({ ...prev, pmi: calculatedPMI * 12 }));
    }

    // Calculate total monthly payment including escrow
    const monthlyPropertyTax = loanDetails.propertyTax / 12;
    const monthlyInsurance = loanDetails.homeInsurance / 12;
    const monthlyPMI = (loanDetails.pmi || calculatedPMI * 12) / 12;
    const monthlyHOA = loanDetails.hoaFees / 12;
    
    const totalMonthly = basePayment + monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
    setTotalMonthlyPayment(totalMonthly);

    let remainingBalance = actualPrincipal;
    const schedule = [];
    let totalInterestPaid = 0;
    let month = 1;
    const paymentFrequency = biWeekly ? 26 : 12;
    const adjustedPayment = biWeekly ? basePayment / 2 : basePayment;
    const adjustedExtra = biWeekly ? monthlyExtra / 2 : monthlyExtra;

    while (remainingBalance > 0.01 && month <= numberOfPayments * (biWeekly ? 2 : 1)) {
      const interestPayment = remainingBalance * (biWeekly ? monthlyRate / 2 : monthlyRate);
      let principalPayment = adjustedPayment - interestPayment + adjustedExtra;
      
      // Don't overpay
      if (principalPayment > remainingBalance) {
        principalPayment = remainingBalance;
      }
      
      totalInterestPaid += interestPayment;
      remainingBalance -= principalPayment;
      
      const actualMonth = biWeekly ? Math.ceil(month / 2) : month;
      const year = Math.ceil(actualMonth / 12);
      
      schedule.push({
        month: actualMonth,
        year,
        payment: (interestPayment + principalPayment).toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        totalInterest: totalInterestPaid.toFixed(2),
        balance: Math.max(0, remainingBalance).toFixed(2),
        isYearEnd: actualMonth % 12 === 0
      });
      
      month++;
    }

    setAmortizationSchedule(schedule);
  };

  useEffect(() => {
    calculateAmortizationSchedule();
  }, [loanDetails, extraPayments]);

  const handleInputChange = (section, field) => (e) => {
    const value = e.target.value;
    if (section === 'loan') {
      setLoanDetails(prev => ({
        ...prev,
        [field]: value === '' ? 0 : Number(value)
      }));
    } else if (section === 'extra') {
      setExtraPayments(prev => ({
        ...prev,
        [field]: field === 'biWeekly' ? e.target.checked : (value === '' ? 0 : Number(value))
      }));
    } else if (section === 'affordability') {
      setAffordabilityData(prev => ({
        ...prev,
        [field]: value === '' ? 0 : Number(value)
      }));
    }
  };

  const calculateAffordability = () => {
    const { annualIncome, monthlyDebts, creditScore } = affordabilityData;
    const monthlyIncome = annualIncome / 12;
    
    // DTI calculations (28/36 rule)
    const maxHousingPayment = monthlyIncome * 0.28;
    const maxTotalDebt = monthlyIncome * 0.36;
    const maxPaymentWithDebts = maxTotalDebt - monthlyDebts;
    
    const affordablePayment = Math.min(maxHousingPayment, maxPaymentWithDebts);
    const currentDTI = ((totalMonthlyPayment + monthlyDebts) / monthlyIncome) * 100;
    
    let affordabilityRating;
    let ratingClass;
    let ratingIcon;
    
    if (currentDTI <= 28) {
      affordabilityRating = 'Excellent';
      ratingClass = 'affordability-excellent';
      ratingIcon = CheckCircle;
    } else if (currentDTI <= 36) {
      affordabilityRating = 'Good';
      ratingClass = 'affordability-good';
      ratingIcon = CheckCircle;
    } else if (currentDTI <= 43) {
      affordabilityRating = 'Fair';
      ratingClass = 'affordability-fair';
      ratingIcon = AlertCircle;
    } else {
      affordabilityRating = 'Poor';
      ratingClass = 'affordability-poor';
      ratingIcon = AlertCircle;
    }

    return {
      maxAffordable: affordablePayment,
      currentDTI,
      affordabilityRating,
      ratingClass,
      ratingIcon,
      creditScore
    };
  };

  const calculateSavingsStrategies = () => {
    const scheduleWithoutExtra = calculateScheduleWithoutExtra();
    const currentSchedule = amortizationSchedule;
    
    const baseTotalInterest = scheduleWithoutExtra.reduce((sum, payment) => sum + parseFloat(payment.interest), 0);
    const currentTotalInterest = currentSchedule.reduce((sum, payment) => sum + parseFloat(payment.interest), 0);
    
    const interestSavings = baseTotalInterest - currentTotalInterest;
    const timeSavings = scheduleWithoutExtra.length - currentSchedule.length;
    
    return {
      interestSavings,
      timeSavings: Math.round(timeSavings / 12 * 10) / 10, // Convert to years
      payoffDate: currentSchedule.length > 0 ? currentSchedule[currentSchedule.length - 1].year : loanDetails.loanTerm
    };
  };

  const calculateScheduleWithoutExtra = () => {
    const { principal, interestRate, loanTerm } = loanDetails;
    const actualPrincipal = principal - loanDetails.downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    const payment = actualPrincipal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    let remainingBalance = actualPrincipal;
    const schedule = [];
    let totalInterestPaid = 0;

    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = payment - interestPayment;
      totalInterestPaid += interestPayment;
      remainingBalance -= principalPayment;

      schedule.push({
        month,
        payment: payment.toFixed(2),
        principal: principalPayment.toFixed(2),
        interest: interestPayment.toFixed(2),
        totalInterest: totalInterestPaid.toFixed(2),
        balance: Math.max(0, remainingBalance).toFixed(2)
      });
    }

    return schedule;
  };

  const exportToCSV = () => {
    const headers = ['Month', 'Year', 'Payment', 'Principal', 'Interest', 'Total Interest', 'Remaining Balance'];
    const csvContent = [
      headers.join(','),
      ...amortizationSchedule.map(row => 
        [row.month, row.year, row.payment, row.principal, row.interest, row.totalInterest, row.balance].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mortgage-amortization.csv';
    link.click();
  };

  const importCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const [headers, firstRow] = text.split('\n');
      if (firstRow) {
        const [, , payment, , , , balance] = firstRow.split(',');
        const principal = Number(balance);
        setLoanDetails(prev => ({
          ...prev,
          principal
        }));
      }
    };
    reader.readAsText(file);
  };

  const getChartData = () => {
    return amortizationSchedule
      .filter(data => data.month % 12 === 0 || data.month === amortizationSchedule.length)
      .map(data => ({
        year: data.year,
        interest: Number(data.totalInterest),
        principal: (loanDetails.principal - loanDetails.downPayment) - Number(data.balance),
        balance: Number(data.balance)
      }));
  };

  const getPaymentBreakdownData = () => {
    const monthlyPI = monthlyPayment;
    const monthlyTax = loanDetails.propertyTax / 12;
    const monthlyInsurance = loanDetails.homeInsurance / 12;
    const monthlyPMI = loanDetails.pmi / 12;
    const monthlyHOA = loanDetails.hoaFees / 12;

    return [
      { name: 'Principal & Interest', value: monthlyPI, color: '#796832' },
      { name: 'Property Tax', value: monthlyTax, color: '#C5563F' },
      { name: 'Insurance', value: monthlyInsurance, color: '#237F74' },
      { name: 'PMI', value: monthlyPMI, color: '#e63946' },
      { name: 'HOA', value: monthlyHOA, color: '#1C3645' }
    ].filter(item => item.value > 0);
  };

  const affordability = calculateAffordability();
  const savings = calculateSavingsStrategies();
  const loanToValue = ((loanDetails.principal - loanDetails.downPayment) / loanDetails.principal) * 100;
  const totalLoanCost = amortizationSchedule.reduce((sum, payment) => sum + parseFloat(payment.payment), 0);

  const navigationActions = [
    {
      label: 'Export PDF',
      icon: <Download size={16} />,
      onClick: () => console.log('Export PDF feature coming soon'),
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
          <div className="section-content">
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
          <div className="section-content">
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
                            <span>{savings.payoffDate} years</span>
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
                      <button className="control-btn" onClick={exportToCSV}>
                        Export Schedule
                      </button>
                      <label className="control-btn">
                        Import Schedule
                        <input
                          type="file"
                          accept=".csv"
                          onChange={importCSV}
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
          <div className="section-content">
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
                  <Bar dataKey="interest" stackId="a" fill="#e63946" name="Total Interest Paid" />
                  <Bar dataKey="principal" stackId="a" fill="#22c55e" name="Principal Paid" />
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
                    stroke="#796832" 
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

        {/* Actions Section */}
        <div className="actions-section">
          <button className="btn-primary" onClick={exportToCSV}>
            <Download size={16} />
            Export Analysis
          </button>
          <label className="btn-primary">
            <Upload size={16} />
            Import Data
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

export default MortgageTool;