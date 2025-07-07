import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';
import WealthStudLogo from './WealthStudLogo';
import { 
  HiChevronDown,
  HiMenuAlt3,
  HiX
} from 'react-icons/hi';
import { 
  TbTrendingUp,
  TbPigMoney,
  TbCalendarStats
} from 'react-icons/tb';
import { 
  GiPayMoney,
  GiCutDiamond,
  GiFamilyHouse
} from 'react-icons/gi';
import { FaShieldAlt } from 'react-icons/fa';

// Available tools data
const TOOLS = [
  {
    path: '/BudgetPlanner',
    icon: GiPayMoney,
    name: 'Budget Manager',
    colorClass: 'danger'
  },
  {
    path: '/RetirementCalculator',
    icon: TbTrendingUp,
    name: 'Retirement Calculator',
    colorClass: 'primary'
  },
  {
    path: '/NetWorthCalculator',
    icon: GiCutDiamond,
    name: 'Net Worth Tracker',
    colorClass: 'purple'
  },
  {
    path: '/SavingPlanner',
    icon: TbPigMoney,
    name: 'Savings Planner',
    colorClass: 'success'
  },
  {
    path: '/VacationPlanner',
    icon: TbCalendarStats,
    name: 'PTO Tracker',
    colorClass: 'warning'
  },
  {
    path: '/MortgageTool',
    icon: GiFamilyHouse,
    name: 'Mortgage Calculator',
    colorClass: 'cyan'
  },
  {
    path: '/InsuranceAnalyzer',
    icon: FaShieldAlt,
    name: 'Insurance Analyzer',
    colorClass: 'purple'
  }
];

const Navigation = ({ 
  actions = [],
  pageTitle = null
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // const getCurrentTool = () => {
  //   return TOOLS.find(tool => tool.path === location.pathname);
  // };

  // const currentTool = getCurrentTool();

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Left Section - Brand */}
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            <WealthStudLogo size={20} />
            <span className="brand-text">WEALTHSTUD.IO</span>
          </Link>
          {pageTitle && <span className="page-title-nav">{pageTitle}</span>}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <HiX /> : <HiMenuAlt3 />}
          </button>
        </div>

        {/* Center Section - Copyright & Legal Info */}
        <div className="nav-center">
          <div className="nav-copyright">
            <div className="copyright-text">
              © {new Date().getFullYear()} WealthStud
            </div>
            <div className="name-text">
              Created by David Hess
            </div>
            <div className="legal-notice">
              <FaShieldAlt size={10} />
              <span>For informational purposes only, not financial advice!</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="nav-right">
          {/* Custom Actions */}
          {actions.map((action, index) => (
            <button
              key={index}
              className={`btn ${action.variant || 'btn-ghost'} nav-action`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && action.icon}
              <span className={action.hideTextOnMobile ? 'desktop-only' : ''}>
                {action.label}
              </span>
            </button>
          ))}

          {/* Tools Dropdown */}
          <div className="tools-dropdown">
            <button 
              className="btn btn-ghost tools-dropdown-trigger"
              onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
            >
              <span>Tools</span>
              <HiChevronDown className={`dropdown-arrow ${isToolsDropdownOpen ? 'open' : ''}`} />
            </button>
            
            {isToolsDropdownOpen && (
              <div className="tools-dropdown-menu">
                <Link 
                  to="/" 
                  className={`dropdown-item ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setIsToolsDropdownOpen(false)}
                >
                  <WealthStudLogo size={16} />
                  <span>Home</span>
                </Link>
                {TOOLS.map((tool) => {
                  const IconComponent = tool.icon;
                  const isActive = location.pathname === tool.path;
                  return (
                    <Link
                      key={tool.path}
                      to={tool.path}
                      className={`dropdown-item ${isActive ? 'active' : ''}`}
                      onClick={() => setIsToolsDropdownOpen(false)}
                    >
                      <IconComponent className="dropdown-icon" />
                      <span>{tool.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {/* All Tools Navigation */}
          <div className="mobile-nav-section">
            <h3 className="mobile-nav-title">Navigation</h3>
            <div className="mobile-tools-list">
              <Link 
                to="/" 
                className={`mobile-tool-item ${location.pathname === '/' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <WealthStudLogo size={16} />
                <span className="tool-name">Home</span>
              </Link>
              {TOOLS.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = location.pathname === tool.path;
                return (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className={`mobile-tool-item ${isActive ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent className="tool-icon" />
                    <span className="tool-name">{tool.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Actions */}
          {actions.length > 0 && (
            <div className="mobile-nav-section">
              <h3 className="mobile-nav-title">Actions</h3>
              <div className="mobile-actions">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    className={`btn ${action.variant || 'btn-ghost'} mobile-action`}
                    onClick={() => {
                      action.onClick();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={action.disabled}
                  >
                    {action.icon && action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Tools Dropdown Overlay */}
      {isToolsDropdownOpen && (
        <div 
          className="dropdown-overlay"
          onClick={() => setIsToolsDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;