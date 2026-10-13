import React, { useState, useEffect } from "react";
import "./appearance.css";
import { useNavigate } from "react-router-dom";

export default function Appearance() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState("dark");
  const [textSize, setTextSize] = useState("medium");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [language, setLanguage] = useState("English");
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("gv_appearance") || "{}");
      if (stored.theme) setTheme(stored.theme);
      if (stored.textSize) setTextSize(stored.textSize);
      if (stored.reduceMotion !== undefined) setReduceMotion(stored.reduceMotion);
      if (stored.language) setLanguage(stored.language);
    } catch (e) {
      console.error("Failed to load appearance settings", e);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = { theme, textSize, reduceMotion, language };
    localStorage.setItem("gv_appearance", JSON.stringify(settings));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="appearance-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="appearance-title">Appearance</h1>
      <p className="appearance-subtitle">
        Customize your visual theme, text scaling, and motion preferences.
      </p>

      <form className="appearance-card" onSubmit={handleSave}>
        
        {/* Theme Setting */}
        <div className="appearance-row">
          <div className="appearance-info">
            <span className="appearance-label">Theme Mode</span>
            <span className="appearance-desc">Select your preferred visual style</span>
          </div>
          <div className="appearance-options-group">
            {["dark", "light", "system"].map((t) => (
              <button
                key={t}
                type="button"
                className={`option-chip ${theme === t ? "active" : ""}`}
                onClick={() => setTheme(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Text Size Setting */}
        <div className="appearance-row">
          <div className="appearance-info">
            <span className="appearance-label">Text Size</span>
            <span className="appearance-desc">Adjust UI readability scale</span>
          </div>
          <div className="appearance-options-group">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                type="button"
                className={`option-chip ${textSize === size ? "active" : ""}`}
                onClick={() => setTextSize(size)}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Reduce Motion Setting */}
        <div className="appearance-row hover-box">
          <div className="appearance-info">
            <span className="appearance-label">Reduce Motion</span>
            <span className="appearance-desc">Minimize interface animations and transitions</span>
          </div>
          <button
            type="button"
            className={`service-toggle-btn ${reduceMotion ? "connected" : ""}`}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            {reduceMotion ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Language Selection */}
        <div className="appearance-row">
          <div className="appearance-info">
            <span className="appearance-label">Language</span>
            <span className="appearance-desc">Choose your preferred display language</span>
          </div>
          <select
            className="appearance-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Spanish">Español</option>
            <option value="French">Français</option>
            <option value="German">Deutsch</option>
            <option value="Japanese">日本語</option>
          </select>
        </div>

        <button className="appearance-save hover-box" type="submit">
          Save Changes
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Preferences Saved</div>
        )}

      </form>
    </div>
  );
}