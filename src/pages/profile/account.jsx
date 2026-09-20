import React, { useState } from "react";
import "./account.css";
import OpenEyeIcon from "../../assets/icons/open-eye.svg";
import ClosedEyeIcon from "../../assets/icons/closed-eye.svg";

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

function handleDeleteAccount() {
  // Ask user to confirm
  const confirmed = window.confirm("Are you sure you want to delete your account?");

  if (!confirmed) {
    return; // User cancelled
  }

  // Clear saved data
  localStorage.removeItem("gv-name");
  localStorage.removeItem("gv-email");
  localStorage.removeItem("gv-password");

  // Reset fields
  setName("");
  setEmail("");
  setPassword("");
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
  {showPassword ? (
    <img src={OpenEyeIcon} alt="Show password" />
  ) : (
    <img src={ClosedEyeIcon} alt="Hide password" />
  )}
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

<button className="account-delete" onClick={handleDeleteAccount}>
  Delete Account
</button>



        <button className="account-save" onClick={handleSave}>
          Save Changes
        </button>

      </div>
    </div>
  );
}
