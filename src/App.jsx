import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { UserProvider } from "./context/UserContext";

import Splash from "./components/Splash/Splash";
import Join from "./pages/join/Join";
import MainLayout from "./components/layout/MainLayout";

import Home from "./pages/home/home";
import Profile from "./pages/profile/profile";
import Dj from "./pages/dj/Dj";
import Library from "./pages/library/Library";

// Identify screens
import Identify from "./pages/identify/Identify";
import IdentifyStory from "./pages/identify/IdentifyStory";

// Profile sub-pages
import Account from "./pages/profile/account";
import Subscription from "./pages/profile/Subscription";
import DjSettings from "./pages/profile/dj";
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

          {/* Splash screen & Join (No footer / mini-player) */}
          <Route path="/" element={<Splash />} />
          <Route path="/join" element={<Join />} />

          {/* Main App Layout (Includes MiniPlayer & MobileFooter automatically) */}
          <Route element={<MainLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/dj" element={<Dj />} />
            <Route path="/library" element={<Library />} />
            <Route path="/identify" element={<Identify />} />
            <Route path="/identify-story" element={<IdentifyStory />} />

            {/* Profile screen & sub-pages */}
            <Route path="/profile" element={<Profile />} />
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
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}