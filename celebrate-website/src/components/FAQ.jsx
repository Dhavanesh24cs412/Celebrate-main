import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How does Celebrate work?",
      answer: "You submit your event details, our AI matches you with the best planners, and they send you customized proposals. You can then compare, collaborate, and book your preferred planner directly on the platform."
    },
    {
      question: "Is it free for clients?",
      answer: "Yes! Creating an event request and receiving proposals is completely free for clients. You only pay when you decide to book a planner."
    },
    {
      question: "How are planners selected?",
      answer: "We carefully vet all our planners based on their experience, portfolio, and past client reviews. Only trusted professionals are allowed on the platform."
    },
    {
      question: "Can I compare multiple proposals?",
      answer: "Absolutely. That's our core feature. You'll receive multiple detailed proposals including budgets, themes, and vendor lists to compare side-by-side."
    },
    {
      question: "Can I customize event designs?",
      answer: "Yes, our Collaborative Design Workspace allows you to leave feedback on stage mockups and decor designs, ensuring your vision is perfectly captured before you book."
    },
    {
      question: "What types of events are supported?",
      answer: "We support a wide range of events including Weddings, Receptions, Birthdays, Anniversaries, Naming Ceremonies, Corporate Events, and College Events."
    }
  ];

  return (
    <section className="section faq-section snap-section" id="faq">
      <div className="container">
        <div className="section-header text-center reveal reveal-up">
          <h2 className="font-serif">Frequently Asked Questions</h2>
          <p>Got questions? We've got answers.</p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div 
              className={`faq-item card reveal reveal-up reveal-delay-${((index % 4) + 1) * 100} ${openIndex === index ? 'active' : ''}`} 
              key={index}
              onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
            >
              <div className="faq-question">
                <h3 className="font-serif">{faq.question}</h3>
                <ChevronDown className="faq-icon" size={20} />
              </div>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
