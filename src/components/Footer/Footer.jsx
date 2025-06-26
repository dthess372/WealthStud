import { useState } from 'react';
import { Heart, Shield, Lock, Zap } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [year] = useState(new Date().getFullYear());

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Main Footer Info */}
          <div className="footer-main">
            <div className="footer-brand">
              <span className="brand-name">WealthStud</span>
              <span className="brand-tagline">Financial Wellness Tools</span>
            </div>
            
            <div className="footer-features">
              <div className="footer-feature">
                <Lock size={14} />
                <span>100% Private</span>
              </div>
              <div className="footer-feature">
                <Zap size={14} />
                <span>Real-time</span>
              </div>
              <div className="footer-feature">
                <Heart size={14} />
                <span>Free Forever</span>
              </div>
            </div>
          </div>

          {/* Legal & Copyright */}
          <div className="footer-legal">
            <div className="copyright">
              © {year} WealthStud. Created by David Hess.
            </div>
            <div className="disclaimer">
              <Shield size={12} />
              <span>For informational purposes only. Not financial advice.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
