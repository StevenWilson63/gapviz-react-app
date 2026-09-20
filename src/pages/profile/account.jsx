import React from "react";
import "./account.css";

export default function Account() {
  return (
    <div className="account-screen">

      <h1 className="account-title">Account</h1>

      <div className="account-card">

        <div className="account-avatar">
  <div id="profile-avatar">SW</div>
</div>


        <div className="account-field">
          <label>Name</label>
          <input type="text" placeholder="Steven Wilson" />
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


        <button className="account-save">
          Save Changes
        </button>

      </div>
    </div>
  );
}
