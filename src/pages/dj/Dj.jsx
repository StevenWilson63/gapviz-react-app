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
  const [ageStyle, setAgeStyle] = useState("Mature Adult");
  const [language, setLanguage] = useState("UK Scottish");

  // User Profile Phonetics
  const [userName, setUserName] = useState("Steven");
  const [userPhonetic, setUserPhonetic] = useState("Stee-ven");

  // Tier 1 Controls (Length & Timing)
  const [commentaryLength, setCommentaryLength] = useState("Standard Bridge");
  const [commentaryTiming, setCommentaryTiming] = useState("Bridge (End & Beginning)");

  // Fine-Tuning Matrix (Tier 2 - Performance & Emotional Delivery Trait Additions)
  const [voiceTone, setVoiceTone] = useState("Crisp");
  const [energyLevel, setEnergyLevel] = useState("Energetic");
  const [deliveryStyle, setDeliveryStyle] = useState("Rock DJ");
  const [speakingSpeed, setSpeakingSpeed] = useState("Standard");
  const [commentaryFocus, setCommentaryFocus] = useState("Storyteller");
  const [formality, setFormality] = useState("Casual");
  const [genreAdaptability, setGenreAdaptability] = useState("Dynamic Flex");
  const [performanceVibe, setPerformanceVibe] = useState("Deep Storyteller"); // Conversational, Storyteller, Theatrical & Wry
  const [expressionDynamics, setExpressionDynamics] = useState("Standard Radio Punch"); // Mellow, Standard, High Octane

  // Persona Shuffle & Timeline Trivia (Tier 2)
  const [enablePersonaShuffle, setEnablePersonaShuffle] = useState(false);
  const [shuffleMode, setShuffleMode] = useState("Per Track");
  const [enableTimelineTrivia, setEnableTimelineTrivia] = useState(true);
  const [timelineFrequency, setTimelineFrequency] = useState(2);

  // Studio Pro Controls (Tier 3 - B2B & Technophobe Suite)
  const [duckingLevel, setDuckingLevel] = useState(30); // Music Bed Ducking %
  const [masterCompressor, setMasterCompressor] = useState("Broadcast Safe");
  const [studioAcoustics, setStudioAcoustics] = useState("Dead Studio (Dry)");
  const [vumeterActive, setVumeterActive] = useState(true);

  // Handler for Tier 1 Persona Card Click (Auto-Syncs Tier 2 Delivery Style Default)
  const handlePersonaSelect = (personaKey) => {
    setSelectedPersona(personaKey);
    switch (personaKey) {
      case "Curator":
        setDeliveryStyle("Documentary Narrator");
        setPerformanceVibe("Deep Storyteller");
        break;
      case "Cool":
        setDeliveryStyle("Best Friend");
        setPerformanceVibe("Pure Conversational");
        break;
      case "Rock":
        setDeliveryStyle("Rock DJ");
        setPerformanceVibe("High Theatrical & Wry");
        setExpressionDynamics("High Octane & Dynamic");
        break;
      case "Late":
        setDeliveryStyle("Late Night Host");
        setPerformanceVibe("Pure Conversational");
        setExpressionDynamics("Mellow & Laid Back");
        break;
      default:
        break;
    }
  };

  const getTimelineFrequencyLabel = (val) => {
    switch (val) {
      case 1: return "Rare";
      case 2: return "Occasional";
      case 3: return "Frequently";
      case 4: return "Every Commentary";
      default: return "Occasional";
    }
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleSelectDj = (djId) => {
    const target = savedDjs.find((item) => item.id === djId);
    if (target) {
      setActiveDjId(target.id);
      setCustomDjName(target.name);
      handlePersonaSelect(target.style);
      setGender(target.gender);
      setLanguage(target.language);
      triggerToast(`Loaded DJ Profile: "${target.name}"`);
    }
  };

  const handleSaveDj = () => {
    const existingIndex = savedDjs.findIndex((item) => item.id === activeDjId);
    if (existingIndex >= 0 && !savedDjs[existingIndex].isPreset) {
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

  const handleDeleteDj = (id) => {
    setSavedDjs(savedDjs.filter((item) => item.id !== id));
    if (activeDjId === id) {
      handleSelectDj("p3");
    }
    triggerToast("Deleted DJ Profile from Vault");
  };

  const handlePlayPhoneticSample = () => {
    triggerToast(`▶ Kokoro TTS: "Hey ${userName}, welcome back to Gapviz!"`);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Hey ${userPhonetic || userName}, welcome back to Gapviz!`);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="dj-screen user-select-none">
      {toastMessage && <div className="dj-toast">{toastMessage}</div>}

      <div className="dj-header">
        <div className="dj-greeting-badge">
          <span>📻</span> Context Greeting Active
        </div>
        <h1>dj studio</h1>
        <p className="dj-subtitle">
          "Hey {userName}, good morning! Ready to jump back into Steve's Songs Playlist?"
        </p>
      </div>

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

          <div className="dj-card">
            <div className="dj-card-title">YOUR DJ STYLE</div>
            <div className="persona-grid">
              <div
                className={`persona-card ${selectedPersona === "Curator" ? "active" : ""}`}
                onClick={() => handlePersonaSelect("Curator")}
              >
                <div className="persona-emoji">🎓</div>
                <h4>The Curator</h4>
                <p>Calm, intelligent, documentary style</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Cool" ? "active" : ""}`}
                onClick={() => handlePersonaSelect("Cool")}
              >
                <div className="persona-emoji">😎</div>
                <h4>The Cool Friend</h4>
                <p>Relaxed, conversational, dry humor</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Rock" ? "active" : ""}`}
                onClick={() => handlePersonaSelect("Rock")}
              >
                <div className="persona-emoji">🎸</div>
                <h4>The Rock Jock</h4>
                <p>Energetic, punchy, loves the drama</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Late" ? "active" : ""}`}
                onClick={() => handlePersonaSelect("Late")}
              >
                <div className="persona-emoji">🌙</div>
                <h4>Late Night Spinner</h4>
                <p>Smooth, atmospheric, almost poetic</p>
              </div>
            </div>
          </div>

          <div className="dj-card">
            <div className="dj-card-title">
              VOICE IDENTITY & COMMENTARY PREFERENCES
              <span className="sync-badge">✓ Two-Way Account Sync</span>
            </div>

            <div className="form-group">
              <label className="form-label">Commentary Length</label>
              <select
                className="form-select"
                value={commentaryLength}
                onChange={(e) => setCommentaryLength(e.target.value)}
              >
                <option value="Quick Tag">Quick Tag (~10s station mention)</option>
                <option value="Standard Bridge">Standard Bridge (~20-30s intro/outro)</option>
                <option value="Deep Dive Story">Deep Dive Story (~45s+ backstory & trivia)</option>
                <option value="Random">Random (Dynamic mix of lengths)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Commentary Timing (Tracks 2+)</label>
              <select
                className="form-select"
                value={commentaryTiming}
                onChange={(e) => setCommentaryTiming(e.target.value)}
              >
                <option value="End of Track">End of Track (Outro bridge)</option>
                <option value="Beginning of Track">Beginning of Track (Intro banter)</option>
                <option value="Bridge (End & Beginning)">Bridge (Both Outro & Intro)</option>
                <option value="Random">Random (Dynamic timing per track)</option>
              </select>
            </div>

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
                  Neutral / Androgynous
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Age Style</label>
              <select
                className="form-select"
                value={ageStyle}
                onChange={(e) => setAgeStyle(e.target.value)}
              >
                <option value="Young Adult">Young Adult (Spotify Presenter)</option>
                <option value="Mature Adult">Mature Adult</option>
                <option value="Veteran Host">Veteran Radio Host (Classic FM)</option>
                <option value="Senior Broadcaster">Senior Broadcaster</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Regional Accent</label>
              <select
                className="form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <optgroup label="UK Accents">
                  <option value="UK Standard">🇬🇧 UK Standard</option>
                  <option value="UK Scottish">🇬🇧 UK Scottish (Glasgow / Edinburgh)</option>
                  <option value="UK Welsh">🇬🇧 UK Welsh (Cardiff)</option>
                  <option value="UK Northern">🇬🇧 UK Northern</option>
                  <option value="UK Southern">🇬🇧 UK Southern</option>
                  <option value="UK London">🇬🇧 UK London / RP</option>
                </optgroup>
                <optgroup label="USA Accents">
                  <option value="US East Coast">🇺🇸 US East Coast</option>
                  <option value="US West Coast">🇺🇸 US West Coast</option>
                  <option value="US Southern">🇺🇸 US Southern</option>
                  <option value="US Midwestern">🇺🇸 US Midwestern</option>
                  <option value="US New York">🇺🇸 US New York</option>
                </optgroup>
                <optgroup label="Global Accents">
                  <option value="Irish">🇮🇪 Irish (Dublin Accent)</option>
                  <option value="Australian">🇦🇺 Australian</option>
                  <option value="New Zealand">🇳🇿 New Zealand</option>
                  <option value="Canadian">🇨🇦 Canadian</option>
                  <option value="South African">🇿🇦 South African</option>
                </optgroup>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Voice Tone</label>
              <select
                className="form-select"
                value={voiceTone}
                onChange={(e) => setVoiceTone(e.target.value)}
              >
                <option value="Warm">Warm</option>
                <option value="Cool">Cool</option>
                <option value="Deep">Deep</option>
                <option value="Smooth">Smooth</option>
                <option value="Bright">Bright</option>
                <option value="Rich">Rich</option>
                <option value="Soft">Soft</option>
                <option value="Crisp">Crisp</option>
                <option value="Authoritative">Authoritative</option>
              </select>
            </div>

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
            <div className="dj-card-title">FINE-TUNING MATRIX</div>

            {/* Performance Delivery Vibe (Conversational vs. Theatrical & Sarcasm) */}
            <div className="form-group">
              <label className="form-label">Performance Delivery Vibe</label>
              <select
                className="form-select"
                value={performanceVibe}
                onChange={(e) => setPerformanceVibe(e.target.value)}
              >
                <option value="Pure Conversational">Pure Conversational (Unscripted, natural, relaxed)</option>
                <option value="Deep Storyteller">Deep Storyteller (Immersive lore & narrative pacing)</option>
                <option value="High Theatrical & Wry">High Theatrical & Wry (Dramatized, dry humor & sarcasm)</option>
              </select>
            </div>

            {/* Expression & Dynamics (Excitement, Emphasis & Pauses) */}
            <div className="form-group">
              <label className="form-label">Expression & Dynamics</label>
              <select
                className="form-select"
                value={expressionDynamics}
                onChange={(e) => setExpressionDynamics(e.target.value)}
              >
                <option value="Mellow & Laid Back">Mellow & Laid Back (Soft tone, minimal emphasis)</option>
                <option value="Standard Radio Punch">Standard Radio Punch (Balanced energy & natural pauses)</option>
                <option value="High Octane & Dynamic">High Octane & Dynamic (Explosive excitement & dramatic pauses)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Energy Level</label>
              <select
                className="form-select"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
              >
                <option value="Calm">Calm</option>
                <option value="Relaxed">Relaxed</option>
                <option value="Conversational">Conversational</option>
                <option value="Energetic">Energetic</option>
                <option value="High Energy">High Energy</option>
                <option value="Party Mode">Party Mode</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Radio Delivery Style</label>
              <select
                className="form-select"
                value={deliveryStyle}
                onChange={(e) => setDeliveryStyle(e.target.value)}
              >
                <option value="Classic Radio DJ">Classic Radio DJ</option>
                <option value="Music Curator">Music Curator</option>
                <option value="Best Friend">Best Friend</option>
                <option value="Club Host">Club Host</option>
                <option value="Late Night Host">Late Night Host</option>
                <option value="Documentary Narrator">Documentary Narrator</option>
                <option value="Rock DJ">Rock DJ</option>
                <option value="Festival MC">Festival MC</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Speaking Speed</label>
              <select
                className="form-select"
                value={speakingSpeed}
                onChange={(e) => setSpeakingSpeed(e.target.value)}
              >
                <option value="Slow">Slow</option>
                <option value="Standard">Standard</option>
                <option value="Fast">Fast</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Commentary Focus</label>
              <select
                className="form-select"
                value={commentaryFocus}
                onChange={(e) => setCommentaryFocus(e.target.value)}
              >
                <option value="Fact Expert">Fact Expert (Stats & Dates)</option>
                <option value="Storyteller">Storyteller (Backstage Lore)</option>
                <option value="Music Nerd">Music Nerd (Gear & Production)</option>
                <option value="Pop Culture Host">Pop Culture Host</option>
                <option value="Superfan">Superfan</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Formality</label>
              <select
                className="form-select"
                value={formality}
                onChange={(e) => setFormality(e.target.value)}
              >
                <option value="Professional">Professional</option>
                <option value="Casual">Casual</option>
                <option value="Very Casual">Very Casual</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Genre Adaptability</label>
              <select
                className="form-select"
                value={genreAdaptability}
                onChange={(e) => setGenreAdaptability(e.target.value)}
              >
                <option value="Strict Identity">Strict Identity (Keep exact tone)</option>
                <option value="Dynamic Flex">Dynamic Flex (Flex delivery to track genre)</option>
                <option value="Chameleon Mode">Chameleon Mode (Full genre adaptation)</option>
              </select>
            </div>
          </div>

          <div className="dj-card">
            <div className="dj-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🔀 PERSONA SHUFFLE (STATION LINEUP)</span>
              <label className="switch-container" style={{ position: "relative", display: "inline-block", width: "40px", height: "22px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={enablePersonaShuffle}
                  onChange={() => setEnablePersonaShuffle(!enablePersonaShuffle)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", inset: 0, backgroundColor: enablePersonaShuffle ? "#ff1a1a" : "#222",
                  borderRadius: "22px", transition: "0.3s", border: "1px solid rgba(255, 26, 26, 0.4)"
                }}>
                  <span style={{
                    position: "absolute", content: "''", height: "16px", width: "16px", left: enablePersonaShuffle ? "20px" : "3px",
                    bottom: "2px", backgroundColor: "white", borderRadius: "50%", transition: "0.3s"
                  }}></span>
                </span>
              </label>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 12px 0", lineHeight: "1.4" }}>
              Rotates through your saved DJ library to give your station a dynamic cast of presenters.
            </p>

            {enablePersonaShuffle && (
              <div className="form-group">
                <label className="form-label">Rotation Mode</label>
                <select
                  className="form-select"
                  value={shuffleMode}
                  onChange={(e) => setShuffleMode(e.target.value)}
                >
                  <option value="Per Track">Rotate Per Track</option>
                  <option value="Genre Shift">Rotate on Genre Shift</option>
                  <option value="Time of Day">Rotate by Time of Day</option>
                </select>
              </div>
            )}
          </div>

          <div className="dj-card">
            <div className="dj-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>"ALSO IN THIS YEAR..." TIMELINE</span>
              <label className="switch-container" style={{ position: "relative", display: "inline-block", width: "40px", height: "22px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={enableTimelineTrivia}
                  onChange={() => setEnableTimelineTrivia(!enableTimelineTrivia)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", inset: 0, backgroundColor: enableTimelineTrivia ? "#ff1a1a" : "#222",
                  borderRadius: "22px", transition: "0.3s", border: "1px solid rgba(255, 26, 26, 0.4)"
                }}>
                  <span style={{
                    position: "absolute", content: "''", height: "16px", width: "16px", left: enableTimelineTrivia ? "20px" : "3px",
                    bottom: "2px", backgroundColor: "white", borderRadius: "50%", transition: "0.3s"
                  }}></span>
                </span>
              </label>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 12px 0", lineHeight: "1.4" }}>
              Weaves unrelated cultural, cinematic, or historical events from the track's release year into host commentary.
            </p>

            {enableTimelineTrivia && (
              <div className="form-group" style={{ marginTop: "10px" }}>
                <div className="slider-header">
                  <span className="slider-label">Timeline Trivia Frequency</span>
                  <span className="trait-badge">{getTimelineFrequencyLabel(timelineFrequency)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={timelineFrequency}
                  onChange={(e) => setTimelineFrequency(Number(e.target.value))}
                  className="form-slider"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TIER 3: STUDIO PRO (B2B & TECHNOPHOBE SUITE) ================= */}
      {activeTier === 3 && (
        <div className="tier-content">
          <div className="dj-card">
            <div className="dj-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>📡 LIVE BROADCAST VU MONITOR</span>
              <label className="switch-container" style={{ position: "relative", display: "inline-block", width: "40px", height: "22px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={vumeterActive}
                  onChange={() => setVumeterActive(!vumeterActive)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: "absolute", inset: 0, backgroundColor: vumeterActive ? "#ff1a1a" : "#222",
                  borderRadius: "22px", transition: "0.3s", border: "1px solid rgba(255, 26, 26, 0.4)"
                }}>
                  <span style={{
                    position: "absolute", content: "''", height: "16px", width: "16px", left: vumeterActive ? "20px" : "3px",
                    bottom: "2px", backgroundColor: "white", borderRadius: "50%", transition: "0.3s"
                  }}></span>
                </span>
              </label>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 10px 0", lineHeight: "1.4" }}>
              Real-time hardware audio stream monitoring for voice and music bed balance.
            </p>
            {vumeterActive && (
              <div style={{ background: "#080808", padding: "10px", borderRadius: "8px", border: "1px solid #222" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginBottom: "4px" }}>
                  <span>CH 1 (MUSIC BED)</span>
                  <span style={{ color: "#22c55e" }}>-12 dB (ACTIVE)</span>
                </div>
                <div style={{ height: "6px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{ width: "72%", height: "100%", background: "linear-gradient(90deg, #22c55e, #eab308, #ef4444)" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#666", marginBottom: "4px" }}>
                  <span>CH 2 (KOKORO TTS HOST)</span>
                  <span style={{ color: "#22c55e" }}>READY</span>
                </div>
                <div style={{ height: "6px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "45%", height: "100%", background: "#22c55e" }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="dj-card">
            <div className="dj-card-title">REAL-TIME WEB AUDIO DUCKING</div>
            <p style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", margin: "0 0 12px 0", lineHeight: "1.4" }}>
              Controls how much the music bed volume lowers (dips) when the DJ host speaks.
            </p>
            <div className="form-group">
              <div className="slider-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span className="slider-label" style={{ fontSize: "12px", color: "#a3a3a3" }}>Music Bed Dip Level</span>
                <span className="trait-badge" style={{ fontSize: "12px", color: "#ef4444", fontWeight: "bold" }}>{duckingLevel}% Volume</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={duckingLevel}
                onChange={(e) => setDuckingLevel(Number(e.target.value))}
                className="form-slider"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="dj-card">
            <div className="dj-card-title">MASTER COMPRESSOR / LIMITER</div>
            <div className="form-group">
              <label className="form-label">Station Broadcast Profile</label>
              <select
                className="form-select"
                value={masterCompressor}
                onChange={(e) => setMasterCompressor(e.target.value)}
              >
                <option value="Broadcast Safe">Broadcast Safe (EBU R128 / LUFS Standard)</option>
                <option value="Warm Vinyl">Warm Vinyl (Classic Analog Warmth)</option>
                <option value="Raw Analog">Raw Analog (Uncompressed Dynamics)</option>
                <option value="Commercial Loud">Commercial FM Punch (Max Presence)</option>
              </select>
            </div>
          </div>

          <div className="dj-card">
            <div className="dj-card-title">STUDIO ROOM ACOUSTICS</div>
            <div className="form-group">
              <label className="form-label">Virtual Booth Reverb</label>
              <select
                className="form-select"
                value={studioAcoustics}
                onChange={(e) => setStudioAcoustics(e.target.value)}
              >
                <option value="Dead Studio (Dry)">Dead Studio (Clean & Intimate)</option>
                <option value="Live Broadcast Booth">Live Broadcast Booth (Warm Air)</option>
                <option value="Stadium Arena">Stadium Arena (Expansive Echo)</option>
              </select>
            </div>
          </div>

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