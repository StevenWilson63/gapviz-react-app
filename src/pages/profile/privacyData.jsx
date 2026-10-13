import React, { useState, useEffect } from "react";
import "./privacyData.css";
import { useNavigate } from "react-router-dom";

export default function PrivacyData() {
  const navigate = useNavigate();

  // Preferences State
  const [useListeningForDJ, setUseListeningForDJ] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(false);
  const [allowAITraining, setAllowAITraining] = useState(false);
  const [essentialCookiesOnly, setEssentialCookiesOnly] = useState(true);

  // Status indicators
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gv_privacy") || "{}");
      if (stored.useListeningForDJ !== undefined) setUseListeningForDJ(stored.useListeningForDJ);
      if (stored.allowAnalytics !== undefined) setAllowAnalytics(stored.allowAnalytics);
      if (stored.allowAITraining !== undefined) setAllowAITraining(stored.allowAITraining);
      if (stored.essentialCookiesOnly !== undefined) setEssentialCookiesOnly(stored.essentialCookiesOnly);
    } catch (e) {
      console.error("Failed to load privacy settings", e);
    }
  }, []);

  const saveSettings = (updates) => {
    const current = {
      useListeningForDJ,
      allowAnalytics,
      allowAITraining,
      essentialCookiesOnly,
      ...updates,
    };
    localStorage.setItem("gv_privacy", JSON.stringify(current));
    triggerFeedback("Preferences updated");
  };

  const triggerFeedback = (msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 2500);
  };

  const handleDownloadData = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      triggerFeedback("✓ Data package download started (.json)");
    }, 1500);
  };

  const handleDeleteAccount = () => {
    triggerFeedback("Account deletion requested. Check your email to confirm.");
    setShowDeleteConfirm(false);
  };

  return (
    <div className="privacy-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="privacy-title">Privacy & Data</h1>
      <p className="privacy-subtitle">
        Manage how Gapviz handles your listening history, AI processing, and personal data.
      </p>

      <div className="privacy-card">
        
        {/* --- SECTION 1: DATA USE --- */}
        <h2 className="privacy-section-heading">Data Usage & Personalization</h2>

        <div className="privacy-row hover-box">
          <div className="privacy-info">
            <span className="privacy-label">DJ Commentary Insights</span>
            <span className="privacy-desc">
              Allow Gapviz to analyze your listening history to customize automated DJ commentary.
            </span>
          </div>
          <button
            type="button"
            className={`privacy-toggle-btn ${useListeningForDJ ? "active" : ""}`}
            onClick={() => {
              const newVal = !useListeningForDJ;
              setUseListeningForDJ(newVal);
              saveSettings({ useListeningForDJ: newVal });
            }}
          >
            {useListeningForDJ ? "Allowed" : "Off"}
          </button>
        </div>

        <div className="privacy-row hover-box">
          <div className="privacy-info">
            <span className="privacy-label">Usage Telemetry & Analytics</span>
            <span className="privacy-desc">
              Share anonymous crash reports and feature usage metrics to help us improve performance.
            </span>
          </div>
          <button
            type="button"
            className={`privacy-toggle-btn ${allowAnalytics ? "active" : ""}`}
            onClick={() => {
              const newVal = !allowAnalytics;
              setAllowAnalytics(newVal);
              saveSettings({ allowAnalytics: newVal });
            }}
          >
            {allowAnalytics ? "Opted In" : "Opted Out"}
          </button>
        </div>

        <div className="privacy-row hover-box">
          <div className="privacy-info">
            <span className="privacy-label">AI Model Training</span>
            <span className="privacy-desc">
              Allow anonymized commentary feedback to refine future AI recommendation models.
            </span>
          </div>
          <button
            type="button"
            className={`privacy-toggle-btn ${allowAITraining ? "active" : ""}`}
            onClick={() => {
              const newVal = !allowAITraining;
              setAllowAITraining(newVal);
              saveSettings({ allowAITraining: newVal });
            }}
          >
            {allowAITraining ? "Allowed" : "Disabled"}
          </button>
        </div>

        {/* --- SECTION 2: STORAGE & COOKIES --- */}
        <h2 className="privacy-section-heading">Storage & Tracking</h2>

        <div className="privacy-row hover-box">
          <div className="privacy-info">
            <span className="privacy-label">Essential Storage Only</span>
            <span className="privacy-desc">
              Restrict browser storage to core functional tokens and local preferences.
            </span>
          </div>
          <button
            type="button"
            className={`privacy-toggle-btn ${essentialCookiesOnly ? "active" : ""}`}
            onClick={() => {
              const newVal = !essentialCookiesOnly;
              setEssentialCookiesOnly(newVal);
              saveSettings({ essentialCookiesOnly: newVal });
            }}
          >
            {essentialCookiesOnly ? "Strict" : "Standard"}
          </button>
        </div>

        <div className="privacy-row privacy-info-row">
          <div className="privacy-info">
            <span className="privacy-label">Audio Sample Retention</span>
            <span className="privacy-desc">
              Short audio samples captured during track recognition are processed in real-time and immediately discarded. No audio recordings are permanently saved.
            </span>
          </div>
        </div>

        {/* --- SECTION 3: YOUR RIGHTS & EXPORT --- */}
        <h2 className="privacy-section-heading">Data Control & Account</h2>

        <div className="privacy-row hover-box">
          <div className="privacy-info">
            <span className="privacy-label">Download My Data</span>
            <span className="privacy-desc">
              Export a complete archive of your saved profile, identification log, and settings (.json).
            </span>
          </div>
          <button
            type="button"
            className="privacy-action-btn"
            onClick={handleDownloadData}
            disabled={downloading}
          >
            {downloading ? "Preparing..." : "Export Data"}
          </button>
        </div>

        <div className="privacy-row danger-zone hover-box">
          <div className="privacy-info">
            <span className="privacy-label danger-text">Delete Account & Data</span>
            <span className="privacy-desc">
              Permanently wipe your account, commentary history, and personal references.
            </span>
          </div>
          <button
            type="button"
            className="privacy-danger-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        </div>

        {/* --- SECTION 4: LEGAL --- */}
        <h2 className="privacy-section-heading">Legal & Compliance</h2>
        <div className="privacy-links">
          <a href="#privacy-policy" onClick={(e) => e.preventDefault()} className="privacy-link">
            Privacy Policy
          </a>
          <span className="privacy-link-sep">•</span>
          <a href="#terms" onClick={(e) => e.preventDefault()} className="privacy-link">
            Terms of Service
          </a>
          <span className="privacy-link-sep">•</span>
          <a href="#licenses" onClick={(e) => e.preventDefault()} className="privacy-link">
            Third-Party Licenses
          </a>
        </div>

        {statusMsg && <div className="privacy-status-toast">{statusMsg}</div>}

      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="danger-text">Confirm Account Deletion</h3>
            <p>
              This action is permanent and cannot be undone. All your saved tracks, preferences, and personal data will be completely deleted.
            </p>
            <div className="modal-actions">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="modal-confirm-danger-btn"
                onClick={handleDeleteAccount}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}