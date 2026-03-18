import { useMemo } from 'react';
import Navigation from '../shared/Navigation';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GraduationCap, TrendingUp, Target, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { formatCurrency, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';
import './CollegeSavingsCalculator.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

// 2024–25 College Board average total Cost of Attendance (tuition+fees+room+board)
const SCHOOL_TYPES = [
  { key: 'instate',    label: 'In-State Public',     annualCost: 27146 },
  { key: 'outofstate', label: 'Out-of-State Public',  annualCost: 44016 },
  { key: 'private',   label: 'Private',               annualCost: 58628 },
];

const RETURN_PRESETS = [
  { label: 'Conservative', value: '5' },
  { label: 'Moderate',     value: '7' },
  { label: 'Aggressive',   value: '9' },
];

const DEFAULT_DATA = {
  childAge:           '',
  collegeStartAge:    '18',
  currentBalance:     '',
  monthlyContribution:'',
  annualReturn:       '7',
  tuitionInflation:   '5',
  schoolType:         'instate',
  customAnnualCost:   '',
};

// Project 529 balance year-by-year and projected 4-year cost year-by-year
function projectCollege({ yearsToCollege, currentBalance, monthlyContribution, annualReturn, annualCost, tuitionInflation }) {
  const monthlyRate = annualReturn / 100 / 12;
  const contrib = monthlyContribution;

  const chartData = [];

  // Balance projection: compound monthly
  let balance = currentBalance;
  for (let yr = 0; yr <= yearsToCollege; yr++) {
    const projectedCost = annualCost * Math.pow(1 + tuitionInflation / 100, yr) * 4;
    chartData.push({
      year: yr,
      balance: Math.round(balance),
      projectedCost: Math.round(projectedCost),
    });
    if (yr < yearsToCollege) {
      // Grow 12 months
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + contrib;
      }
    }
  }

  return chartData;
}

// Required monthly contribution to reach target balance in N years
function calcRequiredMonthly(target, currentBalance, yearsToCollege, annualReturn) {
  const monthlyRate = annualReturn / 100 / 12;
  const n = yearsToCollege * 12;
  if (n <= 0) return 0;

  const futureCurrentBalance = currentBalance * Math.pow(1 + monthlyRate, n);
  const remaining = target - futureCurrentBalance;
  if (remaining <= 0) return 0;

  if (monthlyRate === 0) return remaining / n;
  // FV of annuity: FV = pmt * ((1+r)^n - 1) / r
  return remaining / ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
}

