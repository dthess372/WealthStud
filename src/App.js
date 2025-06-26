import { HashRouter as Router, Routes, Route } from 'react-router-dom';

import HomePage from './components/HomePage/HomePage';
import RetirementCalc from './components/RetirementCalculator/RetirementCalc';
import VacationPlanner from './components/VacationTimeTool/VacationPlanner';
import Footer from './components/Footer/Footer';
import BudgetPlanner from './components/BudgetPlanner/BudgetPlanner';
import NetWorthCalculator from './components/NetWorthCalculator/NetWorthCalculator';
import SavingPlanner from './components/SavingPlanner/SavingPlanner';
import MortgageTool from './components/MortgageTool/MortgageTool';
import InsuranceAnalyzer from './components/InsuranceAnalyzer/InsuranceAnalyzer';
import FinancialDashboard from './components/FinancialDashboard/FinancialDashboard';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1 }}>
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
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
