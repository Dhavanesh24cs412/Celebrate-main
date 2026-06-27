import React from 'react';
import { Sparkles, LayoutDashboard, Search, MessageSquare } from 'lucide-react';
import './About.css';

const About = () => {
  const highlights = [
    {
      icon: <Search size={24} />,
      title: "AI Planner Matching",
      description: "Our smart engine connects you with the perfect planners based on your exact requirements."
    },
    {
      icon: <LayoutDashboard size={24} />,
      title: "Proposal Comparison",
      description: "Compare multiple customized proposals side-by-side in one intuitive dashboard."
    },
    {
      icon: <Sparkles size={24} />,
      title: "Visual Event Concepts",
      description: "See your event come to life before booking with high-quality visual designs."
    },
    {
      icon: <MessageSquare size={24} />,
      title: "Collaborative Workspace",
      description: "Work directly with planners, share feedback, and track design revisions."
    }
  ];

  return (
    <section className="section about-section snap-section" id="about">
      <div className="container">
        <div className="section-header text-center reveal reveal-up">
          <h2 className="font-serif">A Smarter Way to Plan Memorable Events</h2>
          <p>
            Celebrate is an AI-powered event proposal marketplace that helps users discover, compare, and collaborate with event planners seamlessly.
          </p>
        </div>

        <div className="about-content">
          <div className="about-text card reveal reveal-left">
            <p>
              Instead of relying on referrals and endless vendor searches, Celebrate enables users to receive multiple customized proposals and compare them based on budget, creativity, and execution quality.
            </p>
            <p className="text-primary font-serif italic font-semibold">
              We bring transparency, creativity, and collaboration to the forefront of event planning.
            </p>
          </div>

          <div className="highlights-grid">
            {highlights.map((item, index) => (
              <div className={`highlight-card card reveal reveal-right reveal-delay-${((index % 4) + 1) * 100}`} key={index}>
                <div className="highlight-icon text-accent">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
