# Contributing to WealthStud

Thank you for your interest in contributing to WealthStud! This guide will help you understand how to contribute effectively to our personal finance application.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Submitting Changes](#submitting-changes)
- [Architecture Guidelines](#architecture-guidelines)
- [Financial Accuracy](#financial-accuracy)

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- Basic knowledge of React, JavaScript, and financial concepts

### Development Setup

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/wealthstud.git
   cd wealthstud
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Check Build**
   ```bash
   npm run build
   ```

### Project Structure Familiarization

Before contributing, familiarize yourself with the project structure:

```
src/
├── components/           # React components for financial tools
├── lib/                 # Shared utilities and calculations
├── hooks/               # Custom React hooks
├── config/              # Configuration objects
├── styles/              # Shared CSS styles
└── __tests__/           # Test files
```

## Development Process

### 1. Choose an Issue

- Browse [GitHub Issues](https://github.com/user/wealthstud/issues)
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to indicate you're working on it
- Ask questions if requirements are unclear

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Development Workflow

1. **Make Changes**: Implement your feature or fix
2. **Write Tests**: Ensure new code is well-tested
3. **Test Locally**: Run all tests and verify functionality
4. **Update Documentation**: Update relevant docs if needed
5. **Commit Changes**: Use clear, descriptive commit messages

### 4. Before Submitting

```bash
# Run full test suite
npm test -- --watchAll=false

# Check test coverage
npm test -- --coverage --watchAll=false

# Build to ensure no errors
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

## Code Standards

### JavaScript/React Guidelines

#### 1. Component Structure
```javascript
// Good component structure
const FinancialTool = () => {
  // 1. Hooks and state
  const [data, setData] = useLocalStorage('tool-key', initialData);
  const { exportCSV } = useCSV('tool-name');
  
  // 2. Computed values
  const calculations = useMemo(() => {
    return performCalculations(data);
  }, [data]);
  
  // 3. Event handlers
  const handleUpdate = useCallback((updates) => {
    setData(prev => ({ ...prev, ...updates }));
  }, [setData]);
  
  // 4. Render
  return (
    <div className="tool-container">
      {/* Component JSX */}
    </div>
  );
};

export default FinancialTool;
```

#### 2. Function Guidelines
```javascript
// Use descriptive names
const calculateMonthlyPayment = (principal, rate, years) => {
  // Implementation
};

// Handle edge cases
const parseNumber = (value, fallback = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

// Use JSDoc for complex functions
/**
 * Calculate compound interest with various compounding frequencies
 * @param {number} principal - Initial amount
 * @param {number} rate - Annual interest rate (decimal)
 * @param {number} compounds - Compounding frequency per year
 * @param {number} years - Time period in years
 * @returns {number} Final amount after compound interest
 */
const calculateCompoundInterest = (principal, rate, compounds, years) => {
  // Implementation
};
```

#### 3. Hook Usage
```javascript
// Custom hooks for reusable logic
const useFinancialCalculation = (inputs) => {
  return useMemo(() => {
    return performCalculation(inputs);
  }, [inputs]);
};

// Use existing hooks consistently
const [data, setData] = useLocalStorage('key', initialValue);
const { exportCSV, createFileInputHandler } = useCSV('prefix');
```

### CSS Guidelines

#### 1. Component-Specific CSS
```css
/* ToolName.css */
.tool-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.tool-section {
  margin-bottom: 30px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Use specific class names */
.budget-header {
  /* Not .header */
}
```

#### 2. Responsive Design
```css
/* Mobile-first approach */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### File Naming Conventions

- **Components**: PascalCase (`BudgetPlanner.jsx`)
- **Utilities**: camelCase (`utils.js`, `taxCalculations.js`)
- **Hooks**: camelCase with 'use' prefix (`useLocalStorage.js`)
- **Config**: camelCase with descriptive suffix (`budgetConfig.js`)
- **CSS**: Match component name (`BudgetPlanner.css`)
- **Tests**: Match source with `.test.js` suffix (`utils.test.js`)

## Testing Requirements

### 1. Test Coverage Standards

- **New Features**: 90%+ line coverage
- **Utility Functions**: 95%+ line coverage
- **Financial Calculations**: 100% line coverage
- **Error Handling**: All error paths tested

### 2. Test Types Required

#### Unit Tests
```javascript
// Test utility functions
describe('formatCurrency', () => {
  test('should format positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  test('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });

  test('should handle negative numbers', () => {
    expect(formatCurrency(-100)).toBe('-$100');
  });
});
```

#### Component Tests
```javascript
// Test component behavior
describe('NetWorthCalculator', () => {
  test('should display correct net worth calculation', () => {
    const mockData = { /* test data */ };
    render(<NetWorthCalculator initialData={mockData} />);
    
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });
});
```

#### Integration Tests
```javascript
// Test hook integration
describe('useLocalStorage integration', () => {
  test('should persist data between renders', () => {
    const { result, rerender } = renderHook(() => 
      useLocalStorage('test-key', { value: 0 })
    );
    
    act(() => {
      result.current[1]({ value: 100 });
    });
    
    rerender();
    expect(result.current[0]).toEqual({ value: 100 });
  });
});
```

### 3. Financial Calculation Testing

#### Accuracy Requirements
```javascript
// Test with realistic financial scenarios
describe('mortgagePayment', () => {
  test('should calculate payment for typical 30-year mortgage', () => {
    const payment = calculateMonthlyPayment(300000, 0.065, 30);
    expect(payment).toBeCloseTo(1896.20, 2);
  });

  test('should handle edge cases', () => {
    expect(calculateMonthlyPayment(0, 0.05, 30)).toBe(0);
    expect(calculateMonthlyPayment(100000, 0, 30)).toBeCloseTo(2777.78, 2);
  });
});
```

#### Boundary Testing
```javascript
// Test financial limits and edge cases
test('should handle maximum Social Security wage base', () => {
  const maxTax = calculateSocialSecurityTax(200000);
  const expectedMax = 168600 * 0.062; // 2024 wage base
  expect(maxTax).toBeCloseTo(expectedMax, 2);
});
```

## Submitting Changes

### 1. Commit Message Format

Use clear, descriptive commit messages:

```bash
# Good commit messages
git commit -m "Add mortgage affordability calculator"
git commit -m "Fix tax calculation for high earners"
git commit -m "Update net worth chart responsiveness"

# Include context for complex changes
git commit -m "Optimize retirement projections

- Implement Monte Carlo simulation for variability
- Add market crash scenarios
- Improve calculation performance for large datasets"
```

### 2. Pull Request Process

#### PR Title Format
- `feat: Add [feature description]`
- `fix: Resolve [bug description]`
- `test: Add tests for [component/function]`
- `docs: Update [documentation type]`
- `refactor: Improve [code section]`

#### PR Description Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Test improvements

## Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed
- [ ] Edge cases considered

## Financial Accuracy
- [ ] Calculations verified with external sources
- [ ] Edge cases tested (zero, negative, large numbers)
- [ ] Tax calculations validated against current year data

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements left in code
- [ ] Performance implications considered
```

### 3. Review Process

Your PR will be reviewed for:
- **Code Quality**: Clean, readable, maintainable code
- **Test Coverage**: Comprehensive testing of new functionality
- **Financial Accuracy**: Correct financial calculations
- **Documentation**: Updated docs and comments
- **Performance**: No significant performance regressions

## Architecture Guidelines

### 1. Adding New Financial Tools

When adding a new financial tool:

1. **Create Component Structure**
   ```bash
   mkdir src/components/NewTool
   touch src/components/NewTool/NewTool.jsx
   touch src/components/NewTool/NewTool.css
   ```

2. **Add Configuration**
   ```javascript
   // src/config/newToolConfig.js
   export const NEW_TOOL_CONFIG = {
     categories: { /* ... */ },
     defaultValues: { /* ... */ },
     validationRules: { /* ... */ }
   };
   ```

3. **Implement Using Shared Patterns**
   ```javascript
   // Use existing hooks and utilities
   import { useLocalStorage, useCSV } from '../../hooks';
   import { formatCurrency, parseNumber } from '../../lib/utils';
   import { NEW_TOOL_CONFIG } from '../../config/newToolConfig';
   ```

4. **Add Route**
   ```javascript
   // src/App.js
   import NewTool from './components/NewTool/NewTool';
   
   // Add to routes
   <Route path="/new-tool" element={<NewTool />} />
   ```

### 2. Extending Existing Tools

When modifying existing tools:

1. **Update Configuration First**
   ```javascript
   // Modify config files rather than hardcoding
   export const UPDATED_CONFIG = {
     ...EXISTING_CONFIG,
     newFeature: { /* new configuration */ }
   };
   ```

2. **Add Utility Functions**
   ```javascript
   // Add to appropriate utility file
   export const newCalculationFunction = (inputs) => {
     // Implementation with error handling
   };
   ```

3. **Maintain Backward Compatibility**
   ```javascript
   // Handle existing data gracefully
   const migrateData = (oldData) => {
     return {
       ...oldData,
       newField: oldData.newField || defaultValue
     };
   };
   ```

## Financial Accuracy

### 1. Tax Calculations

When working with tax-related features:

- **Use Current Year Data**: Always use the most recent tax brackets and rates
- **Multiple Filing Statuses**: Test all filing status scenarios
- **State Variations**: Consider state-specific tax rules
- **Edge Cases**: Test boundary conditions (bracket transitions, caps)

### 2. Investment Calculations

For investment-related calculations:

- **Compound Interest**: Use precise mathematical formulas
- **Market Assumptions**: Use realistic return rates and volatility
- **Time Value of Money**: Account for inflation and real returns
- **Risk Factors**: Include market crash scenarios in projections

### 3. Mortgage and Debt Calculations

For loan calculations:

- **Standard Formulas**: Use industry-standard calculation methods
- **PMI Calculations**: Accurate loan-to-value ratio handling
- **Amortization**: Precise payment allocation to principal and interest
- **Prepayment Scenarios**: Handle extra payments correctly

### 4. Validation Sources

Always validate calculations against:
- IRS publications for tax calculations
- Financial calculator websites (Bankrate, etc.)
- Professional financial planning software
- Academic financial formulas

## Performance Guidelines

### 1. Calculation Optimization

```javascript
// Memoize expensive calculations
const expensiveResult = useMemo(() => {
  return complexCalculation(inputs);
}, [inputs]);

// Use callback optimization for event handlers
const handleUpdate = useCallback((value) => {
  setData(value);
}, []);
```

### 2. Component Optimization

```javascript
// Prevent unnecessary re-renders
const MemoizedComponent = React.memo(Component);

// Split large components
const LargeComponent = () => {
  return (
    <>
      <SmallComponent1 />
      <SmallComponent2 />
      <SmallComponent3 />
    </>
  );
};
```

### 3. Data Structure Efficiency

```javascript
// Use efficient data structures
const optimizedData = {
  byId: { /* indexed by ID */ },
  byCategory: { /* grouped by category */ },
  allIds: [ /* array of IDs */ ]
};
```

## Getting Help

### Resources
- **Documentation**: Check README.md, ARCHITECTURE.md, and TESTING.md
- **Code Examples**: Review existing components for patterns
- **Test Files**: Look at test files for usage examples
- **Issues**: Search existing issues for similar problems

### Communication
- **GitHub Issues**: For bug reports and feature requests
- **Pull Request Comments**: For code-specific discussions
- **Email**: For sensitive issues or private questions

### Learning Resources
- **React Documentation**: https://reactjs.org/docs
- **Financial Formulas**: Khan Academy, Investopedia
- **Testing Best Practices**: React Testing Library docs
- **Git Workflow**: GitHub guides

Thank you for contributing to WealthStud and helping make financial planning more accessible and accurate for everyone!