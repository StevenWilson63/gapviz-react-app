import React, { useState } from "react";
import "./dj.css";
import { useNavigate } from "react-router-dom";

export function DjSettings() {
  const navigate = useNavigate();

  // Mock state for user DJ preferences
  const [selectedPersona, setSelectedPersona] = useState("The Vinyl Archivist");
  const [commentaryLength, setCommentaryLength] = useState("Standard");
  const [tone, setTone] = useState("Fact-Focused");
  const [depth, setDepth] = useState("Deep Historical Context");
  const [isPremiumUser] = useState(false); // Change to true to test unlocked state
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const previewVoice = () => {
    const text = `Hi, I'm ${selectedPersona}. Ready to dive deep into the liner notes?`;
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="dj-settings-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="dj-title">Your DJs & Commentary</h1>
      <p className="dj-subtitle">Configure your default DJ persona, voice, and analytical depth.</p>

      <form className="dj-card" onSubmit={handleSave}>
        
        {/* PREMIUM LOCK OVERLAY BANNER IF NOT PREMIUM */}
        {!isPremiumUser && (
          <div className="premium-lock-banner">
            <span>🔒 Premium Feature: Upgrade to customize advanced DJ personas & depth.</span>
            <button type="button" onClick={() => navigate("/profile/subscription")}>
              Upgrade
            </button>
          </div>
        )}

        {/* DEFAULT DJ PERSONA */}
        <div className={`dj-field hover-box ${!isPremiumUser ? "locked-field" : ""}`}>
          <label>Default DJ Persona</label>
          <select 
            value={selectedPersona} 
            onChange={(e) => setSelectedPersona(e.target.value)}
            disabled={!isPremiumUser}
          >
            <option value="The Vinyl Archivist">The Vinyl Archivist (Calm, Fact-Dense)</option>
            <option value="Late Night Selector">Late Night Selector (Warm, Ambient, Story-Driven)</option>
            <option value="Indie Musicologist">Indie Musicologist (Energetic, Trivia-Heavy)</option>
          </select>
        </div>

        {/* VOICE PREVIEW */}
        <div className="dj-field hover-box voice-preview-row">
          <div>
            <label>Voice Persona Preview</label>
            <p className="field-hint">Listen to a sample of your selected DJ's voice model.</p>
          </div>
          <button type="button" className="preview-btn hover-box" onClick={previewVoice}>
            ▶️ Preview Voice
          </button>
        </div>

        {/* COMMENTARY LENGTH */}
        <div className="dj-field hover-box">
          <label>Commentary Length</label>
          <div className="radio-group">
            {["Short (Quick Fact)", "Standard (Balanced)", "Deep Dive (Full Story)"].map((len) => (
              <label key={len} className={`radio-label ${commentaryLength === len ? "active" : ""}`}>
                <input 
                  type="radio" 
                  name="length" 
                  checked={commentaryLength === len} 
                  onChange={() => setCommentaryLength(len)} 
                />
                {len}
              </label>
            ))}
          </div>
        </div>

        {/* TONE & DEPTH SETTINGS */}
        <div className="dj-field hover-box">
          <label>Tone & Historical Depth</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="Fact-Focused">Fact-Focused (MusicBrainz / AcoustID Verified)</option>
            <option value="Conversational">Conversational & Narrative</option>
            <option value="Technical">Technical & Production-Focused (Studio & Gear)</option>
          </select>
        </div>

        {/* SAVE BUTTON */}
        <button className="dj-save hover-box" type="submit">
          Save DJ Preferences
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Preferences Saved</div>
        )}

      </form>
    </div>
  );
}

export default DjSettings;