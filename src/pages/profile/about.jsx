import React, { useState } from "react";
import "./about.css";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | 'attributions' | null

  const APP_VERSION = "1.2.0";
  const BUILD_NUMBER = "2026.10.14-rel";

  return (
    <div className="about-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="about-title">About Gapviz</h1>
      <p className="about-subtitle">
        Legal disclosures, platform attributions, and software build information.
      </p>

      <div className="about-card">
        
        {/* --- SECTION 1: LEGAL POLICIES --- */}
        <h2 className="about-section-heading">Legal</h2>

        <div
          className="about-row hover-box about-clickable"
          onClick={() => setActiveModal("terms")}
        >
          <div className="about-info">
            <span className="about-label">Terms of Service</span>
            <span className="about-desc">Application usage conditions, terms of service, and user rights.</span>
          </div>
          <span className="about-arrow">→</span>
        </div>

        <div
          className="about-row hover-box about-clickable"
          onClick={() => setActiveModal("privacy")}
        >
          <div className="about-info">
            <span className="about-label">Privacy Policy</span>
            <span className="about-desc">Statement on real-time acoustic identification and data protection.</span>
          </div>
          <span className="about-arrow">→</span>
        </div>

        {/* --- SECTION 2: ATTRIBUTIONS --- */}
        <h2 className="about-section-heading">Licenses & Attributions</h2>

        <div
          className="about-row hover-box about-clickable"
          onClick={() => setActiveModal("attributions")}
        >
          <div className="about-info">
            <span className="about-label">Third-Party Licenses</span>
            <span className="about-desc">
              Open-source software disclosures, open music metadata, and map data attributions.
            </span>
          </div>
          <span className="about-arrow">→</span>
        </div>

        {/* --- SECTION 3: SYSTEM METADATA --- */}
        <h2 className="about-section-heading">System Information</h2>

        <div className="about-row hover-box">
          <div className="about-info">
            <span className="about-label">App Version</span>
            <span className="about-desc">Current production release version</span>
          </div>
          <span className="about-badge">v{APP_VERSION}</span>
        </div>

        <div className="about-row hover-box">
          <div className="about-info">
            <span className="about-label">Build Number</span>
            <span className="about-desc">Internal client release identifier</span>
          </div>
          <span className="about-badge-sub">{BUILD_NUMBER}</span>
        </div>

        <div className="about-footer-text">
          <p>© 2026 Gapviz Inc. All rights reserved.</p>
          <p>Protected by international copyright & intellectual property laws.</p>
        </div>

      </div>

      {/* --- LEGAL MODALS --- */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content legal-modal-body" onClick={(e) => e.stopPropagation()}>
            
            {activeModal === "terms" && (
              <>
                <h3 className="modal-title">Terms of Service</h3>
                <div className="legal-scroll-text">
                  <p><strong>1. Service Overview:</strong> Gapviz provides real-time audio identification and automated commentary features.</p>
                  <p><strong>2. Fair Usage:</strong> Automated API access, reverse engineering, or unauthorized extraction of Gapviz features and commentary outputs is strictly prohibited.</p>
                  <p><strong>3. Intellectual Property:</strong> Track metadata, album artwork, and artist references remain the property of their respective copyright holders.</p>
                </div>
              </>
            )}

            {activeModal === "privacy" && (
              <>
                <h3 className="modal-title">Privacy Statement</h3>
                <div className="legal-scroll-text">
                  <p><strong>1. Audio Sample Processing:</strong> Audio samples processed during identification are converted to temporary acoustic signatures in volatile memory and immediately discarded. No raw audio recordings are stored.</p>
                 <p><strong>2. User Rights:</strong> You retain full rights to export or permanently delete your user account data at any time via Profile &gt; Privacy & Data.</p>
                </div>
              </>
            )}

            {activeModal === "attributions" && (
              <>
                <h3 className="modal-title">Third-Party Attributions</h3>
                <div className="legal-scroll-text">
                  <p><strong>Open Music Knowledge & Metadata:</strong> Music metadata and knowledge graph entries are incorporated in accordance with Creative Commons (CC BY-SA) and Open Database Licenses (ODbL).</p>
                  <p><strong>Audio Recognition Frameworks:</strong> Audio identification services and client frameworks (including ShazamKit where applicable) are utilized under standard provider terms.</p>
                  <p><strong>Map & Spatial Data:</strong> Map data © OpenStreetMap contributors, licensed under the Open Database License (ODbL).</p>
                  <p><strong>Software Frameworks:</strong> Built using open-source libraries under permissive MIT and BSD licenses.</p>
                </div>
              </>
            )}

            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}