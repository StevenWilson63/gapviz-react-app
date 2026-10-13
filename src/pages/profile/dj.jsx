import React, { useState, useEffect } from "react";
import "./yourDjs.css";
import { useNavigate } from "react-router-dom";

export default function YourDjs() {
  const navigate = useNavigate();

  const [selectedDj, setSelectedDj] = useState("vinyl-archivist");
  const [commentaryLength, setCommentaryLength] = useState("medium");
  const [voiceTone, setVoiceTone] = useState("warm");
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gv_djSettings") || "{}");
    if (stored.selectedDj) setSelectedDj(stored.selectedDj);
    if (stored.commentaryLength) setCommentaryLength(stored.commentaryLength);
    if (stored.voiceTone) setVoiceTone(stored.voiceTone);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      selectedDj,
      commentaryLength,
      voiceTone,
    };
    localStorage.setItem("gv_djSettings", JSON.stringify(settings));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="your-djs-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="your-djs-title">Your DJs</h1>
      <p className="your-djs-subtitle">
        Choose your AI persona and customize how your music commentary is delivered.
      </p>

      <form className="your-djs-card" onSubmit={handleSave}>
        
        {/* DJ PERSONA SELECTION */}
        <div className="dj-section-label">Select DJ Persona</div>

        <div 
          className={`dj-option-card hover-box ${selectedDj === "vinyl-archivist" ? "selected" : ""}`}
          onClick={() => setSelectedDj("vinyl-archivist")}
        >
          <div className="dj-info">
            <span className="dj-name">The Vinyl Archivist</span>
            <span className="dj-description">Deep cuts, B-sides, liner notes, and recording studio history.</span>
          </div>
          <span className="dj-radio-dot">{selectedDj === "vinyl-archivist" ? "●" : "○"}</span>
        </div>

        <div 
          className={`dj-option-card hover-box ${selectedDj === "late-night-selector" ? "selected" : ""}`}
          onClick={() => setSelectedDj("late-night-selector")}
        >
          <div className="dj-info">
            <span className="dj-name">Late Night Selector</span>
            <span className="dj-description">Smooth, atmospheric vibes, electronic history, and mood curation.</span>
          </div>
          <span className="dj-radio-dot">{selectedDj === "late-night-selector" ? "●" : "○"}</span>
        </div>

        <div 
          className={`dj-option-card hover-box ${selectedDj === "chart-historian" ? "selected" : ""}`}
          onClick={() => setSelectedDj("chart-historian")}
        >
          <div className="dj-info">
            <span className="dj-name">Chart Historian</span>
            <span className="dj-description">Billboard milestones, record-breaking runs, and chart trivia.</span>
          </div>
          <span className="dj-radio-dot">{selectedDj === "chart-historian" ? "●" : "○"}</span>
        </div>

        {/* COMMENTARY SETTINGS */}
        <div className="dj-settings-group">
          <label className="dj-setting-label">Commentary Length</label>
          <select 
            className="dj-select-input hover-box"
            value={commentaryLength}
            onChange={(e) => setCommentaryLength(e.target.value)}
          >
            <option value="short">Short & Punchy (Quick Facts)</option>
            <option value="medium">Balanced (Standard Story)</option>
            <option value="deep">Deep Dive (Full Liner Notes)</option>
          </select>
        </div>

        <div className="dj-settings-group">
          <label className="dj-setting-label">Voice Tone</label>
          <select 
            className="dj-select-input hover-box"
            value={voiceTone}
            onChange={(e) => setVoiceTone(e.target.value)}
          >
            <option value="warm">Warm & Conversational</option>
            <option value="energetic">Upbeat & Energetic</option>
            <option value="laidback">Mellow & Laidback</option>
          </select>
        </div>

        {/* SAVE BUTTON */}
        <button className="your-djs-save hover-box" type="submit">
          Save Changes
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Preferences Saved</div>
        )}

      </form>
    </div>
  );
}