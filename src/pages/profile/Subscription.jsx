import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Subscription.module.css";

export default function Subscription() {
  const navigate = useNavigate();

  // Current active plan state ('free', 'plus', or 'premium')
  const [currentPlan, setCurrentPlan] = useState("free");

  // Read region selected at login (defaults to GB/£)
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
    const checkoutUrl = `https://app.lemonsqueezy.com/buy/placeholder-${tierName.toLowerCase()}`;
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className={styles["subscription-screen"]}>
      {/* Back to Profile Button matching Account page */}
      <button className={styles["back-profile-btn"]} onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className={styles["subscription-title"]}>Subscription</h1>
      <p className={styles["subscription-subtitle"]}>
        Manage your membership tier, regional billing currency, and commentary access.
      </p>

      {/* Active Membership Banner with red border & hover glow */}
      <div className={`${styles["status-banner"]} ${styles["hover-box"]}`}>
        <div>
          <span className={styles["status-label"]}>Current Membership Plan</span>
          <div className={styles["status-value"]}>
            {currentPlan === "free" && (
              <>
                Gapviz Free <span className={styles["badge-free"]}>Active</span>
              </>
            )}
            {currentPlan === "plus" && (
              <>
                Gapviz Plus <span className={styles["badge-active"]}>Active</span>
              </>
            )}
            {currentPlan === "premium" && (
              <>
                Gapviz Premium <span className={styles["badge-active"]}>Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tier Selection Grid */}
      <div className={styles["subscription-grid"]}>
        
        {/* Tier 1: Free */}
        <div className={`${styles["tier-card"]} ${styles["hover-box"]}`}>
          <h2 className={styles["tier-name"]}>Free</h2>
          <p className={styles["tier-desc"]}>
            Essential music streaming with general knowledge commentary.
          </p>
          <div className={styles["price-container"]}>
            <span className={styles.price}>{currency.symbol}0</span>
            <span className={styles.period}>/ month</span>
          </div>
          <div className={styles["renewal-info"]}>Permanent free tier</div>
          <ul className={styles["feature-list"]}>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Continuous uninterrupted music
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Standard music history commentary
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Basic multilingual voices
            </li>
          </ul>
          {currentPlan === "free" ? (
            <button className={styles["tier-current-btn"]} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={styles["tier-action-btn"]} 
              onClick={() => setCurrentPlan("free")}
            >
              Downgrade
            </button>
          )}
        </div>

        {/* Tier 2: Plus (Featured) */}
        <div className={`${styles["tier-card"]} ${styles["tier-card-featured"]} ${styles["hover-box"]}`}>
          <span className={styles["popular-tag"]}>Most Popular</span>
          <h2 className={styles["tier-name"]}>Plus</h2>
          <p className={styles["tier-desc"]}>
            Deep-dive trivia, custom commentary frequency, and expanded language options.
          </p>
          <div className={styles["price-container"]}>
            <span className={styles.price}>{currency.symbol}{currency.plus}</span>
            <span className={styles.period}>/ month</span>
          </div>
          <div className={styles["renewal-info"]}>
            {currentPlan === "plus" ? "Renews on Nov 12, 2026" : "Billed monthly via Lemon Squeezy"}
          </div>
          <ul className={styles["feature-list"]}>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Everything in Free
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Detailed artist trivia & cultural context
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Full Voicedeck multilingual narration
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Customizable commentary frequency
            </li>
          </ul>
          {currentPlan === "plus" ? (
            <button className={styles["tier-current-btn"]} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={`${styles["tier-action-btn"]} ${styles["tier-action-btn-featured"]}`} 
              onClick={() => handleLemonSqueezyCheckout("Plus")}
            >
              Upgrade to Plus
            </button>
          )}
        </div>

        {/* Tier 3: Premium */}
        <div className={`${styles["tier-card"]} ${styles["hover-box"]}`}>
          <h2 className={styles["tier-name"]}>Premium</h2>
          <p className={styles["tier-desc"]}>
            Advanced tools for power listeners, station curators, and professional narration creators.
          </p>
          <div className={styles["price-container"]}>
            <span className={styles.price}>{currency.symbol}{currency.premium}</span>
            <span className={styles.period}>/ month</span>
          </div>
          <div className={styles["renewal-info"]}>
            {currentPlan === "premium" ? "Renews on Nov 12, 2026" : "Billed monthly via Lemon Squeezy"}
          </div>
          <ul className={styles["feature-list"]}>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Everything in Plus
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Gapviz Studio & Voicedeck integration
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Custom narration scheduling
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> High-definition audio playback
            </li>
          </ul>
          {currentPlan === "premium" ? (
            <button className={styles["tier-current-btn"]} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={styles["tier-action-btn"]} 
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