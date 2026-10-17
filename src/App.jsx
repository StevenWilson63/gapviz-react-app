import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { UserProvider } from "./context/UserContext";

import Home from "./pages/home/home";
import Profile from "./pages/profile/profile";
import Dj from "./pages/dj/Dj"; // Dedicated DJ studio screen
import Library from "./pages/library/Library";

// Identify screens
import Identify from "./pages/identify/Identify";
import IdentifyStory from "./pages/identify/IdentifyStory";

// Profile sub-pages
import Account from "./pages/profile/account";
import Subscription from "./pages/profile/Subscription";
import DjSettings from "./pages/profile/dj"; // Profile settings for DJ
import ConnectedServices from "./pages/profile/connectedServices";
import Notifications from "./pages/profile/notifications";
import Appearance from "./pages/profile/appearance";
import PrivacyData from "./pages/profile/privacyData";
import HelpSupport from "./pages/profile/helpSupport";
import About from "./pages/profile/about";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Main bottom navigation screens */}
          <Route path="/home" element={<Home />} />
          <Route path="/dj" element={<Dj />} />
          <Route path="/library" element={<Library />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/identify-story" element={<IdentifyStory />} />

          {/* Profile screen */}
          <Route path="/profile" element={<Profile />} />

          {/* Profile sub-pages */}
          <Route path="/profile/account" element={<Account />} />
          <Route path="/profile/subscription" element={<Subscription />} />
          <Route path="/profile/dj" element={<DjSettings />} />
          <Route path="/profile/connected-services" element={<ConnectedServices />} />
          <Route path="/profile/notifications" element={<Notifications />} />
          <Route path="/profile/app" element={<div>App Settings Page</div>} />
          <Route path="/profile/avatar" element={<div>Avatar Editor Page</div>} />
          <Route path="/profile/appearance" element={<Appearance />} />
          <Route path="/profile/privacy-data" element={<PrivacyData />} />
          <Route path="/profile/help-support" element={<HelpSupport />} />
          <Route path="/profile/about" element={<About />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}