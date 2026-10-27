import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import MiniPlayer from "../mini-player/MiniPlayer";
import MobileFooter from "../mobile-footer/MobileFooter";
import SoundBooth from "../soundbooth/SoundBooth";

export default function MainLayout() {
  const [isSoundBoothOpen, setIsSoundBoothOpen] = useState(false);
  const navigate = useNavigate();

  const handleOpenSoundBooth = () => {
    setIsSoundBoothOpen(true);
  };

  const handleCloseSoundBooth = () => {
    setIsSoundBoothOpen(false);
  };

  const handleOpenControlRoom = () => {
    setIsSoundBoothOpen(false);
    navigate("/dj"); // Or opens the control room drawer
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Page Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <Outlet />
      </div>

      {/* Persistent Mini-Player */}
      <MiniPlayer onOpenSoundBooth={handleOpenSoundBooth} />

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