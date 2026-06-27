import React, { useRef } from 'react';
import { ArrowRight, Heart, Gift, Camera, Sparkles, Building, Baby } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './Categories.css';

const Categories = () => {
  const headerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: headerRef,
    offset: ["start 180px", "start 80px"]
  });
  const headerOpacityOut = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const categories = [
    { name: "Weddings", desc: "Make your big day magical", icon: <Heart size={20} />, img: "/assets/mockup_hero_arch.png" },
    { name: "Engagements", desc: "Celebrate your new beginning", icon: <Sparkles size={20} />, img: "/assets/mockup_category_engagements.png" },
    { name: "Birthdays", desc: "Make birthdays unforgettable", icon: <Gift size={20} />, img: "/assets/mockup_category_birthdays.png" },
    { name: "Anniversaries", desc: "Cherish every milestone", icon: <Camera size={20} />, img: "/assets/mockup_category_anniversaries.png" },
    { name: "Naming Ceremonies", desc: "Beautiful beginnings", icon: <Heart size={20} />, img: "/assets/mockup_category_naming.png" },
    { name: "Baby Showers", desc: "Welcome the little one", icon: <Baby size={20} />, img: "/assets/mockup_category_baby_shower.png" },
    { name: "Corporate", desc: "Professional. Impactful.", icon: <Building size={20} />, img: "/assets/category_corporate.png" }
  ];

  // Math for seamless loop (280px card + 32px gap)
  const cardWidth = 280;
  const gap = 32;
  const infiniteCategories = [...categories, ...categories];

  const titleText = "Every Celebration, Beautifully Planned";
  const words = titleText.split(" ");

  const titleContainerVariants = {
    hidden: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.85,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="section categories-section snap-section" id="events">
      <div className="container">

        <motion.div
          className="categories-header"
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ opacity: headerOpacityOut }}
        >
          <div className="cat-nav left">
            Explore by Event Type <Sparkles size={16} className="text-accent ml-2" />
          </div>
          <motion.div
            className="cat-title"
            variants={titleContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
          >
            <h2 className="font-serif" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.2em' }}>
              {words.map((word, index) => (
                <motion.span key={index} variants={wordVariants} style={{ display: 'inline-block' }}>
                  {word}
                </motion.span>
              ))}
            </h2>
          </motion.div>
          <div className="cat-nav right">
            <a href="#">View All Events <ArrowRight size={16} className="ml-2" /></a>
          </div>
        </motion.div>

        {/* Seamless Infinite Carousel */}
        <motion.div
          className="event-carousel-container"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.1 }}
        >
          <div className="event-carousel-track">
            {infiniteCategories.map((cat, index) => (
              <div className="event-card" key={index}>
                <div className="event-img-container">
                  <img src={cat.img} alt={cat.name} className="event-img" />
                </div>
                <div className="event-info">
                  <div className="event-title-row">
                    <div className="event-icon text-accent">{cat.icon}</div>
                    <h4>{cat.name}</h4>
                  </div>
                  <p>{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="categories-footer text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ marginTop: '2rem' }}
        >
          <p className="text-neutral-gray" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            Don't see your specific event type? Our expert planners can customize a unique experience just for you.
          </p>
          <a href="#contact" className="btn btn-secondary cta-outline-btn">Request Custom Event</a>
        </motion.div>

      </div>
    </section>
  );
};

export default Categories;
