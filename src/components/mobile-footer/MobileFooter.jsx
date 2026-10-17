import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MobileFooter.css";

export default function MobileFooter() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: "Home", path: "/home", emoji: "🏠" },
        { label: "DJ", path: "/dj", emoji: "🎧" },
        { label: "Library", path: "/library", emoji: "📚" },
        { label: "Identify", path: "/identify", emoji: "👆" },
    ];

    return (
        <div id="mobile-footer">
            {navItems.map((item) => {
                // Highlight active tab (handles /identify and /identify-story)
                const isActive = 
                    location.pathname === item.path || 
                    (item.path === "/identify" && location.pathname === "/identify-story");

                return (
                    <div
                        key={item.label}
                        className={`nav-item ${isActive ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        <div className="icon">{item.emoji}</div>
                        <span className="nav-label">{item.label}</span>
                        <div className="nav-underline"></div>
                    </div>
                );
            })}
        </div>
    );
}