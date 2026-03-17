import { useState, useMemo } from 'react';
import Navigation from '../shared/Navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingDown, Plus, Trash2, Calculator, Download } from 'lucide-react';
import { formatCurrency, parseNumber } from '../../lib/utils';
import { STORAGE_KEYS } from '../../lib/constants';
import { useLocalStorage, useCSV } from '../../hooks';
import {
  comparePayoffStrategies,
  calculatePayoffStrategy,
  calculateConsolidation,
} from '../../lib/debtCalculations';
import './DebtPayoffPlanner.css';
import '../../styles/shared-page-styles.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

const DEFAULT_DEBTS = [
  { id: '1', name: 'Credit Card', balance: 8000, annualRate: 22, minPayment: 200 },
  { id: '2', name: 'Car Loan', balance: 12000, annualRate: 6.5, minPayment: 250 },
  { id: '3', name: 'Student Loan', balance: 20000, annualRate: 5.5, minPayment: 220 },
];

const DEFAULT_SETTINGS = {
  extraPayment: 200,
  strategy: 'avalanche',
};

const DEFAULT_CONSOLIDATION = {
  rate: 9,
  termMonths: 60,
  fee: 0,
  enabled: false,
};

let nextId = 4;

const DebtPayoffPlanner = () => {
  const [debts, setDebts] = useLocalStorage(STORAGE_KEYS.DEBT_PLANNER_DATA, DEFAULT_DEBTS);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [consolidation, setConsolidation] = useState(DEFAULT_CONSOLIDATION);
  const [newDebt, setNewDebt] = useState({ name: '', balance: '', annualRate: '', minPayment: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const { exportCSV } = useCSV('debt-planner');

  // Main calculation
  const results = useMemo(() => {
    const validDebts = debts.filter(d => d.balance > 0 && d.minPayment > 0);
    if (validDebts.length === 0) return null;

    const comparison = comparePayoffStrategies(validDebts, parseNumber(settings.extraPayment));
    const chosen = calculatePayoffStrategy(
      validDebts,
      parseNumber(settings.extraPayment),
      settings.strategy
    );

    // Build monthly chart data (sample every 3 months for performance)
    const chartData = chosen.schedule
      .filter((_, i) => i % 3 === 0 || i === chosen.schedule.length - 1)
      .map(row => ({
        month: row.month,
        label: `Mo ${row.month}`,
        balance: Math.round(row.totalBalance),
      }));

    // Consolidation
    let consolidationResult = null;
    if (consolidation.enabled) {
      consolidationResult = calculateConsolidation(
        validDebts,
        parseNumber(consolidation.rate),
        parseNumber(consolidation.termMonths),
        parseNumber(consolidation.fee)
      );
    }

    return { comparison, chosen, chartData, consolidationResult };
  }, [debts, settings, consolidation]);

  const totalBalance = debts.reduce((s, d) => s + parseNumber(d.balance), 0);
  const totalMinPayment = debts.reduce((s, d) => s + parseNumber(d.minPayment), 0);

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.balance || !newDebt.annualRate || !newDebt.minPayment) return;
    setDebts(prev => [
      ...prev,
      {
        id: String(nextId++),
        name: newDebt.name,
        balance: parseNumber(newDebt.balance),
        annualRate: parseNumber(newDebt.annualRate),
        minPayment: parseNumber(newDebt.minPayment),
      },
    ]);
    setNewDebt({ name: '', balance: '', annualRate: '', minPayment: '' });
    setShowAddForm(false);
  };

  const handleRemoveDebt = id => setDebts(prev => prev.filter(d => d.id !== id));

  const handleDebtChange = (id, field, value) => {
    setDebts(prev =>
      prev.map(d =>
        d.id === id
          ? { ...d, [field]: field === 'name' ? value : parseNumber(value) || value }
          : d
      )
    );
  };

  const handleExport = () => {
    const rows = debts.map(d => ({
      Name: d.name,
      Balance: d.balance,
      'Annual Rate (%)': d.annualRate,
      'Min Payment': d.minPayment,
    }));
    exportCSV(rows, 'debt-planner');
  };

  const formatMonths = months => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m}mo`;
    if (m === 0) return `${y}yr`;
    return `${y}yr ${m}mo`;
  };

  const comparisonBarData = results
    ? [
        {
          name: 'Minimum Only',
          months: results.comparison.minimumOnly.months,
          interest: Math.round(results.comparison.minimumOnly.totalInterestPaid),
        },
        {
          name: 'Snowball',
          months: results.comparison.snowball.months,
          interest: Math.round(results.comparison.snowball.totalInterestPaid),
        },
        {
          name: 'Avalanche',
          months: results.comparison.avalanche.months,
          interest: Math.round(results.comparison.avalanche.totalInterestPaid),
        },
      ]
    : [];

  return (
    <div className="debt-planner">
      <Navigation />

      <div className="debt-header">
        <div className="debt-header-content">
          <div className="debt-header-icon">
            <TrendingDown size={32} />
          </div>
          <h1 className="debt-title">Debt Payoff Planner</h1>
          <p className="debt-subtitle">
            Compare avalanche vs snowball strategies and find your fastest path to debt-free
          </p>
        </div>
      </div>

      <div className="debt-main">
        {/* ── Debts Table ── */}
        <section className="debt-card">
          <div className="debt-card-header">
            <h2 className="debt-card-title">Your Debts</h2>
            <div className="debt-card-actions">
              <button className="btn-secondary" onClick={handleExport}>
                <Download size={14} /> Export
              </button>
              <button className="btn-primary" onClick={() => setShowAddForm(v => !v)}>
                <Plus size={14} /> Add Debt
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="add-debt-form">
              <input
                placeholder="Name (e.g. Credit Card)"
                value={newDebt.name}
                onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Balance ($)"
                value={newDebt.balance}
                onChange={e => setNewDebt(p => ({ ...p, balance: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Annual Rate (%)"
                value={newDebt.annualRate}
                onChange={e => setNewDebt(p => ({ ...p, annualRate: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Min Payment ($)"
                value={newDebt.minPayment}
                onChange={e => setNewDebt(p => ({ ...p, minPayment: e.target.value }))}
              />
              <button className="btn-primary" onClick={handleAddDebt}>Add</button>
              <button className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          )}

          <div className="debt-table-wrapper">
            <table className="debt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Balance</th>
                  <th>Rate (%)</th>
                  <th>Min Payment</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {debts.map(d => (
                  <tr key={d.id}>
                    <td>
                      <input
                        className="inline-input"
                        value={d.name}
                        onChange={e => handleDebtChange(d.id, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        value={d.balance}
                        onChange={e => handleDebtChange(d.id, 'balance', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        value={d.annualRate}
                        onChange={e => handleDebtChange(d.id, 'annualRate', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="inline-input"
                        type="number"
                        value={d.minPayment}
                        onChange={e => handleDebtChange(d.id, 'minPayment', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleRemoveDebt(d.id)}
                        aria-label="Remove debt"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="debt-table-total">
                  <td>Total</td>
                  <td>{formatCurrency(totalBalance)}</td>
                  <td>—</td>
                  <td>{formatCurrency(totalMinPayment)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* ── Strategy Settings ── */}
        <section className="debt-card">
          <h2 className="debt-card-title">Payoff Strategy</h2>
          <div className="strategy-grid">
            <div className="form-group">
              <label htmlFor="extra-payment">Extra Monthly Payment</label>
              <div className="input-prefix">
                <span>$</span>
                <input
                  id="extra-payment"
                  type="number"
                  value={settings.extraPayment}
                  onChange={e => setSettings(p => ({ ...p, extraPayment: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Strategy</label>
              <div className="strategy-toggle">
                <button
                  className={`strategy-btn ${settings.strategy === 'avalanche' ? 'active' : ''}`}
                  onClick={() => setSettings(p => ({ ...p, strategy: 'avalanche' }))}
                >
                  Avalanche
                  <span className="strategy-hint">Highest rate first</span>
                </button>
                <button
                  className={`strategy-btn ${settings.strategy === 'snowball' ? 'active' : ''}`}
                  onClick={() => setSettings(p => ({ ...p, strategy: 'snowball' }))}
                >
                  Snowball
                  <span className="strategy-hint">Lowest balance first</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        {results && (
          <>
            {/* Summary stats */}
            <section className="debt-stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-label">Payoff Timeline</div>
                <div className="stat-value">
                  {formatMonths(
                    settings.strategy === 'avalanche'
                      ? results.comparison.avalanche.months
                      : results.comparison.snowball.months
                  )}
                </div>
                <div className="stat-sub">with {formatCurrency(parseNumber(settings.extraPayment))} extra/mo</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Interest</div>
                <div className="stat-value stat-danger">
                  {formatCurrency(
                    settings.strategy === 'avalanche'
                      ? results.comparison.avalanche.totalInterestPaid
                      : results.comparison.snowball.totalInterestPaid
                  )}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Interest Saved vs Min-Only</div>
                <div className="stat-value stat-success">
                  {formatCurrency(
                    results.comparison.minimumOnly.totalInterestPaid -
                      (settings.strategy === 'avalanche'
                        ? results.comparison.avalanche.totalInterestPaid
                        : results.comparison.snowball.totalInterestPaid)
                  )}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Months Saved vs Min-Only</div>
                <div className="stat-value stat-success">
                  {results.comparison.minimumOnly.months -
                    (settings.strategy === 'avalanche'
                      ? results.comparison.avalanche.months
                      : results.comparison.snowball.months)}{' '}
                  mo
                </div>
              </div>
            </section>

            {/* Balance over time */}
            <section className="debt-card">
              <h2 className="debt-card-title">Balance Over Time ({settings.strategy})</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={results.chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="label" tick={{ fill: '#aaa', fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#aaa', fontSize: 11 }} />
                  <Tooltip
                    formatter={v => formatCurrency(v)}
                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#ccc' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--primary-color)"
                    strokeWidth={2}
                    dot={false}
                    name="Total Balance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>

            {/* Strategy comparison */}
            <section className="debt-card">
              <h2 className="debt-card-title">Strategy Comparison</h2>
              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Payoff Time</th>
                      <th>Total Interest</th>
                      <th>Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'minimumOnly', label: 'Minimum Only' },
                      { key: 'snowball', label: 'Snowball' },
                      { key: 'avalanche', label: 'Avalanche' },
                    ].map(({ key, label }) => (
                      <tr
                        key={key}
                        className={key === settings.strategy ? 'row-active' : ''}
                      >
                        <td>{label}</td>
                        <td>{formatMonths(results.comparison[key].months)}</td>
                        <td>{formatCurrency(results.comparison[key].totalInterestPaid)}</td>
                        <td>{formatCurrency(results.comparison[key].totalPaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonBarData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" tick={{ fill: '#aaa', fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: '#aaa', fontSize: 11 }} />
                  <Tooltip
                    formatter={v => formatCurrency(v)}
                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#ccc' }}
                  />
                  <Bar dataKey="interest" fill="#f97316" name="Total Interest" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Consolidation */}
            <section className="debt-card">
              <div className="debt-card-header">
                <h2 className="debt-card-title">Debt Consolidation</h2>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={consolidation.enabled}
                    onChange={e => setConsolidation(p => ({ ...p, enabled: e.target.checked }))}
                  />
                  Analyze
                </label>
              </div>

              {consolidation.enabled && (
                <>
                  <div className="consolidation-inputs">
                    <div className="form-group">
                      <label htmlFor="con-rate">Consolidated Rate (%)</label>
                      <input
                        id="con-rate"
                        type="number"
                        value={consolidation.rate}
                        onChange={e => setConsolidation(p => ({ ...p, rate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="con-term">Term (months)</label>
                      <input
                        id="con-term"
                        type="number"
                        value={consolidation.termMonths}
                        onChange={e => setConsolidation(p => ({ ...p, termMonths: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="con-fee">Origination Fee ($)</label>
                      <input
                        id="con-fee"
                        type="number"
                        value={consolidation.fee}
                        onChange={e => setConsolidation(p => ({ ...p, fee: e.target.value }))}
                      />
                    </div>
                  </div>

                  {results.consolidationResult && (
                    <div className="consolidation-results">
                      <div className={`consolidation-verdict ${results.consolidationResult.isWorthIt ? 'verdict-good' : 'verdict-bad'}`}>
                        {results.consolidationResult.isWorthIt
                          ? '✓ Consolidation saves money'
                          : '✗ Consolidation costs more than current strategy'}
                      </div>
                      <div className="consolidation-stats">
                        <div className="con-stat">
                          <span>New Monthly Payment</span>
                          <strong>{formatCurrency(results.consolidationResult.consolidatedMonthlyPayment)}</strong>
                        </div>
                        <div className="con-stat">
                          <span>Interest Before</span>
                          <strong>{formatCurrency(results.consolidationResult.totalInterestBefore)}</strong>
                        </div>
                        <div className="con-stat">
                          <span>Interest After</span>
                          <strong>{formatCurrency(results.consolidationResult.totalInterestAfter)}</strong>
                        </div>
                        <div className="con-stat">
                          <span>Net Savings</span>
                          <strong className={results.consolidationResult.netSavings >= 0 ? 'stat-success' : 'stat-danger'}>
                            {formatCurrency(results.consolidationResult.netSavings)}
                          </strong>
                        </div>
                        {results.consolidationResult.breakEvenMonths !== null && results.consolidationResult.breakEvenMonths > 0 && (
                          <div className="con-stat">
                            <span>Break-even</span>
                            <strong>{formatMonths(results.consolidationResult.breakEvenMonths)}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        {debts.length === 0 && (
          <div className="empty-state">
            <Calculator size={48} />
            <p>Add your first debt above to get started</p>
          </div>
        )}
      </div>

      <SuggestionBox toolName="Debt Payoff Planner" />
    </div>
  );
};

export default DebtPayoffPlanner;
