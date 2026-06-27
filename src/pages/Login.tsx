import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LoadingState } from '../components/ui/LoadingState';

import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import TrustedBy from '../components/landing/TrustedBy';
import About from '../components/landing/About';
import Categories from '../components/landing/Categories';
import HowItWorks from '../components/landing/HowItWorks';
import Services from '../components/landing/Services';
import ValueProposition from '../components/landing/ValueProposition';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import Contact from '../components/landing/Contact';
import CTABanner from '../components/landing/CTABanner';
import ContactFooter from '../components/landing/ContactFooter';

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from 'lenis';

import '../styles/landing.css';
import '../styles/landing-app.css';

gsap.registerPlugin(ScrollTrigger);

export const Login = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const handleGoogleLogin = async () => {
    // Preserve full route fidelity (pathname + search + hash)
    const fromState = location.state?.from;
    const nextRoute = fromState 
      ? `${fromState.pathname}${fromState.search}${fromState.hash}`
      : '';
    
    const baseUrl = `${window.location.origin}/auth/callback`;
    const redirectTo = nextRoute 
      ? `${baseUrl}?next=${encodeURIComponent(nextRoute)}`
      : baseUrl;
      
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
  };

  useEffect(() => {
    // Only initialize Lenis and animations if we aren't loading
    if (loading) return;

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      mouseMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    } as any);

    // Globally intercept anchor links to use Lenis smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.hash && target.hash.length > 1) {
        try {
          const el = document.querySelector(target.hash);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el as HTMLElement, { offset: -80, duration: 1.5 });
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
      // Ensure we clear out the gsap ticker to prevent memory leaks across routes
      gsap.ticker.remove(lenis.raf);
    };
  }, [loading]);

  useGSAP(() => {
    if (loading) return;

    // Wait for images to load, then calculate snap points
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();

      let panels = gsap.utils.toArray(".snap-section");

      ScrollTrigger.create({
        trigger: ".app-container",
        start: "top top",
        end: "bottom bottom",
        snap: {
          snapTo: (progress, self) => {
            let snapPoints = panels.map((panel: any) => panel.offsetTop / self!.end);
            if (snapPoints.length === 0) return progress;
            let closest = snapPoints.reduce((prev: any, curr: any) =>
              Math.abs(curr - progress) < Math.abs(prev - progress) ? curr : prev
            );
            return closest;
          },
          duration: { min: 0.3, max: 0.8 },
          delay: 0.05,
          ease: "power3.inOut"
        }
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) return <LoadingState />;

  return (
    <div className="landing-page-scope">
      <div className="app-container">
        <Navbar onGoogleLogin={handleGoogleLogin} />
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

        <CTABanner onGoogleLogin={handleGoogleLogin} />
        <ContactFooter />
      </div>
    </div>
  );
};
