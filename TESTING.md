# Testing Guide

This document provides comprehensive guidance for testing the WealthStud application.

## Overview

WealthStud uses a comprehensive testing strategy that covers unit tests, component tests, and integration tests to ensure the reliability and accuracy of financial calculations and user interactions.

## Test Structure

### Test Organization

Tests are co-located with source files in `__tests__` directories:

```
src/
├── lib/
│   ├── utils.js
│   ├── taxes.js
│   ├── mortgageCalculations.js
│   ├── debtCalculations.js
│   └── __tests__/
│       ├── utils.test.js
│       ├── taxes.test.js
│       ├── mortgageCalculations.test.js
│       └── debtCalculations.test.js
├── hooks/
│   ├── useLocalStorage.js
│   ├── useCSV.js
│   ├── useFormValidation.js
│   └── __tests__/
│       ├── useLocalStorage.test.js
│       ├── useCSV.test.js
│       └── useFormValidation.test.js
├── config/
│   ├── budgetConfig.js
│   └── __tests__/
│       └── budgetConfig.test.js
└── components/
    └── __tests__/
        └── NetWorthCalculator.test.js
```

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --watchAll=false

# Run tests with coverage report
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- utils

# Run tests matching a pattern
npm test -- --testPathPattern="hooks"
```

### Coverage Analysis

Generate a detailed coverage report:

```bash
npm test -- --coverage --watchAll=false
```

Coverage reports include:
- **Line Coverage**: Percentage of code lines executed
- **Branch Coverage**: Percentage of code branches taken
- **Function Coverage**: Percentage of functions called
- **Statement Coverage**: Percentage of statements executed

## Test Categories

### 1. Utility Function Tests (`src/lib/__tests__/`)

**Purpose**: Ensure mathematical accuracy and edge case handling

**Key Test Areas**:
- Number parsing and formatting
- Financial calculations (compound interest, loan payments)
- Date utilities and age calculations
- CSV import/export functionality
- Validation functions
- Error handling for invalid inputs

**Example Test Structure**:
```javascript
describe('Financial Calculations', () => {
  describe('calculateCompoundInterest', () => {
    test('should calculate compound interest correctly', () => {
      const result = calculateCompoundInterest(1000, 0.05, 12, 10);
      expect(result).toBeCloseTo(1647.01, 1);
    });

    test('should handle zero interest rate', () => {
      const result = calculateCompoundInterest(1000, 0, 1, 10);
      expect(result).toBe(1000);
    });
  });
});
```

### 2. Tax Calculation Tests (`src/lib/__tests__/taxes.test.js`)

**Purpose**: Verify accuracy of federal, state, and payroll tax calculations

**Test Coverage**:
- Federal income tax brackets for all filing statuses
- State income tax rates for all 50 states + DC
- Social Security tax with wage base caps
- Medicare tax including additional tax for high earners
- Tax integration scenarios

**Critical Test Cases**:
- Boundary conditions (tax bracket transitions)
- Edge cases (zero income, negative values)
- High-income scenarios with additional taxes
- Different filing status comparisons

### 3. Hook Tests (`src/hooks/__tests__/`)

**Purpose**: Ensure proper React hook behavior and error handling

#### useLocalStorage Tests
- Initial value handling
- State updates and persistence
- Error handling (storage unavailable, quota exceeded)
- JSON parsing errors
- Complex object storage

#### useCSV Tests
- File export with proper formatting
- File import with validation
- Error handling for invalid files
- Header validation
- Large dataset handling

### 4. Configuration Tests (`src/config/__tests__/`)

**Purpose**: Validate configuration objects and data structures

**Test Areas**:
- Configuration completeness
- Data type validation
- Color code validation
- Icon component verification
- Cross-configuration consistency

### 5. Component Tests (`src/components/__tests__/`)

**Purpose**: Test React component behavior and user interactions

**Testing Approach**:
- Use React Testing Library
- Mock external dependencies
- Test user interactions
- Verify data flow
- Check accessibility

**Example Component Test**:
```javascript
test('should calculate and display net worth correctly', () => {
  renderWithRouter(<NetWorthCalculator />);
  
  // Verify calculations are displayed
  expect(screen.getByText('$135,000')).toBeInTheDocument();
  expect(screen.getByText('$140,000')).toBeInTheDocument();
  expect(screen.getByText('$5,000')).toBeInTheDocument();
});
```

## Test Quality Standards

### 1. Test Naming Conventions

Use descriptive test names that follow the pattern:
```
"should [expected behavior] when [condition]"
```

Examples:
- `should calculate federal tax for single filer correctly`
- `should handle localStorage errors gracefully`
- `should display negative net worth indicator when debts exceed assets`

### 2. Edge Case Coverage

Ensure comprehensive testing of edge cases:
- **Zero values**: All financial inputs
- **Negative values**: Debts, losses, invalid inputs
- **Boundary conditions**: Tax brackets, contribution limits
- **Invalid inputs**: Non-numeric strings, null, undefined
- **Large numbers**: Test precision and overflow handling

### 3. Error Handling

Test error scenarios thoroughly:
- Network failures for external APIs
- localStorage unavailability or quota exceeded
- File import/export errors
- Invalid CSV format handling
- Calculation errors with invalid parameters

### 4. Mock Strategy

Use appropriate mocking for external dependencies:

```javascript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock file operations
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
```

### 5. Test Data

Use realistic financial scenarios in tests:
- Typical salary ranges ($30k - $500k)
- Common loan amounts and terms
- Realistic interest rates and market returns
- Standard tax scenarios

## Performance Testing

### Large Dataset Testing

Test components with large datasets to ensure performance:
- 1000+ line items in budget categories
- Multi-year amortization schedules
- Complex net worth calculations with many accounts

### Memory Testing

Monitor memory usage during:
- Large CSV imports/exports
- Chart rendering with extensive data
- Complex calculation operations

## Debugging Tests

### Common Issues

1. **Floating Point Precision**: Use `toBeCloseTo()` for financial calculations
2. **Async Operations**: Properly await async operations in tests
3. **Mock Cleanup**: Ensure mocks are cleared between tests
4. **Component State**: Use `act()` for state updates in React tests

### Debugging Tools

```bash
# Run tests in debug mode
npm test -- --no-cache --verbose

# Run specific test with detailed output
npm test -- --testNamePattern="specific test name" --verbose
```

## Coverage Goals

### Current Coverage Targets

- **Utility Functions**: 90%+ line coverage
- **Tax Calculations**: 95%+ line coverage
- **Hooks**: 90%+ line coverage
- **Calculations**: 100% line coverage for core math functions
- **Components**: 70%+ line coverage (focus on critical user paths)

### Coverage Reporting

View coverage reports in:
- Terminal output after running `npm test -- --coverage`
- HTML report in `coverage/lcov-report/index.html`
- Detailed file-by-file breakdown

## Contributing Test Guidelines

### Before Submitting

1. **Run Full Test Suite**: Ensure all tests pass
2. **Check Coverage**: Maintain or improve coverage percentages
3. **Add Tests for New Features**: Every new function needs tests
4. **Test Edge Cases**: Consider boundary conditions and error scenarios
5. **Follow Naming Conventions**: Use descriptive test names

### Test Review Checklist

- [ ] Tests are properly organized and named
- [ ] Edge cases are covered
- [ ] Error handling is tested
- [ ] Mocks are used appropriately
- [ ] Tests are deterministic (no random values)
- [ ] Performance considerations are addressed
- [ ] Tests are maintainable and readable

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Release builds

CI failure conditions:
- Any test failures
- Coverage drop below thresholds
- ESLint violations
- Build failures