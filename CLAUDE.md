# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WealthStud is a React-based personal finance application that provides a comprehensive suite of financial wellness tools. The app prioritizes user privacy by performing all calculations client-side and offering CSV import/export functionality instead of server-side data storage.

## Common Commands

### Development
- `npm start` - Start the development server
- `npm run build` - Build the application for production
- `npm test` - Run tests
- `npm run deploy` - Deploy to GitHub Pages (runs build first)

## Architecture

### Core Structure
- **Single Page Application**: Uses React Router with HashRouter for GitHub Pages compatibility
- **Component-based**: Each financial tool is a self-contained component in `src/components/`
- **Route-based Navigation**: Main routes defined in `src/App.js`

### Key Components
- **HomePage** (`src/components/HomePage/`): Landing page with tool grid navigation
- **BudgetPlanner**: Income/expense tracking with tax calculations and pie chart visualizations
- **RetirementCalculator**: Retirement planning with Monte Carlo simulations and dynamic charts
- **NetWorthCalculator**: Asset/liability tracking across multiple categories
- **SavingPlanner**: Savings growth projections with yearly raise calculations
- **VacationPlanner**: PTO accrual and balance tracking
- **MortgageTool**: Mortgage payment and amortization calculations
- **InsuranceAnalyzer**: Insurance needs estimation

### Data Management
- **Client-side only**: No backend data storage
- **CSV Import/Export**: All tools support local data persistence via CSV files
- **State Management**: Component-level state management (no global state library)

### Styling
- **CSS Modules**: Component-specific CSS files alongside JSX components
- **Responsive Design**: Mobile-first approach with device optimization
- **Custom Styling**: No UI library dependency, custom CSS throughout

### Key Libraries
- **React Router**: Navigation (`react-router-dom`)
- **Recharts**: Data visualization for charts and graphs
- **React Icons**: Icon components (various icon sets)
- **Material-UI**: Limited usage for specific components (`@mui/material`, `@mui/x-charts`)
- **EmailJS**: Contact form functionality
- **Tailwind Utilities**: `clsx` and `tailwind-merge` for conditional styling

### Tax Calculations
- **FEDERAL_TAX_BRACKETS.jsx**: Federal tax bracket data for budget calculations
- **STATE_TAX_RATES.jsx**: State tax rate data

### Shared Libraries and Utilities

#### Core Utilities (`src/lib/`)
- **utils.js**: Comprehensive utility functions including:
  - Number parsing/validation (`parseNumber`, `formatCurrency`, `formatPercent`)
  - Financial calculations (`calculateCompoundInterest`, `calculateLoanPayment`)
  - Date utilities (`calculateAge`, `formatDate`)
  - CSV handling (`arrayToCSV`, `csvToArray`)
  - Local storage utilities (`getStorageItem`, `setStorageItem`)
  - Validation functions (`isValidAge`, `isValidPercentage`, `isValidEmail`)

- **constants.js**: Application-wide constants including:
  - Routes, colors, and UI configuration
  - Financial constants (contribution limits, market assumptions)
  - Validation rules and error messages
  - File handling settings

- **taxes.js**: Centralized tax calculations and data:
  - Federal tax brackets and standard deductions
  - State tax rates for all 50 states + DC
  - Payroll tax rates (Social Security, Medicare)
  - Tax calculation functions (`calculateFederalTax`, `calculateAllTaxes`)

#### Custom Hooks (`src/hooks/`)
- **useLocalStorage.js**: Persistent state management with localStorage
- **useCSV.js**: CSV import/export functionality with file handling
- **useFormValidation.js**: Form validation with predefined rules for financial inputs

### Development Tools
- **ESLint**: Configured for React development with hooks support
- **Prettier**: Code formatting with consistent style rules

#### Usage Examples
```javascript
// Using shared utilities
import { formatCurrency, parseNumber, calculateAge } from '../lib/utils';
import { COLORS, ROUTES } from '../lib/constants';
import { calculateAllTaxes } from '../lib/taxes';

// Using custom hooks
import { useLocalStorage, useCSV, useFormValidation } from '../hooks';

// Example component
const [data, setData] = useLocalStorage('my-data', {});
const { exportCSV, importCSV } = useCSV('budget');
const { values, errors, handleChange } = useFormValidation(initialValues, validationRules);
```

## Implementation Status

### ✅ Completed Improvements
- **Shared Constants**: Centralized configuration in `src/lib/constants.js`
- **Enhanced Utils**: Comprehensive utility functions in `src/lib/utils.js`
- **Custom Hooks**: Reusable React hooks in `src/hooks/`
- **Tax System**: Centralized tax calculations in `src/lib/taxes.js`
- **Component Configs**: Moved to `src/config/` directory
- **BudgetPlanner**: Fully migrated to new architecture with localStorage and CSV support
- **Development Tools**: ESLint and Prettier configured

### 🚧 In Progress
- **NetWorthCalculator**: Partially migrated (configuration moved, utilities pending)
- **RetirementCalculator**: Configuration moved, utilities migration started

### 📋 Pending Components
- CapitalGainsAnalyzer, SavingPlanner, InsuranceAnalyzer, MortgageTool, VacationPlanner

## Development Notes

### Migration Pattern
When updating components to use the new architecture:
1. Import shared utilities: `import { formatCurrency, parseNumber } from '../../lib/utils'`
2. Import configuration: `import { CONFIG_NAME } from '../../config/componentConfig'`
3. Add hooks: `import { useLocalStorage, useCSV } from '../../hooks'`
4. Replace local utility functions with shared ones
5. Add localStorage persistence: `const [data, setData] = useLocalStorage(key, initialValue)`
6. Implement CSV functionality: `const { exportCSV, createFileInputHandler } = useCSV('prefix')`

### File Organization
Each tool follows the pattern:
```
src/components/ToolName/
├── ToolName.jsx      # Main component
├── ToolName.css      # Component styles
└── [HelperFiles.jsx] # Additional component files
```

### Deployment
- Hosted on GitHub Pages
- Uses HashRouter for compatibility with static hosting
- GitHub Actions workflow deploys from `build/` directory