import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileFooter from "../../components/MobileFooter";
import "./identify-story.css";

export default function IdentifyStory() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Identify Story screen loaded successfully.");
  }, []);

  return (
    <div className="song-story-screen">
      <h1 className="story-header-title">story</h1>

      <div className="story-container">
        <p className="story-line">
          This is where the identified song’s story will appear.
        </p>

        <p className="story-line">
          Commentary, background, artist notes, and narrative will be displayed here.
        </p>

        <p className="story-line highlight">
          This screen will later be replaced with the full dynamic RAG-driven commentary engine.
        </p>
      </div>

      <div className="actions-container">
        <button className="gv-button" onClick={() => alert("Playing DJ commentary...")}>
          play dj commentary
        </button>
        <button className="gv-button" onClick={() => navigate("/library")}>
          save to library
        </button>
        <button className="gv-button" onClick={() => navigate("/identify")}>
          identify another song
        </button>
      </div>

      <MobileFooter />
    </div>
  );
}