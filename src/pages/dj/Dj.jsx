import React, { useState } from "react";
import MobileFooter from "../../components/mobile-footer/MobileFooter";
import "./Dj.css";

export default function Dj() {
  // Navigation & Vault State
  const [activeTier, setActiveTier] = useState(1);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Saved DJ Profiles List (Mock Storage)
  const [savedDjs, setSavedDjs] = useState([
    { id: "p1", name: "The Curator", style: "Curator", gender: "Male", language: "UK Scottish", isPreset: true },
    { id: "p2", name: "The Cool Friend", style: "Cool", gender: "Male", language: "US West Coast", isPreset: true },
    { id: "p3", name: "The Rock Jock", style: "Rock", gender: "Male", language: "UK Scottish", isPreset: true },
    { id: "p4", name: "Late Night Spinner", style: "Late", gender: "Female", language: "US East Coast", isPreset: true },
    { id: "u1", name: "DJ Rude Boy (My Setup)", style: "Rock", gender: "Male", language: "UK Scottish", isPreset: false }
  ]);

  // Active DJ Identity
  const [activeDjId, setActiveDjId] = useState("u1");
  const [customDjName, setCustomDjName] = useState("DJ Rude Boy");
  const [selectedPersona, setSelectedPersona] = useState("Rock");
  const [gender, setGender] = useState("Male");
  const [language, setLanguage] = useState("UK Scottish");

  // User Profile Phonetics
  const [userName, setUserName] = useState("Steven");
  const [userPhonetic, setUserPhonetic] = useState("Stee-ven");

  // Dynamic Trait Sliders (Tier 2)
  const [energy, setEnergy] = useState(75);
  const [speed, setSpeed] = useState(1.0);
  const [depth, setDepth] = useState(50);
  const [formality, setFormality] = useState(40);
  const [focusStyle, setFocusStyle] = useState("Random");

  // "Also in this year..." Timeline Trivia Feature State (Tier 2)
  const [enableTimelineTrivia, setEnableTimelineTrivia] = useState(true);
  const [timelineFrequency, setTimelineFrequency] = useState(4); // Every 3-4 tracks

  // Trigger Toast Notifications
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Select Saved DJ Profile
  const handleSelectDj = (djId) => {
    const target = savedDjs.find((item) => item.id === djId);
    if (target) {
      setActiveDjId(target.id);
      setCustomDjName(target.name);
      setSelectedPersona(target.style);
      setGender(target.gender);
      setLanguage(target.language);
      triggerToast(`Loaded DJ Profile: "${target.name}"`);
    }
  };

  // Save or Overwrite DJ DNA Profile
  const handleSaveDj = () => {
    const existingIndex = savedDjs.findIndex((item) => item.id === activeDjId);

    if (existingIndex >= 0 && !savedDjs[existingIndex].isPreset) {
      // Overwrite existing user DJ
      const updated = [...savedDjs];
      updated[existingIndex] = {
        ...updated[existingIndex],
        name: customDjName,
        style: selectedPersona,
        gender: gender,
        language: language
      };
      setSavedDjs(updated);
      triggerToast(`Updated DJ DNA: "${customDjName}"`);
    } else {
      // Save as New DJ
      const newDj = {
        id: "u_" + Date.now(),
        name: customDjName || "My Custom DJ",
        style: selectedPersona,
        gender: gender,
        language: language,
        isPreset: false
      };
      setSavedDjs([...savedDjs, newDj]);
      setActiveDjId(newDj.id);
      triggerToast(`Saved New DJ: "${newDj.name}"`);
    }
  };

  // Delete User DJ
  const handleDeleteDj = (id) => {
    setSavedDjs(savedDjs.filter((item) => item.id !== id));
    if (activeDjId === id) {
      handleSelectDj("p3"); // Fallback to Rock Jock
    }
    triggerToast("Deleted DJ Profile from Vault");
  };

  // TTS Phonetic Sample
  const handlePlayPhoneticSample = () => {
    triggerToast(`▶ Kokoro TTS: "Hey ${userName}, welcome back to Gapviz!"`);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Hey ${userPhonetic || userName}, welcome back to Gapviz!`);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="dj-screen">
      {/* Toast Feedback */}
      {toastMessage && <div className="dj-toast">{toastMessage}</div>}

      {/* Header & Context Greeting Banner */}
      <div className="dj-header">
        <div className="dj-greeting-badge">
          <span>📻</span> Context Greeting Active
        </div>
        <h1>dj studio</h1>
        <p className="dj-subtitle">
          "Hey {userName}, good morning! Ready to jump back into Steve's Songs Playlist?"
        </p>
      </div>

      {/* 3-Tier Segmented Switcher */}
      <div className="dj-tier-switcher">
        <button
          className={`tier-tab-btn ${activeTier === 1 ? "active" : ""}`}
          onClick={() => setActiveTier(1)}
        >
          <span>Tier 1</span>
          <span className="tier-sub-label">Just Play</span>
        </button>

        <button
          className={`tier-tab-btn ${activeTier === 2 ? "active" : ""}`}
          onClick={() => setActiveTier(2)}
        >
          <span>Tier 2</span>
          <span className="tier-sub-label">Vibe Curator</span>
        </button>

        <button
          className={`tier-tab-btn ${activeTier === 3 ? "active" : ""}`}
          onClick={() => setActiveTier(3)}
        >
          <span>Tier 3</span>
          <span className="tier-sub-label">Studio Pro</span>
        </button>
      </div>

      {/* ================= TIER 1: JUST PLAY ================= */}
      {activeTier === 1 && (
        <div className="tier-content">
          {/* Active Preset Dropdown & Vault Trigger Bar */}
          <div className="dj-preset-vault-bar">
            <select
              className="vault-select"
              value={activeDjId}
              onChange={(e) => handleSelectDj(e.target.value)}
            >
              <optgroup label="Custom Saved DJs">
                {savedDjs
                  .filter((item) => !item.isPreset)
                  .map((dj) => (
                    <option key={dj.id} value={dj.id}>
                      ⭐ {dj.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Default Station Presets">
                {savedDjs
                  .filter((item) => item.isPreset)
                  .map((dj) => (
                    <option key={dj.id} value={dj.id}>
                      📻 {dj.name}
                    </option>
                  ))}
              </optgroup>
            </select>

            <button className="vault-btn" onClick={() => setIsVaultOpen(true)}>
              📁 DJ Vault
            </button>
          </div>

          {/* Persona Style Grid */}
          <div className="dj-card">
            <div className="dj-card-title">YOUR DJ STYLE</div>
            <div className="persona-grid">
              <div
                className={`persona-card ${selectedPersona === "Curator" ? "active" : ""}`}
                onClick={() => setSelectedPersona("Curator")}
              >
                <div className="persona-emoji">🎓</div>
                <h4>The Curator</h4>
                <p>Calm, intelligent, documentary style</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Cool" ? "active" : ""}`}
                onClick={() => setSelectedPersona("Cool")}
              >
                <div className="persona-emoji">😎</div>
                <h4>The Cool Friend</h4>
                <p>Relaxed, conversational, dry humor</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Rock" ? "active" : ""}`}
                onClick={() => setSelectedPersona("Rock")}
              >
                <div className="persona-emoji">🎸</div>
                <h4>The Rock Jock</h4>
                <p>Energetic, punchy, loves the drama</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Late" ? "active" : ""}`}
                onClick={() => setSelectedPersona("Late")}
              >
                <div className="persona-emoji">🌙</div>
                <h4>Late Night Spinner</h4>
                <p>Smooth, atmospheric, almost poetic</p>
              </div>
            </div>
          </div>

          {/* Voice Identity & Language Architecture */}
          <div className="dj-card">
            <div className="dj-card-title">
              VOICE IDENTITY & LANGUAGES
              <span className="sync-badge">✓ Two-Way Account Sync</span>
            </div>

            {/* Gender Toggle */}
            <div className="form-group">
              <label className="form-label">Voice Gender</label>
              <div className="gender-pill-group">
                <button
                  className={`gender-btn ${gender === "Male" ? "active" : ""}`}
                  onClick={() => setGender("Male")}
                >
                  Male
                </button>
                <button
                  className={`gender-btn ${gender === "Female" ? "active" : ""}`}
                  onClick={() => setGender("Female")}
                >
                  Female
                </button>
                <button
                  className={`gender-btn ${gender === "Neutral" ? "active" : ""}`}
                  onClick={() => setGender("Neutral")}
                >
                  Neutral
                </button>
              </div>
            </div>

            {/* Language & Regional Accent Selection */}
            <div className="form-group">
              <label className="form-label">Language & Regional Dialect</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <optgroup label="Default Account Language">
                  <option value="UK Default">🌐 Account Default (English - UK)</option>
                </optgroup>
                <optgroup label="Regional Accents (Native)">
                  <option value="UK Scottish">🇬🇧 UK Scottish (Glasgow / Edinburgh)</option>
                  <option value="UK Welsh">🇬🇧 UK Welsh (Cardiff)</option>
                  <option value="UK Northern Irish">🇬🇧 UK Northern Irish (Belfast)</option>
                  <option value="Irish">🇮🇪 Irish (Dublin Accent)</option>
                  <option value="UK RP">🇬🇧 UK London / RP Broadcaster</option>
                </optgroup>
                <optgroup label="Global English Variants">
                  <option value="US East Coast">🇺🇸 US East Coast (Radio Host)</option>
                  <option value="US West Coast">🇺🇸 US West Coast (Chill)</option>
                  <option value="Australian">🇦🇺 Australian (Sydney)</option>
                  <option value="Canadian">🇨🇦 Canadian</option>
                </optgroup>
                <optgroup label="Global Languages">
                  <option value="Spanish">🇪🇸 Spanish (Castilian)</option>
                  <option value="French">🇫🇷 French</option>
                  <option value="German">🇩🇪 German</option>
                  <option value="Japanese">🇯🇵 Japanese</option>
                </optgroup>
              </select>
            </div>

            {/* Name & Phonetic Pronunciation */}
            <div className="form-group">
              <label className="form-label">Name & Phonetic Pronunciation</label>
              <div className="phonetics-row">
                <input
                  type="text"
                  className="form-input"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Display Name"
                />
                <input
                  type="text"
                  className="form-input"
                  value={userPhonetic}
                  onChange={(e) => setUserPhonetic(e.target.value)}
                  placeholder="Phonetic (e.g. Stee-ven)"
                />
                <button className="sample-play-btn" onClick={handlePlayPhoneticSample}>
                  ▶ Play Sample
                </button>
              </div>
            </div>

            {/* DJ Name & Save Action Row */}
            <div className="form-group" style={{ marginTop: "14px" }}>
              <label className="form-label">Custom DJ Name</label>
              <input
                type="text"
                className="form-input"
                value={customDjName}
                onChange={(e) => setCustomDjName(e.target.value)}
                placeholder="e.g. DJ Rude Boy"
              />
            </div>

            <div className="action-btn-row">
              <button className="action-btn-primary" onClick={handleSaveDj}>
                💾 Save DJ DNA
              </button>
              <button className="action-btn-secondary" onClick={() => setIsVaultOpen(true)}>
                📁 Manage Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TIER 2: VIBE CURATOR ================= */}
      {activeTier === 2 && (
        <div className="tier-content">
          <div className="dj-card">
            <div className="dj-card-title">DYNAMIC TRAIT SLIDERS</div>

            <div className="form-group">
              <div className="slider-header">
                <span className="slider-label">Energy Level</span>
                <span className="trait-badge">{energy}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="form-slider"
              />
            </div>

            <div className="form-group">
              <div className="slider-header">
                <span className="slider-label">Speaking Speed</span>
                <span className="trait-badge">{speed}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="form-slider"
              />
            </div>
          </div>

          <div className="dj-card">
            <div className="dj-card-title">COMMENTARY FOCUS MATRIX</div>
            <div className="matrix-grid">
              <button
                className={`matrix-btn ${focusStyle === "Fact" ? "active" : ""}`}
                onClick={() => setFocusStyle("Fact")}
              >
                <h5>Fact Expert</h5>
                <p>Chart dates & stats</p>
              </button>

              <button
                className={`matrix-btn ${focusStyle === "Story" ? "active" : ""}`}
                onClick={() => setFocusStyle("Story")}
              >
                <h5>Storyteller</h5>
                <p>Backstage lore</p>
              </button>

              <button
                className={`matrix-btn full-width ${focusStyle === "Random" ? "active" : ""}`}
                onClick={() => setFocusStyle("Random")}
              >
                <h5>🔀 Random (Weave All)</h5>
                <p>Blends trivia, storytelling, gear & culture across tracks</p>
              </button>
            </div>
          </div>

          {/* "Also in this year..." Historical Timeline Trivia Module */}
          <div className="dj-card">
            <div className="dj-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>"ALSO IN THIS YEAR..." TIMELINE</span>
              <input
                type="checkbox"
                checked={enableTimelineTrivia}
                onChange={() => setEnableTimelineTrivia(!enableTimelineTrivia)}
                style={{ accentColor: "#ff1a1a", width: "16px", height: "16px", cursor: "pointer" }}
              />
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 12px 0", lineHeight: "1.4" }}>
              Weaves unrelated cultural, cinematic, or historical events from the track's release year into the AI host commentary.
            </p>

            {enableTimelineTrivia && (
              <div className="form-group" style={{ marginTop: "10px" }}>
                <div className="slider-header">
                  <span className="slider-label">Timeline Trivia Frequency</span>
                  <span className="trait-badge">Every {timelineFrequency} Tracks</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={timelineFrequency}
                  onChange={(e) => setTimelineFrequency(Number(e.target.value))}
                  className="form-slider"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TIER 3: STUDIO PRO ================= */}
      {activeTier === 3 && (
        <div className="tier-content">
          <div className="dj-card">
            <div className="dj-card-title">MANUAL STATION SOUND DROPS</div>
            <div className="soundboard-grid">
              <button className="soundboard-btn" onClick={() => triggerToast("📢 Triggered: Airhorn Beat Drop")}>
                ⚡ Airhorn Drop
              </button>
              <button className="soundboard-btn" onClick={() => triggerToast("📻 Triggered: Vinyl Scratch")}>
                📻 Vinyl Scratch
              </button>
              <button className="soundboard-btn" onClick={() => triggerToast("🎙️ Triggered: Gapviz Station ID")}>
                🎙️ Station ID Tag
              </button>
              <button className="soundboard-btn" onClick={() => triggerToast("🎛️ Triggered: Radio Frequency Sweep")}>
                📻 Frequency Sweep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DJ Vault Modal Drawer */}
      {isVaultOpen && (
        <div className="vault-modal-overlay">
          <div className="vault-modal">
            <div className="vault-modal-header">
              <h3>📁 Saved DJ Vault</h3>
              <button className="close-btn" onClick={() => setIsVaultOpen(false)}>
                ✕
              </button>
            </div>

            <div className="vault-list">
              {savedDjs.map((dj) => (
                <div key={dj.id} className="vault-item">
                  <div className="vault-item-info">
                    <h5>
                      {dj.name} {dj.id === activeDjId && "(Active)"}
                    </h5>
                    <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
                      {dj.style} • {dj.gender} • {dj.language}
                    </p>
                  </div>
                  <div className="vault-item-actions">
                    <button
                      className="vault-action-btn"
                      onClick={() => {
                        handleSelectDj(dj.id);
                        setIsVaultOpen(false);
                      }}
                    >
                      Load
                    </button>
                    {!dj.isPreset && (
                      <button
                        className="vault-action-btn delete"
                        onClick={() => handleDeleteDj(dj.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Locked Add-On */}
      <div className="locked-card">
        <div className="locked-info">
          <h4>🔒 DJ VoiceDeck Creator Pass</h4>
          <p>Script custom host drops, voice clone, and export ready DJ sets.</p>
        </div>
        <button className="lock-pill" onClick={() => triggerToast("DJ VoiceDeck Creator Pass requires add-on subscription")}>
          Unlock Pass
        </button>
      </div>

      <MobileFooter />
    </div>
  );
}