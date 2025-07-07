# Enhanced Input System Migration Guide

## Overview

WealthStud now features a professional input system with **adornments** (units/icons inside inputs) that provides a better user experience and matches modern financial application standards.

## New Components Available

### 1. **AmountInput** - Base component for numeric inputs
```jsx
import { AmountInput } from '../shared/AmountInput';

<AmountInput
  value={value}
  onValueChange={setValue}
  label="Annual Salary"
  placeholder="Enter amount"
  unit={<DollarSign size={16} />}
  shouldBePositive={true}
  suggestion={<CurrencySuggestion name="Max" value={100000} onSelect={setValue} />}
/>
```

### 2. **CurrencyInput** - Pre-configured for dollar amounts
```jsx
import { CurrencyInput } from '../shared/AmountInput';

<CurrencyInput
  value={salary}
  onValueChange={setSalary}
  label="Salary"
  suggestion={<CurrencySuggestion name="Average" value={75000} onSelect={setSalary} />}
/>
```

### 3. **PercentageInput** - Pre-configured for percentages
```jsx
import { PercentageInput } from '../shared/AmountInput';

<PercentageInput
  value={rate}
  onValueChange={setRate}
  label="Interest Rate"
  min={0}
  max={100}
  suggestion={<PercentageSuggestion name="Market Avg" value={7.5} onSelect={setRate} />}
/>
```

## Migration Examples

### Before (Legacy)
```jsx
// Old way - external prefix with complex styling
<div className="input-group">
  <label className="input-label">Annual Income</label>
  <div className="input-wrapper">
    <span className="input-prefix">$</span>
    <input
      type="number"
      className="input-field"
      value={income}
      onChange={(e) => setIncome(parseFloat(e.target.value))}
    />
  </div>
</div>
```

### After (Enhanced)
```jsx
// New way - clean component with built-in adornment
<CurrencyInput
  value={income}
  onValueChange={setIncome}
  label="Annual Income"
  suggestion={<CurrencySuggestion name="Median" value={65000} onSelect={setIncome} />}
/>
```

## Key Features

### ✨ **Professional Adornments**
- **Dollar signs ($)** inside currency inputs
- **Percentage symbols (%)** inside rate inputs  
- **Custom icons** for any unit type
- **Focus-aware styling** - adornments change color on focus

### 🎯 **Smart Number Handling**
- **Automatic validation** - prevents invalid input
- **Positive-only mode** - for values that can't be negative
- **Min/max constraints** - enforce business rules
- **Decimal preservation** - maintains "0.0" while typing

### 💡 **Quick Suggestions**
- **Inline suggestions** next to labels
- **One-click population** of common values
- **Formatted display** - currency and percentage formatting

### 🎨 **Professional Design**
- **Consistent with design system** - uses CSS variables
- **Focus states** - blue glow and color changes
- **Responsive** - adapts to mobile screens
- **Accessibility** - proper focus management

## CSS Class Migration

### For Existing Components (Quick Fix)
If you can't migrate to the new components immediately, you can use enhanced CSS classes:

```jsx
// Currency input using CSS classes
<div className="currency-input">
  <input 
    type="number" 
    className="input-field"
    value={amount}
    onChange={handleChange}
  />
</div>

// Percentage input using CSS classes  
<div className="percentage-input">
  <input 
    type="number" 
    className="input-field"
    value={rate}
    onChange={handleChange}
  />
</div>
```

### Updated Input Field Classes
All existing `.input-field` classes now use the enhanced design system:

- ✅ **Better colors** - professional blue focus states
- ✅ **Improved spacing** - consistent with design system
- ✅ **Enhanced typography** - better font weights and sizes
- ✅ **Focus effects** - subtle glow and color transitions

## Implementation Checklist

### Phase 1: Quick Wins (CSS Classes)
- [ ] Update import statements to include new CSS
- [ ] Replace manual `$` and `%` with `.currency-input` and `.percentage-input` classes
- [ ] Test existing forms with enhanced styling

### Phase 2: Component Migration  
- [ ] Replace currency inputs with `<CurrencyInput>`
- [ ] Replace percentage inputs with `<PercentageInput>`
- [ ] Add suggestions for common values
- [ ] Update event handlers to use `onValueChange`

### Phase 3: Enhanced Features
- [ ] Add input validation and error states
- [ ] Implement suggestion components
- [ ] Add custom adornments for specific use cases
- [ ] Test accessibility and mobile experience

## Common Patterns

### Currency with Suggestion
```jsx
<CurrencyInput
  value={downPayment}
  onValueChange={setDownPayment}
  label="Down Payment"
  suggestion={
    <CurrencySuggestion 
      name="20%" 
      value={homePrice * 0.2} 
      onSelect={setDownPayment} 
    />
  }
/>
```

### Percentage with Range
```jsx
<PercentageInput
  value={interestRate}
  onValueChange={setInterestRate}
  label="Interest Rate"
  min={0}
  max={30}
  suggestion={
    <PercentageSuggestion 
      name="Current Avg" 
      value={6.8} 
      onSelect={setInterestRate} 
    />
  }
/>
```

### Custom Adornment
```jsx
<AmountInput
  value={age}
  onValueChange={setAge}
  label="Age"
  unit={<Calendar size={16} />}
  shouldBePositive={true}
  min={18}
  max={100}
/>
```

## Benefits

1. **🎨 Professional Appearance** - Matches modern financial apps
2. **⚡ Better UX** - Units are clearly visible inside inputs
3. **🛡️ Input Validation** - Prevents invalid data entry
4. **📱 Mobile Friendly** - Touch-optimized with proper spacing
5. **♿ Accessible** - Proper focus management and ARIA support
6. **🎯 Consistent** - All inputs follow the same design patterns

## Support

The legacy input classes remain supported during migration. You can gradually update components without breaking existing functionality.

For questions or issues, refer to the component documentation in `/src/components/shared/AmountInput.jsx`.