const CollegeSavingsCalculator = () => {
  const [data, setData] = useLocalStorage(STORAGE_KEYS.COLLEGE_SAVINGS_DATA, DEFAULT_DATA);
  const { exportCSV } = useCSV('college-savings');

  const update = (field) => (e) => setData(prev => ({ ...prev, [field]: e.target.value }));

  const childAge         = parseNumber(data.childAge);
  const collegeStartAge  = parseNumber(data.collegeStartAge) || 18;
  const currentBalance   = parseNumber(data.currentBalance);
  const monthlyContrib   = parseNumber(data.monthlyContribution);
  const annualReturn     = parseNumber(data.annualReturn) || 7;
  const tuitionInflation = parseNumber(data.tuitionInflation) || 5;
  const yearsToCollege   = Math.max(0, collegeStartAge - childAge);

  const schoolType = SCHOOL_TYPES.find(s => s.key === data.schoolType) || SCHOOL_TYPES[0];
  const annualCost = parseNumber(data.customAnnualCost) || schoolType.annualCost;
  const projectedAnnualCost = annualCost * Math.pow(1 + tuitionInflation / 100, yearsToCollege);
  const projectedFourYearCost = projectedAnnualCost * 4;

  const { projectedBalance, chartData } = useMemo(() => {
    if (!data.childAge) return { projectedBalance: currentBalance, chartData: [] };
    const chart = projectCollege({
      yearsToCollege,
      currentBalance,
      monthlyContribution: monthlyContrib,
      annualReturn,
      annualCost,
      tuitionInflation,
    });
    const last = chart[chart.length - 1];
    return { projectedBalance: last?.balance ?? currentBalance, chartData: chart };
  }, [yearsToCollege, currentBalance, monthlyContrib, annualReturn, annualCost, tuitionInflation, data.childAge]);

  const gap = projectedFourYearCost - projectedBalance;
  const isFunded = gap <= 0;

  const requiredMonthly = useMemo(() => {
    if (isFunded) return 0;
    return calcRequiredMonthly(projectedFourYearCost, currentBalance, yearsToCollege, annualReturn);
  }, [isFunded, projectedFourYearCost, currentBalance, yearsToCollege, annualReturn]);

  const hasChildAge = data.childAge !== '';

  const handleExport = () => {
    exportCSV(
      [{
        childAge: data.childAge,
        collegeStartAge: data.collegeStartAge,
        currentBalance: data.currentBalance,
        monthlyContribution: data.monthlyContribution,
        annualReturn: data.annualReturn,
        tuitionInflation: data.tuitionInflation,
        schoolType: schoolType.label,
        annualCost,
        yearsToCollege,
        projectedBalance,
        projectedFourYearCost: Math.round(projectedFourYearCost),
        gap: Math.round(gap),
        requiredMonthly: Math.round(requiredMonthly),
      }],
      ['childAge','collegeStartAge','currentBalance','monthlyContribution','annualReturn',
       'tuitionInflation','schoolType','annualCost','yearsToCollege','projectedBalance',
       'projectedFourYearCost','gap','requiredMonthly']
    );
  };

  return (
    <div className="cs-page">
      <Navigation />

      <header className="cs-header">
        <div className="cs-header-content">
          <GraduationCap className="cs-header-icon" size={36} />
          <h1 className="cs-title">College Savings Calculator</h1>
          <p className="cs-subtitle">Plan your 529 contributions with year-by-year projections</p>
        </div>
      </header>

      <main className="cs-main">

        {/* Inputs */}
        <section className="cs-card">
          <h2 className="cs-card-title"><Target size={18} /> About Your Child & Goals</h2>
          <div className="cs-form-grid">

            <div className="cs-field">
              <label htmlFor="cs-child-age">Child&apos;s Current Age</label>
              <input
                id="cs-child-age"
                type="number"
                min="0"
                max="17"
                placeholder="e.g. 5"
                value={data.childAge}
                onChange={update('childAge')}
              />
            </div>

            <div className="cs-field">
              <label htmlFor="cs-college-age">College Start Age</label>
              <input
                id="cs-college-age"
                type="number"
                min="1"
                max="30"
                placeholder="18"
                value={data.collegeStartAge}
                onChange={update('collegeStartAge')}
              />
              <span className="cs-hint">Typically 18</span>
            </div>

            <div className="cs-field">
              <label htmlFor="cs-balance">Current 529 Balance ($)</label>
              <input
                id="cs-balance"
                type="number"
                min="0"
                placeholder="e.g. 10000"
                value={data.currentBalance}
                onChange={update('currentBalance')}
              />
            </div>

            <div className="cs-field">
              <label htmlFor="cs-contrib">Monthly Contribution ($)</label>
              <input
                id="cs-contrib"
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={data.monthlyContribution}
                onChange={update('monthlyContribution')}
              />
            </div>

            <div className="cs-field">
              <label htmlFor="cs-inflation">Tuition Inflation Rate (%/yr)</label>
              <input
                id="cs-inflation"
                type="number"
                min="0"
                step="0.1"
                placeholder="5"
                value={data.tuitionInflation}
                onChange={update('tuitionInflation')}
              />
              <span className="cs-hint">Historical avg ~5% per year</span>
            </div>

            <div className="cs-field">
              <label htmlFor="cs-custom-cost">Override Annual Cost ($, optional)</label>
              <input
                id="cs-custom-cost"
                type="number"
                min="0"
                placeholder={`e.g. ${schoolType.annualCost.toLocaleString()}`}
                value={data.customAnnualCost}
                onChange={update('customAnnualCost')}
              />
              <span className="cs-hint">Leave blank to use preset</span>
            </div>

          </div>

          {/* School type selector */}
          <div className="cs-selector-row">
            <label>Target School Type <span className="cs-hint-inline">(2024–25 NCES avg total COA)</span></label>
            <div className="cs-preset-buttons">
              {SCHOOL_TYPES.map(s => (
                <button
                  key={s.key}
                  className={`cs-preset-btn ${data.schoolType === s.key ? 'active' : ''}`}
                  onClick={() => setData(prev => ({ ...prev, schoolType: s.key, customAnnualCost: '' }))}
                >
                  {s.label}
                  <span className="cs-preset-sub">{formatCurrency(s.annualCost)}/yr</span>
                </button>
              ))}
            </div>
          </div>

          {/* Return rate selector */}
          <div className="cs-selector-row">
            <label>Expected Annual Return</label>
            <div className="cs-preset-buttons">
              {RETURN_PRESETS.map(p => (
                <button
                  key={p.value}
                  className={`cs-preset-btn ${data.annualReturn === p.value ? 'active' : ''}`}
                  onClick={() => setData(prev => ({ ...prev, annualReturn: p.value }))}
                >
                  {p.label}
                  <span className="cs-preset-sub">{p.value}%/yr</span>
                </button>
              ))}
            </div>
            <div className="cs-field cs-return-override">
              <label htmlFor="cs-return">Custom Return (%)</label>
              <input
                id="cs-return"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 7"
                value={data.annualReturn}
                onChange={update('annualReturn')}
              />
            </div>
          </div>
        </section>

        {/* Results */}
        {hasChildAge && (
          <>
            {/* Status banner */}
            <section className="cs-card cs-status-card" style={{ borderColor: isFunded ? '#22c55e' : '#f97316' }}>
              <div className="cs-status-row">
                {isFunded
                  ? <CheckCircle size={28} style={{ color: '#22c55e' }} />
                  : <AlertTriangle size={28} style={{ color: '#f97316' }} />}
                <div>
                  <div className="cs-status-label" style={{ color: isFunded ? '#22c55e' : '#f97316' }}>
                    {isFunded ? 'On Track — Fully Funded' : 'Funding Gap Detected'}
                  </div>
                  <div className="cs-status-desc">
                    {yearsToCollege <= 0
                      ? 'College start age reached.'
                      : `${yearsToCollege} year${yearsToCollege !== 1 ? 's' : ''} until college`}
                    {' · '}
                    {schoolType.label} · {annualReturn}% return · {tuitionInflation}% tuition inflation
                  </div>
                </div>
              </div>
            </section>

            {/* Metrics */}
            <section className="cs-metrics-grid">
              <div className="cs-metric">
                <div className="cs-metric-label">Projected 529 Balance</div>
                <div className="cs-metric-value" style={{ color: '#3b82f6' }}>{formatCurrency(projectedBalance)}</div>
                <div className="cs-metric-sub">at age {collegeStartAge}</div>
              </div>

              <div className="cs-metric">
                <div className="cs-metric-label">Projected 4-Year Cost</div>
                <div className="cs-metric-value">{formatCurrency(projectedFourYearCost)}</div>
                <div className="cs-metric-sub">{formatCurrency(projectedAnnualCost)}/yr inflated</div>
              </div>

              <div className="cs-metric">
                <div className="cs-metric-label">{isFunded ? 'Surplus' : 'Funding Gap'}</div>
                <div className="cs-metric-value" style={{ color: isFunded ? '#22c55e' : '#ef4444' }}>
                  {isFunded ? '+' : ''}{formatCurrency(Math.abs(gap))}
                </div>
                <div className="cs-metric-sub">{isFunded ? 'ahead of target' : 'shortfall at college start'}</div>
              </div>

              <div className="cs-metric">
                <div className="cs-metric-label">Required Monthly</div>
                <div className="cs-metric-value" style={{ color: isFunded ? '#22c55e' : '#f97316' }}>
                  {isFunded ? formatCurrency(0) : formatCurrency(requiredMonthly)}
                </div>
                <div className="cs-metric-sub">
                  {isFunded
                    ? 'no additional needed'
                    : `vs ${formatCurrency(monthlyContrib)} current`}
                </div>
              </div>
            </section>

            {/* Chart */}
            {chartData.length > 1 && (
              <section className="cs-card">
                <h2 className="cs-card-title"><TrendingUp size={18} /> Balance vs. Projected Cost</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="csBalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="csCostGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={v => `Yr ${v}`}
                      stroke="var(--secondary-text-color)"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                      stroke="var(--secondary-text-color)"
                      tick={{ fontSize: 11 }}
                      width={58}
                    />
                    <Tooltip
                      formatter={(v, name) => [formatCurrency(v), name === 'balance' ? '529 Balance' : '4-Yr Cost']}
                      labelFormatter={l => `Year ${l} (age ${Number(childAge) + Number(l)})`}
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 6 }}
                    />
                    <Legend
                      formatter={v => v === 'balance' ? '529 Balance' : 'Projected 4-Yr Cost'}
                      wrapperStyle={{ fontSize: '0.82rem', color: 'var(--secondary-text-color)' }}
                    />
                    <Area type="monotone" dataKey="balance"       stroke="#3b82f6" strokeWidth={2} fill="url(#csBalGrad)"  />
                    <Area type="monotone" dataKey="projectedCost" stroke="#f97316" strokeWidth={2} fill="url(#csCostGrad)" strokeDasharray="5 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Tips */}
            <section className="cs-card cs-tips-card">
              <h2 className="cs-card-title"><CheckCircle size={18} /> 529 Planning Tips</h2>
              <ul className="cs-tips">
                <li>529 earnings grow <strong>tax-free</strong> when used for qualified education expenses (tuition, fees, books, room & board).</li>
                {!isFunded && requiredMonthly > monthlyContrib && (
                  <li>Increase your monthly contribution by <strong>{formatCurrency(requiredMonthly - monthlyContrib)}</strong> to fully fund by college start.</li>
                )}
                <li>The annual federal gift tax exclusion is <strong>$18,000/year</strong> per contributor (2024). Superfunding allows up to $90,000 in a lump sum (5-year election).</li>
                <li>Many states offer <strong>state income tax deductions</strong> on 529 contributions — check your state&apos;s plan for additional savings.</li>
                <li>Unused 529 funds can be <strong>rolled over to a Roth IRA</strong> (up to $35,000 lifetime, subject to annual IRA limits) starting 2024.</li>
                {isFunded && (
                  <li>You&apos;re on track — consider whether the surplus should be redirected to a sibling, graduate school, or Roth IRA rollover.</li>
                )}
              </ul>
            </section>

            <div className="cs-export-row">
              <button className="cs-export-btn" onClick={handleExport}>
                <Download size={16} /> Export Summary
              </button>
            </div>
          </>
        )}

        {!hasChildAge && (
          <div className="cs-empty">
            Enter your child&apos;s age above to see your college savings projection.
          </div>
        )}

      </main>

      <SuggestionBox />
    </div>
  );
};

export default CollegeSavingsCalculator;
