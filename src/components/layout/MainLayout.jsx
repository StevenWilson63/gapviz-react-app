import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import MiniPlayer from "../mini-player/MiniPlayer";
import MobileFooter from "../mobile-footer/MobileFooter";

export default function MainLayout() {
  const navigate = useNavigate();

  // This triggers when the user clicks the MiniPlayer to open Layer 2 (SoundBooth)
  const handleOpenSoundBooth = () => {
    navigate("/dj"); // Or opens the SoundBooth view/modal
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Page Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <Outlet />
      </div>

      {/* Persistent Mini-Player (Sits above footer) */}
      <MiniPlayer onOpenSoundBooth={handleOpenSoundBooth} />

      {/* Your Existing Mobile Footer Taskbar */}
      <MobileFooter />
    </div>
  );
}