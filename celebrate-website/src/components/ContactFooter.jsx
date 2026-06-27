import React from 'react';
import { Link, Sparkles, Send } from 'lucide-react';
import './ContactFooter.css';

const ContactFooter = () => {
  return (
    <footer className="footer section">
      <div className="container">
        <div className="footer-grid">

          <div className="footer-brand">
            <div className="logo-text">
              <h2>Celebrate</h2>
              <Sparkles className="logo-sparkle" size={14} />
            </div>
            <p className="footer-subtitle">Perfect Events.<br />Perfectly Planned.</p>
            <div className="social-icons">
              <a href="#" className="social-icon">IG</a>
              <a href="#" className="social-icon">FB</a>
              <a href="#" className="social-icon">PIN</a>
              <a href="#" className="social-icon">YT</a>
            </div>
          </div>

          <div className="footer-links">
            <h4>For Clients</h4>
            <ul>
              <li><a href="#">How It Works</a></li>
              <li><a href="#">Browse Events</a></li>
              <li><a href="#">Client Guide</a></li>
              <li><a href="#">FAQs</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>our services</h4>
            <ul>
              <li><a href="#">Join as Planner</a></li>
              <li><a href="#">Planner Benefits</a></li>
              <li><a href="#">Pricing Plans</a></li>
              <li><a href="#">Resources</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
            </ul>
          </div>

          <div className="footer-newsletter">
            <h4>Stay Inspired</h4>
            <p>Get event ideas, tips & special offers delivered to your inbox.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit" aria-label="Subscribe"><Send size={16} /></button>
            </form>
          </div>

        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 Celebrate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default ContactFooter;
