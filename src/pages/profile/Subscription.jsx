import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Subscription.css";

export default function Subscription() {
  const navigate = useNavigate();

  // Current active plan state ('free', 'plus', or 'premium')
  const [currentPlan, setCurrentPlan] = useState("free");

  // Read region selected at login (defaults to GB/£ if not set)
  const [userRegion] = useState(() => localStorage.getItem("gapviz_region") || "GB");

  // Regional pricing mapping
  const currencyData = {
    GB: { symbol: "£", plus: "4.99", premium: "12.99" },
    US: { symbol: "$", plus: "5.99", premium: "14.99" },
    EU: { symbol: "€", plus: "5.99", premium: "13.99" }
  };

  const currency = currencyData[userRegion] || currencyData.GB;

  // Lemon Squeezy Checkout Handler
  const handleLemonSqueezyCheckout = (tierName) => {
    // Placeholder URL until Lemon Squeezy account setup is complete
    const checkoutUrl = `https://app.lemonsqueezy.com/buy/placeholder-${tierName.toLowerCase()}`;
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className="subscription-screen">
      {/* Back to Profile Button matching Account page */}
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="subscription-title">Subscription</h1>
      <p className="subscription-subtitle">
        Manage your membership tier, regional billing currency, and commentary access.
      </p>

      {/* Active Membership Banner */}
      <div className="status-banner">
        <div>
          <span className="status-label">Current Membership Plan</span>
          <div className="status-value">
            {currentPlan === "free" && (
              <>
                Gapviz Free <span className="badge-free">Active</span>
              </>
            )}
            {currentPlan === "plus" && (
              <>
                Gapviz Plus <span className="badge-active">Active</span>
              </>
            )}
            {currentPlan === "premium" && (
              <>
                Gapviz Premium <span className="badge-active">Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tier Selection Grid */}
      <div className="subscription-grid">
        
        {/* Tier 1: Free */}
        <div className="tier-card hover-box">
          <h2 className="tier-name">Free</h2>
          <p className="tier-desc">
            Essential music streaming with general knowledge commentary.
          </p>
          <div className="price-container">
            <span className="price">{currency.symbol}0</span>
            <span className="period">/ month</span>
          </div>
          <div className="renewal-info">Permanent free tier</div>
          <ul className="feature-list">
            <li className="feature-item">
              <span className="check-icon">✓</span> Continuous uninterrupted music
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Standard music history commentary
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Basic multilingual voices
            </li>
          </ul>
          {currentPlan === "free" ? (
            <button className="tier-current-btn" disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className="tier-action-btn" 
              onClick={() => setCurrentPlan("free")}
            >
              Downgrade
            </button>
          )}
        </div>

        {/* Tier 2: Plus (Featured) */}
        <div className="tier-card tier-card-featured hover-box">
          <span className="popular-tag">Most Popular</span>
          <h2 className="tier-name">Plus</h2>
          <p className="tier-desc">
            Deep-dive trivia, custom commentary frequency, and expanded language options.
          </p>
          <div className="price-container">
            <span className="price">{currency.symbol}{currency.plus}</span>
            <span className="period">/ month</span>
          </div>
          <div className="renewal-info">
            {currentPlan === "plus" ? "Renews on Nov 12, 2026" : "Billed monthly via Lemon Squeezy"}
          </div>
          <ul className="feature-list">
            <li className="feature-item">
              <span className="check-icon">✓</span> Everything in Free
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Detailed artist trivia & cultural context
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Full Voicedeck multilingual narration
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Customizable commentary frequency
            </li>
          </ul>
          {currentPlan === "plus" ? (
            <button className="tier-current-btn" disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className="tier-action-btn tier-action-btn-featured" 
              onClick={() => handleLemonSqueezyCheckout("Plus")}
            >
              Upgrade to Plus
            </button>
          )}
        </div>

        {/* Tier 3: Premium */}
        <div className="tier-card hover-box">
          <h2 className="tier-name">Premium</h2>
          <p className="tier-desc">
            Advanced tools for power listeners, station curators, and professional narration creators.
          </p>
          <div className="price-container">
            <span className="price">{currency.symbol}{currency.premium}</span>
            <span className="period">/ month</span>
          </div>
          <div className="renewal-info">
            {currentPlan === "premium" ? "Renews on Nov 12, 2026" : "Billed monthly via Lemon Squeezy"}
          </div>
          <ul className="feature-list">
            <li className="feature-item">
              <span className="check-icon">✓</span> Everything in Plus
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Gapviz Studio & Voicedeck integration
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> Custom narration scheduling
            </li>
            <li className="feature-item">
              <span className="check-icon">✓</span> High-definition audio playback
            </li>
          </ul>
          {currentPlan === "premium" ? (
            <button className="tier-current-btn" disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className="tier-action-btn" 
              onClick={() => handleLemonSqueezyCheckout("Premium")}
            >
              Upgrade to Premium
            </button>
          )}
        </div>

      </div>
    </div>
  );
}