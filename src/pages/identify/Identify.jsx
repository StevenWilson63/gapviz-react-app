import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileFooter from "../../components/mobile-footer/MobileFooter";

export default function Identify() {
  const navigate = useNavigate();
  const [topText, setTopText] = useState("Tap");
  const [bottomText, setBottomText] = useState("unlock the song and story");
  const [statusText, setStatusText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleFingerprintClick = () => {
    if (isListening) return; // Prevent double taps

    setIsListening(true);
    setTopText("");
    setBottomText("");
    setStatusText("Listening…");

    setTimeout(() => {
      setStatusText("We know the song…");
    }, 1800);

    setTimeout(() => {
      setStatusText("Unlocking the story…");
    }, 3500);

    setTimeout(() => {
      navigate("/identify-story");
    }, 5200);
  };

  return (
    <div className="identify-screen">
      <div className="fp-logo-container">
        <h2 className="fp-brand-logo">gapviz</h2>
      </div>

      {topText && <div className="fp-top-text">{topText}</div>}

      <div 
        className={`fp-wrapper ${isListening ? "active-pulse" : ""}`}
        onClick={handleFingerprintClick}
        role="button"
        tabIndex={0}
      >
        <div className="fp-icon-inner">
          <svg viewBox="0 0 100 100" className="fp-svg">
            <path
              d="M50 10 A40 40 0 0 1 90 50 A40 40 0 0 1 50 90 A40 40 0 0 1 10 50 A40 40 0 0 1 50 10 Z"
              fill="none"
              stroke="#FF1A1A"
              strokeWidth="4"
            />
            <path
              d="M50 25 A25 25 0 0 1 75 50 A25 25 0 0 1 50 75 A25 25 0 0 1 25 50 A25 25 0 0 1 50 25 Z"
              fill="none"
              stroke="#FF1A1A"
              strokeWidth="4"
            />
          </svg>
        </div>
      </div>

      {bottomText && <div className="fp-bottom-text">{bottomText}</div>}
      {statusText && <div className="fp-status">{statusText}</div>}

      <MobileFooter />
    </div>
  );
}