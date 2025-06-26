import { Shield, BarChart3, Zap } from 'lucide-react';

export const INVESTMENT_SCENARIOS = {
  conservative: {
    name: 'Conservative',
    description: 'Low risk with bonds and stable investments',
    returnRate: 4,
    icon: Shield,
    allocation: '20% Stocks, 70% Bonds, 10% Cash',
    color: '#22c55e'
  },
  moderate: {
    name: 'Moderate',
    description: 'Balanced risk with mixed portfolio',
    returnRate: 7,
    icon: BarChart3,
    allocation: '60% Stocks, 30% Bonds, 10% Cash',
    color: '#3b82f6'
  },
  aggressive: {
    name: 'Aggressive',
    description: 'Higher risk with growth-focused investments',
    returnRate: 10,
    icon: Zap,
    allocation: '90% Stocks, 10% Bonds',
    color: '#ef4444'
  }
};