import { useState, useCallback } from 'react';
import { parseNumber, isValidAge, isValidPercentage, isValidEmail } from '../lib/utils';
import { ERROR_MESSAGES } from '../lib/constants';

/**
 * Custom hook for form validation
 * @param {object} initialValues - Initial form values
 * @param {object} validationRules - Validation rules for each field
 * @returns {object} - Form state and validation functions
 */
export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Update a single field value
  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Update multiple field values
  const setMultipleValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Mark field as touched
  const setFieldTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  // Validate a single field
  const validateField = useCallback((field, value = values[field]) => {
    const rules = validationRules[field];
    if (!rules) return '';

    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      return rules.requiredMessage || ERROR_MESSAGES.REQUIRED_FIELD;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return '';
    }

    // Numeric validations
    if (rules.type === 'number') {
      const numValue = parseNumber(value);
      
      if (isNaN(numValue)) {
        return rules.invalidMessage || ERROR_MESSAGES.INVALID_NUMBER;
      }
      
      if (rules.min !== undefined && numValue < rules.min) {
        return `Value must be at least ${rules.min}`;
      }
      
      if (rules.max !== undefined && numValue > rules.max) {
        return `Value must be no more than ${rules.max}`;
      }
      
      if (rules.positive && numValue < 0) {
        return rules.positiveMessage || ERROR_MESSAGES.NEGATIVE_VALUE;
      }
    }

    // Age validation
    if (rules.type === 'age') {
      if (!isValidAge(value)) {
        return 'Please enter a valid age between 18 and 100';
      }
    }

    // Percentage validation
    if (rules.type === 'percentage') {
      if (!isValidPercentage(value)) {
        return 'Please enter a percentage between 0 and 100';
      }
    }

    // Email validation
    if (rules.type === 'email') {
      if (!isValidEmail(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Date validation
    if (rules.type === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Please enter a valid date';
      }
      
      if (rules.minDate && date < new Date(rules.minDate)) {
        return `Date must be after ${new Date(rules.minDate).toLocaleDateString()}`;
      }
      
      if (rules.maxDate && date > new Date(rules.maxDate)) {
        return `Date must be before ${new Date(rules.maxDate).toLocaleDateString()}`;
      }
    }

    // Custom validation function
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, values);
      if (customError) return customError;
    }

    return '';
  }, [values, validationRules]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, validationRules]);

  // Handle field blur (mark as touched and validate)
  const handleBlur = useCallback((field) => {
    setFieldTouched(field);
    const error = validateField(field);
    setErrors(prev => ({ ...prev, [field]: error }));
  }, [setFieldTouched, validateField]);

  // Handle field change
  const handleChange = useCallback((field, value) => {
    setValue(field, value);
  }, [setValue]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Check if form has any errors
  const hasErrors = Object.values(errors).some(error => error !== '');

  // Check if form is dirty (has changes from initial values)
  const isDirty = Object.keys(values).some(key => values[key] !== initialValues[key]);

  return {
    values,
    errors,
    touched,
    setValue,
    setValues: setMultipleValues,
    setFieldTouched,
    validateField,
    validateForm,
    handleBlur,
    handleChange,
    resetForm,
    hasErrors,
    isDirty
  };
}

/**
 * Predefined validation rules for common financial fields
 */
export const COMMON_VALIDATION_RULES = {
  income: {
    type: 'number',
    required: true,
    min: 0,
    max: 10000000,
    positive: true
  },
  
  age: {
    type: 'age',
    required: true
  },
  
  percentage: {
    type: 'percentage',
    required: false,
    min: 0,
    max: 100
  },
  
  interestRate: {
    type: 'number',
    required: false,
    min: 0,
    max: 50
  },
  
  amount: {
    type: 'number',
    required: false,
    min: 0,
    positive: true
  },
  
  email: {
    type: 'email',
    required: false
  },
  
  birthDate: {
    type: 'date',
    required: true,
    maxDate: new Date().toISOString().split('T')[0] // Today
  }
};