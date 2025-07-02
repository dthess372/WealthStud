// WealthStudLogo component
import './WealthStudLogo.css';

const WealthStudLogo = ({ size = 24 }) => {
  return (
    <div className="wealthstud-logo" style={{ width: size, height: size }}>
      <div className="spinner">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
};

export default WealthStudLogo;