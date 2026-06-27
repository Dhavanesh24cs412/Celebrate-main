import React from 'react';
import { motion } from 'framer-motion';
import './TrustedBy.css';

const TrustedBy = () => {
  return (
    <div className="trusted-by-section">
      <div className="container">
        <motion.div 
          className="trusted-by-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10px" }}
          transition={{ type: "spring", stiffness: 70, damping: 20, delay: 0.2 }}
        >
          <p className="trusted-by-text">Trusted by 25,000+ families & 2,000+ event professionals</p>
          <div className="trusted-by-logos">
            <div className="partner-logo serif-logo text-gold">WEDDING VIBES</div>
            <div className="partner-logo script-logo">Event Showcase</div>
            <div className="partner-logo serif-logo stacked">
              <span>Better Homes</span>
              <span>& Gardens</span>
            </div>
            <div className="partner-logo serif-logo text-dark">THE HINDU</div>
            <div className="partner-logo serif-logo text-rose">BRIDES</div>
            <div className="partner-logo serif-logo text-purple">FEMINA</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrustedBy;
