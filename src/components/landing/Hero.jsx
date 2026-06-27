import React, { useRef } from 'react';
import { Sparkles, ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './Hero.css';

const Hero = () => {
  const heroRef = useRef(null);

  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 500], [0, 150]);
  const textY = useTransform(scrollY, [0, 400], [0, -80]);
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 15 }
    }
  };

  const archVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 60, damping: 20, delay: 0.2 }
    }
  };

  return (
    <section className="hero-section snap-section" ref={heroRef}>

      {/* Background decorations */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="bg-decor top-right"></motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="bg-decor bottom-left"></motion.div>
      <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 0.6, rotate: 45 }} transition={{ duration: 2, ease: "easeOut" }} className="bg-decor petal-1"></motion.div>
      <motion.div initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 0.7, rotate: -30 }} transition={{ duration: 2, ease: "easeOut" }} className="bg-decor petal-2"></motion.div>

      <motion.div
        className="hero-visual-full"
        variants={archVariants}
        initial="hidden"
        animate="visible"
        style={{ y: imgY }}
      >
        <div className="bg-image-container">
          <img src="/landing-assets/mockup_hero_arch.png" alt="Wedding Stage Concept" className="bg-img" />
        </div>
      </motion.div>

      <div className="container hero-container">

        <motion.div style={{ y: textY, opacity: textOpacity }} className="parallax-text-wrapper">
          <motion.div
            className="hero-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="hero-badge" variants={itemVariants}>
              <Sparkles className="badge-icon" size={14} fill="#E5B869" color="#E5B869" />
              <span>AI-Powered Event Planning</span>
            </motion.div>

            <motion.h1 variants={itemVariants}>
              Your Perfect Event, <br />
              <span className="font-logo text-accent" style={{ fontSize: '4.5rem', marginLeft: '-0.5rem', paddingRight: '1rem' }}>Perfectly</span> Planned
            </motion.h1>

            <motion.p className="hero-subtitle" variants={itemVariants}>
              Share your ideas, get multiple proposals,<br />
              compare & choose the best event team.
            </motion.p>

            <motion.div className="hero-features-row" variants={itemVariants}>
              <div className="feature-pill">
                <ShieldCheck className="feature-icon" size={16} />
                <span>Multiple<br />Proposals</span>
              </div>
              <div className="feature-pill">
                <ShieldCheck className="feature-icon" size={16} />
                <span>AI Design<br />Collaboration</span>
              </div>
              <div className="feature-pill">
                <ShieldCheck className="feature-icon" size={16} />
                <span>Transparent<br />Pricing</span>
              </div>
              <div className="feature-pill">
                <ShieldCheck className="feature-icon" size={16} />
                <span>Trusted<br />Planners</span>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
