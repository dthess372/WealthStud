import React, { useState, useRef, forwardRef } from 'react';
import { DollarSign, Percent } from 'lucide-react';
import './AmountInput.css';

// Base TextInput component with adornment support
export const TextInput = forwardRef(({
  label,
  value,
  onChange,
  onValueChange,
  placeholder,
  type = "text",
  className = "",
  inputOverlay,
  suggestion,
  disabled = false,
  error,
  ...props
}, ref) => {
  const inputId = useRef(`input-${Math.random().toString(36).substr(2, 9)}`);

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange?.(e);
    onValueChange?.(newValue);
  };

  return (
    <div className={`text-input-container ${className}`}>
      {label && (
        <div className="input-label-container">
          <label htmlFor={inputId.current} className="input-label">
            {typeof label === 'string' ? label : label}
          </label>
          {suggestion}
        </div>
      )}
      <div className="input-wrapper">
        {inputOverlay}
        <input
          ref={ref}
          id={inputId.current}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className={`input-field ${inputOverlay ? 'with-adornment' : ''} ${error ? 'error' : ''}`}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && <div className="input-error">{error}</div>}
    </div>
  );
});

// Amount input with number formatting and validation
export const AmountInput = forwardRef(({
  value,
  onValueChange,
  onChange,
  unit,
  shouldBePositive = false,
  suggestion,
  label,
  placeholder = "Enter amount",
  max,
  min,
  step,
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const valueRef = useRef(value?.toString() || '');

  const handleValueChange = (newValue) => {
    // Allow empty input
    if (newValue === '') {
      setInputValue('');
      valueRef.current = '';
      onValueChange?.(undefined);
      return;
    }

    // Remove any non-numeric characters except decimal point and negative sign
    const cleanValue = newValue.replace(/[^0-9.-]/g, '');
    
    // Convert to number
    const numericValue = parseFloat(cleanValue);
    
    // Validate number
    if (isNaN(numericValue)) {
      return;
    }

    // Check positive constraint
    if (shouldBePositive && numericValue < 0) {
      return;
    }

    // Check min/max constraints
    if (min !== undefined && numericValue < min) {
      return;
    }
    if (max !== undefined && numericValue > max) {
      return;
    }

    setInputValue(cleanValue);
    valueRef.current = cleanValue;
    onValueChange?.(numericValue);
  };

  // Sync with external value changes
  React.useEffect(() => {
    if (value !== undefined && value.toString() !== valueRef.current) {
      const newValue = value.toString();
      setInputValue(newValue);
      valueRef.current = newValue;
    }
  }, [value]);

  return (
    <TextInput
      ref={ref}
      type="text"
      label={label}
      value={inputValue}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      inputOverlay={unit && <UnitAdornment>{unit}</UnitAdornment>}
      suggestion={suggestion}
      {...props}
    />
  );
});

// Percentage input component
export const PercentageInput = forwardRef((props, ref) => {
  return (
    <AmountInput
      ref={ref}
      unit={<Percent size={16} />}
      shouldBePositive={true}
      min={0}
      max={100}
      {...props}
    />
  );
});

// Currency input component
export const CurrencyInput = forwardRef((props, ref) => {
  return (
    <AmountInput
      ref={ref}
      unit={<DollarSign size={16} />}
      {...props}
    />
  );
});

// Unit adornment component
const UnitAdornment = ({ children, position = 'left' }) => {
  return (
    <div className={`unit-adornment ${position}`}>
      {children}
    </div>
  );
};

// Suggestion component for quick selection
export const AmountSuggestion = ({ 
  name, 
  value, 
  renderValue = (value) => value.toString(),
  onSelect 
}) => {
  return (
    <div className="amount-suggestion">
      <span className="suggestion-name">{name}:</span>
      <button 
        type="button"
        className="suggestion-button"
        onClick={() => onSelect(value)}
      >
        {renderValue(value)}
      </button>
    </div>
  );
};

// Common suggestion formatters
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value) => {
  return `${value}%`;
};

// Pre-configured suggestion components
export const CurrencySuggestion = ({ name, value, onSelect }) => (
  <AmountSuggestion
    name={name}
    value={value}
    renderValue={formatCurrency}
    onSelect={onSelect}
  />
);

export const PercentageSuggestion = ({ name, value, onSelect }) => (
  <AmountSuggestion
    name={name}
    value={value}
    renderValue={formatPercentage}
    onSelect={onSelect}
  />
);