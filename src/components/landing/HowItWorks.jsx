import React from 'react';
import { Search, PenTool, CheckCircle, PartyPopper, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import './HowItWorks.css';

const HowItWorks = () => {
  const steps = [
    {
      title: "Share Your Vision",
      desc: "Tell us about your event, budget, and style preferences.",
      icon: <Search size={32} />
    },
    {
      title: "Get Proposals",
      desc: "Receive customized plans from top-rated event planners.",
      icon: <PenTool size={32} />
    },
    {
      title: "Compare & Choose",
      desc: "Review designs, budgets, and reviews to pick the best match.",
      icon: <CheckCircle size={32} />
    },
    {
      title: "Celebrate",
      desc: "Enjoy your perfectly executed, stress-free event.",
      icon: <PartyPopper size={32} />
    }
  ];

  return (
    <section className="section how-it-works-section snap-section" id="how-it-works">
      <div className="container">

        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
        >
          <h2>Planning <span className="font-serif text-italic text-primary">Simplified</span></h2>
          <p>We've broken down the complex event planning process into four simple, enjoyable steps.</p>
        </motion.div>

        <div className="steps-container">
          <motion.div
            className="connecting-line"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
            style={{ transformOrigin: "left" }}
          ></motion.div>

          {steps.map((step, index) => (
            <motion.div
              className="step-card"
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 60, damping: 12, delay: 0.2 + (index * 0.15) }}
            >
              <div className="step-icon-wrapper">
                <div className="step-number">{index + 1}</div>
                <div className="step-icon text-primary">{step.icon}</div>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
