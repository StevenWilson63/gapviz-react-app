import React, { useState, useRef, useEffect } from "react";
import "./CountrySelect.css";

export const WORLD_COUNTRIES = [
  "United Kingdom",
  "United States of America",
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe",
  "Other / Prefer not to say"
];

export default function CountrySelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const wrapperRef = useRef(null);

  // Check positioning to see if it should flip upwards if near screen bottom
  const handleToggle = () => {
    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 300px space below, open upwards
      setDropUp(spaceBelow < 300);
    }
    setIsOpen(!isOpen);
    setSearchTerm("");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = WORLD_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (country) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="country-select-wrapper" ref={wrapperRef}>
      <div 
        className={`country-select-trigger ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
      >
        <span>{value || "Select Country"}</span>
        <span className="dropdown-arrow">▾</span>
      </div>

      {isOpen && (
        <div className={`country-dropdown-menu ${dropUp ? "drop-up" : ""}`}>
          <div className="search-input-box">
            <input
              type="text"
              placeholder="Type to search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()} // Prevent parent form handlers from capturing single keys
              autoFocus
            />
          </div>

          <div className="country-list-scroll">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <div
                  key={c}
                  className={`country-item ${c === value ? "selected" : ""}`}
                  onClick={() => handleSelect(c)}
                >
                  {c}
                </div>
              ))
            ) : (
              <div className="no-country-found">No country found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}