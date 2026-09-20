import React, { useState } from "react";
import "./account.css";

export default function Account() {

  // ⭐ Add state here
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateJoined, setDateJoined] = useState("12 Aug 2026");
  const [showPassword, setShowPassword] = useState(false);
  React.useEffect(() => {
  const savedName = localStorage.getItem("gv-name");
  const savedEmail = localStorage.getItem("gv-email");
  const savedPassword = localStorage.getItem("gv-password");
 


  if (savedName) setName(savedName);
  if (savedEmail) setEmail(savedEmail);
  if (savedPassword) setPassword(savedPassword);
}, []);

  // ⭐ STEP 4A — Save handler goes HERE
  function handleSave() {
    localStorage.setItem("gv-name", name);
    localStorage.setItem("gv-email", email);
    localStorage.setItem("gv-password", password);
  }

  return (
    <div className="account-screen">

      <h1 className="account-title">Account</h1>

      <div className="account-card">

        <div className="account-avatar">
          <div id="profile-avatar">SW</div>
        </div>

        <div className="account-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Steven Wilson"
          />
        </div>

        <div className="account-field">
          <label>Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="steven@example.com"
          />
        </div>

<div className="account-field password-field">
  <label>Password</label>

  <div className="password-wrapper">
    <input
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="••••••••"
    />

    <span
      className="password-toggle"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? "👁" : "👁‍🗨"}
    </span>
  </div>
</div>




<div className="account-field">
  <label>Date Joined</label>
  <input
    type="text"
    value={dateJoined}
    readOnly
  />
</div>

<button className="account-delete">
  Delete Account
</button>


        <button className="account-save" onClick={handleSave}>
          Save Changes
        </button>

      </div>
    </div>
  );
}
