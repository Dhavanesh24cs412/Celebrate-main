import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustedBy from './components/TrustedBy';
import About from './components/About';
import Categories from './components/Categories';
import HowItWorks from './components/HowItWorks';
import Services from './components/Services';
import ValueProposition from './components/ValueProposition';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import CTABanner from './components/CTABanner';
import ContactFooter from './components/ContactFooter';

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from 'lenis';

import './index.css';

gsap.registerPlugin(ScrollTrigger);

function App() {
  React.useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // Globally intercept anchor links to use Lenis smooth scrolling
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a');
      if (target && target.hash && target.hash.length > 1) {
        try {
          const el = document.querySelector(target.hash);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el, { offset: -80, duration: 1.5 });
          }
        } catch (err) {
          // Ignore invalid selectors like "#"
        }
      }
    };
    document.addEventListener('click', handleAnchorClick);

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Setup Intersection Observer for reveal animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      lenis.destroy();
      document.removeEventListener('click', handleAnchorClick);
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useGSAP(() => {
    // Wait for images to load, then calculate snap points
    setTimeout(() => {
      ScrollTrigger.refresh();

      let panels = gsap.utils.toArray(".snap-section");

      ScrollTrigger.create({
        trigger: ".app-container",
        start: "top top",
        end: "bottom bottom",
        snap: {
          snapTo: (progress, self) => {
            let snapPoints = panels.map(panel => panel.offsetTop / self.end);
            if (snapPoints.length === 0) return progress;
            let closest = snapPoints.reduce((prev, curr) =>
              Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
            );
            return closest;
          },
          duration: { min: 0.3, max: 0.8 },
          delay: 0.05,
          ease: "power3.inOut"
        }
      });
    }, 500); // Give initial render & images a moment
  });

  return (
    <div className="app-container">
      <Navbar />
      <Hero />
      <TrustedBy />

      <Categories />
      <HowItWorks />

      <About />
      <Services />
      <ValueProposition />
      <Testimonials />
      <FAQ />
      <Contact />

      <CTABanner />
      <ContactFooter />
    </div>
  );
}

export default App;
