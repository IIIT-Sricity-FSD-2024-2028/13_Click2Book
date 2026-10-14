import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

export default function CityAutocomplete({
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select city',
  icon,
  requireValidOption = true,
  disabled = false,
  ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize internal input value with external value changes (e.g. swap, recent searches)
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter options based on typed input
  const filteredOptions = React.useMemo(() => {
    const q = (inputValue || '').trim().toLowerCase();
    if (!q) return options;
    return options.filter((c) => c.toLowerCase().includes(q));
  }, [options, inputValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        handleBlurValidation();
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, options, value]);

  const handleBlurValidation = () => {
    const q = (inputValue || '').trim().toLowerCase();
    if (!q) {
      onChange('');
      setInputValue('');
      return;
    }
    // Check if typed text matches an available option exactly (case-insensitive)
    const exactMatch = options.find((c) => c.toLowerCase() === q);
    if (exactMatch) {
      setInputValue(exactMatch);
      onChange(exactMatch);
    } else if (requireValidOption) {
      // Revert to current selected value
      setInputValue(value || '');
    } else {
      onChange(inputValue.trim());
    }
  };

  const handleSelectOption = (city) => {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          scrollIntoView(next);
          return next;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          scrollIntoView(next);
          return next;
        });
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (isOpen && filteredOptions.length === 1) {
        e.preventDefault();
        handleSelectOption(filteredOptions[0]);
      } else if (isOpen) {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Tab') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
      setIsOpen(false);
    }
  };

  const scrollIntoView = (index) => {
    if (listRef.current) {
      const items = listRef.current.children;
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div ref={containerRef} className="input-wrapper" style={{ position: 'relative' }}>
      <span className="input-icon">
        {icon || (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )}
      </span>
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={id}
        className="form-input"
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        autoComplete="off"
        onFocus={() => {
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onChange={(e) => {
          const val = e.target.value;
          setInputValue(val);
          setIsOpen(true);
          setHighlightedIndex(0);
          onChange(val);
        }}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          id={`${id}-listbox`}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            border: '1.5px solid #fed7aa',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '6px',
            margin: 0,
            listStyle: 'none',
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((city, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = city.toLowerCase() === (value || '').toLowerCase();
              return (
                <li
                  key={city}
                  role="option"
                  aria-selected={isSelected}
                  id={`${id}-opt-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(city);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--primary-dark, #c2410c)' : '#1e293b',
                    background: isHighlighted
                      ? '#fff7ed'
                      : isSelected
                      ? '#ffedd5'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <MapPin size={14} color={isSelected || isHighlighted ? '#f97316' : '#94a3b8'} />
                  <span style={{ flex: 1 }}>{city}</span>
                  {isSelected && (
                    <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 700 }}>
                      Selected
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li
              style={{
                padding: '12px 14px',
                fontSize: '0.82rem',
                color: '#94a3b8',
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              🔍 No cities found matching &ldquo;{inputValue}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
