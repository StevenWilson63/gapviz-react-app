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

  // Status indicators & modals
  const [downloading, setDownloading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState(null); // 'privacy' | 'terms' | 'licenses' | null
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

        <div className="privacy-row hover-box">
          <div className="privacy-info">
            <span className="privacy-label">Audio Sample Retention</span>
            <span className="privacy-desc">
              Short audio samples captured during track recognition are processed in real-time and immediately discarded. No raw audio is permanently saved.
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

        {/* --- SECTION 4: LEGAL & COMPLIANCE --- */}
        <h2 className="privacy-section-heading">Legal & Compliance</h2>

        <div
          className="privacy-row hover-box legal-clickable"
          onClick={() => setActiveLegalModal("privacy")}
        >
          <div className="privacy-info">
            <span className="privacy-label">Privacy Policy</span>
            <span className="privacy-desc">View our full global data collection policies and GDPR compliance statement.</span>
          </div>
          <span className="legal-arrow">→</span>
        </div>

        <div
          className="privacy-row hover-box legal-clickable"
          onClick={() => setActiveLegalModal("terms")}
        >
          <div className="privacy-info">
            <span className="privacy-label">Terms of Service</span>
            <span className="privacy-desc">Review application usage guidelines, service level terms, and rights.</span>
          </div>
          <span className="legal-arrow">→</span>
        </div>

        <div
          className="privacy-row hover-box legal-clickable"
          onClick={() => setActiveLegalModal("licenses")}
        >
          <div className="privacy-info">
            <span className="privacy-label">Third-Party Licenses</span>
            <span className="privacy-desc">Open-source software attributions, audio libraries, and technology disclosures.</span>
          </div>
          <span className="legal-arrow">→</span>
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

      {/* Legal & Compliance Text Modals */}
      {activeLegalModal && (
        <div className="modal-overlay" onClick={() => setActiveLegalModal(null)}>
          <div className="modal-content legal-modal-body" onClick={(e) => e.stopPropagation()}>
            {activeLegalModal === "privacy" && (
              <>
                <h3>Privacy Policy</h3>
                <div className="legal-scroll-text">
                  <p><strong>1. Data Collection & Processing:</strong> Gapviz processes audio fingerprints in real time solely for track identification. Samples are not permanently stored.</p>
                  <p><strong>2. GDPR & Global Compliance:</strong> You reserve full rights to export or permanently delete your account data at any time via this settings panel.</p>
                  <p><strong>3. AI & Analytics:</strong> Usage data is strictly anonymized and used only for personalized DJ script commentary if explicitly authorized above.</p>
                </div>
              </>
            )}

            {activeLegalModal === "terms" && (
              <>
                <h3>Terms of Service</h3>
                <div className="legal-scroll-text">
                  <p><strong>1. Acceptance:</strong> By accessing Gapviz, you agree to adhere to these usage conditions and fair usage policies.</p>
                  <p><strong>2. Audio Identification:</strong> Commercial broadcast scanning is subject to licensing restrictions provided by integrated recognition providers.</p>
                  <p><strong>3. Account Usage:</strong> Subscriptions and free trial periods apply strictly to individual non-commercial use.</p>
                </div>
              </>
            )}

            {activeLegalModal === "licenses" && (
              <>
                <h3>Third-Party Licenses</h3>
                <div className="legal-scroll-text">
                  <p><strong>i18next / react-i18next:</strong> MIT License. Copyright (c) i18next.</p>
                  <p><strong>React / React Router:</strong> MIT License. Copyright (c) Meta Platforms, Inc.</p>
                  <p><strong>Acoustic Recognition Engine:</strong> Open-source and commercial audio processing integration modules.</p>
                </div>
              </>
            )}

            <button className="modal-cancel-btn full-width-btn" onClick={() => setActiveLegalModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}