// src/components/BudgetPlanner/data/BudgetCategories.js

export const DEFAULT_BUDGET_CATEGORIES = {
  'Housing': {
    label: 'Housing',
    recommended: 0.28,
    color: '#D98245',
    subcategories: {
      'Rent/Mortgage': { monthly: 0 },
      'Property Tax': { monthly: 0 },
      'Insurance': { monthly: 0 },
      'Utilities': { monthly: 0 },
      'HOA Fees': { monthly: 0 },
    }
  },
  'Food': {
    label: 'Food',
    recommended: 0.12,
    color: '#C5563F',
    subcategories: {
      'Groceries': { monthly: 0 },
      'Dining Out': { monthly: 0 },
      'Coffee/Drinks': { monthly: 0 },
    }
  },
  'Transportation': {
    label: 'Transportation',
    recommended: 0.15,
    color: '#237F74',
    subcategories: {
      'Car Payment': { monthly: 0 },
      'Gas': { monthly: 0 },
      'Insurance': { monthly: 0 },
      'Maintenance': { monthly: 0 },
      'Public Transit': { monthly: 0 },
      'Parking/Tolls': { monthly: 0 },
    }
  },
  'Entertainment': {
    label: 'Entertainment',
    recommended: 0.05,
    color: '#8B4513',
    subcategories: {
      'Streaming Services': { monthly: 0 },
      'Movies/Events': { monthly: 0 },
      'Hobbies': { monthly: 0 },
      'Gaming': { monthly: 0 },
    }
  },
  'Personal': {
    label: 'Personal & Shopping',
    recommended: 0.05,
    color: '#1C3645',
    subcategories: {
      'Clothing': { monthly: 0 },
      'Personal Care': { monthly: 0 },
      'Gym/Fitness': { monthly: 0 },
      'Subscriptions': { monthly: 0 },
      'Phone/Internet': { monthly: 0 },
    }
  },
  'Healthcare': {
    label: 'Healthcare',
    recommended: 0.10,
    color: '#C7A653',
    subcategories: {
      'Insurance Premium': { monthly: 0 },
      'Medical Expenses': { monthly: 0 },
      'Dental/Vision': { monthly: 0 },
      'Prescriptions': { monthly: 0 },
    }
  },
  'Education': {
    label: 'Education & Development',
    recommended: 0.05,
    color: '#4B0082',
    subcategories: {
      'Student Loans': { monthly: 0 },
      'Courses/Training': { monthly: 0 },
      'Books/Resources': { monthly: 0 },
    }
  },
  'Savings': {
    label: 'Savings & Investments',
    recommended: 0.20,
    color: '#27A25B',
    subcategories: {
      'Emergency Fund': { monthly: 0 },
      'Investment Account': { monthly: 0 },
      'IRA/Roth IRA': { monthly: 0 },
      'Other Savings': { monthly: 0 },
    }
  },
};

// Helper function to get a fresh copy of categories
export const getDefaultCategories = () => {
  return JSON.parse(JSON.stringify(DEFAULT_BUDGET_CATEGORIES));
};