import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FORMATTING, VALIDATION_RULES } from './constants';

// Tailwind class merging utility
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ===== NUMBER PARSING AND VALIDATION =====

// Safely parse numbers with fallback
export function parseNumber(value, fallback = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

// Safely parse integers with fallback
export function parseInteger(value, fallback = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? fallback : num;
}

// Validate numeric input within range
export function validateNumber(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined || value === '') return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

// ===== CURRENCY FORMATTING =====

// Format number as currency
export function formatCurrency(value, options = {}) {
  if (isNaN(value) || !isFinite(value)) return '$0';
  
  const defaults = {
    ...FORMATTING.currency,
    style: 'currency'
  };
  
  const formatter = new Intl.NumberFormat(defaults.locale, { ...defaults, ...options });
  return formatter.format(Math.round(value));
}

// Format number with commas (no currency symbol)
export function formatNumber(value, options = {}) {
  if (isNaN(value) || !isFinite(value)) return '0';
  
  const defaults = {
    ...FORMATTING.currency,
    style: 'decimal'
  };
  
  const formatter = new Intl.NumberFormat(defaults.locale, { ...defaults, ...options });
  return formatter.format(value);
}

// Format large currency values with abbreviations (K, M, B)
export function formatLargeCurrency(value, decimals = 1) {
  if (isNaN(value) || !isFinite(value)) return '$0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(decimals)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(decimals)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}$${(absValue / 1e3).toFixed(decimals)}K`;
  } else {
    return formatCurrency(value);
  }
}

// ===== PERCENTAGE FORMATTING =====

// Format as percentage with specified decimal places
export function formatPercent(value, decimals = 1) {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value.toFixed(decimals)}%`;
}

// Convert decimal to percentage (0.1 -> 10%)
export function decimalToPercent(decimal, decimals = 1) {
  return formatPercent(decimal * 100, decimals);
}

// ===== DATE UTILITIES =====

// Calculate age from birth date
export function calculateAge(birthDate) {
  if (!birthDate || birthDate === null || birthDate === undefined) return 0;
  
  const birth = new Date(birthDate);
  const now = new Date();
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Format date for display
export function formatDate(date, options = {}) {
  if (!date || date === null || date === undefined) return 'Invalid Date';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const defaults = { year: 'numeric', month: 'numeric', day: 'numeric' };
  return dateObj.toLocaleDateString('en-US', { ...defaults, ...options });
}

// ===== FINANCIAL CALCULATIONS =====

// Calculate compound interest
export function calculateCompoundInterest(principal, rate, compounds, years) {
  if (compounds === 0) return principal * Math.pow(1 + rate, years);
  return principal * Math.pow(1 + (rate / compounds), compounds * years);
}

// Calculate monthly payment for loan
export function calculateLoanPayment(principal, rate, years) {
  if (rate === 0) return principal / (years * 12);
  
  const monthlyRate = rate / 12;
  const numPayments = years * 12;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

// Calculate future value of annuity (regular payments)
export function calculateAnnuityFV(payment, rate, periods) {
  if (rate === 0) return payment * periods;
  return payment * ((Math.pow(1 + rate, periods) - 1) / rate);
}

// ===== ARRAY AND DATA UTILITIES =====

// Sum array of numbers
export function sum(array) {
  return array.reduce((total, num) => total + parseNumber(num), 0);
}

// Calculate average of array
export function average(array) {
  return array.length === 0 ? 0 : sum(array) / array.length;
}

// Sort array of objects by property
export function sortBy(array, property, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
}

// ===== VALIDATION UTILITIES =====

// Validate email format
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Additional check for consecutive dots
  if (email.includes('..')) return false;
  return emailRegex.test(email);
}

// Validate age within reasonable range
export function isValidAge(age) {
  const numAge = parseNumber(age);
  return validateNumber(numAge, VALIDATION_RULES.AGE.MIN, VALIDATION_RULES.AGE.MAX);
}

// Validate percentage (0-100)
export function isValidPercentage(percentage) {
  if (percentage === null || percentage === undefined) return false;
  const numPercentage = parseFloat(percentage);
  if (isNaN(numPercentage)) return false;
  return numPercentage >= VALIDATION_RULES.PERCENTAGE.MIN && numPercentage <= VALIDATION_RULES.PERCENTAGE.MAX;
}

// ===== CSV UTILITIES =====

// Convert array of objects to CSV string
export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers || Object.keys(data[0]);
  const csvRows = data.map(row => 
    csvHeaders.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"`
        : value;
    }).join(',')
  );
  
  return [csvHeaders.join(','), ...csvRows].join('\n');
}

// Parse CSV string to array of objects
export function csvToArray(csvString, headers = null) {
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) return [];
  
  const csvHeaders = headers || lines[0].split(',');
  const dataLines = headers ? lines : lines.slice(1);
  
  return dataLines.map(line => {
    const values = line.split(',');
    const obj = {};
    csvHeaders.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj;
  });
}

// ===== STRING UTILITIES =====

// Capitalize first letter
export function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Convert camelCase to title case
export function camelToTitle(str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}

// ===== LOCAL STORAGE UTILITIES =====

// Safely get item from localStorage
export function getStorageItem(key, fallback = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.warn(`Error reading from localStorage key: ${key}`, error);
    return fallback;
  }
}

// Safely set item in localStorage
export function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage key: ${key}`, error);
    return false;
  }
}

// Remove item from localStorage
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing localStorage key: ${key}`, error);
    return false;
  }
}