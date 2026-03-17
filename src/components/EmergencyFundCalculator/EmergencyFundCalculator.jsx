import { useMemo } from 'react';
import Navigation from '../shared/Navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Target, Download } from 'lucide-react';
import { formatCurrency, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';
import './EmergencyFundCalculator.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

const COVERAGE_OPTIONS = [
  { months: 3, label: '3 months', tier: 'Basic' },
  { months: 6, label: '6 months', tier: 'Solid' },
  { months: 9, label: '9 months', tier: 'Conservative' },
  { months: 12, label: '12 months', tier: 'Very Conservative' },
];

const DEFAULT_DATA = {
  monthlyExpenses: '',
  currentBalance: '',
  targetMonths: 6,
  monthlyContribution: '',
  apy: '4.5',
};

// Returns months needed to reach target, and the monthly balance chart data.
function projectFund(currentBalance, target, monthlyContribution, apy) {
  const monthlyRate = parseNumber(apy) / 100 / 12;
  const contrib = parseNumber(monthlyContribution);
  const MAX_MONTHS = 600; // 50 years cap

  const data = [];
  let balance = currentBalance;
  let monthsToTarget = null;

  for (let m = 0; m <= MAX_MONTHS; m++) {
    data.push({ month: m, balance: Math.round(balance) });

    if (monthsToTarget === null && balance >= target) {
      monthsToTarget = m;
    }

    // Stop chart data once we hit target + a buffer (or after 60 months minimum)
    if (monthsToTarget !== null && m >= Math.max(monthsToTarget + 6, 12)) break;
    if (m === MAX_MONTHS) break;

    // Grow balance
    if (monthlyRate > 0) {
      balance = balance * (1 + monthlyRate) + contrib;
    } else {
      balance = balance + contrib;
    }
  }

  // If already funded, monthsToTarget stays 0
  if (monthsToTarget === null && balance < target) monthsToTarget = null; // never reached

  return { data, monthsToTarget };
}

function getTier(currentCoverage) {
  if (currentCoverage < 1) return { label: 'Critical', color: '#ef4444', icon: AlertTriangle, description: 'Less than 1 month covered — urgent priority.' };
  if (currentCoverage < 3) return { label: 'Underfunded', color: '#f97316', icon: AlertTriangle, description: 'Under 3 months. Build this before investing.' };
  if (currentCoverage < 6) return { label: 'Basic', color: '#eab308', icon: Shield, description: '3–6 months. Good start; aim for 6 months.' };
  if (currentCoverage < 9) return { label: 'Solid', color: '#22c55e', icon: CheckCircle, description: '6–9 months. Solid foundation.' };
  return { label: 'Conservative', color: '#10b981', icon: CheckCircle, description: '9+ months. Strong financial cushion.' };
}

function formatMonths(months) {
  if (months === null) return 'Never (increase contribution)';
  if (months === 0) return 'Already funded!';
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  const parts = [];
  if (yrs > 0) parts.push(`${yrs} yr${yrs !== 1 ? 's' : ''}`);
  if (mos > 0) parts.push(`${mos} mo${mos !== 1 ? 's' : ''}`);
  return parts.join(' ');
}

function projectedDate(monthsToTarget) {
  if (monthsToTarget === null) return null;
  if (monthsToTarget === 0) return 'Now';
  const d = new Date();
  d.setMonth(d.getMonth() + monthsToTarget);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const EmergencyFundCalculator = () => {
  const [data, setData] = useLocalStorage(STORAGE_KEYS.EMERGENCY_FUND_DATA, DEFAULT_DATA);
  const { exportCSV } = useCSV('emergency-fund');

  const update = (field) => (e) => setData(prev => ({ ...prev, [field]: e.target.value }));

  const monthlyExpenses = parseNumber(data.monthlyExpenses);
  const currentBalance  = parseNumber(data.currentBalance);
  const targetAmount    = monthlyExpenses * data.targetMonths;
  const gap             = Math.max(0, targetAmount - currentBalance);
  const currentCoverage = monthlyExpenses > 0 ? currentBalance / monthlyExpenses : 0;
  const tier            = getTier(currentCoverage);

  const { data: chartData, monthsToTarget } = useMemo(
    () => {
      if (monthlyExpenses <= 0) return { data: [], monthsToTarget: null };
      return projectFund(currentBalance, targetAmount, data.monthlyContribution, data.apy);
    },
    [currentBalance, targetAmount, data.monthlyContribution, data.apy, monthlyExpenses]
  );

  const handleExport = () => {
    exportCSV(
      [
        {
          monthlyExpenses: data.monthlyExpenses,
          currentBalance: data.currentBalance,
          targetMonths: data.targetMonths,
          monthlyContribution: data.monthlyContribution,
          apy: data.apy,
          targetAmount,
          gap,
          currentCoverageMonths: currentCoverage.toFixed(1),
          tier: tier.label,
          monthsToTarget,
        },
      ],
      ['monthlyExpenses','currentBalance','targetMonths','monthlyContribution','apy',
       'targetAmount','gap','currentCoverageMonths','tier','monthsToTarget']
    );
  };

  const TierIcon = tier.icon;

  return (
    <div className="ef-page">
      <Navigation />

      {/* Header */}
      <header className="ef-header">
        <div className="ef-header-content">
          <Shield className="ef-header-icon" size={36} />
          <h1 className="ef-title">Emergency Fund Calculator</h1>
          <p className="ef-subtitle">Build your financial safety net with confidence</p>
        </div>
      </header>

      <main className="ef-main">

        {/* Inputs */}
        <section className="ef-card">
          <h2 className="ef-card-title"><Target size={18} /> Your Finances</h2>
          <div className="ef-form-grid">

            <div className="ef-field">
              <label>Monthly Essential Expenses ($)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 3500"
                value={data.monthlyExpenses}
                onChange={update('monthlyExpenses')}
              />
              <span className="ef-hint">Rent, utilities, groceries, insurance, minimums</span>
            </div>

            <div className="ef-field">
              <label>Current Emergency Fund Balance ($)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={data.currentBalance}
                onChange={update('currentBalance')}
              />
            </div>

            <div className="ef-field">
              <label>Monthly Contribution ($)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={data.monthlyContribution}
                onChange={update('monthlyContribution')}
              />
            </div>

            <div className="ef-field">
              <label>Savings APY (%)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 4.5"
                value={data.apy}
                onChange={update('apy')}
              />
              <span className="ef-hint">Current HYSA rates are typically 4–5%</span>
            </div>

          </div>

          {/* Target months selector */}
          <div className="ef-target-row">
            <label>Target Coverage</label>
            <div className="ef-coverage-buttons">
              {COVERAGE_OPTIONS.map(opt => (
                <button
                  key={opt.months}
                  className={`ef-coverage-btn ${data.targetMonths === opt.months ? 'active' : ''}`}
                  onClick={() => setData(prev => ({ ...prev, targetMonths: opt.months }))}
                >
                  {opt.label}
                  <span className="ef-coverage-tier">{opt.tier}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results — only show if we have expenses */}
        {monthlyExpenses > 0 && (
          <>
            {/* Status banner */}
            <section className="ef-card ef-status-card" style={{ borderColor: tier.color }}>
              <div className="ef-status-row">
                <TierIcon size={28} style={{ color: tier.color }} />
                <div>
                  <div className="ef-status-label" style={{ color: tier.color }}>{tier.label}</div>
                  <div className="ef-status-desc">{tier.description}</div>
                </div>
              </div>
            </section>

            {/* Key metrics */}
            <section className="ef-metrics-grid">

              <div className="ef-metric">
                <div className="ef-metric-label">Target Amount</div>
                <div className="ef-metric-value">{formatCurrency(targetAmount)}</div>
                <div className="ef-metric-sub">{data.targetMonths} months × {formatCurrency(monthlyExpenses)}/mo</div>
              </div>

              <div className="ef-metric">
                <div className="ef-metric-label">Current Coverage</div>
                <div className="ef-metric-value">{currentCoverage.toFixed(1)} mo</div>
                <div className="ef-metric-sub">{formatCurrency(currentBalance)} saved</div>
              </div>

              <div className="ef-metric">
                <div className="ef-metric-label">Gap to Target</div>
                <div className="ef-metric-value" style={{ color: gap > 0 ? '#f97316' : '#22c55e' }}>
                  {gap > 0 ? formatCurrency(gap) : 'Funded!'}
                </div>
                <div className="ef-metric-sub">{gap > 0 ? 'remaining' : 'You\'ve hit your target'}</div>
              </div>

              <div className="ef-metric">
                <div className="ef-metric-label">Reach Target In</div>
                <div className="ef-metric-value">{formatMonths(monthsToTarget)}</div>
                <div className="ef-metric-sub">
                  {projectedDate(monthsToTarget) && projectedDate(monthsToTarget) !== 'Now'
                    ? `By ${projectedDate(monthsToTarget)}`
                    : projectedDate(monthsToTarget) || ''}
                </div>
              </div>

            </section>

            {/* Growth chart */}
            {chartData.length > 1 && (
              <section className="ef-card">
                <h2 className="ef-card-title"><TrendingUp size={18} /> Savings Growth</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="efGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={v => v === 0 ? 'Now' : `${v}mo`}
                      stroke="var(--secondary-text-color)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                      stroke="var(--secondary-text-color)"
                      tick={{ fontSize: 11 }}
                      width={55}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v), 'Balance']}
                      labelFormatter={(l) => l === 0 ? 'Now' : `Month ${l}`}
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6 }}
                    />
                    {targetAmount > 0 && (
                      <ReferenceLine
                        y={targetAmount}
                        stroke="#22c55e"
                        strokeDasharray="6 3"
                        label={{ value: 'Target', fill: '#22c55e', fontSize: 11, position: 'insideTopRight' }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#efGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Recommendation */}
            <section className="ef-card ef-tips-card">
              <h2 className="ef-card-title"><CheckCircle size={18} /> Recommendations</h2>
              <ul className="ef-tips">
                <li>Keep your emergency fund in a <strong>high-yield savings account (HYSA)</strong> — it earns interest while remaining instantly accessible.</li>
                {gap > 0 && parseNumber(data.monthlyContribution) === 0 && (
                  <li>Set a monthly auto-transfer to accelerate progress. Even {formatCurrency(monthlyExpenses * 0.1)}/mo ({Math.round(10)}% of expenses) builds habit.</li>
                )}
                {currentCoverage < 3 && (
                  <li>Pause non-essential investing until you reach 3 months of coverage — this is Baby Step 3 for good reason.</li>
                )}
                {currentCoverage >= 6 && (
                  <li>Great work! With {currentCoverage.toFixed(1)} months covered, redirect excess savings to investments or debt payoff.</li>
                )}
                <li>Revisit your target whenever expenses change significantly (new rent, family, job change).</li>
              </ul>
            </section>

            <div className="ef-export-row">
              <button className="ef-export-btn" onClick={handleExport}>
                <Download size={16} /> Export Summary
              </button>
            </div>
          </>
        )}

        {monthlyExpenses === 0 && (
          <div className="ef-empty">
            Enter your monthly essential expenses above to see your emergency fund analysis.
          </div>
        )}

      </main>

      <SuggestionBox />
    </div>
  );
};

export default EmergencyFundCalculator;
