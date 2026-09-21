import React, { useState, useEffect } from "react";
import "./account.css";
import { useNavigate } from "react-router-dom";
import { getAvatarDisplay } from "../../utils/avatarLogic";

export default function Account() {
  const navigate = useNavigate();

  // -----------------------------
  // State
  // -----------------------------
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [nickname, setNickname] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateJoined, setDateJoined] = useState("");
  const [photo, setPhoto] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // -----------------------------
  // Load saved data
  // -----------------------------
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("gapvizUser") || "{}");

    setFirstName(stored.firstName || "");
    setSurname(stored.surname || "");
    setNickname(stored.nickname || "");
    setPhonetic(stored.phonetic || "");
    setEmail(stored.email || "");
    setPassword(stored.password || "");
    setDateJoined(stored.dateJoined || "12 Aug 2026");
    setPhoto(stored.photo || null);
  }, []);

  // -----------------------------
  // Save handler
  // -----------------------------
  function handleSave() {
    const user = {
      firstName,
      surname,
      nickname,
      phonetic,
      email,
      password,
      dateJoined: dateJoined || new Date().toLocaleDateString(),
      photo,
    };

    localStorage.setItem("gapvizUser", JSON.stringify(user));

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  }

  // -----------------------------
  // Delete handler
  // -----------------------------
  function handleDeleteAccount() {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
    if (!confirmed) return;

    localStorage.removeItem("gapvizUser");

    setFirstName("");
    setSurname("");
    setNickname("");
    setPhonetic("");
    setEmail("");
    setPassword("");
    setDateJoined("");
    setPhoto(null);
  }

  // -----------------------------
  // Avatar photo upload
  // -----------------------------
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);

      const stored = JSON.parse(localStorage.getItem("gapvizUser") || "{}");
      stored.photo = reader.result;
      localStorage.setItem("gapvizUser", JSON.stringify(stored));
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setPhoto(null);

    const stored = JSON.parse(localStorage.getItem("gapvizUser") || "{}");
    delete stored.photo;
    localStorage.setItem("gapvizUser", JSON.stringify(stored));
  }

  // -----------------------------
  // Play Sample (phonetic)
  // -----------------------------
  function playSample() {
    const text = phonetic || nickname || firstName || "Guest";
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }

  // -----------------------------
  // Avatar display logic
  // -----------------------------
  const avatarDisplay = getAvatarDisplay({
    photo,
    nickname,
    firstName,
    surname,
  });

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="account-screen">

      {/* Back to Profile */}
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="account-title">Your Account</h1>

      <div className="account-card">

        {/* Avatar */}
        <div className="account-avatar">
          <div className="avatar-circle">
            {avatarDisplay.type === "photo" && (
              <img src={avatarDisplay.value} alt="Avatar" />
            )}
            {avatarDisplay.type === "initials" && (
              <span>{avatarDisplay.value}</span>
            )}
          </div>

          <div className="avatar-links">
            <label className="avatar-link">
              Upload or Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>

            {photo && (
              <button className="avatar-link" onClick={handleRemovePhoto}>
                Remove Photo
              </button>
            )}
          </div>
        </div>

        {/* First Name */}
        <div className="account-field hover-box">
          <label>First Name</label>
          <input
            type="text"
            placeholder="Your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Surname */}
        <div className="account-field hover-box">
          <label>Surname</label>
          <input
            type="text"
            placeholder="Your last name"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
        </div>

        {/* Nickname */}
        <div className="account-field hover-box">
          <label>Nickname</label>
          <input
            type="text"
            placeholder="What the DJ will call you and what appears on the greeting screen"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        {/* Phonetic Name + Play Sample */}
<div className="account-field phonetic-row">
  <div className="phonetic-input-wrapper hover-box">
    <label>Phonetic Name</label>
    <input
      type="text"
      placeholder="How the DJ should pronounce your name (e.g., Stee-ven)"
      value={phonetic}
      onChange={(e) => setPhonetic(e.target.value)}
    />
  </div>

.phonetic-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  width: 100%;            /* ← THIS FIXES EVERYTHING */
}

  <button className="play-sample-button hover-box" onClick={playSample}>
    ▶️ Play Sample
  </button>
</div>



        {/* Email */}
        <div className="account-field hover-box">
          <label>Email</label>
          <input
            type="text"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="account-field password-field hover-box">
          <label>Password</label>

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        {/* Date Joined */}
        <div className="account-field hover-box read-only-row">
          <label>Date Joined</label>
          <input type="text" value={dateJoined} readOnly />
        </div>

        {/* Save */}
        <button className="account-save hover-box" onClick={handleSave}>
          Save Changes
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Changes Saved</div>
        )}

        {/* Delete */}
        <button className="account-delete" onClick={handleDeleteAccount}>
          Delete Account
        </button>

      </div>
    </div>
  );
}
