import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileFooter from "../../components/mobile-footer/MobileFooter";
import "./IdentifyStory.css";

export default function IdentifyStory() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fontSize, setFontSize] = useState("normal"); // 'normal' or 'large'

  const trackData = {
    title: "Dreams",
    artist: "Fleetwood Mac",
    album: "Rumours",
    year: "1977",
    platform: "🟢 Spotify",
    narrative: [
      "Written by Stevie Nicks in just 10 minutes at the Record Plant studio in Sausalito during a break from tense recording sessions.",
      "Armed with a Fender Rhodes piano and a cassette recorder, she captured a raw blueprint of heartbreak and liberation.",
      "When she played it for the band, Lindsey Buckingham immediately recognized its hit potential despite the personal tension between them."
    ]
  };

  const handlePlayCommentary = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSaveForLater = () => {
    setIsSaved(true);
    // Automatically bundles and drops into Identify Inbox for later decision
  };

  return (
    <div className={`song-story-screen ${fontSize === "large" ? "font-large" : ""}`}>
      {/* Header Deck */}
      <div className="story-top-nav">
        <button className="story-back-btn" onClick={() => navigate("/identify")}>
          <i className="fa-solid fa-arrow-left"></i> Back to Scanner
        </button>
        <span className="story-screen-badge">DISCOVERY RESULT</span>
      </div>

      {/* Song Hero Metadata Card */}
      <div className="story-hero-card">
        <div className="hero-meta-group">
          <div className="hero-title-row">
            <h2>{trackData.title}</h2>
            <span className="hero-platform-badge">{trackData.platform}</span>
          </div>
          <p className="hero-artist-album">{trackData.artist} • {trackData.album} ({trackData.year})</p>
        </div>
      </div>

      {/* Main RAG Commentary Card */}
      <div className="story-container">
        <div className="story-card-header">
          <div className="host-tag-group">
            <span className="host-avatar-dot"></span>
            <span className="host-name">AI Archivist & DJ Rude Boy</span>
          </div>
          <div className="font-resizer-group">
            <button 
              className={`font-size-btn ${fontSize === "normal" ? "active" : ""}`}
              onClick={() => setFontSize("normal")}
            >
              A-
            </button>
            <button 
              className={`font-size-btn ${fontSize === "large" ? "active" : ""}`}
              onClick={() => setFontSize("large")}
            >
              A+
            </button>
          </div>
        </div>

        <div className="story-content-body">
          <h3 className="story-subtitle-heading">The Story Behind The Song</h3>
          {trackData.narrative.map((paragraph, index) => (
            <p key={index} className={`story-line ${index === 0 ? "highlight" : ""}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Action Suite */}
      <div className="actions-container">
        <button 
          className={`gv-button primary-action ${isPlaying ? "playing" : ""}`}
          onClick={handlePlayCommentary}
        >
          <i className={`fa-solid ${isPlaying ? "fa-pause" : "fa-volume-high"}`}></i>
          {isPlaying ? "Pause DJ Commentary" : "Play DJ Commentary"}
        </button>

        <button 
          className={`gv-button secondary-action ${isSaved ? "saved" : ""}`}
          onClick={handleSaveForLater}
        >
          <i className={`fa-solid ${isSaved ? "fa-bookmark" : "fa-inbox"}`}></i>
          {isSaved ? "Saved to Identify Inbox" : "Save for Later (Identify Inbox)"}
        </button>

        <button 
          className="gv-button outline-action"
          onClick={() => navigate("/library")}
        >
          <i className="fa-solid fa-list-check"></i> Manage in Master Library
        </button>

        <button 
          className="gv-button subtle-action"
          onClick={() => navigate("/identify")}
        >
          <i className="fa-solid fa-rotate-right"></i> Identify Another Song
        </button>
      </div>

      <MobileFooter />
    </div>
  );
}