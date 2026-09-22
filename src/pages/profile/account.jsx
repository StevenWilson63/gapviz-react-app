import React, { useState, useEffect } from "react";
import "./account.css";
import { useNavigate } from "react-router-dom";
import { getAvatarDisplay } from "../../utils/avatarLogic";
import { EyeOpenIcon, EyeClosedIcon } from "../../assets/icons/EyeIcons";


export default function Account() {
  const navigate = useNavigate();

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

  const [firstNameError, setFirstNameError] = useState("");
  const [surnameError, setSurnameError] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [phoneticError, setPhoneticError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateName = (value, maxLength) => {
    const allowed = /^[A-Za-z\s'-]+$/;
    if (value.length > maxLength) return false;
    if (!allowed.test(value)) return false;
    return true;
  };

  const validateEmail = (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value);
  };

  const validatePassword = (value) => {
    if (value.length < 8) return false;
    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    return hasLetter && hasNumber;
  };

  const handleFirstNameChange = (e) => {
  const value = e.target.value;
  setFirstName(value); // always update — never block the input itself

  if (value === "" || validateName(value, 30)) {
    setFirstNameError("");
  } else {
    setFirstNameError("Only letters, spaces, hyphens, apostrophes. Max 30 characters.");
  }
};

  const handleSurnameChange = (e) => {
  const value = e.target.value;
  setSurname(value);

  if (value === "" || validateName(value, 30)) {
    setSurnameError("");
  } else {
    setSurnameError("Only letters, spaces, hyphens, apostrophes. Max 30 characters.");
  }
};

  const handleNicknameChange = (e) => {
  const value = e.target.value;
  setNickname(value);

  if (value === "" || validateName(value, 20)) {
    setNicknameError("");
  } else {
    setNicknameError("Only letters, spaces, hyphens, apostrophes. Max 20 characters.");
  }
};

  const handlePhoneticChange = (e) => {
  const value = e.target.value;
  setPhonetic(value);

  if (value === "" || validateName(value, 30)) {
    setPhoneticError("");
  } else {
    setPhoneticError("Only letters, spaces, hyphens, apostrophes. Max 30 characters.");
  }
};

  const handleEmailChange = (e) => {
    const value = e.target.value;
    if (validateEmail(value)) {
      setEmail(value);
      setEmailError("");
    } else {
      setEmail(value);
      setEmailError("Enter a valid email address.");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    if (validatePassword(value)) {
      setPassword(value);
      setPasswordError("");
    } else {
      setPassword(value);
      setPasswordError("Min 8 characters, must include letters and numbers.");
    }
  };

  const openAvatarEditor = () => {
  // Navigate to your avatar editor screen
  navigate("/profile/avatar");
};

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

  const allValid =
    !firstNameError &&
    !surnameError &&
    !nicknameError &&
    !phoneticError &&
    !emailError &&
    !passwordError &&
    firstName &&
    surname &&
    nickname &&
    phonetic &&
    email &&
    password;

  function handleSave(e) {
    e.preventDefault();
    if (!allValid) return;

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

  function playSample() {
    const text = phonetic || nickname || firstName || "Guest";
    const utter = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utter);
  }

  const avatarDisplay = getAvatarDisplay({
    photo,
    nickname,
    firstName,
    surname,
  });

  return (
    <div className="account-screen">
      <button className="back-profile-btn" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <h1 className="account-title">Your Account</h1>

      <form className="account-card" onSubmit={handleSave} autoComplete="new-password">
       <div className="account-avatar">
  <div
    className="avatar-circle"
    onClick={() => document.getElementById("avatar-file-input").click()}

  >
    {avatarDisplay.type === "photo" && (
      <img src={avatarDisplay.value} alt="Avatar" />
    )}

    {avatarDisplay.type === "initials" && (
      <span>{avatarDisplay.value}</span>
    )}
  </div>

  {/* Hidden file input */}
  <input
    id="avatar-file-input"
    type="file"
    accept="image/*"
    onChange={handlePhotoChange}
    style={{ display: "none" }}
  />

  {/* Remove photo button */}
  {photo && (
    <button
      className="avatar-link"
      type="button"
      onClick={handleRemovePhoto}
      style={{ marginTop: "8px" }}
    >
      Remove Photo
    </button>
  )}
</div>




        <div className="account-field hover-box">
          <label>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={handleFirstNameChange}
            autoComplete="new-password"
          />
          {firstNameError && <div className="error-text">{firstNameError}</div>}
        </div>

        <div className="account-field hover-box">
          <label>Surname</label>
          <input
            type="text"
            value={surname}
            onChange={handleSurnameChange}
            autoComplete="new-password"
          />
          {surnameError && <div className="error-text">{surnameError}</div>}
        </div>

        <div className="account-field hover-box">
          <label>Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            autoComplete="new-password"
          />
          {nicknameError && <div className="error-text">{nicknameError}</div>}
        </div>

        <div className="phonetic-row">
          <div className="phonetic-input-wrapper hover-box">
            <label>Phonetic Name</label>
            <input
              type="text"
              value={phonetic}
              onChange={handlePhoneticChange}
              autoComplete="new-password"
            />
            {phoneticError && <div className="error-text">{phoneticError}</div>}
          </div>

          <button className="play-sample-button hover-box" type="button" onClick={playSample}>
            ▶️ Play Sample
          </button>
        </div>

        <div className="account-field hover-box">
  <label>Email</label>
  <input
    type="email"
    value={email}
    onChange={handleEmailChange}
    autoComplete="email"
  />
  {emailError && <div className="error-text">{emailError}</div>}
</div>


       <div className="account-field password-field hover-box">
  <label>Password</label>

  <div className="password-wrapper">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={handlePasswordChange}
      autoComplete="new-password"
    />

    <button
      type="button"
      className="password-toggle-button"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
    </button>
  </div>

  {passwordError && <div className="error-text">{passwordError}</div>}
</div>



        <div className="account-field hover-box read-only-row">
          <label>Date Joined</label>
          <input type="text" value={dateJoined} readOnly />
        </div>

        <button
          className={`account-save hover-box ${!allValid ? "disabled-save" : ""}`}
          type="submit"
          disabled={!allValid}
        >
          Save Changes
        </button>

        {savedMessage && (
          <div className="save-confirm-box">✓ Changes Saved</div>
        )}

        <button className="account-delete" type="button" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </form>
    </div>
  );
}
