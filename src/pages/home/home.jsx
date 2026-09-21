// deploy trigger

import React, { useState } from "react";
import "./home.css";

import gapvizLogo from "../../assets/logos/gapviz-logo.svg";
import homeIcon from "../../assets/icons/home.svg";
import djIcon from "../../assets/icons/dj.svg";
import libraryIcon from "../../assets/icons/library.svg";
import fingerprintIcon from "../../assets/icons/fingerprint.svg";
import settingsIcon from "../../assets/icons/equalizer.svg";

import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function Home() {
  const navigate = useNavigate();
  const { getGreetingName, getInitials, theme } = useUser();

  const [activeNav, setActiveNav] = useState("home");

  const greetingName = getGreetingName();
  const initials = getInitials() || "";

  const hours = new Date().getHours();
  let greetingPrefix = "";
  if (hours < 12) greetingPrefix = "Good morning";
  else if (hours < 18) greetingPrefix = "Good afternoon";
  else greetingPrefix = "Good evening";

  const greetingText = `${greetingPrefix} ${greetingName}`;

  return (
    <>
      {/* FIXED TOP AVATAR */}
      <div
        id="top-avatar"
        className={`home-avatar home-theme-${theme}`}
        onClick={() => navigate("/profile")}
      >
        {initials}
      </div>

      {/* FIXED SETTINGS ICON */}
      <div
        id="settings-icon"
        className={`home-theme-${theme}`}
        onClick={() => navigate("/settings")}
        title="Settings"
      >
        <img src={settingsIcon} alt="Settings" />
      </div>

      {/* SCROLLABLE MIDDLE SECTION */}
      <div id="home-screen" className={`home-theme-${theme}`}>
        <img id="home-logo" src={gapvizLogo} alt="Gapviz Logo" />

        <h1 id="welcome-text">{greetingText}</h1>
        <p className="sub-welcome">Ready to jump back in?</p>

        {/* TRIAL COUNTDOWN */}
        <p id="trial-countdown" className="trial-middle">
          7 days left in your free trial
        </p>

        <div className="home-boxes">
          <div className="home-box hover-box" onClick={() => navigate("/dj")}>
            <h2>Last DJ</h2>
            <p>Not set yet</p>
          </div>

          <div
            className="home-box hover-box"
            onClick={() => navigate("/identify-summary")}
          >
            <h2>Identify Summary</h2>
            <p>No track identified yet</p>
          </div>

          <div
            className="home-box hover-box"
            onClick={() => navigate("/song-story")}
          >
            <h2>Last Track Played</h2>
            <p>No track played yet</p>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM NAV */}
      <div id="bottom-nav" className={`home-theme-${theme}`}>
        <div
          className={`nav-item ${activeNav === "home" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("home");
            navigate("/home");
          }}
        >
          <img src={homeIcon} alt="Home" />
          <span>Home</span>
          <div className="nav-underline"></div>
        </div>

        <div
          className={`nav-item ${activeNav === "dj" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("dj");
            navigate("/dj");
          }}
        >
          <img src={djIcon} alt="DJ" />
          <span>DJ</span>
          <div className="nav-underline"></div>
        </div>

        <div
          className={`nav-item ${activeNav === "library" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("library");
            navigate("/library");
          }}
        >
          <img src={libraryIcon} alt="Library" />
          <span>Library</span>
          <div className="nav-underline"></div>
        </div>

        <div
          className={`nav-item ${activeNav === "identify" ? "active" : ""}`}
          onClick={() => {
            setActiveNav("identify");
            navigate("/identify");
          }}
        >
          <img src={fingerprintIcon} alt="Identify" />
          <span>Identify</span>
          <div className="nav-underline"></div>
        </div>
      </div>
    </>
  );
}
