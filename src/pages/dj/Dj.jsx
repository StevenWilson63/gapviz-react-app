import React, { useState } from "react";
import MobileFooter from "../../components/mobile-footer/MobileFooter";
import "./Dj.css";

export default function Dj() {
  // State Management
  const [activeTier, setActiveTier] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState("Rock");
  const [userName, setUserName] = useState("Steven");
  const [userPhonetic, setUserPhonetic] = useState("Stee-ven");
  const [toastMessage, setToastMessage] = useState(null);

  // Dynamic Trait Sliders (Tier 2)
  const [energy, setEnergy] = useState(75);
  const [speed, setSpeed] = useState(1.0);
  const [depth, setDepth] = useState(50);
  const [formality, setFormality] = useState(40);
  const [focusStyle, setFocusStyle] = useState("Random");

  // Trigger Toast Notifications
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Kokoro TTS Phonetics Sample Simulation
  const handlePlayPhoneticSample = () => {
    triggerToast(`▶ Kokoro TTS: "Hey ${userName}, welcome back to Gapviz!"`);
    
    // Web Speech API fallback audio preview
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Hey ${userPhonetic || userName}, welcome back to Gapviz!`);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper Functions for Dynamic Badge Text
  const getEnergyText = (val) => {
    if (val <= 20) return `${val}% • Quiet & Chill`;
    if (val <= 40) return `${val}% • Relaxed`;
    if (val <= 60) return `${val}% • Conversational`;
    if (val <= 85) return `${val}% • High Energy`;
    return `${val}% • Full Party Mode`;
  };

  const getSpeedText = (val) => {
    if (val <= 0.9) return `${val}x • Relaxed Pace`;
    if (val <= 1.1) return `${val}x • Natural Radio`;
    return `${val}x • Fast Pitch`;
  };

  const getDepthText = (val) => {
    if (val <= 30) return `${val}% • Bite-Sized Trivia`;
    if (val <= 70) return `${val}% • Balanced Backstory`;
    return `${val}% • Deep Lore`;
  };

  const getFormalityText = (val) => {
    if (val <= 25) return "Strict Professional";
    if (val <= 60) return "Casual Broadcaster";
    return "Unfiltered / Off-the-Cuff";
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
          {/* Persona Selection */}
          <div className="dj-card">
            <div className="dj-card-title">YOUR DJ STYLE</div>
            <div className="persona-grid">
              <div
                className={`persona-card ${selectedPersona === "Curator" ? "active" : ""}`}
                onClick={() => { setSelectedPersona("Curator"); triggerToast("Selected: The Curator"); }}
              >
                <div className="persona-emoji">🎓</div>
                <h4>The Curator</h4>
                <p>Calm, intelligent, documentary style</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Cool" ? "active" : ""}`}
                onClick={() => { setSelectedPersona("Cool"); triggerToast("Selected: The Cool Friend"); }}
              >
                <div className="persona-emoji">😎</div>
                <h4>The Cool Friend</h4>
                <p>Relaxed, conversational, dry humor</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Rock" ? "active" : ""}`}
                onClick={() => { setSelectedPersona("Rock"); triggerToast("Selected: The Rock Jock"); }}
              >
                <div className="persona-emoji">🎸</div>
                <h4>The Rock Jock</h4>
                <p>Energetic, punchy, loves the drama</p>
              </div>

              <div
                className={`persona-card ${selectedPersona === "Late" ? "active" : ""}`}
                onClick={() => { setSelectedPersona("Late"); triggerToast("Selected: Late Night Spinner"); }}
              >
                <div className="persona-emoji">🌙</div>
                <h4>Late Night Spinner</h4>
                <p>Smooth, atmospheric, almost poetic</p>
              </div>
            </div>
          </div>

          {/* Voice Identity & Phonetics */}
          <div className="dj-card">
            <div className="dj-card-title">
              VOICE IDENTITY & PHONETICS
              <span className="sync-badge">✓ Two-Way Account Sync</span>
            </div>

            <div className="form-group">
              <label className="form-label">Regional Accent & Language</label>
              <select className="form-select">
                <option>🇬🇧 UK Scottish (Glasgow / Edinburgh)</option>
                <option>🇬🇧 UK Welsh (Cardiff)</option>
                <option>🇬🇧 UK Northern Irish (Belfast)</option>
                <option>🇮🇪 Irish (Dublin Accent)</option>
                <option>🇬🇧 UK London / RP Broadcaster</option>
                <option>🇺🇸 US East Coast (Radio Host)</option>
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
                  placeholder="e.g. Stee-ven"
                />
                <button className="sample-play-btn" onClick={handlePlayPhoneticSample}>
                  ▶ Play Sample
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TIER 2: VIBE CURATOR ================= */}
      {activeTier === 2 && (
        <div className="tier-content">
          {/* Dynamic Trait Sliders */}
          <div className="dj-card">
            <div className="dj-card-title">DYNAMIC TRAIT SLIDERS</div>

            <div className="form-group">
              <div className="slider-header">
                <span className="slider-label">Energy Level</span>
                <span className="trait-badge">{getEnergyText(energy)}</span>
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
                <span className="trait-badge">{getSpeedText(speed)}</span>
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

            <div className="form-group">
              <div className="slider-header">
                <span className="slider-label">Storytelling Depth</span>
                <span className="trait-badge">{getDepthText(depth)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="form-slider"
              />
            </div>

            <div className="form-group">
              <div className="slider-header">
                <span className="slider-label">Formality & Humor</span>
                <span className="trait-badge">{getFormalityText(formality)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formality}
                onChange={(e) => setFormality(Number(e.target.value))}
                className="form-slider"
              />
            </div>
          </div>

          {/* Commentary Focus Matrix */}
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
                className={`matrix-btn ${focusStyle === "Nerd" ? "active" : ""}`}
                onClick={() => setFocusStyle("Nerd")}
              >
                <h5>Music Nerd</h5>
                <p>Gear, synths & chords</p>
              </button>

              <button
                className={`matrix-btn ${focusStyle === "Pop" ? "active" : ""}`}
                onClick={() => setFocusStyle("Pop")}
              >
                <h5>Pop Culture</h5>
                <p>Film soundtracks & trends</p>
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
        </div>
      )}

      {/* ================= TIER 3: STUDIO PRO ================= */}
      {activeTier === 3 && (
        <div className="tier-content">
          {/* Broadcast DSP Profiles */}
          <div className="dj-card">
            <div className="dj-card-title">BROADCAST DSP & EQ PROFILES</div>
            <div className="form-group">
              <label className="form-label">Master Voice Equalizer</label>
              <select className="form-select">
                <option>🎙️ Warm FM Radio (Vintage 70s)</option>
                <option>📻 Punchy Modern Broadcaster</option>
                <option>🎧 Crisp Podcast (Clean & Close)</option>
                <option>🎚️ Flat / Unprocessed Reference</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Spatial Width & Panning</label>
              <select className="form-select">
                <option>Center Mono (Classic Radio)</option>
                <option>Spatial Stereo Width (Enhanced)</option>
                <option>Binaural Headphone 3D</option>
              </select>
            </div>
          </div>

          {/* Manual Station Sound Drops Soundboard */}
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

      {/* Locked DJ VoiceDeck Add-On CTA */}
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