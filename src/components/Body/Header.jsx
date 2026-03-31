import { useState } from "react";
import "./Header.css";
import logo from '../../assets/logo.svg';
import { Link } from "react-router-dom";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <div id="header">
        <div className="header-brand">
          <img src={logo} alt="DwaTrack logo" id="logo" />
          <p id="main">DwaTrack</p>
        </div>

        {/* Desktop nav */}
        <nav id="nav-bar">
          <button className="nav-btn" onClick={() => scrollTo('problem-section')}>
            The Problem
          </button>
          <button className="nav-btn" onClick={() => scrollTo('features-section')}>
            Features
          </button>
          <button className="nav-btn" onClick={() => scrollTo('steps-section')}>
            How it Works
          </button>
          <button className="nav-btn" onClick={() => scrollTo('faq-section')}>
            FAQ
          </button>
        </nav>

        {/* Desktop action buttons */}
        <div className="header-actions">
          <Link to="/login" className="no-underline">
            <button className="btn-login">Log In</button>
          </Link>
          <Link to="/signup" className="no-underline">
            <button className="btn-primary">Get Started</button>
          </Link>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className={`hamburger${menuOpen ? ' hamburger-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile nav overlay */}
      {menuOpen && (
        <div id="mobile-nav">
          <button className="mobile-nav-link" onClick={() => scrollTo('problem-section')}>
            The Problem
          </button>
          <button className="mobile-nav-link" onClick={() => scrollTo('features-section')}>
            Features
          </button>
          <button className="mobile-nav-link" onClick={() => scrollTo('steps-section')}>
            How it Works
          </button>
          <button className="mobile-nav-link" onClick={() => scrollTo('faq-section')}>
            FAQ
          </button>

          <div className="mobile-nav-divider"></div>

          <div className="mobile-nav-actions">
            <Link to="/login" className="no-underline" onClick={closeMenu}>
              <button className="mobile-btn-login">Log In</button>
            </Link>
            <Link to="/signup" className="no-underline" onClick={closeMenu}>
              <button className="mobile-btn-primary">Get Started Free</button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
