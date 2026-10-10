import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Subscription.module.css";

export default function Subscription() {
  const navigate = useNavigate();

  // Current active plan state ('free', 'plus', or 'premium')
  const [currentPlan, setCurrentPlan] = useState("free");

  // Read region selected at login (defaults to GB/£)
  const [userRegion] = useState(() => localStorage.getItem("gapviz_region") || "GB");

  // Regional currency symbols
  const currencySymbols = {
    GB: "£",
    US: "$",
    EU: "€"
  };

  const symbol = currencySymbols[userRegion] || currencySymbols.GB;

  // Regional pricing data (Annual emphasized first)
  const pricingData = {
    free: {
      yearly: `${symbol}0`,
      monthly: `${symbol}0`
    },
    plus: {
      yearly: `${symbol}25`,
      monthly: `${symbol}2.99`
    },
    premium: {
      yearly: `${symbol}48`,
      monthly: `${symbol}4.99`
    }
  };

  // Lemon Squeezy Checkout Handler
  const handleLemonSqueezyCheckout = (tierName) => {
    const checkoutUrl = `https://app.lemonsqueezy.com/buy/placeholder-${tierName.toLowerCase()}`;
    window.open(checkoutUrl, "_blank");
  };

  return (
    <div className={styles["subscription-screen"]}>
      {/* Back to Profile Button */}
      <button className={styles["back-profile-btn"]} onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className={styles["subscription-title"]}>Subscription</h1>
      <p className={styles["subscription-subtitle"]}>
        Manage your membership tier, regional billing currency, and commentary access.
      </p>

      {/* Solid Red Current Membership Plan Banner */}
      <div className={styles["status-banner-solid"]}>
        <div>
          <span className={styles["status-label"]}>Current Membership Plan</span>
          <div className={styles["status-value"]}>
            {currentPlan === "free" && (
              <>
                Gapviz Free <span className={styles["badge-white"]}>Active</span>
              </>
            )}
            {currentPlan === "plus" && (
              <>
                Gapviz Plus <span className={styles["badge-white"]}>Active</span>
              </>
            )}
            {currentPlan === "premium" && (
              <>
                Gapviz Premium <span className={styles["badge-white"]}>Active</span>
              </>
            )}
          </div>
        </div>

        {/* Renewal Date aligned to far right */}
        <div className={styles["status-renewal-box"]}>
          <span className={styles["renewal-label"]}>Next Renewal Date</span>
          <span className={styles["renewal-date"]}>12 Nov 2026</span>
        </div>
      </div>

      {/* Tier Selection Grid */}
      <div className={styles["subscription-grid"]}>
        
        {/* Tier 1: Free */}
        <div className={`${styles["tier-card"]} ${styles["hover-box"]}`}>
          <h2 className={styles["tier-name"]}>Free</h2>
          <p className={styles["tier-desc"]}>
            Essential music streaming with daily commentary limits.
          </p>
          <div className={styles["price-container-stack"]}>
            <div className={styles["price-primary"]}>
              <span className={styles["yearly-amount"]}>{pricingData.free.yearly}</span>
              <span className={styles["yearly-period"]}>/ year</span>
            </div>
            <span className={styles["monthly-subtext"]}>or {pricingData.free.monthly} / month</span>
          </div>
          <div className={styles["renewal-info"]}>Renewal date: 12 Nov 2026</div>
          <ul className={styles["feature-list"]}>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> 5 text commentaries per day only
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Basic music commentary
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> 1 DJ Persona
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

        {/* Tier 2: Plus */}
        <div className={`${styles["tier-card"]} ${styles["hover-box"]}`}>
          <h2 className={styles["tier-name"]}>Plus</h2>
          <p className={styles["tier-desc"]}>
            Unlimited text commentary with expanded DJ options.
          </p>
          <div className={styles["price-container-stack"]}>
            <div className={styles["price-primary"]}>
              <span className={styles["yearly-amount"]}>{pricingData.plus.yearly}</span>
              <span className={styles["yearly-period"]}>/ year</span>
            </div>
            <span className={styles["monthly-subtext"]}>or {pricingData.plus.monthly} / month</span>
          </div>
          <div className={styles["renewal-info"]}>Renewal date: 12 Nov 2026</div>
          <ul className={styles["feature-list"]}>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Unlimited text only commentary
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Multi DJ Personas
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Enhanced music facts
            </li>
          </ul>
          {currentPlan === "plus" ? (
            <button className={styles["tier-current-btn"]} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={styles["tier-action-btn"]} 
              onClick={() => handleLemonSqueezyCheckout("Plus")}
            >
              Upgrade to Plus
            </button>
          )}
        </div>

        {/* Tier 3: Premium (Featured) */}
        <div className={`${styles["tier-card"]} ${styles["tier-card-featured"]} ${styles["hover-box"]}`}>
          <span className={styles["popular-tag"]}>Ultimate Experience</span>
          <h2 className={styles["tier-name"]}>Premium</h2>
          <p className={styles["tier-desc"]}>
            Full custom DJ studio with total control over commentary and voices.
          </p>
          <p className={styles["premium-tagline"]}>
            "Your music. Your DJ. Your way."
          </p>
          <div className={styles["price-container-stack"]}>
            <div className={styles["price-primary"]}>
              <span className={styles["yearly-amount"]}>{pricingData.premium.yearly}</span>
              <span className={styles["yearly-period"]}>/ year</span>
            </div>
            <span className={styles["monthly-subtext"]}>or {pricingData.premium.monthly} / month</span>
          </div>
          <div className={styles["renewal-info"]}>Renewal date: 12 Nov 2026</div>
          <ul className={styles["feature-list"]}>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Access to all DJ personas
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Access to all DJ voices
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Create fully custom DJs
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Control commentary length
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Control DJ style and personality
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Control DJ delivery and tone
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Access deeper music insights and stories
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> Access Album mode
            </li>
            <li className={styles["feature-item"]}>
              <span className={styles["check-icon"]}>✓</span> The most detailed facts and commentary available
            </li>
          </ul>
          {currentPlan === "premium" ? (
            <button className={styles["tier-current-btn"]} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={`${styles["tier-action-btn"]} ${styles["tier-action-btn-featured"]}`} 
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