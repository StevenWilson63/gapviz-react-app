import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import gapvizLogo from "../../assets/logos/gapviz-logo.svg";
import { EyeOpenIcon, EyeClosedIcon } from "../../assets/icons/EyeIcons";
import CountrySelect from "../../components/CountrySelect/CountrySelect";
import "./Join.css";

export default function Join() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    nickname: "",
    email: "",
    password: "",
    country: "United Kingdom",
    dob: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCountryChange = (selectedCountry) => {
    setFormData((prev) => ({
      ...prev,
      country: selectedCountry,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.email.trim() || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!formData.termsAccepted) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }

    // Determine preferred display name (nickname first, fallback to first name)
    const preferredName = formData.nickname.trim() || formData.firstName.trim();
    const combinedFullName = `${formData.firstName.trim()} ${formData.surname.trim()}`.trim();

    // Persist JSON user bundle
    const gapvizUserObj = {
      firstName: formData.firstName.trim(),
      surname: formData.surname.trim(),
      nickname: formData.nickname.trim(),
      email: formData.email.trim(),
      password: formData.password,
      country: formData.country,
      dob: formData.dob,
      dateJoined: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    localStorage.setItem("gapvizUser", JSON.stringify(gapvizUserObj));

    // Persist sync keys for Splash / Home / Account modules
    localStorage.setItem("returningUser", "true");
    localStorage.setItem("firstName", formData.firstName.trim());
    localStorage.setItem("surname", formData.surname.trim());
    localStorage.setItem("nickname", formData.nickname.trim());
    localStorage.setItem("displayName", preferredName);
    localStorage.setItem("userEmail", formData.email.trim());
    localStorage.setItem("userCountry", formData.country);
    localStorage.setItem("userDOB", formData.dob);
    localStorage.setItem("gv_fullName", combinedFullName);
    localStorage.setItem("gv_nickname", formData.nickname.trim());

    // Default initial DJ if not already set
    if (!localStorage.getItem("lastDJName")) {
      localStorage.setItem("lastDJName", "The Curator");
    }

    // Redirect to home screen
    navigate("/home");
  };

  return (
    <div className="join-container">
      <div className="join-header">
        <img src={gapvizLogo} alt="Gapviz Logo" className="join-logo" />
        <h2>Create Your Account</h2>
        <p className="join-subtitle">Unlock personalized AI DJ stories and identified music history</p>
      </div>

      <form className="join-form" onSubmit={handleSubmit}>
        {error && <div className="join-error-banner">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name *</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              placeholder="Steven"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="surname">Surname</label>
            <input
              type="text"
              id="surname"
              name="surname"
              placeholder="Smith"
              value={formData.surname}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="nickname">
            Nickname <span className="label-helper">(What the DJ calls you)</span>
          </label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            placeholder="e.g. Steve"
            value={formData.nickname}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="steven@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password Field with Eye Toggle */}
        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <div className="join-password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="join-password-toggle-button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </button>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="country">Location / Country</label>
            <CountrySelect
              value={formData.country}
              onChange={handleCountryChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="terms-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <span className="checkmark"></span>
            <span className="terms-text">
              I accept the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            </span>
          </label>
        </div>

        <button type="submit" className="join-submit-btn">
          Create Account & Start Listening
        </button>
      </form>
    </div>
  );
}