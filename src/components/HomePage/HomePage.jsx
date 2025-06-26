import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import SuggestionBox from '../SuggestionBox/SuggestionBox';

// Import modern icons
import { 
  GiPayMoney, 
  GiCutDiamond, 
  GiFamilyHouse,
  GiShield 
} from "react-icons/gi";
import { 
  TbPigMoney,
  TbTrendingUp,
  TbCalendarStats,
  TbSparkles,
  TbArrowRight,
  TbChevronDown,
  TbDashboard
} from "react-icons/tb";
import { 
  FaUmbrellaBeach, 
  FaRocket,
  FaChartLine,
  FaShieldAlt
} from "react-icons/fa";
import { 
  BsGraphUpArrow,
  BsStars,
  BsLightning
} from "react-icons/bs";
import { 
  HiSparkles,
  HiLightningBolt,
  HiTrendingUp 
} from "react-icons/hi";

function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const tools = [
    {
      path: "/FinancialDashboard",
      icon: TbDashboard,
      name: "Financial",
      subtitle: "Dashboard",
      description: "Complete financial overview with real-time projections and analytics",
      tags: ["New", "Comprehensive"],
      colorClass: "purple"
    },
    {
      path: "/BudgetPlanner",
      icon: GiPayMoney,
      name: "Budget",
      subtitle: "Manager",
      description: "AI-powered expense tracking with smart categorization and insights",
      tags: ["Essential", "Popular"],
      colorClass: "primary"
    },
    {
      path: "/RetirementCalculator", 
      icon: TbTrendingUp,
      name: "Retirement",
      subtitle: "Calculator",
      description: "Monte Carlo simulations with dynamic market projections",
      tags: ["Advanced", "Long-term"],
      colorClass: "purple"
    },
    {
      path: "/NetWorthCalculator",
      icon: GiCutDiamond,
      name: "Net Worth",
      subtitle: "Tracker", 
      description: "Real-time portfolio tracking with asset visualization",
      tags: ["Premium", "Visual"],
      colorClass: "purple"
    },
    {
      path: "/SavingPlanner",
      icon: TbPigMoney,
      name: "Savings",
      subtitle: "Planner",
      description: "Goal-based savings with compound interest optimization",
      tags: ["Goal-oriented"],
      colorClass: "primary"
    },
    {
      path: "/VacationPlanner",
      icon: TbCalendarStats,
      name: "PTO",
      subtitle: "Tracker",
      description: "Smart vacation planning with accrual calculations",
      tags: ["Lifestyle"],
      colorClass: "primary"
    },
    {
      path: "/MortgageTool",
      icon: GiFamilyHouse,
      name: "Mortgage",
      subtitle: "Calculator", 
      description: "Comprehensive loan analysis with amortization charts",
      tags: ["Property"],
      colorClass: "primary"
    },
    {
      path: "/InsuranceAnalyzer",
      icon: FaShieldAlt,
      name: "Insurance",
      subtitle: "Analyzer",
      description: "Risk assessment with personalized coverage recommendations",
      tags: ["Protection"],
      colorClass: "purple"
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? 'animate-fade-in-up' : ''}`}>
        
        <div className="hero-content">
          
          <h1 className="hero-title">
            <span className="title-line-1">Master Your</span>
            <span className="title-line-2 gradient-text">Financial Future</span>
          </h1>
          
          <p className="hero-description">
            Cutting-edge financial planning tools powered by advanced algorithms. 
            Track, analyze, and optimize your wealth with precision and confidence.
          </p>
          
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">8</div>
              <div className="stat-label">Expert Tools</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Privacy First</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Calculations</div>
            </div>
          </div>
          
          <div className="hero-cta">
            <button className="scroll-indicator" onClick={() => document.querySelector('.tools-section').scrollIntoView({ behavior: 'smooth' })}>
              <span>Explore Tools</span>
              <TbChevronDown className="scroll-arrow" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Value Proposition Section */}
      <section className="value-proposition-section">
        <div className="value-content">
          <h2 className="value-title">Why Choose WealthStud?</h2>
          <div className="value-points">
            <div className="value-point">
              <div className="value-icon primary">
                <HiSparkles />
              </div>
              <div className="value-text">
                <h4>Privacy-First Design</h4>
                <p>All calculations happen locally in your browser. Your financial data never leaves your device.</p>
              </div>
            </div>
            <div className="value-point">
              <div className="value-icon purple">
                <TbSparkles />
              </div>
              <div className="value-text">
                <h4>Professional-Grade Tools</h4>
                <p>Advanced algorithms and Monte Carlo simulations typically found in expensive financial software.</p>
              </div>
            </div>
            <div className="value-point">
              <div className="value-icon primary">
                <BsStars />
              </div>
              <div className="value-text">
                <h4>Completely Free</h4>
                <p>No subscriptions, no hidden fees, no data harvesting. Just powerful financial tools, free forever.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="tools-section">
        <div className="tools-grid stagger-children">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Link
                key={tool.path}
                to={tool.path}
                className={`tool-card card ${tool.colorClass} animate-slide-up`}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="tool-header">
                  <div className="tool-icon-wrapper">
                    <div className={`tool-icon ${tool.colorClass}`}>
                      <IconComponent size={28} />
                    </div>
                  </div>
                  <div className="tool-tags">
                    {tool.tags.map((tag) => (
                      <span key={tag} className={`badge badge-${tool.colorClass}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="tool-body">
                  <h3 className="tool-title">
                    <span className="tool-name">{tool.name}</span>
                    <span className="tool-subtitle">{tool.subtitle}</span>
                  </h3>
                  
                  <p className="tool-description">
                    {tool.description}
                  </p>
                </div>
                
                <div className="tool-footer">
                  <div className={`tool-action btn btn-ghost ${activeCard === index ? 'active' : ''}`}>
                    <span>Launch Tool</span>
                    <TbArrowRight className="action-arrow" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon success">
                <FaRocket />
              </div>
              <h3 className="feature-title">Lightning Fast</h3>
              <p className="feature-description">
                Instant calculations with real-time updates and optimized performance
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon primary">
                <FaShieldAlt />
              </div>
              <h3 className="feature-title">Privacy First</h3>
              <p className="feature-description">
                Zero data collection, complete client-side processing for maximum security
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon purple">
                <FaChartLine />
              </div>
              <h3 className="feature-title">Pro Analytics</h3>
              <p className="feature-description">
                Advanced visualizations with comprehensive financial insights
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <SuggestionBox />
    </div>
  );
}

export default HomePage;