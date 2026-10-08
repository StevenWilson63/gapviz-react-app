import React, { useState } from 'react';
import styles from './Subscription.module.css';

// SVG Checkmark Icon
const CheckIcon = () => (
  <svg 
    className={styles.iconCheck} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function Subscription() {
  // Current plan state (Free by default)
  const [currentPlan, setCurrentPlan] = useState('free');

  const handleSelectPlan = (planKey) => {
    if (planKey === currentPlan) return;
    setCurrentPlan(planKey);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Subscription</h1>
        <p className={styles.subtitle}>
          Manage your membership and upgrade your music discovery commentary.
        </p>
      </header>

      {/* Active Membership Overview */}
      <div className={styles.statusBanner}>
        <div className={styles.statusInfo}>
          <span className={styles.statusLabel}>Current Membership Plan</span>
          <div className={styles.statusValue}>
            {currentPlan === 'free' && (
              <>
                Gapviz Standard <span className={styles.badgeFree}>Free</span>
              </>
            )}
            {currentPlan === 'plus' && (
              <>
                Gapviz Plus <span className={styles.badgePro}>Active</span>
              </>
            )}
            {currentPlan === 'pro' && (
              <>
                Gapviz Pro DJ <span className={styles.badgePro}>Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Options */}
      <div className={styles.grid}>
        
        {/* Tier 1: Free */}
        <div className={styles.card}>
          <h2 className={styles.planName}>Standard</h2>
          <p className={styles.planDesc}>
            Essential music streaming with general knowledge commentary.
          </p>
          <div className={styles.priceContainer}>
            <span className={styles.price}>£0</span>
            <span className={styles.period}>/ month</span>
          </div>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <CheckIcon /> Continuous uninterrupted music
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Standard music history commentary
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Basic multilingual voices
            </li>
          </ul>
          {currentPlan === 'free' ? (
            <button className={styles.btnCurrent} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={styles.btnSecondary} 
              onClick={() => handleSelectPlan('free')}
            >
              Downgrade
            </button>
          )}
        </div>

        {/* Tier 2: Gapviz Plus (Featured) */}
        <div className={styles.cardFeatured}>
          <span className={styles.popularTag}>Most Popular</span>
          <h2 className={styles.planName}>Plus</h2>
          <p className={styles.planDesc}>
            Deep-dive trivia, custom commentary frequency, and expanded language options.
          </p>
          <div className={styles.priceContainer}>
            <span className={styles.price}>£4.99</span>
            <span className={styles.period}>/ month</span>
          </div>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <CheckIcon /> Everything in Standard
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Detailed artist trivia & cultural context
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Full Voicedeck multilingual narration
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Customizable commentary frequency
            </li>
          </ul>
          {currentPlan === 'plus' ? (
            <button className={styles.btnCurrent} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={styles.btnPrimary} 
              onClick={() => handleSelectPlan('plus')}
            >
              Upgrade to Plus
            </button>
          )}
        </div>

        {/* Tier 3: Gapviz Pro DJ */}
        <div className={styles.card}>
          <h2 className={styles.planName}>Pro DJ</h2>
          <p className={styles.planDesc}>
            Advanced tools for DJs, station curators, and professional narration creators.
          </p>
          <div className={styles.priceContainer}>
            <span className={styles.price}>£12.99</span>
            <span className={styles.period}>/ month</span>
          </div>
          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <CheckIcon /> Everything in Plus
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Gapviz Studio & Voicedeck integration
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> Custom narration scheduling
            </li>
            <li className={styles.featureItem}>
              <CheckIcon /> High-definition audio playback
            </li>
          </ul>
          {currentPlan === 'pro' ? (
            <button className={styles.btnCurrent} disabled>
              Current Plan
            </button>
          ) : (
            <button 
              className={styles.btnSecondary} 
              onClick={() => handleSelectPlan('pro')}
            >
              Upgrade to Pro
            </button>
          )}
        </div>

      </div>
    </div>
  );
}