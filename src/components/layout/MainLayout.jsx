import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import MiniPlayer from "../mini-player/MiniPlayer";
import MobileFooter from "../mobile-footer/MobileFooter";
import SoundBooth from "../soundbooth/SoundBooth";

export default function MainLayout() {
  const [isSoundBoothOpen, setIsSoundBoothOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page is the profile screen or any of its sub-screens
  const isProfileScreen = location.pathname.startsWith("/profile");

  const handleOpenSoundBooth = () => {
    setIsSoundBoothOpen(true);
  };

  const handleCloseSoundBooth = () => {
    setIsSoundBoothOpen(false);
  };

  const handleOpenControlRoom = () => {
    setIsSoundBoothOpen(false);
    navigate("/dj");
  };

  return (
    <div className="relative w-full h-screen flex flex-col justify-between overflow-hidden">
      {/* Page Content */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{
          paddingBottom: isProfileScreen ? "80px" : "130px", /* Gives ample scroll space above the footer */
          WebkitOverflowScrolling: "touch" /* Smooth scrolling on iOS / iPhone */
        }}
      >
        <Outlet />
      </div>

      {/* Persistent Mini-Player (Hidden on Profile and sub-screens) */}
      {!isProfileScreen && (
        <MiniPlayer onOpenSoundBooth={handleOpenSoundBooth} />
      )}

      {/* Mobile Footer Taskbar */}
      <MobileFooter />

      {/* Layer 2: SoundBooth Immersive Screen */}
      <SoundBooth
        isOpen={isSoundBoothOpen}
        onClose={handleCloseSoundBooth}
        onOpenControlRoom={handleOpenControlRoom}
      />
    </div>
  );
}