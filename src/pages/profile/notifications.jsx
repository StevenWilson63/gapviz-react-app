import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './notifications.css';

export default function NotificationsScreen() {
  const navigate = useNavigate();

  // State management for notification preferences
  const [settings, setSettings] = useState({
    pushNotifications: true,
    featureAnnouncements: true,
    subscriptionReminders: true,
    marketingEmails: false,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="profile-subscreen-container">
      {/* Header */}
      <div className="subscreen-header">
        <button 
          className="back-button" 
          onClick={() => navigate(-1)}
          aria-label="Back to Profile"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1>Notifications</h1>
      </div>

      <p className="subscreen-subtitle">
        Manage how and when we keep you updated about your account and activity.
      </p>

      {/* Notification Preferences Cards */}
      <div className="settings-cards-list">
        
        {/* Push Notifications Master Toggle */}
        <div className="setting-card-row">
          <div className="setting-info">
            <span className="setting-title">Push Notifications</span>
            <span className="setting-desc">Master toggle for all app push notifications.</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.pushNotifications} 
              onChange={() => handleToggle('pushNotifications')} 
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* New Feature Announcements */}
        <div className="setting-card-row">
          <div className="setting-info">
            <span className="setting-title">New Feature Announcements</span>
            <span className="setting-desc">Get notified about updates, drops, and new tool releases.</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.featureAnnouncements} 
              onChange={() => handleToggle('featureAnnouncements')} 
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* Subscription Reminders */}
        <div className="setting-card-row">
          <div className="setting-info">
            <span className="setting-title">Subscription Reminders</span>
            <span className="setting-desc">Alerts for renewal dates, trials ending, and billing updates.</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.subscriptionReminders} 
              onChange={() => handleToggle('subscriptionReminders')} 
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* Marketing Email Opt-In */}
        <div className="setting-card-row">
          <div className="setting-info">
            <span className="setting-title">Marketing Email Opt-In</span>
            <span className="setting-desc">Receive exclusive offers, tips, and promotional updates via email.</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.marketingEmails} 
              onChange={() => handleToggle('marketingEmails')} 
            />
            <span className="slider round"></span>
          </label>
        </div>

      </div>
    </div>
  );
}