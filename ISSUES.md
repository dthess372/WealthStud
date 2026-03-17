# WealthStud — Known Issues & Technical Debt

This document tracks identified issues, bugs, and improvement opportunities found during codebase analysis (2026-03-17). Each issue is categorized by priority and type.

---

## Priority Legend
- 🔴 **High** — Functional bug or significant risk
- 🟡 **Medium** — Code quality / maintainability concern
- 🟢 **Low** — Nice-to-have improvement

---

## 🔴 High Priority

### ISSUE-001: `withPerformanceTracking` HOC Violates Rules of Hooks
**File:** `src/lib/performance.js`
**Type:** Bug
**Impact:** Will throw in React 18 Strict Mode; breaks any component using this HOC

`withPerformanceTracking` calls `React.useEffect` inside a plain function, not inside a React component. This violates the Rules of Hooks and will produce runtime errors.

**Fix:** Rewrite as a proper HOC that returns a functional component wrapping the input component, and call `useEffect` inside that returned component.

---

### ISSUE-002: Unused / Dead Dependencies in `package.json`
**File:** `package.json`
**Type:** Bug / Security
**Impact:** Bloated bundle size, unnecessary security attack surface, confusing to contributors

The following packages appear to be unused in the codebase:
- `firebase` (^10.11.0) — no Firebase imports found anywhere
- `react-charts` (^3.0.0-beta.57) — beta package; `recharts` is the active chart library
- `@shadcn/ui` (^0.0.4) — extremely outdated version, not used

**Fix:** Run `npm uninstall firebase react-charts @shadcn/ui` and verify no regressions. Run `npm audit` after cleanup.

---

## 🟡 Medium Priority

### ISSUE-003: No TypeScript — Financial Calculations Are Type-Unsafe
**Files:** `src/lib/utils.js`, `src/lib/taxes.js`, `src/lib/mortgageCalculations.js`
**Type:** Code Quality / Risk
**Impact:** Silently incorrect results if wrong types are passed to financial functions (e.g., string instead of number in `calculateFederalTax`)

Financial applications have near-zero tolerance for type errors. A miscasted parameter produces wrong output without any runtime warning.

**Fix:** Migrate `src/lib/` and `src/hooks/` to TypeScript first (highest ROI), then progressively type components. Create `src/types/` for shared interfaces (`TaxBracket`, `MortgagePayment`, `RetirementProjection`, etc.).

---

### ISSUE-004: `FinancialDashboard` Component Is Too Large
**File:** `src/components/FinancialDashboard/`
**Type:** Maintainability
**Impact:** ~79 KB component is hard to test, modify, and review; single file violates single-responsibility principle

**Fix:** Decompose into sub-components:
- `DashboardSummaryPanel` — top-level net worth / budget summary
- `DashboardChartsPanel` — all chart visualizations
- `DashboardToolLinks` — quick-access navigation grid
- `DashboardInsights` — any calculated insights/suggestions

---

### ISSUE-005: Insufficient Component-Level Test Coverage
**Files:** `src/components/__tests__/`
**Type:** Testing Gap
**Impact:** Logic regressions in high-value tools go undetected; only `BudgetPlanner` and `NetWorthCalculator` have tests

Missing component tests for:
- `RetirementCalculator` — Monte Carlo simulation output and chart rendering
- `MortgageTool` — amortization schedule accuracy and payment breakdown
- `CapitalGainsAnalyzer` — tax bracket calculation correctness in UI
- `FinancialDashboard` — cross-tool data aggregation

**Fix:** Add React Testing Library tests for each tool focusing on: user input → calculated output accuracy, CSV export/import round-trips, and localStorage persistence.

---

### ISSUE-006: No Route-Level Code Splitting
**File:** `src/App.js`
**Type:** Performance
**Impact:** All tool components are loaded on initial page load, increasing time-to-interactive unnecessarily

**Fix:** Wrap each route component in `React.lazy()` with a `<Suspense>` fallback:
```jsx
const RetirementCalculator = React.lazy(() => import('./components/RetirementCalculator/RetirementCalculator'));
```

---

### ISSUE-007: Console Statements in Production Code
**Files:** Multiple — approximately 23 instances across `src/lib/` and `src/components/`
**Type:** Code Quality
**Impact:** Leaks internal state/error details to browser console in production; noisy during development

**Fix:** Create a simple logger utility in `src/lib/logger.js`:
```js
const isDev = process.env.NODE_ENV === 'development';
export const logger = {
  log: (...args) => isDev && console.log(...args),
  warn: (...args) => console.warn(...args),    // keep warns
  error: (...args) => console.error(...args),  // keep errors
};
```
Replace `console.log` calls with `logger.log`, keep `console.error` and `console.warn`.

---

## 🟢 Low Priority

### ISSUE-008: `debtCalculations.js` Is Underdeveloped
**File:** `src/lib/debtCalculations.js` (41 lines)
**Type:** Feature Gap
**Impact:** Debt tools lack avalanche/snowball strategy comparisons, consolidation ROI analysis

**Fix:** Expand with:
- Avalanche method (highest interest first)
- Snowball method (lowest balance first)
- Debt consolidation break-even calculator
- Total interest paid comparison across strategies

---

### ISSUE-009: localStorage Data Is Not Encrypted
**Files:** `src/hooks/useLocalStorage.js`, `src/lib/utils.js`
**Type:** Security / UX
**Impact:** Sensitive financial data (income, assets, debts) stored in plaintext in browser localStorage

This is acceptable for the current privacy model but users should be informed.

**Fix (short-term):** Add a visible notice in the UI that data is stored locally in the browser and is not encrypted.
**Fix (long-term):** Consider optional AES encryption using the Web Crypto API for sensitive fields.

---

### ISSUE-010: `financialPresets.js` and `validationRules.js` Overlap with `constants.js`
**Files:** `src/config/financialPresets.js`, `src/config/validationRules.js`, `src/lib/constants.js`
**Type:** Organization
**Impact:** Validation rules exist in both `config/validationRules.js` and `lib/constants.js` — potential for drift/inconsistency

**Fix:** Consolidate all validation rules into one location (either `lib/constants.js` or `config/validationRules.js`) and have the other file re-export from it.

---

## Issue Summary

| ID | Title | Priority | Type |
|----|-------|----------|------|
| ISSUE-001 | `withPerformanceTracking` HOC violates Rules of Hooks | 🔴 High | Bug |
| ISSUE-002 | Unused/dead dependencies in package.json | 🔴 High | Bug/Security |
| ISSUE-003 | No TypeScript — financial calculations are type-unsafe | 🟡 Medium | Code Quality |
| ISSUE-004 | `FinancialDashboard` component is too large | 🟡 Medium | Maintainability |
| ISSUE-005 | Insufficient component-level test coverage | 🟡 Medium | Testing |
| ISSUE-006 | No route-level code splitting | 🟡 Medium | Performance |
| ISSUE-007 | Console statements in production code | 🟡 Medium | Code Quality |
| ISSUE-008 | `debtCalculations.js` is underdeveloped | 🟢 Low | Feature Gap |
| ISSUE-009 | localStorage data is not encrypted | 🟢 Low | Security/UX |
| ISSUE-010 | Validation rules duplicated across config and lib | 🟢 Low | Organization |
