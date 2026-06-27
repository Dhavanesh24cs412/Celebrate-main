import React from 'react';
import { Send } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  return (
    <section className="section contact-section snap-section" id="contact">
      <div className="container">
        <div className="contact-wrapper card">
          <div className="contact-info reveal reveal-left">
            <h2 className="font-serif">Get in Touch</h2>
            <p>Have specific questions or ready to plan? Send us a message and our team will get back to you shortly.</p>
          </div>

          <div className="contact-form-container reveal reveal-right reveal-delay-200">
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <input type="text" placeholder="Your Name" required className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input type="email" placeholder="Email Address" required className="form-input" />
                </div>
                <div className="form-group">
                  <input type="tel" placeholder="Phone Number" className="form-input" />
                </div>
              </div>
              <div className="form-group">
                <select className="form-input" required defaultValue="">
                  <option value="" disabled>Select Event Type</option>
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="birthday">Birthday</option>
                  <option value="other">Other Celebration</option>
                </select>
              </div>
              <div className="form-group">
                <textarea placeholder="Message" rows="4" required className="form-input"></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Send Message <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
