import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileFooter from "../../components/mobile-footer/MobileFooter";
import fingerprintIcon from "../../assets/icons/fingerprint.svg";
import "./Identify.css";

export default function Identify() {
  const navigate = useNavigate();
  const [topText, setTopText] = useState("Tap");
  const [bottomText, setBottomText] = useState("unlock the song and story");
  const [statusText, setStatusText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleFingerprintClick = () => {
    if (isListening) return;

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
      {/* Header / Logo */}
      <div className="fp-logo-container">
        <h2 className="fp-brand-logo">gapviz</h2>
      </div>

      {/* Main Center Content Container */}
      <div className="fp-center-content">
        {topText && <div className="fp-top-text">{topText}</div>}

        <div 
          className="fp-wrapper"
          onClick={handleFingerprintClick}
          role="button"
          tabIndex={0}
        >
          {/* We now apply the 'isListening' pulse class directly to the SVG/Image */}
          <div className="fp-icon-inner">
            <img 
              src={fingerprintIcon} 
              alt="Gapviz Fingerprint" 
              className={`fp-svg ${isListening ? "icon-listening-glow" : ""}`} 
            />
          </div>
        </div>

        {bottomText && <div className="fp-bottom-text">{bottomText}</div>}
        {statusText && <div className="fp-status">{statusText}</div>}
      </div>

      <MobileFooter />
    </div>
  );
}