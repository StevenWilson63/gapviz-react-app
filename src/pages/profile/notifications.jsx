import React, { useState, useEffect } from "react";
import "./notifications.css";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();

  // Notification Toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [featureAnnouncements, setFeatureAnnouncements] = useState(true);
  const [subscriptionReminders, setSubscriptionReminders] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Unread badge indicator state
  const [hasUnread, setHasUnread] = useState(true);

  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gv_notificationSettings") || "{}");
    if (stored.pushEnabled !== undefined) setPushEnabled(stored.pushEnabled);
    if (stored.featureAnnouncements !== undefined) setFeatureAnnouncements(stored.featureAnnouncements);
    if (stored.subscriptionReminders !== undefined) setSubscriptionReminders(stored.subscriptionReminders);
    if (stored.marketingOptIn !== undefined) setMarketingOptIn(stored.marketingOptIn);
    if (stored.hasUnread !== undefined) setHasUnread(stored.hasUnread);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      pushEnabled,
      featureAnnouncements,
      subscriptionReminders,
      marketingOptIn,
      hasUnread,
    };
    localStorage.setItem("gv_notificationSettings", JSON.stringify(settings));

    // Dispatch custom event so top nav / home avatar updates instantly
    window.dispatchEvent(new Event("gv_notifications_updated"));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleClearUnread = () => {
    setHasUnread(false);
    const stored = JSON.parse(localStorage.getItem("gv_notificationSettings") || "{}");
    stored.hasUnread = false;
    localStorage.setItem("gv_notificationSettings", JSON.stringify(stored));
    window.dispatchEvent(new Event("gv_notifications_updated"));
  };

  return (
    <div className="notifications-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="notifications-title">Notifications</h1>
      <p className="notifications-subtitle">
        Manage how and when Gapviz alerts you about features, updates, and subscriptions.
      </p>

      {hasUnread && (
        <div className="unread-banner hover-box">
          <span>🔔 You have unread announcements!</span>
          <button type="button" className="mark-read-btn" onClick={handleClearUnread}>
            Mark as Read
          </button>
        </div>
      )}

      <form className="notifications-card" onSubmit={handleSave}>
        
        {/* PUSH NOTIFICATIONS */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Push Notifications</span>
            <span className="service-desc">Allow real-time push notifications on this device</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${pushEnabled ? "connected" : ""}`}
            onClick={() => setPushEnabled(!pushEnabled)}
          >
            {pushEnabled ? "On ✓" : "Off"}
          </button>
        </div>

        {/* NEW FEATURE ANNOUNCEMENTS */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">New Feature Announcements</span>
            <span className="service-desc">Stay updated on new DJ personas, features, and engine updates</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${featureAnnouncements ? "connected" : ""}`}
            onClick={() => setFeatureAnnouncements(!featureAnnouncements)}
          >
            {featureAnnouncements ? "On ✓" : "Off"}
          </button>
        </div>

        {/* SUBSCRIPTION REMINDERS */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Subscription Reminders</span>
            <span className="service-desc">Alerts regarding trial expiration, renewals, and payment status</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${subscriptionReminders ? "connected" : ""}`}
            onClick={() => setSubscriptionReminders(!subscriptionReminders)}
          >
            {subscriptionReminders ? "On ✓" : "Off"}
          </button>
        </div>

        {/* MARKETING EMAIL OPT-IN */}
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Marketing Email Opt-in</span>
            <span className="service-desc">Receive occasional newsletters, offers, and curated playlists</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${marketingOptIn ? "connected" : ""}`}
            onClick={() => setMarketingOptIn(!marketingOptIn)}
          >
            {marketingOptIn ? "On ✓" : "Off"}
          </button>
        </div>

        {/* SAVE BUTTON */}
        <button className="notifications-save hover-box" type="submit">
          Save Preferences
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Preferences Saved</div>
        )}

      </form>
    </div>
  );
}