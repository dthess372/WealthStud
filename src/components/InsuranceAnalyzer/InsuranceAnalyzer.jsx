import { useState, useEffect, useCallback } from 'react';
import Navigation from '../shared/Navigation';
import { 
  Shield, 
  Home, 
  Car, 
  Heart, 
  Calculator,
  Users,
  DollarSign,
  Zap,
  Activity,
  Target,
  Download,
  Upload
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './InsuranceAnalyzer.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

// Import shared utilities and configurations
import { 
  formatCurrency
} from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';

// Insurance type configurations
const INSURANCE_TYPES = {
  life: {
    name: 'Life Insurance',
    icon: Heart,
    color: '#ef4444',
    description: 'Protect your family\'s financial future'
  },
  auto: {
    name: 'Auto Insurance',
    icon: Car,
    color: '#3b82f6',
    description: 'Coverage for your vehicles'
  },
  home: {
    name: 'Home Insurance',
    icon: Home,
    color: '#10b981',
    description: 'Protect your property investment'
  },
  health: {
    name: 'Health Insurance',
    icon: Activity,
    color: '#8b5cf6',
    description: 'Medical coverage optimization'
  }
};

// State average insurance factors (simplified for demo)
const STATE_INSURANCE_FACTORS = {
  'CA': { auto: 1.3, home: 1.4, health: 1.2 },
  'TX': { auto: 1.1, home: 1.0, health: 0.9 },
  'FL': { auto: 1.4, home: 1.5, health: 1.0 },
  'NY': { auto: 1.3, home: 1.3, health: 1.3 },
  'MI': { auto: 1.5, home: 0.9, health: 1.0 }
  // Add more states as needed
};

const InsuranceAnalyzer = () => {
  // Use localStorage for data persistence
  const [insuranceData, setInsuranceData] = useLocalStorage(STORAGE_KEYS.INSURANCE_DATA, {
    activeTab: 'life',
    generalInfo: {
      age: 35,
      state: 'MI', 
      dependents: 2,
      annualIncome: 75000,
      totalDebt: 250000,
      emergencyFund: 15000
    },
    lifeInsurance: {
      currentCoverage: 0,
      employerCoverage: 100000,
      spouseIncome: 50000,
      mortgageBalance: 200000,
      otherDebts: 30000,
      childrenEducation: 100000,
      finalExpenses: 15000,
      yearsOfIncome: 10,
      insuranceType: 'term',
      termLength: 20
    },
    autoInsurance: {
      vehicleValue: 25000,
      liability: 300000,
      collision: 1000,
      comprehensive: 500,
      personalInjury: 100000,
      uninsuredMotorist: 100000,
      roadside: true,
      vehicles: [{
        id: 1,
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        value: 25000,
        annualMiles: 12000,
        ownership: 'financed'
      }],
      drivingRecord: 'clean',
      creditScore: 'good',
      currentPremium: 1200,
      coverageLevels: {
        liability: '100/300/100',
        collision: 500,
        comprehensive: 500,
        uninsured: true,
        medical: 5000
      }
    },
    homeInsurance: {
      homeValue: 300000,
      dwellingCoverage: 300000,
      personalProperty: 150000,
      liability: 300000,
      medicalPayments: 5000,
      deductible: 1000,
      homeType: 'single-family',
      yearBuilt: 2010,
      squareFeet: 2500,
      roofAge: 5,
      securityFeatures: ['smoke_detectors', 'deadbolts'],
      floodZone: false,
      earthquakeZone: false
    },
    healthInsurance: {
      plan: 'hmo',
      deductible: 1500,
      copay: 25,
      coinsurance: 20,
      maxOutOfPocket: 8000,
      monthlyPremium: 450,
      currentPremium: 450,
      employerContribution: 300,
      expectedMedicalCosts: 3000,
      hsaEligible: false,
      hsaContribution: 0,
      chronicConditions: false
    }
  });
  
  // CSV functionality
  const { exportCSV, createFileInputHandler } = useCSV('insurance');

  const exportInsuranceData = () => {
    const exportData = [{
      // General Information
      'Age': generalInfo.age,
      'State': generalInfo.state,
      'Dependents': generalInfo.dependents,
      'Annual Income': generalInfo.annualIncome,
      'Total Debt': generalInfo.totalDebt,
      'Emergency Fund': generalInfo.emergencyFund,
      
      // Life Insurance
      'Life Current Coverage': lifeInsurance.currentCoverage,
      'Life Employer Coverage': lifeInsurance.employerCoverage,
      'Spouse Income': lifeInsurance.spouseIncome,
      'Mortgage Balance': lifeInsurance.mortgageBalance,
      'Other Debts': lifeInsurance.otherDebts,
      'Children Education Fund': lifeInsurance.childrenEducation,
      'Final Expenses': lifeInsurance.finalExpenses,
      'Years of Income Replacement': lifeInsurance.yearsOfIncomeReplacement,
      
      // Auto Insurance
      'Auto Vehicle Value': autoInsurance.vehicleValue,
      'Auto Loan Balance': autoInsurance.loanBalance,
      'Auto Deductible': autoInsurance.deductible,
      'Auto Coverage Level': autoInsurance.coverageLevel,
      'Auto Monthly Premium': autoInsurance.monthlyPremium,
      
      // Home Insurance
      'Home Value': homeInsurance.homeValue,
      'Home Mortgage Balance': homeInsurance.mortgageBalance,
      'Home Personal Property': homeInsurance.personalProperty,
      'Home Deductible': homeInsurance.deductible,
      'Home Monthly Premium': homeInsurance.monthlyPremium,
      
      // Health Insurance
      'Health Plan Type': healthInsurance.planType,
      'Health Network': healthInsurance.network,
      'Health Deductible': healthInsurance.deductible,
      'Health Max Out of Pocket': healthInsurance.maxOutOfPocket,
      'Health Monthly Premium': healthInsurance.monthlyPremium
    }];
    
    exportCSV(exportData, 'insurance_analysis_data');
  };

  const handleCSVImport = createFileInputHandler(
    (result) => {
      const data = result.data[0];
      if (data && data['Age']) {
        setInsuranceData({
          activeTab: 'life',
          generalInfo: {
            age: parseInt(data['Age']) || 35,
            state: data['State'] || 'MI',
            dependents: parseInt(data['Dependents']) || 2,
            annualIncome: parseFloat(data['Annual Income']) || 75000,
            totalDebt: parseFloat(data['Total Debt']) || 250000,
            emergencyFund: parseFloat(data['Emergency Fund']) || 15000
          },
          lifeInsurance: {
            currentCoverage: parseFloat(data['Life Current Coverage']) || 0,
            employerCoverage: parseFloat(data['Life Employer Coverage']) || 100000,
            spouseIncome: parseFloat(data['Spouse Income']) || 50000,
            mortgageBalance: parseFloat(data['Mortgage Balance']) || 200000,
            otherDebts: parseFloat(data['Other Debts']) || 30000,
            childrenEducation: parseFloat(data['Children Education Fund']) || 100000,
            finalExpenses: parseFloat(data['Final Expenses']) || 15000,
            yearsOfIncomeReplacement: parseInt(data['Years of Income Replacement']) || 10
          },
          autoInsurance: {
            vehicleValue: parseFloat(data['Auto Vehicle Value']) || 25000,
            loanBalance: parseFloat(data['Auto Loan Balance']) || 15000,
            deductible: parseFloat(data['Auto Deductible']) || 1000,
            coverageLevel: data['Auto Coverage Level'] || 'full',
            monthlyPremium: parseFloat(data['Auto Monthly Premium']) || 150
          },
          homeInsurance: {
            homeValue: parseFloat(data['Home Value']) || 300000,
            mortgageBalance: parseFloat(data['Home Mortgage Balance']) || 200000,
            personalProperty: parseFloat(data['Home Personal Property']) || 75000,
            deductible: parseFloat(data['Home Deductible']) || 2500,
            monthlyPremium: parseFloat(data['Home Monthly Premium']) || 120
          },
          healthInsurance: {
            planType: data['Health Plan Type'] || 'hmo',
            network: data['Health Network'] || 'in-network',
            deductible: parseFloat(data['Health Deductible']) || 3000,
            maxOutOfPocket: parseFloat(data['Health Max Out of Pocket']) || 8000,
            monthlyPremium: parseFloat(data['Health Monthly Premium']) || 450
          }
        });
      }
    },
    (error) => {
      console.error('CSV import error:', error);
      alert('Error importing CSV file. Please check the format and try again.');
    }
  );
  
  // Destructure data for easier access
  const { activeTab, generalInfo, lifeInsurance, autoInsurance, homeInsurance, healthInsurance } = insuranceData;
  
  // Helper function to update insurance data
  const updateInsuranceData = (updates) => {
    setInsuranceData(prev => ({ ...prev, ...updates }));
  };

  // Helper functions for updating specific sections
  const setGeneralInfo = (updates) => {
    updateInsuranceData({ generalInfo: { ...generalInfo, ...updates } });
  };

  const setLifeInsurance = (updates) => {
    updateInsuranceData({ lifeInsurance: { ...lifeInsurance, ...updates } });
  };

  const setAutoInsurance = (updates) => {
    updateInsuranceData({ autoInsurance: { ...autoInsurance, ...updates } });
  };

  const setHomeInsurance = (updates) => {
    updateInsuranceData({ homeInsurance: { ...homeInsurance, ...updates } });
  };

  const setHealthInsurance = (updates) => {
    updateInsuranceData({ healthInsurance: { ...healthInsurance, ...updates } });
  };

  // Life Insurance calculations (data already available from insuranceData.lifeInsurance)
  // const [lifeInsurance, setLifeInsurance] = useState({
  //   currentCoverage: 0,
  //   employerCoverage: 100000,
  //   spouseIncome: 50000,
  //   mortgageBalance: 200000,
  //   otherDebts: 30000,
  //   childrenEducation: 100000,
  //   finalExpenses: 15000,
  //   yearsOfIncome: 10,
  //   insuranceType: 'term',
  //   termLength: 20
  // });

  // Auto Insurance State (data already available from insuranceData.autoInsurance)
  // const [autoInsurance, setAutoInsurance] = useState({
  //   vehicles: [{
  //     id: 1,
  //     year: 2020,
  //     make: 'Toyota',
  //     model: 'Camry',
  //     value: 25000,
  //     annualMiles: 12000,
  //     ownership: 'financed'
  //   }],
  //   drivingRecord: 'clean',
  //   creditScore: 'good',
  //   currentPremium: 1200,
  //   coverageLevels: {
  //     liability: '100/300/100',
  //     collision: 500,
  //     comprehensive: 500,
  //     uninsured: true,
  //     medical: 5000
  //   }
  // });

  // Home Insurance State (data already available from insuranceData.homeInsurance)
  // const [homeInsurance, setHomeInsurance] = useState({
  //   homeValue: 350000,
  //   yearBuilt: 2010,
  //   squareFeet: 2500,
  //   homeType: 'single_family',
  //   roofAge: 5,
  //   securityFeatures: ['smoke_detectors', 'deadbolts'],
  //   personalProperty: 100000,
  //   liability: 300000,
  //   deductible: 1000,
  //   floodZone: false,
  //   earthquakeZone: false
  // });

  // Health Insurance State (data already available from insuranceData.healthInsurance)
  // const [healthInsurance, setHealthInsurance] = useState({
  //   currentPremium: 400,
  //   employerContribution: 300,
  //   planType: 'ppo',
  //   deductible: 1500,
  //   outOfPocketMax: 5000,
  //   hsaEligible: false,
  //   hsaContribution: 0,
  //   expectedMedicalCosts: 3000,
  //   chronicConditions: false,
  //   preferredDoctors: true
  // });

  const [recommendations, setRecommendations] = useState([]);
  const [_collapsedSections, setCollapsedSections] = useState({});

  // Calculate life insurance needs
  const calculateLifeInsuranceNeeds = useCallback(() => {
    // DIME Method calculation
    const debts = lifeInsurance.mortgageBalance + lifeInsurance.otherDebts;
    const incomeReplacement = generalInfo.annualIncome * lifeInsurance.yearsOfIncome;
    const education = lifeInsurance.childrenEducation * generalInfo.dependents;
    const total = debts + incomeReplacement + lifeInsurance.finalExpenses + education;
    
    // Subtract existing coverage and assets
    const existingResources = lifeInsurance.currentCoverage + lifeInsurance.employerCoverage + generalInfo.emergencyFund;
    const gap = Math.max(0, total - existingResources);
    
    // Calculate affordability
    const recommendedPremium = generalInfo.annualIncome * 0.02; // 2% of income rule
    const termCost = gap * 0.003; // Rough estimate: $3 per $1000 of coverage per year
    const wholeCost = termCost * 10; // Whole life is roughly 10x more expensive
    
    return {
      totalNeed: total,
      existingCoverage: existingResources,
      coverageGap: gap,
      recommendedBudget: recommendedPremium,
      estimatedTermCost: termCost,
      estimatedWholeCost: wholeCost
    };
  }, [lifeInsurance, generalInfo]);

  // Calculate auto insurance estimate
  const calculateAutoInsurance = useCallback(() => {
    let totalPremium = 0;
    const vehiclePremiums = [];
    
    // Ensure vehicles array exists and has items
    const vehicles = autoInsurance?.vehicles || [];
    vehicles.forEach(vehicle => {
      // Base rate calculation
      let basePremium = 800; // National average base
      
      // Age factor
      if (generalInfo.age < 25) basePremium *= 1.8;
      else if (generalInfo.age < 30) basePremium *= 1.3;
      else if (generalInfo.age > 65) basePremium *= 1.1;
      
      // Vehicle factors
      const vehicleAge = new Date().getFullYear() - vehicle.year;
      if (vehicleAge < 3) basePremium *= 1.3;
      else if (vehicleAge > 10) basePremium *= 0.8;
      
      // Mileage factor
      if (vehicle.annualMiles > 15000) basePremium *= 1.2;
      else if (vehicle.annualMiles < 7500) basePremium *= 0.9;
      
      // Coverage level adjustments
      if (autoInsurance.coverageLevels.liability === '250/500/250') basePremium *= 1.3;
      if (autoInsurance.coverageLevels.collision === 250) basePremium *= 1.2;
      
      // Driving record
      if (autoInsurance.drivingRecord === 'accidents') basePremium *= 1.5;
      else if (autoInsurance.drivingRecord === 'tickets') basePremium *= 1.3;
      
      // State factor
      const stateFactor = STATE_INSURANCE_FACTORS[generalInfo.state]?.auto || 1;
      basePremium *= stateFactor;
      
      vehiclePremiums.push({
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        premium: Math.round(basePremium)
      });
      
      totalPremium += basePremium;
    });
    
    return {
      totalAnnualPremium: Math.round(totalPremium),
      monthlyPremium: Math.round(totalPremium / 12),
      vehiclePremiums,
      potentialSavings: Math.round(totalPremium * 0.15) // Potential 15% savings
    };
  }, [autoInsurance, generalInfo]);

  // Calculate home insurance estimate
  const calculateHomeInsurance = useCallback(() => {
    // Base rate: $3.50 per $1000 of home value
    let baseRate = (homeInsurance.homeValue / 1000) * 3.5;
    
    // Age of home factor
    const homeAge = new Date().getFullYear() - homeInsurance.yearBuilt;
    if (homeAge > 30) baseRate *= 1.3;
    else if (homeAge < 10) baseRate *= 0.9;
    
    // Roof age factor
    if (homeInsurance.roofAge > 15) baseRate *= 1.2;
    else if (homeInsurance.roofAge < 5) baseRate *= 0.95;
    
    // Security features discount
    const securityDiscount = homeInsurance.securityFeatures.length * 0.02;
    baseRate *= (1 - securityDiscount);
    
    // Deductible adjustment
    if (homeInsurance.deductible >= 2500) baseRate *= 0.85;
    else if (homeInsurance.deductible === 500) baseRate *= 1.15;
    
    // State factor
    const stateFactor = STATE_INSURANCE_FACTORS[generalInfo.state]?.home || 1;
    baseRate *= stateFactor;
    
    // Additional coverage
    if (homeInsurance.floodZone) baseRate += 1200; // Flood insurance
    if (homeInsurance.earthquakeZone) baseRate += 800; // Earthquake coverage
    
    return {
      annualPremium: Math.round(baseRate),
      monthlyPremium: Math.round(baseRate / 12),
      dwellingCoverage: homeInsurance.homeValue,
      personalPropertyCoverage: homeInsurance.personalProperty,
      liabilityCoverage: homeInsurance.liability,
      rebuildCost: Math.round(homeInsurance.homeValue * 1.25) // 125% for full rebuild
    };
  }, [homeInsurance, generalInfo]);

  // Calculate health insurance optimization
  const calculateHealthInsurance = useCallback(() => {
    const annualPremium = healthInsurance.currentPremium * 12;
    const employerContribution = healthInsurance.employerContribution * 12;
    const outOfPocket = annualPremium - employerContribution;
    
    // Calculate total expected costs
    const expectedTotalCost = outOfPocket + Math.min(healthInsurance.expectedMedicalCosts, healthInsurance.deductible);
    
    // HSA calculations
    let hsaSavings = 0;
    let hsaTaxBenefit = 0;
    if (healthInsurance.hsaEligible) {
      hsaSavings = healthInsurance.hsaContribution;
      hsaTaxBenefit = hsaSavings * 0.25; // Assume 25% tax bracket
    }
    
    // High deductible plan comparison
    const hdhpPremium = annualPremium * 0.7; // HDHP typically 30% cheaper
    const hdhpDeductible = 3000; // Typical HDHP deductible
    const hdhpMaxHSA = 3850; // 2024 individual limit
    const hdhpTotalCost = (hdhpPremium - employerContribution) + 
      Math.min(healthInsurance.expectedMedicalCosts, hdhpDeductible) - 
      (hdhpMaxHSA * 0.25); // Tax benefit
    
    return {
      currentPlanCost: expectedTotalCost,
      hdhpAlternativeCost: hdhpTotalCost,
      potentialSavings: Math.max(0, expectedTotalCost - hdhpTotalCost),
      hsaMaxContribution: hdhpMaxHSA,
      taxSavings: hsaTaxBenefit
    };
  }, [healthInsurance]);

  // Generate recommendations
  useEffect(() => {
    const newRecommendations = [];
    
    // Life insurance recommendations
    const lifeNeeds = calculateLifeInsuranceNeeds();
    if (lifeNeeds.coverageGap > 0) {
      newRecommendations.push({
        type: 'life',
        priority: 'high',
        title: 'Life Insurance Gap Detected',
        description: `You need an additional ${formatCurrency(lifeNeeds.coverageGap)} in life insurance coverage.`,
        action: lifeInsurance.insuranceType === 'term' ? 
          'Consider a 20-30 year term policy for affordable coverage.' :
          'Term life insurance could save you thousands while providing the same protection.'
      });
    }
    
    // Auto insurance recommendations
    const autoEstimate = calculateAutoInsurance();
    if (autoInsurance.currentPremium > autoEstimate.totalAnnualPremium * 1.2) {
      newRecommendations.push({
        type: 'auto',
        priority: 'medium',
        title: 'Potential Auto Insurance Savings',
        description: `You might be overpaying by ${formatCurrency(autoInsurance.currentPremium - autoEstimate.totalAnnualPremium)} annually.`,
        action: 'Shop around for quotes or increase your deductible to lower premiums.'
      });
    }
    
    // Home insurance recommendations
    const _homeEstimate = calculateHomeInsurance();
    if (homeInsurance.securityFeatures.length < 3) {
      newRecommendations.push({
        type: 'home',
        priority: 'low',
        title: 'Home Security Discount Available',
        description: 'Adding security features could reduce your premium by 5-15%.',
        action: 'Consider installing a security system, smart locks, or water leak detectors.'
      });
    }
    
    // Health insurance recommendations
    const healthAnalysis = calculateHealthInsurance();
    if (healthAnalysis.potentialSavings > 500 && !healthInsurance.chronicConditions) {
      newRecommendations.push({
        type: 'health',
        priority: 'medium',
        title: 'Consider a High-Deductible Health Plan',
        description: `You could save ${formatCurrency(healthAnalysis.potentialSavings)} annually with an HSA-eligible plan.`,
        action: 'Evaluate if an HDHP with HSA would better fit your healthcare needs.'
      });
    }
    
    setRecommendations(newRecommendations);
  }, [generalInfo, lifeInsurance, autoInsurance, homeInsurance, healthInsurance, calculateLifeInsuranceNeeds, calculateAutoInsurance, calculateHomeInsurance, calculateHealthInsurance]);


  // Toggle section collapse
  const _toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Add vehicle
  const addVehicle = () => {
    const newVehicle = {
      id: Date.now(),
      year: new Date().getFullYear(),
      make: '',
      model: '',
      value: 20000,
      annualMiles: 12000,
      ownership: 'owned'
    };
    setAutoInsurance(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle]
    }));
  };

  // Remove vehicle
  const removeVehicle = (vehicleId) => {
    setAutoInsurance(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== vehicleId)
    }));
  };

  // Update vehicle
  const updateVehicle = (vehicleId, field, value) => {
    setAutoInsurance(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => 
        v.id === vehicleId ? { ...v, [field]: value } : v
      )
    }));
  };

  // Calculate total insurance costs
  const calculateTotalCosts = () => {
    const life = calculateLifeInsuranceNeeds();
    const auto = calculateAutoInsurance();
    const home = calculateHomeInsurance();
    const health = calculateHealthInsurance();
    
    return {
      life: lifeInsurance.insuranceType === 'term' ? life.estimatedTermCost : life.estimatedWholeCost,
      auto: auto.totalAnnualPremium,
      home: home.annualPremium,
      health: health.currentPlanCost,
      total: (lifeInsurance.insuranceType === 'term' ? life.estimatedTermCost : life.estimatedWholeCost) +
             auto.totalAnnualPremium + home.annualPremium + health.currentPlanCost
    };
  };

  const totalCosts = calculateTotalCosts();
  const monthlyTotal = Math.round(totalCosts.total / 12);

  // Prepare chart data
  const costBreakdownData = [
    { name: 'Life', value: totalCosts.life, color: INSURANCE_TYPES.life.color },
    { name: 'Auto', value: totalCosts.auto, color: INSURANCE_TYPES.auto.color },
    { name: 'Home', value: totalCosts.home, color: INSURANCE_TYPES.home.color },
    { name: 'Health', value: totalCosts.health, color: INSURANCE_TYPES.health.color }
  ].filter(item => item.value > 0);

  const _insuranceRatioData = [
    { category: 'Insurance Costs', value: totalCosts.total },
    { category: 'Income', value: generalInfo.annualIncome }
  ];

  const insurancePercentOfIncome = (totalCosts.total / generalInfo.annualIncome * 100).toFixed(1);

  const navigationActions = [
    {
      label: 'Export Analysis',
      icon: <Download size={16} />,
      onClick: exportInsuranceData,
      variant: 'btn-ghost',
      hideTextOnMobile: true
    },
    {
      label: 'Import Data',
      icon: <Upload size={16} />,
      onClick: () => document.getElementById('insurance-csv-import').click(),
      variant: 'btn-ghost',
      hideTextOnMobile: true
    }
  ];

  return (
    <div className="page-container">
      <Navigation actions={navigationActions} />

      {/* Hidden file input for CSV import */}
      <input
        id="insurance-csv-import"
        type="file"
        accept=".csv"
        onChange={handleCSVImport}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Insurance Coverage Analyzer</h1>
          <p className="page-subtitle">Comprehensive analysis of your insurance needs and coverage gaps</p>
        </div>
      </div>

      {/* Intro Section */}
      <div className="page-intro-section">
        <h2 className="intro-title">Complete Insurance Coverage Analysis</h2>
        <p>
          Analyze all your insurance needs in one place. Get personalized recommendations for life, auto, 
          home, and health insurance based on your unique situation.
        </p>
        <div className="intro-features">
          <div className="feature">
            <Shield size={20} />
            <span>Coverage gap analysis</span>
          </div>
          <div className="feature">
            <Calculator size={20} />
            <span>Cost optimization</span>
          </div>
          <div className="feature">
            <Target size={20} />
            <span>Personalized recommendations</span>
          </div>
          <div className="feature">
            <DollarSign size={20} />
            <span>Savings opportunities</span>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Dashboard */}
        <div className="summary-grid">
          <div className="dashboard-card primary">
            <div className="dashboard-value">${formatCurrency(monthlyTotal)}</div>
            <div className="dashboard-label">Total Monthly Cost</div>
            <div className="dashboard-sublabel">All insurance types</div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-value">{insurancePercentOfIncome}%</div>
            <div className="dashboard-label">Of Annual Income</div>
            <div className="dashboard-sublabel">Target: 10-20%</div>
          </div>
          <div className="dashboard-card warning">
            <div className="dashboard-value">{recommendations.filter(r => r.priority === 'high').length}</div>
            <div className="dashboard-label">High Priority Items</div>
            <div className="dashboard-sublabel">Needs attention</div>
          </div>
          <div className="dashboard-card success">
            <div className="dashboard-value">
              ${formatCurrency(
                recommendations.reduce((sum, r) => {
                  if (r.type === 'auto') return sum + (autoInsurance.currentPremium - calculateAutoInsurance().totalAnnualPremium);
                  if (r.type === 'health') return sum + calculateHealthInsurance().potentialSavings;
                  return sum;
                }, 0)
              )}
            </div>
            <div className="dashboard-label">Potential Savings</div>
            <div className="dashboard-sublabel">Annual opportunity</div>
          </div>
        </div>

        {/* General Information */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <Users size={20} />
              General Information
            </h2>
          </div>
            <div className="input-grid">
              <div className="input-group">
                <label>Your Age</label>
                <input
                  type="number"
                  value={generalInfo.age}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, age: parseInt(e.target.value) || 0 })}
                  min="18"
                  max="100"
                />
              </div>
              <div className="input-group">
                <label>State</label>
                <select 
                  value={generalInfo.state}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, state: e.target.value })}
                >
                  <option value="CA">California</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  <option value="NY">New York</option>
                  <option value="MI">Michigan</option>
                </select>
              </div>
              <div className="input-group">
                <label>Number of Dependents</label>
                <input
                  type="number"
                  value={generalInfo.dependents}
                  onChange={(e) => setGeneralInfo({ ...generalInfo, dependents: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="10"
                />
              </div>
              <div className="input-group">
                <label>Annual Income</label>
                <div className="input-wrapper">
                  <span className="prefix">$</span>
                  <input
                    type="number"
                    value={generalInfo.annualIncome}
                    onChange={(e) => setGeneralInfo({ ...generalInfo, annualIncome: parseInt(e.target.value) || 0 })}
                    step="1000"
                  />
                </div>
              </div>
            </div>
        </div>

        {/* Insurance Type Tabs */}
        <div className="insurance-tabs">
          <div className="tabs-nav">
            {Object.entries(INSURANCE_TYPES).map(([key, type]) => {
              const Icon = type.icon;
              return (
                <button
                  key={key}
                  className={`tab-button ${activeTab === key ? 'active' : ''}`}
                  onClick={() => updateInsuranceData({ activeTab: key })}
                  style={activeTab === key ? { backgroundColor: type.color } : {}}
                >
                  <Icon size={18} />
                  <span>{type.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Life Insurance Tab */}
            {activeTab === 'life' && (
              <div className="tab-pane">
                <div className="section-card">
                  <div className="section-header">
                    <h3>Life Insurance Analysis</h3>
                  </div>
                    <div className="input-grid">
                      <div className="input-group">
                        <label>Current Life Insurance Coverage</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={lifeInsurance.currentCoverage}
                            onChange={(e) => setLifeInsurance({ ...lifeInsurance, currentCoverage: parseInt(e.target.value) || 0 })}
                            step="10000"
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Employer-Provided Coverage</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={lifeInsurance.employerCoverage}
                            onChange={(e) => setLifeInsurance({ ...lifeInsurance, employerCoverage: parseInt(e.target.value) || 0 })}
                            step="10000"
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Years of Income to Replace</label>
                        <input
                          type="number"
                          value={lifeInsurance.yearsOfIncome}
                          onChange={(e) => setLifeInsurance({ ...lifeInsurance, yearsOfIncome: parseInt(e.target.value) || 0 })}
                          min="1"
                          max="30"
                        />
                      </div>
                      <div className="input-group">
                        <label>Insurance Type Preference</label>
                        <select 
                          value={lifeInsurance.insuranceType}
                          onChange={(e) => setLifeInsurance({ ...lifeInsurance, insuranceType: e.target.value })}
                        >
                          <option value="term">Term Life (Lower Cost)</option>
                          <option value="whole">Whole Life (Cash Value)</option>
                        </select>
                      </div>
                    </div>

                    <div className="calculation-results">
                      <h4>Coverage Analysis</h4>
                      {(() => {
                        const needs = calculateLifeInsuranceNeeds();
                        return (
                          <div className="results-grid">
                            <div className="result-card">
                              <div className="result-label">Total Coverage Needed</div>
                              <div className="result-value">${formatCurrency(needs.totalNeed)}</div>
                            </div>
                            <div className="result-card">
                              <div className="result-label">Current Coverage</div>
                              <div className="result-value">${formatCurrency(needs.existingCoverage)}</div>
                            </div>
                            <div className="result-card highlight">
                              <div className="result-label">Coverage Gap</div>
                              <div className="result-value">${formatCurrency(needs.coverageGap)}</div>
                            </div>
                            <div className="result-card">
                              <div className="result-label">Estimated Annual Cost</div>
                              <div className="result-value">
                                ${formatCurrency(lifeInsurance.insuranceType === 'term' ? needs.estimatedTermCost : needs.estimatedWholeCost)}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            )}

            {/* Auto Insurance Tab */}
            {activeTab === 'auto' && (
              <div className="tab-pane">
                <div className="section-card">
                  <div className="section-header">
                    <h3>Auto Insurance Analysis</h3>
                    <button className="add-btn" onClick={addVehicle}>
                      Add Vehicle
                    </button>
                  </div>
                    <div className="vehicles-list">
                      {autoInsurance.vehicles.map((vehicle, index) => (
                        <div key={vehicle.id} className="vehicle-card">
                          <div className="vehicle-header">
                            <h4>Vehicle {index + 1}</h4>
                            {autoInsurance.vehicles.length > 1 && (
                              <button 
                                className="remove-btn"
                                onClick={() => removeVehicle(vehicle.id)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="input-grid">
                            <div className="input-group">
                              <label>Year</label>
                              <input
                                type="number"
                                value={vehicle.year}
                                onChange={(e) => updateVehicle(vehicle.id, 'year', parseInt(e.target.value) || 2020)}
                                min="1990"
                                max={new Date().getFullYear() + 1}
                              />
                            </div>
                            <div className="input-group">
                              <label>Make</label>
                              <input
                                type="text"
                                value={vehicle.make}
                                onChange={(e) => updateVehicle(vehicle.id, 'make', e.target.value)}
                                placeholder="Toyota"
                              />
                            </div>
                            <div className="input-group">
                              <label>Model</label>
                              <input
                                type="text"
                                value={vehicle.model}
                                onChange={(e) => updateVehicle(vehicle.id, 'model', e.target.value)}
                                placeholder="Camry"
                              />
                            </div>
                            <div className="input-group">
                              <label>Current Value</label>
                              <div className="input-wrapper">
                                <span className="prefix">$</span>
                                <input
                                  type="number"
                                  value={vehicle.value}
                                  onChange={(e) => updateVehicle(vehicle.id, 'value', parseInt(e.target.value) || 0)}
                                  step="1000"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="input-grid" style={{ marginTop: '2rem' }}>
                      <div className="input-group">
                        <label>Driving Record</label>
                        <select 
                          value={autoInsurance.drivingRecord}
                          onChange={(e) => setAutoInsurance({ ...autoInsurance, drivingRecord: e.target.value })}
                        >
                          <option value="clean">Clean (No accidents/tickets)</option>
                          <option value="tickets">Minor violations</option>
                          <option value="accidents">Accidents in past 5 years</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Current Annual Premium</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={autoInsurance.currentPremium}
                            onChange={(e) => setAutoInsurance({ ...autoInsurance, currentPremium: parseInt(e.target.value) || 0 })}
                            step="100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="calculation-results">
                      <h4>Premium Estimate</h4>
                      {(() => {
                        const estimate = calculateAutoInsurance();
                        return (
                          <div className="results-grid">
                            <div className="result-card">
                              <div className="result-label">Estimated Annual Premium</div>
                              <div className="result-value">${formatCurrency(estimate.totalAnnualPremium)}</div>
                            </div>
                            <div className="result-card">
                              <div className="result-label">Monthly Payment</div>
                              <div className="result-value">${formatCurrency(estimate.monthlyPremium)}</div>
                            </div>
                            <div className="result-card highlight">
                              <div className="result-label">Potential Savings</div>
                              <div className="result-value">
                                ${formatCurrency(Math.max(0, autoInsurance.currentPremium - estimate.totalAnnualPremium))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            )}

            {/* Home Insurance Tab */}
            {activeTab === 'home' && (
              <div className="tab-pane">
                <div className="section-card">
                  <div className="section-header">
                    <h3>Home Insurance Analysis</h3>
                  </div>
                    <div className="input-grid">
                      <div className="input-group">
                        <label>Home Value</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={homeInsurance.homeValue}
                            onChange={(e) => setHomeInsurance({ ...homeInsurance, homeValue: parseInt(e.target.value) || 0 })}
                            step="10000"
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Year Built</label>
                        <input
                          type="number"
                          value={homeInsurance.yearBuilt}
                          onChange={(e) => setHomeInsurance({ ...homeInsurance, yearBuilt: parseInt(e.target.value) || 2000 })}
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <div className="input-group">
                        <label>Square Feet</label>
                        <input
                          type="number"
                          value={homeInsurance.squareFeet}
                          onChange={(e) => setHomeInsurance({ ...homeInsurance, squareFeet: parseInt(e.target.value) || 0 })}
                          step="100"
                        />
                      </div>
                      <div className="input-group">
                        <label>Deductible</label>
                        <select 
                          value={homeInsurance.deductible}
                          onChange={(e) => setHomeInsurance({ ...homeInsurance, deductible: parseInt(e.target.value) })}
                        >
                          <option value="500">$500</option>
                          <option value="1000">$1,000</option>
                          <option value="2500">$2,500</option>
                          <option value="5000">$5,000</option>
                        </select>
                      </div>
                    </div>

                    <div className="security-features">
                      <h4>Security Features</h4>
                      <div className="checkbox-grid">
                        {['smoke_detectors', 'burglar_alarm', 'deadbolts', 'security_system', 'water_sensors'].map(feature => (
                          <label key={feature} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={homeInsurance.securityFeatures.includes(feature)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setHomeInsurance({
                                    ...homeInsurance,
                                    securityFeatures: [...homeInsurance.securityFeatures, feature]
                                  });
                                } else {
                                  setHomeInsurance({
                                    ...homeInsurance,
                                    securityFeatures: homeInsurance.securityFeatures.filter(f => f !== feature)
                                  });
                                }
                              }}
                            />
                            <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="calculation-results">
                      <h4>Coverage Estimate</h4>
                      {(() => {
                        const estimate = calculateHomeInsurance();
                        return (
                          <div className="results-grid">
                            <div className="result-card">
                              <div className="result-label">Annual Premium</div>
                              <div className="result-value">${formatCurrency(estimate.annualPremium)}</div>
                            </div>
                            <div className="result-card">
                              <div className="result-label">Monthly Payment</div>
                              <div className="result-value">${formatCurrency(estimate.monthlyPremium)}</div>
                            </div>
                            <div className="result-card highlight">
                              <div className="result-label">Rebuild Cost Coverage</div>
                              <div className="result-value">${formatCurrency(estimate.rebuildCost)}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            )}

            {/* Health Insurance Tab */}
            {activeTab === 'health' && (
              <div className="tab-pane">
                <div className="section-card">
                  <div className="section-header">
                    <h3>Health Insurance Analysis</h3>
                  </div>
                    <div className="input-grid">
                      <div className="input-group">
                        <label>Monthly Premium</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={healthInsurance.currentPremium}
                            onChange={(e) => setHealthInsurance({ ...healthInsurance, currentPremium: parseInt(e.target.value) || 0 })}
                            step="50"
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Employer Contribution</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={healthInsurance.employerContribution}
                            onChange={(e) => setHealthInsurance({ ...healthInsurance, employerContribution: parseInt(e.target.value) || 0 })}
                            step="50"
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Annual Deductible</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={healthInsurance.deductible}
                            onChange={(e) => setHealthInsurance({ ...healthInsurance, deductible: parseInt(e.target.value) || 0 })}
                            step="500"
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Expected Annual Medical Costs</label>
                        <div className="input-wrapper">
                          <span className="prefix">$</span>
                          <input
                            type="number"
                            value={healthInsurance.expectedMedicalCosts}
                            onChange={(e) => setHealthInsurance({ ...healthInsurance, expectedMedicalCosts: parseInt(e.target.value) || 0 })}
                            step="500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="calculation-results">
                      <h4>Cost Analysis</h4>
                      {(() => {
                        const analysis = calculateHealthInsurance();
                        return (
                          <div className="results-grid">
                            <div className="result-card">
                              <div className="result-label">Current Plan Total Cost</div>
                              <div className="result-value">${formatCurrency(analysis.currentPlanCost)}</div>
                            </div>
                            <div className="result-card">
                              <div className="result-label">HDHP Alternative Cost</div>
                              <div className="result-value">${formatCurrency(analysis.hdhpAlternativeCost)}</div>
                            </div>
                            <div className="result-card highlight">
                              <div className="result-label">Potential HSA Tax Savings</div>
                              <div className="result-value">${formatCurrency(analysis.hsaMaxContribution * 0.25)}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coverage Summary */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <PieChart size={20} />
              Total Insurance Coverage Summary
            </h2>
          </div>
            <div className="charts-grid">
              <div className="chart-container">
                <h4>Annual Cost Breakdown</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${formatCurrency(value)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="cost-summary">
                <h4>Annual Insurance Costs</h4>
                <div className="cost-items">
                  {Object.entries(INSURANCE_TYPES).map(([key, type]) => {
                    const Icon = type.icon;
                    return (
                      <div key={key} className="cost-item">
                        <Icon size={20} style={{ color: type.color }} />
                        <span>{type.name}</span>
                        <span className="cost-value">${formatCurrency(totalCosts[key])}</span>
                      </div>
                    );
                  })}
                  <div className="cost-item total">
                    <Shield size={20} />
                    <span>Total Annual Cost</span>
                    <span className="cost-value">${formatCurrency(totalCosts.total)}</span>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <Target size={20} />
                Personalized Recommendations
              </h2>
            </div>
              <div className="recommendations-grid">
                {recommendations.map((rec, index) => {
                  const Icon = INSURANCE_TYPES[rec.type].icon;
                  return (
                    <div key={index} className={`recommendation-card ${rec.priority}`}>
                      <div className="rec-header">
                        <Icon size={24} style={{ color: INSURANCE_TYPES[rec.type].color }} />
                        <span className={`priority-badge ${rec.priority}`}>
                          {rec.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <h4>{rec.title}</h4>
                      <p>{rec.description}</p>
                      <div className="rec-action">
                        <Zap size={16} />
                        <span>{rec.action}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}
      </div>

      <SuggestionBox />
    </div>
  );
};

export default InsuranceAnalyzer;