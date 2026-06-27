import React from 'react';
import { Star } from 'lucide-react';
import './Testimonials.css';

const Testimonials = () => {
  const reviews = [
    {
      name: "Sarah & John",
      event: "Wedding",
      rating: 5,
      feedback: "The proposal comparison feature helped us find the perfect wedding planner. It was so easy to see who offered the best value.",
      image: "https://i.pravatar.cc/150?img=47"
    },
    {
      name: "Michael T.",
      event: "Corporate Gala",
      rating: 5,
      feedback: "We finalized our décor design before booking and avoided costly changes later. Celebrate saved us a lot of back-and-forth emails.",
      image: "https://i.pravatar.cc/150?img=11"
    },
    {
      name: "Emma W.",
      event: "Birthday Celebration",
      rating: 5,
      feedback: "Collaborating on the design workspace was a game changer. The planner understood my vision perfectly.",
      image: "https://i.pravatar.cc/150?img=5"
    }
  ];

  return (
    <section className="section testimonials-section snap-section" id="reviews">
      <div className="container">
        <div className="section-header text-center reveal reveal-up">
          <h2 className="font-serif">Customer Reviews</h2>
          <p>Don't just take our word for it.</p>
        </div>

        <div className="testimonials-grid">
          {reviews.map((review, index) => (
            <div className={`review-card card reveal reveal-up reveal-delay-${((index % 3) + 1) * 100}`} key={index}>
              <div className="stars">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={18} fill="var(--tertiary)" color="var(--tertiary)" />
                ))}
              </div>
              <p className="feedback">"{review.feedback}"</p>
              
              <div className="client-info">
                <img src={review.image} alt={review.name} className="client-img" />
                <div>
                  <h4 className="font-serif">{review.name}</h4>
                  <span>{review.event}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
