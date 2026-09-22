import React from "react";

export function EyeOpenIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 12C1 12 5.5 5 12 5C18.5 5 23 12 23 12C23 12 18.5 19 12 19C5.5 19 1 12 1 12Z"
        fill="#ff1a1a"
      />
      <circle cx="12" cy="12" r="3.8" fill="#000" />
      <circle cx="13.6" cy="10.4" r="1.1" fill="#ff1a1a" />
    </svg>
  );
}

export function EyeClosedIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 10C3 10 7 15 12 15C17 15 21 10 21 10"
        stroke="#ff1a1a"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 15L6 18"
        stroke="#ff1a1a"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M12 15V18"
        stroke="#ff1a1a"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M17 15L18 18"
        stroke="#ff1a1a"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
