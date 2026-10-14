import React, { useState, useEffect } from "react";
import "./dj.css";
import { useNavigate } from "react-router-dom";

export default function YourDjs() {
  const navigate = useNavigate();

  // Form State
  const [selectedDj, setSelectedDj] = useState("the-curator");
  const [commentaryLength, setCommentaryLength] = useState("standard");
  const [historicalDepth, setHistoricalDepth] = useState("fact-focused");
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gv_djSettings") || "{}");
    if (stored.selectedDj) setSelectedDj(stored.selectedDj);
    if (stored.commentaryLength) setCommentaryLength(stored.commentaryLength);
    if (stored.historicalDepth) setHistoricalDepth(stored.historicalDepth);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      selectedDj,
      commentaryLength,
      historicalDepth,
    };
    localStorage.setItem("gv_djSettings", JSON.stringify(settings));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handlePreviewVoice = () => {
    alert("Playing voice preview sample...");
  };

  return (
    <div className="your-djs-screen">
      {/* UNIFIED HEADER & BACK BUTTON */}
      <div className="your-djs-header-wrapper">
        <div>
          <h1 className="your-djs-title">Your DJs</h1>
          <p className="your-djs-subtitle">Customize your virtual DJ personas, voice styles, and commentary depth.</p>
        </div>
        <button className="back-profile-btn" onClick={() => navigate("/profile")}>
          ← Back to Profile
        </button>
      </div>

      <form className="your-djs-container" onSubmit={handleSave}>

        {/* 1. PREMIUM BANNER */}
        <div className="premium-banner hover-box">
          <div className="premium-text">
            <span className="lock-icon">🔒</span>
            <div className="premium-info">
              <strong>Premium Feature:</strong> Upgrade to customize advanced DJ personas & depth.
            </div>
          </div>
          <button 
            type="button" 
            className="upgrade-btn"
            onClick={() => navigate("/profile/subscription")}
          >
            Upgrade
          </button>
        </div>

        {/* 2. DEFAULT DJ PERSONA */}
        <div className="dj-card-box hover-box">
          <label className="dj-box-label">Default DJ Persona</label>
          <select 
            className="dj-dropdown-input"
            value={selectedDj}
            onChange={(e) => setSelectedDj(e.target.value)}
          >
            <option value="the-rock-jock">The Rock Jock (Energetic, Punchy, Drama)</option>
            <option value="the-curator">The Curator (Calm, Intelligent, Documentary Style)</option>
            <option value="the-cool-friend">The Cool Friend (Relaxed, Conversational, Dry Humour)</option>
            <option value="late-night-spinner">Late Night Spinner (Smooth, Atmospheric, Poetic)</option>
          </select>
        </div>

        {/* 3. VOICE PERSONA PREVIEW */}
        <div className="dj-card-box voice-preview-card hover-box">
          <div className="voice-preview-info">
            <span className="dj-box-label">Voice Persona Preview</span>
            <p className="voice-preview-sub">
              Listen to a sample of your selected DJ's voice model.
            </p>
          </div>
          <button 
            type="button" 
            className="preview-voice-btn hover-box"
            onClick={handlePreviewVoice}
          >
            ▶<br />Preview<br />Voice
          </button>
        </div>

        {/* 4. COMMENTARY LENGTH */}
        <div className="dj-card-box hover-box">
          <label className="dj-box-label">Commentary Length</label>
          
          <div className="radio-options-group">
            <label className="radio-option">
              <input 
                type="radio" 
                name="commentaryLength" 
                value="short" 
                checked={commentaryLength === "short"}
                onChange={(e) => setCommentaryLength(e.target.value)}
              />
              <span className="radio-text">Short (Quick Fact)</span>
            </label>

            <label className="radio-option">
              <input 
                type="radio" 
                name="commentaryLength" 
                value="standard" 
                checked={commentaryLength === "standard"}
                onChange={(e) => setCommentaryLength(e.target.value)}
              />
              <span className="radio-text">Standard (Balanced)</span>
            </label>

            <label className="radio-option">
              <input 
                type="radio" 
                name="commentaryLength" 
                value="deep" 
                checked={commentaryLength === "deep"}
                onChange={(e) => setCommentaryLength(e.target.value)}
              />
              <span className="radio-text">Deep Dive (Full Story)</span>
            </label>
          </div>
        </div>

        {/* 5. TONE & HISTORICAL DEPTH */}
        <div className="dj-card-box hover-box">
          <label className="dj-box-label">Tone & Historical Depth</label>
          <select 
            className="dj-dropdown-input"
            value={historicalDepth}
            onChange={(e) => setHistoricalDepth(e.target.value)}
          >
            <option value="fact-focused">Fact-Focused (MusicBrainz / Acoustics)</option>
            <option value="anecdotal">Anecdotal & Studio Stories</option>
            <option value="chart-focused">Chart History & Cultural Context</option>
          </select>
        </div>

        {/* 6. SAVE BUTTON */}
        <button className="save-dj-btn hover-box" type="submit">
          Save DJ Preferences
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Preferences Saved</div>
        )}

      </form>
    </div>
  );
}