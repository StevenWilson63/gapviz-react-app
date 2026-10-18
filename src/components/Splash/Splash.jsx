import React, { useEffect, useState } from "react";
import "./Splash.css";
import gapvizLogo from "../../assets/logos/gapviz-logo.svg";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const [showLogo, setShowLogo] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showSecondTagline, setShowSecondTagline] = useState(false);
  const [showOnAir, setShowOnAir] = useState(false);
  const [showTap, setShowTap] = useState(false);
  const [showSubscriber, setShowSubscriber] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // ⭐ Returning-user state
  const isReturning = localStorage.getItem("returningUser") === "true";
  const displayName = localStorage.getItem("displayName") || "Listener";
  const lastDJName = localStorage.getItem("lastDJName") || "The Curator";

  const [showReturningMessage, setShowReturningMessage] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Logo fade-in
    const t1 = setTimeout(() => {
      setShowLogo(true);
    }, 200);

    // "Your music." pops in
    const t2 = setTimeout(() => setShowTagline(true), 1400);

    // "Their story." pops in
    const t3 = setTimeout(() => setShowSecondTagline(true), 2000);

    // ON AIR appears
    const t4 = setTimeout(() => setShowOnAir(true), 2400);

    // ⭐ RETURNING USER SEQUENCE
    if (isReturning) {
      // Returning message appears at 3 seconds
      const tMsg = setTimeout(() => setShowReturningMessage(true), 3000);

      // Start smooth screen fade-out at 7 seconds
      const tFade = setTimeout(() => setIsFadingOut(true), 7000);

      // Navigate to Home at 8.2 seconds (after fade finishes)
      const tNav = setTimeout(() => navigate("/home"), 8200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(tMsg);
        clearTimeout(tFade);
        clearTimeout(tNav);
      };
    }

    // ⭐ NEW USER SEQUENCE
    const tTap = setTimeout(() => setShowTap(true), 2800);
    const tSub = setTimeout(() => setShowSubscriber(true), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tTap);
      clearTimeout(tSub);
    };
  }, [isReturning, navigate]);

  return (
    <div className={`splash-container ${isFadingOut ? "fade-out" : ""}`}>
      {/* Logo */}
      <img
        src={gapvizLogo}
        alt="Gapviz Logo"
        className={`splash-logo ${showLogo ? "visible" : ""}`}
      />

      {/* Tagline */}
      <p className="splash-tagline">
        <span className={`tagline-part ${showTagline ? "visible" : ""}`}>
          Your music.
        </span>
        <span className="tagline-gap"> </span>
        <span className={`tagline-part ${showSecondTagline ? "visible" : ""}`}>
          Their story.
        </span>
      </p>

      {/* ON AIR */}
      <div className={`onair-box ${showOnAir ? "visible" : ""}`}>
        <span>ON AIR</span>
      </div>

      {/* ⭐ Returning-user message */}
      {isReturning && (
        <div
          className={`returning-message ${
            showReturningMessage ? "visible" : ""
          }`}
        >
          <p className="welcome-line">
            Welcome back {displayName}.
          </p>
          <p className="dj-line">
            DJ {lastDJName} is live in the studio.
          </p>
        </div>
      )}

      {/* ⭐ Subscriber block (new users only) */}
      {!isReturning && (
        <div className={`subscriber-block ${showSubscriber ? "visible" : ""}`}>
          <p className="discover-line">Discover Gapviz — join now</p>

          <div className="join-capsule" onClick={() => navigate("/join")}>
            Join now
          </div>

          <p className="trial-line">Enjoy Gapviz Premium free for 7 days</p>
          <p className="nocard-line">No card required</p>
        </div>
      )}
    </div>
  );
}