import React from 'react';
import { CalendarHeart, Map, Palette, Briefcase, Handshake, ShieldCheck } from 'lucide-react';
import './Services.css';

const Services = () => {
  const services = [
    {
      icon: <CalendarHeart size={28} strokeWidth={1.5} />,
      title: "Event Planning",
      description: "Professional planning for all event types, from intimate gatherings to grand celebrations."
    },
    {
      icon: <Map size={28} strokeWidth={1.5} />,
      title: "Venue Recommendations",
      description: "Find the perfect venue based on your budget, location, and guest count."
    },
    {
      icon: <Palette size={28} strokeWidth={1.5} />,
      title: "Decor & Theme Design",
      description: "Customized stage and event décor concepts visualized before execution."
    },
    {
      icon: <Briefcase size={28} strokeWidth={1.5} />,
      title: "Vendor Coordination",
      description: "Seamless management of photographers, caterers, florists, and entertainment."
    },
    {
      icon: <Handshake size={28} strokeWidth={1.5} />,
      title: "Collaborative Design",
      description: "Work directly with planners to refine event concepts and track design history."
    },
    {
      icon: <ShieldCheck size={28} strokeWidth={1.5} />,
      title: "Execution Support",
      description: "Ensure smooth event delivery and on-ground coordination on your special day."
    }
  ];

  return (
    <section className="section services-section snap-section" id="services">
      <div className="container">
        <div className="section-header text-center reveal reveal-up">
          <h2 className="font-serif">Our Services</h2>
          <p>Everything you need for a flawless event experience.</p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div className={`service-card card reveal reveal-up reveal-delay-${((index % 4) + 1) * 100}`} key={index}>
              <div className="service-icon-wrapper text-primary">
                {service.icon}
              </div>
              <h3 className="font-serif">{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
