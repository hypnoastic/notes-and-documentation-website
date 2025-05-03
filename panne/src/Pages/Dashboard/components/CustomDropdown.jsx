import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option',
  label = null,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  // Find the selected option based on value
  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option || null);
  }, [value, options]);

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

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option.value);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown();
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === selectedOption?.value);
      const nextIndex = (currentIndex + 1) % options.length;
      handleOptionClick(options[nextIndex]);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === selectedOption?.value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      handleOptionClick(options[prevIndex]);
    }
  };

  return (
    <div className="custom-dropdown-container">
      {label && <label className="dropdown-label">{label}{required && <span className="required-mark">*</span>}</label>}
      <div 
        ref={dropdownRef}
        className={`custom-dropdown ${isOpen ? 'open' : ''}`}
        tabIndex="0"
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
      >
        <div 
          className="selected-option"
          onClick={toggleDropdown}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
        
        {isOpen && (
          <ul className="options-list" role="listbox">
            {options.map((option) => (
              <li 
                key={option.value} 
                className={`option-item ${selectedOption?.value === option.value ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option)}
                role="option"
                aria-selected={selectedOption?.value === option.value}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;