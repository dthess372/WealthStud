import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './components/HomePage/HomePage';

const RetirementCalc = lazy(() => import('./components/RetirementCalculator/RetirementCalc'));
const VacationPlanner = lazy(() => import('./components/VacationTimeTool/VacationPlanner'));
const BudgetPlanner = lazy(() => import('./components/BudgetPlanner/BudgetPlanner'));
const NetWorthCalculator = lazy(() => import('./components/NetWorthCalculator/NetWorthCalculator'));
const SavingPlanner = lazy(() => import('./components/SavingPlanner/SavingPlanner'));
const MortgageTool = lazy(() => import('./components/MortgageTool/MortgageTool'));
const InsuranceAnalyzer = lazy(() => import('./components/InsuranceAnalyzer/InsuranceAnalyzer'));
const FinancialDashboard = lazy(() => import('./components/FinancialDashboard/FinancialDashboard'));
const CapitalGainsAnalyzer = lazy(() => import('./components/CapitalGainsAnalyzer/CapitalGainsAnalyzer'));

function App() {
  return (
    <Router basename={process.env.NODE_ENV === 'production' ? '/WealthStud' : ''}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, paddingTop: '40px' }}>
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/RetirementCalculator" element={<RetirementCalc />} />
              <Route path="/VacationPlanner" element={<VacationPlanner />} />
              <Route path="/BudgetPlanner" element={<BudgetPlanner />} />
              <Route path="/NetWorthCalculator" element={<NetWorthCalculator />} />
              <Route path="/SavingPlanner" element={<SavingPlanner/>} />
              <Route path="/MortgageTool" element={<MortgageTool/>} />
              <Route path="/InsuranceAnalyzer" element={<InsuranceAnalyzer />} />
              <Route path="/FinancialDashboard" element={<FinancialDashboard />} />
              <Route path="/CapitalGainsAnalyzer" element={<CapitalGainsAnalyzer />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
