import React from 'react';
import { Target, TrendingUp, Eye, DollarSign, Users, History } from 'lucide-react';
import './ValueProposition.css';

const ValueProposition = () => {
  const values = [
    {
      icon: <Target size={24} strokeWidth={1.5} />,
      title: "AI-Powered Matching",
      description: "Find planners that match your exact requirements."
    },
    {
      icon: <TrendingUp size={24} strokeWidth={1.5} />,
      title: "Competitive Marketplace",
      description: "Receive multiple proposals for the same event."
    },
    {
      icon: <Eye size={24} strokeWidth={1.5} />,
      title: "Visual-First Planning",
      description: "See event concepts before booking."
    },
    {
      icon: <DollarSign size={24} strokeWidth={1.5} />,
      title: "Transparent Budgeting",
      description: "Compare costs and inclusions easily."
    },
    {
      icon: <Users size={24} strokeWidth={1.5} />,
      title: "Design Workspace",
      description: "Co-create your event with planners."
    },
    {
      icon: <History size={24} strokeWidth={1.5} />,
      title: "Version History",
      description: "Track every design change and approval."
    }
  ];

  return (
    <section className="section value-prop-section snap-section" id="value">
      <div className="container">
        <div className="value-prop-container">
          <div className="value-header text-center reveal reveal-up">
            <h2 className="font-serif">Why Choose Celebrate</h2>
            <p>Our unique approach ensures a stress-free planning experience.</p>
          </div>
          
          <div className="value-grid">
            {values.map((val, index) => (
              <div className={`value-item card reveal reveal-up reveal-delay-${((index % 3) + 1) * 100}`} key={index}>
                <div className="value-icon-wrapper">
                  <div className="value-icon text-accent">{val.icon}</div>
                </div>
                <div className="value-text">
                  <h4 className="font-serif">{val.title}</h4>
                  <p>{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
