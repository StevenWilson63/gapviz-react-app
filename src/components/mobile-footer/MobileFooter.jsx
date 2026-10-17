import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MobileFooter.css";

// Import your custom SVG icons from assets
import homeIcon from "../../assets/icons/home.svg";
import djIcon from "../../assets/icons/dj.svg";
import libraryIcon from "../../assets/icons/library.svg";
import fingerprintIcon from "../../assets/icons/fingerprint.svg";

export default function MobileFooter() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: "Home", path: "/home", icon: homeIcon },
        { label: "DJ", path: "/dj", icon: djIcon },
        { label: "Library", path: "/library", icon: libraryIcon },
        { label: "Identify", path: "/identify", icon: fingerprintIcon },
    ];

    return (
        <div id="mobile-footer">
            {navItems.map((item) => {
                const isActive = 
                    location.pathname === item.path || 
                    (item.path === "/identify" && location.pathname === "/identify-story");

                return (
                    <div
                        key={item.label}
                        className={`nav-item ${isActive ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        <img src={item.icon} alt={item.label} className="nav-icon-img" />
                        <span className="nav-label">{item.label}</span>
                        <div className="nav-underline"></div>
                    </div>
                );
            })}
        </div>
    );
}