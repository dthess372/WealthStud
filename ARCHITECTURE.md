# WealthStud Architecture Documentation

This document provides detailed architectural insights for the WealthStud application, covering design patterns, data flow, and implementation strategies.

## Table of Contents
- [Overview](#overview)
- [Architectural Patterns](#architectural-patterns)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Shared Libraries](#shared-libraries)
- [Performance Considerations](#performance-considerations)
- [Security & Privacy](#security--privacy)

## Overview

WealthStud follows a **modular, component-based architecture** built on React 18 with a focus on:
- **Privacy by Design**: Client-side only calculations
- **Code Reusability**: Shared utilities and custom hooks
- **Maintainability**: Clear separation of concerns
- **Performance**: Optimized calculations and efficient rendering
- **Testability**: Comprehensive test coverage

## Architectural Patterns

### 1. Component-Based Architecture

Each financial tool is implemented as a self-contained component:

```
src/components/ToolName/
├── ToolName.jsx         # Main component logic
├── ToolName.css         # Component-specific styles
└── HelperComponent.jsx  # Optional sub-components
```

**Benefits**:
- Clear separation of concerns
- Easy to maintain and test
- Reusable across different contexts
- Independent development and deployment

### 2. Configuration-Driven Development

Tool behavior is controlled by configuration objects:

```javascript
// src/config/budgetConfig.js
export const EXPENSE_CATEGORIES = {
  housing: {
    name: 'Housing',
    icon: Home,
    color: '#3b82f6',
    subcategories: ['Rent/Mortgage', 'Utilities', 'Insurance']
  }
};
```

**Benefits**:
- Easy to modify tool behavior without code changes
- Consistent data structures across components
- Simplified testing and validation
- Rapid prototyping of new features

### 3. Custom Hooks Pattern

Reusable business logic encapsulated in custom hooks:

```javascript
// src/hooks/useLocalStorage.js
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => getStorageItem(key, initialValue));
  
  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    setStorageItem(key, newValue);
  }, [key]);
  
  return [value, setStoredValue];
}
```

**Benefits**:
- Separation of business logic from UI logic
- Reusable across multiple components
- Easy to test in isolation
- Consistent data handling patterns

## Component Architecture

### Financial Tool Structure

All financial tools follow a consistent structure:

```javascript
const FinancialTool = () => {
  // 1. Data Management
  const [data, setData] = useLocalStorage(STORAGE_KEY, initialData);
  const { exportCSV, createFileInputHandler } = useCSV('tool-name');
  
  // 2. Local State
  const [localState, setLocalState] = useState({});
  
  // 3. Configuration
  const config = TOOL_CONFIG;
  
  // 4. Calculations
  const calculations = useMemo(() => {
    return performCalculations(data);
  }, [data]);
  
  // 5. Event Handlers
  const handleDataUpdate = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }));
  }, [setData]);
  
  // 6. Render
  return (
    <div className="tool-container">
      <Navigation actions={navigationActions} />
      <ToolHeader />
      <DataInput onUpdate={handleDataUpdate} />
      <Results data={calculations} />
      <Visualizations data={calculations} />
    </div>
  );
};
```

### Component Hierarchy

```
App
├── Router (HashRouter)
├── Routes
│   ├── HomePage
│   ├── BudgetPlanner
│   │   ├── IncomeSection
│   │   ├── ExpenseSection
│   │   ├── TaxSection
│   │   └── ChartsSection
│   ├── NetWorthCalculator
│   │   ├── AccountCategories
│   │   ├── SummaryDashboard
│   │   ├── HealthInsights
│   │   └── VisualizationSection
│   └── [Other Tools...]
└── SharedComponents
    ├── Navigation
    ├── SuggestionBox
    └── WealthStudLogo
```

## State Management

### 1. Component-Level State

Each tool manages its own state using the **useLocalStorage** hook:

```javascript
const [toolData, setToolData] = useLocalStorage('tool-key', {
  userInputs: {},
  calculations: {},
  preferences: {}
});
```

**Benefits**:
- No global state complexity
- Data persists between sessions
- Easy to export/import via CSV
- Independent tool development

### 2. Local UI State

Transient UI state uses standard React useState:

```javascript
const [isEditing, setIsEditing] = useState(false);
const [selectedCategory, setSelectedCategory] = useState(null);
const [collapsedSections, setCollapsedSections] = useState({});
```

### 3. Computed State

Calculations are memoized for performance:

```javascript
const financialMetrics = useMemo(() => ({
  totalAssets: calculateTotalAssets(accounts),
  totalDebts: calculateTotalDebts(accounts),
  netWorth: totalAssets - totalDebts,
  healthScore: calculateHealthScore(totalAssets, totalDebts)
}), [accounts]);
```

## Data Flow

### 1. User Input Flow

```
User Input → Validation → State Update → Calculation → UI Update
```

```javascript
// 1. User enters data
<input onChange={(e) => handleInputChange(field, e.target.value)} />

// 2. Validation
const handleInputChange = (field, value) => {
  const validatedValue = validateInput(field, value);
  updateToolData({ [field]: validatedValue });
};

// 3. State update triggers recalculation
const calculations = useMemo(() => {
  return performCalculations(toolData);
}, [toolData]);

// 4. UI updates automatically
<ResultDisplay value={calculations.result} />
```

### 2. Data Persistence Flow

```
State Change → localStorage → CSV Export/Import
```

```javascript
// Automatic persistence via useLocalStorage
const [data, setData] = useLocalStorage('key', initialData);

// Manual backup via CSV
const handleExport = () => exportCSV(data);
const handleImport = createFileInputHandler(setData);
```

### 3. Calculation Dependencies

Financial calculations follow a dependency tree:

```
User Inputs
    ↓
Base Calculations (income, expenses, assets)
    ↓
Derived Metrics (net worth, ratios, scores)
    ↓
Advanced Analytics (projections, scenarios)
    ↓
Visualizations (charts, graphs, insights)
```

## Shared Libraries

### 1. Utility Functions (`src/lib/utils.js`)

**Categories**:
- **Number Processing**: `parseNumber`, `formatCurrency`, `formatPercent`
- **Financial Math**: `calculateCompoundInterest`, `calculateLoanPayment`
- **Date Utilities**: `calculateAge`, `formatDate`, `addMonths`
- **Data Handling**: `arrayToCSV`, `csvToArray`, `validateInput`
- **Storage**: `getStorageItem`, `setStorageItem`, `removeStorageItem`

**Design Principles**:
- Pure functions (no side effects)
- Comprehensive error handling
- Consistent parameter patterns
- Full test coverage

### 2. Tax System (`src/lib/taxes.js`)

**Structure**:
```javascript
// Tax Data
export const FEDERAL_TAX_BRACKETS = { /* 2024 brackets */ };
export const STATE_TAX_RATES = { /* All 50 states + DC */ };
export const PAYROLL_TAX_RATES = { /* Social Security, Medicare */ };

// Calculation Functions
export function calculateFederalTax(income, filingStatus);
export function calculateStateTax(income, stateCode);
export function calculatePayrollTaxes(income, filingStatus);
export function calculateAllTaxes(grossIncome, deductions, filingStatus, state);
```

**Benefits**:
- Centralized tax logic
- Annual updates in one place
- Consistent calculations across tools
- Comprehensive test coverage

### 3. Specialized Calculations

**Mortgage Calculations** (`src/lib/mortgageCalculations.js`):
- Monthly payment calculations
- Amortization schedule generation
- PMI calculations
- Affordability analysis

**Debt Calculations** (`src/lib/debtCalculations.js`):
- Debt payment calculations
- Interest calculations
- Payoff strategies

## Performance Considerations

### 1. Calculation Optimization

```javascript
// Memoize expensive calculations
const expensiveCalculation = useMemo(() => {
  return complexFinancialCalculation(data);
}, [data]);

// Debounce user input
const debouncedUpdate = useCallback(
  debounce((value) => updateData(value), 300),
  []
);
```

### 2. Component Optimization

```javascript
// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

// Use callback optimization
const handleUpdate = useCallback((id, value) => {
  setData(prev => ({ ...prev, [id]: value }));
}, []);
```

### 3. Bundle Optimization

- **Code Splitting**: Dynamic imports for route-based splitting
- **Tree Shaking**: ES6 modules for unused code elimination
- **Asset Optimization**: Optimized images and icons
- **Lazy Loading**: Components loaded on demand

### 4. Data Structure Optimization

```javascript
// Efficient data structures
const accounts = {
  byId: { '1': { id: '1', name: 'Checking', value: 5000 } },
  byCategory: { cash: ['1'], investments: ['2', '3'] },
  allIds: ['1', '2', '3']
};

// Fast lookups and updates
const getAccountById = (id) => accounts.byId[id];
const getAccountsByCategory = (category) => 
  accounts.byCategory[category].map(id => accounts.byId[id]);
```

## Security & Privacy

### 1. Client-Side Only Architecture

- **No Server Communication**: All calculations performed in browser
- **No Data Transmission**: User data never leaves the device
- **No Analytics**: No tracking or data collection
- **No Authentication**: No user accounts or login required

### 2. Data Protection

```javascript
// Secure data handling
const sanitizeInput = (input) => {
  // Remove potentially harmful characters
  return input.replace(/[<>'"]/g, '');
};

// Validate all user inputs
const validateFinancialInput = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.max(0, num);
};
```

### 3. Local Storage Security

```javascript
// Graceful handling of storage failures
const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // Handle quota exceeded, private browsing, etc.
    console.warn('Storage unavailable:', error);
    return false;
  }
};
```

### 4. CSV Security

```javascript
// Safe CSV parsing
const parseCSV = (csvText) => {
  try {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: sanitizeInput
    });
    return validateCSVData(parsed.data);
  } catch (error) {
    throw new Error('Invalid CSV format');
  }
};
```

## Testing Architecture

### 1. Test Organization

```
src/
├── lib/__tests__/          # Utility function tests
├── hooks/__tests__/        # Custom hook tests
├── components/__tests__/   # Component tests
└── config/__tests__/       # Configuration tests
```

### 2. Testing Strategies

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interaction with hooks
- **Calculation Tests**: Mathematical accuracy verification
- **Error Handling Tests**: Edge cases and error conditions

### 3. Mock Strategies

```javascript
// Mock external dependencies
jest.mock('../../lib/utils', () => ({
  formatCurrency: jest.fn(val => `$${val}`),
  parseNumber: jest.fn(val => parseFloat(val) || 0)
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});
```

## Future Architecture Considerations

### 1. Scalability

- **Micro-frontends**: Split tools into independent applications
- **Web Workers**: Move heavy calculations to background threads
- **Service Workers**: Offline functionality and caching
- **Module Federation**: Share components across applications

### 2. Advanced Features

- **Real-time Data**: Integration with financial APIs
- **Collaborative Features**: Multi-user planning scenarios
- **Advanced Analytics**: Machine learning insights
- **Progressive Web App**: Mobile app-like experience

### 3. Performance Enhancements

- **Virtual Scrolling**: Handle large datasets efficiently
- **Incremental Calculations**: Update only changed calculations
- **Caching Strategies**: Intelligent result caching
- **Streaming Updates**: Real-time calculation updates

This architecture provides a solid foundation for building robust, maintainable, and performant financial planning tools while maintaining user privacy and data security.