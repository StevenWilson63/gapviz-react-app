import React, { useState } from "react";
import "./helpSupport.css";
import { useNavigate } from "react-router-dom";

export default function HelpSupport() {
  const navigate = useNavigate();

  // State for active FAQ toggle
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Modal State for Support/Problem/Request forms
  const [activeModal, setActiveModal] = useState(null); // 'contact' | 'problem' | 'feature' | 'whatsNew' | null
  const [formText, setFormText] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const faqs = [
    {
      question: "What commands can I give the Smart DJ Assistant?",
      answer:
        "You can instruct the DJ using natural voice or text! Try commands like 'Increase commentary length', 'Talk more about album trivia', 'Change my password', or 'Take me to Appearance settings'."
    },
    {
      question: "How does track identification work?",
      answer:
        "Tap the Identify fingerprint icon on the home bar. Gapviz listens to a brief audio snippet, creates an acoustic fingerprint, and matches it against our global database in seconds without storing raw audio."
    },
    {
      question: "How do I manage my free trial or subscription?",
      answer:
        "Head to Profile > Subscription & Plan to view remaining trial days, upgrade your tier, or manage payment methods."
    },
    {
      question: "Is my microphone data recorded permanently?",
      answer:
        "No. Audio snippets captured during identification or voice commands are processed in real-time and immediately discarded after execution."
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formText.trim()) return;

    let confirmText = "Message sent to support!";
    if (activeModal === "problem") confirmText = "Problem report submitted. Thank you!";
    if (activeModal === "feature") confirmText = "Feature request received!";

    setStatusMsg(`✓ ${confirmText}`);
    setFormText("");
    setActiveModal(null);

    setTimeout(() => setStatusMsg(""), 3000);
  };

  return (
    <div className="help-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="help-title">Help & Support</h1>
      <p className="help-subtitle">
        Find quick answers, contact our support team, or suggest new features for Gapviz.
      </p>

      {statusMsg && <div className="help-status-toast">{statusMsg}</div>}

      <div className="help-card">
        
        {/* --- SECTION 1: SUPPORT ACTIONS --- */}
        <h2 className="help-section-heading">Get Assistance</h2>

        <div
          className="help-row hover-box help-clickable"
          onClick={() => setActiveModal("contact")}
        >
          <div className="help-info">
            <span className="help-label">Contact Support</span>
            <span className="help-desc">Reach out directly to our dedicated customer support team.</span>
          </div>
          <span className="help-arrow">→</span>
        </div>

        <div
          className="help-row hover-box help-clickable"
          onClick={() => setActiveModal("problem")}
        >
          <div className="help-info">
            <span className="help-label">Report a Problem</span>
            <span className="help-desc">Encountered a bug or playback glitch? Let us know.</span>
          </div>
          <span className="help-arrow">→</span>
        </div>

        <div
          className="help-row hover-box help-clickable"
          onClick={() => setActiveModal("feature")}
        >
          <div className="help-info">
            <span className="help-label">Feature Request</span>
            <span className="help-desc">Suggest new DJ capabilities or UI tools for upcoming builds.</span>
          </div>
          <span className="help-arrow">→</span>
        </div>

        <div
          className="help-row hover-box help-clickable"
          onClick={() => setActiveModal("whatsNew")}
        >
          <div className="help-info">
            <span className="help-label">What's New</span>
            <span className="help-desc">Explore recent release updates, bug fixes, and feature highlights.</span>
          </div>
          <span className="help-arrow">→</span>
        </div>

        {/* --- SECTION 2: FREQUENTLY ASKED QUESTIONS --- */}
        <h2 className="help-section-heading">Frequently Asked Questions</h2>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className={`help-row hover-box faq-item ${isOpen ? "faq-open" : ""}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="help-info">
                  <div className="faq-header">
                    <span className="help-label">{faq.question}</span>
                    <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
                  </div>
                  {isOpen && <p className="faq-answer">{faq.answer}</p>}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* --- FORM & INFO MODALS --- */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {activeModal === "whatsNew" ? (
              <>
                <h3 className="modal-title">What's New in Gapviz</h3>
                <div className="whats-new-body">
                  <p><strong>v1.2.0 - Multi-lingual & Appearance Scaling</strong></p>
                  <ul>
                    <li>Integrated global react-i18next translation engine.</li>
                    <li>Added high-contrast dark mode aesthetics with red border highlights.</li>
                    <li>Enhanced Smart DJ voice command recognition.</li>
                    <li>Synchronized avatar notification badge states.</li>
                  </ul>
                </div>
                <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <h3 className="modal-title">
                  {activeModal === "contact" && "Contact Support"}
                  {activeModal === "problem" && "Report a Problem"}
                  {activeModal === "feature" && "Request a Feature"}
                </h3>
                <p className="modal-desc">
                  {activeModal === "contact" && "How can we help you today? Enter your inquiry below."}
                  {activeModal === "problem" && "Please describe the bug or issue you encountered."}
                  {activeModal === "feature" && "Describe the feature or DJ command you would like to see."}
                </p>
                <textarea
                  className="modal-textarea"
                  rows="4"
                  placeholder="Type your message here..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  required
                ></textarea>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setActiveModal(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-submit-btn">
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}