import React, { useState, useEffect } from "react";
import "./notifications.css";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [featureAnnouncements, setFeatureAnnouncements] = useState(true);
  const [subscriptionReminders, setSubscriptionReminders] = useState(true);
  const [marketingEmail, setMarketingEmail] = useState(false);

  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gv_notifications") || "{}");
      if (stored.pushNotifications !== undefined) setPushNotifications(stored.pushNotifications);
      if (stored.featureAnnouncements !== undefined) setFeatureAnnouncements(stored.featureAnnouncements);
      if (stored.subscriptionReminders !== undefined) setSubscriptionReminders(stored.subscriptionReminders);
      if (stored.marketingEmail !== undefined) setMarketingEmail(stored.marketingEmail);
    } catch (e) {
      console.error("Failed to load notifications from storage", e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      pushNotifications,
      featureAnnouncements,
      subscriptionReminders,
      marketingEmail,
      hasUnread: true,
    };
    localStorage.setItem("gv_notifications", JSON.stringify(settings));
    window.dispatchEvent(new Event("gv_notifications_updated"));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="notifications-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="notifications-title">Notifications</h1>
      <p className="notifications-subtitle">
        Manage your push alerts, feature updates, and subscription reminders.
      </p>

      <form className="notifications-card" onSubmit={handleSave}>
        
        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Push Notifications</span>
            <span className="service-desc">Receive real-time alerts on your device</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${pushNotifications ? "connected" : ""}`}
            onClick={() => setPushNotifications(!pushNotifications)}
          >
            {pushNotifications ? "On ✓" : "Off"}
          </button>
        </div>

        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">New Feature Announcements</span>
            <span className="service-desc">Get notified about new DJ personas and app updates</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${featureAnnouncements ? "connected" : ""}`}
            onClick={() => setFeatureAnnouncements(!featureAnnouncements)}
          >
            {featureAnnouncements ? "On ✓" : "Off"}
          </button>
        </div>

        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Subscription Reminders</span>
            <span className="service-desc">Alerts regarding trial expirations and billing renewals</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${subscriptionReminders ? "connected" : ""}`}
            onClick={() => setSubscriptionReminders(!subscriptionReminders)}
          >
            {subscriptionReminders ? "On ✓" : "Off"}
          </button>
        </div>

        <div className="service-row hover-box">
          <div className="service-info">
            <span className="service-name">Marketing Email Opt-in</span>
            <span className="service-desc">Receive occasional newsletters and curated playlists</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${marketingEmail ? "connected" : ""}`}
            onClick={() => setMarketingEmail(!marketingEmail)}
          >
            {marketingEmail ? "On ✓" : "Off"}
          </button>
        </div>

        <button className="notifications-save hover-box" type="submit">
          Save Changes
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Preferences Saved</div>
        )}

      </form>
    </div>
  );
}