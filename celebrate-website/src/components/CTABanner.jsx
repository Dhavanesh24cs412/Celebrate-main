import React from 'react';
import './CTABanner.css';

const CTABanner = () => {
  return (
    <section className="section cta-banner-section" id="cta">
      <div className="container">
        <div className="cta-banner-card reveal reveal-zoom">
          <div className="cta-content reveal reveal-up reveal-delay-200">
            <h2 className="font-serif">Ready to Plan Your Dream Event?</h2>
            <p>
              Join thousands of happy families who trusted Celebrate<br />
              to make their special moments unforgettable.
            </p>
            <div className="cta-actions">
              <button className="btn btn-gold">Get Started Now</button>
              <button className="btn btn-secondary cta-outline-btn">Talk to Our Expert</button>
            </div>
          </div>
          
          <div className="cta-image-wrapper">
            <div className="cta-gradient-overlay"></div>
            <img src="/assets/mockup_cta_banner.png" alt="Outdoor Event" className="cta-bg-img" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
