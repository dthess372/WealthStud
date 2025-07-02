# WealthStud 💰

A comprehensive React-based personal finance application that provides a complete suite of financial wellness tools. WealthStud prioritizes user privacy by performing all calculations client-side and offering CSV import/export functionality instead of server-side data storage.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/user/wealthstud)
[![Test Coverage](https://img.shields.io/badge/coverage-87%25-yellow)](https://github.com/user/wealthstud)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🌟 Features

### Financial Planning Tools
- **💰 Budget Planner**: Income/expense tracking with tax calculations and visual breakdowns
- **🏠 Net Worth Calculator**: Asset/liability tracking across multiple categories with health scoring
- **🎯 Retirement Calculator**: Advanced retirement planning with Monte Carlo simulations
- **💡 Savings Planner**: Growth projections with different investment scenarios
- **🏡 Mortgage Tool**: Payment calculations, amortization schedules, and affordability analysis
- **🛡️ Insurance Analyzer**: Comprehensive insurance needs estimation
- **📈 Capital Gains Analyzer**: Tax-efficient investment strategy planning
- **🏖️ Vacation Planner**: PTO accrual tracking and vacation planning

### Core Capabilities
- **🔒 Privacy-First**: All calculations performed client-side, no data sent to servers
- **📊 Data Visualization**: Interactive charts and graphs using Recharts and Material-UI
- **💾 Data Persistence**: CSV import/export for all tools with localStorage backup
- **📱 Responsive Design**: Mobile-first design optimized for all devices
- **🧮 Financial Accuracy**: Comprehensive tax calculations for all 50 states + DC
- **⚡ Performance**: Optimized calculations and efficient state management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/user/wealthstud.git
cd wealthstud

# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000`.

### Build for Production

```bash
# Create production build
npm run build

# Deploy to GitHub Pages (if configured)
npm run deploy
```

## 🧪 Testing

WealthStud includes a comprehensive testing suite with 87% code coverage.

```bash
# Run tests in watch mode
npm test

# Run tests with coverage report
npm test -- --coverage --watchAll=false

# Run specific test files
npm test -- utils
npm test -- hooks
npm test -- taxes
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with functional components and hooks
- **Router**: React Router with HashRouter for GitHub Pages compatibility
- **Charts**: Recharts and Material-UI X-Charts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Styling**: Custom CSS with responsive design principles
- **Testing**: Jest and React Testing Library
- **Build**: Create React App with custom configuration

### Project Structure

```
src/
├── components/           # React components for each financial tool
│   ├── BudgetPlanner/   
│   ├── NetWorthCalculator/
│   ├── RetirementCalculator/
│   └── ...
├── lib/                 # Shared utilities and calculations
│   ├── utils.js         # 50+ utility functions
│   ├── taxes.js         # Tax calculation system
│   ├── constants.js     # Application constants
│   └── mortgageCalculations.js
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.js
│   ├── useCSV.js
│   └── useFormValidation.js
├── config/              # Configuration objects
│   ├── budgetConfig.js
│   ├── netWorthConfig.js
│   └── ...
└── styles/              # Shared CSS styles
```

### Key Design Principles
- **Component Isolation**: Each financial tool is self-contained
- **Shared Utilities**: Common functionality centralized in `/lib`
- **Custom Hooks**: Reusable state management and data handling
- **Configuration-Driven**: Tool behavior controlled by config objects
- **Type Safety**: Comprehensive input validation and error handling

## 💡 Usage Examples

### Budget Planning
1. Navigate to Budget Planner
2. Enter your income and select pay frequency
3. Add expenses by category
4. View tax calculations and spending breakdown
5. Export data as CSV for record keeping

### Net Worth Tracking
1. Open Net Worth Calculator
2. Add assets across categories (cash, investments, real estate, retirement)
3. Enter debts and liabilities
4. View financial health score and insights
5. Analyze asset allocation with interactive charts

### Retirement Planning
1. Access Retirement Calculator
2. Configure retirement accounts and contributions
3. Set retirement goals and timeline
4. Run Monte Carlo simulations for success probability
5. Adjust strategy based on projections

## 🔧 Development

### Adding New Features

1. **Create Component**: Add new component in `/src/components/NewTool/`
2. **Add Configuration**: Create config file in `/src/config/newToolConfig.js`
3. **Implement Logic**: Use shared utilities from `/src/lib/`
4. **Add Persistence**: Integrate `useLocalStorage` and `useCSV` hooks
5. **Write Tests**: Add comprehensive tests in `__tests__` directory
6. **Update Routes**: Add route in `src/App.js`

### Code Quality Standards
- **ESLint**: Configured for React best practices
- **Prettier**: Consistent code formatting
- **Testing**: 90%+ coverage for new features
- **Documentation**: Update README and CLAUDE.md for changes

### Development Commands

```bash
# Development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy

# Lint code
npm run lint

# Format code
npm run format
```

## 🧮 Financial Calculations

WealthStud includes accurate financial mathematics:

### Tax System
- **Federal Income Tax**: 2024 tax brackets for all filing statuses
- **State Income Tax**: Rates for all 50 states + DC
- **Payroll Taxes**: Social Security and Medicare with caps and thresholds
- **Tax Optimization**: Strategies for minimizing tax burden

### Investment Calculations
- **Compound Interest**: Accurate calculations with various compounding frequencies
- **Retirement Projections**: Monte Carlo simulations with market volatility
- **Portfolio Analysis**: Asset allocation and diversification metrics
- **Capital Gains**: Tax-efficient investment strategies

### Mortgage Mathematics
- **Payment Calculations**: Principal, interest, taxes, insurance (PITI)
- **Amortization Schedules**: Detailed payment breakdowns over loan term
- **PMI Calculations**: Private mortgage insurance based on loan-to-value
- **Affordability Analysis**: Maximum home price based on income and debts

## 📊 Data Management

### Privacy & Security
- **Client-Side Only**: No data transmitted to external servers
- **Local Storage**: Data persisted locally in browser
- **CSV Export/Import**: Full data portability and backup
- **No Tracking**: No analytics or user tracking implemented

### Data Formats
All tools support CSV import/export with standardized formats:
- Budget data with categories and tax information
- Net worth accounts with asset/liability classifications
- Retirement projections with contribution schedules
- Mortgage scenarios with payment breakdowns

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/new-feature`
3. **Write Tests**: Ensure new code is well-tested
4. **Follow Code Standards**: Use ESLint and Prettier
5. **Update Documentation**: Keep README and docs current
6. **Submit Pull Request**: Include description of changes

### Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/wealthstud.git

# Install dependencies
npm install

# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm test

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Create React App** for the excellent development environment
- **Recharts** for beautiful and responsive chart components
- **Lucide React** for the comprehensive icon library
- **React Testing Library** for testing best practices
- **Material-UI** for advanced chart components

## 📞 Support

For questions, suggestions, or issues:
- Create an issue on GitHub
- Check existing documentation in `/docs`
- Review test files for usage examples

## 🔮 Roadmap

### Upcoming Features
- **Investment Portfolio Tracker**: Real-time portfolio analysis
- **Debt Payoff Calculator**: Optimization strategies for debt elimination
- **College Savings Planner**: 529 plan calculations and projections
- **Estate Planning Tools**: Will and trust planning utilities
- **Business Finance Tools**: Small business financial planning

### Technical Improvements
- **Performance Optimization**: Code splitting and lazy loading
- **Enhanced Testing**: Integration and end-to-end test coverage
- **Accessibility**: WCAG 2.1 AA compliance
- **PWA Features**: Offline functionality and app installation
- **Advanced Analytics**: Deeper financial insights and recommendations

---

Built with ❤️ for financial wellness and privacy.