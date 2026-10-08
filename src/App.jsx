import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { UserProvider } from "./context/UserContext";

import Home from "./pages/home/home";
import Profile from "./pages/profile/profile";

// Profile sub-pages
import Account from "./pages/profile/account";
import Subscription from "./pages/profile/Subscription";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Main screens */}
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          {/* Profile sub-pages */}
          <Route path="/profile/account" element={<Account />} />
          <Route path="/profile/subscription" element={<Subscription />} />
          <Route path="/profile/dj" element={<div>DJ Settings Page</div>} />
          <Route path="/profile/app" element={<div>App Settings Page</div>} />
          <Route path="/profile/avatar" element={<div>Avatar Editor Page</div>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}