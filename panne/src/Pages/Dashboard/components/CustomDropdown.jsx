import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find the selected option label
  const selectedOption = options.find(option => option.value === value);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
      <div className="custom-dropdown-wrapper">
        {label && <label className="dropdown-label">{label}</label>}
        <div className="custom-dropdown-container" ref={dropdownRef}>
          <div
              className={`custom-dropdown ${isOpen ? 'open' : ''}`}
              onClick={toggleDropdown}
          >
            <div className="selected-option">
              {selectedOption ? selectedOption.label : placeholder}
            </div>
            <div className="dropdown-arrow">▼</div>
          </div>

          {isOpen && (
              <div className="dropdown-options">
                {options.map((option) => (
                    <div
                        key={option.value}
                        className={`dropdown-option ${option.value === value ? 'selected' : ''}`}
                        onClick={() => handleOptionClick(option.value)}
                    >
                      {option.label}
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
};

export default CustomDropdown;