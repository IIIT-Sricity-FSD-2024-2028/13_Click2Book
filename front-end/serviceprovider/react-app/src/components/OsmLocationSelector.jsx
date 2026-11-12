import React, { useState, useEffect, useRef } from 'react';
import { searchOsmLocations } from '../services/api';

export default function OsmLocationSelector({
  label,
  value,
  onChange,
  onRequestMissing,
  approvedCities = [],
  placeholder = 'Search Indian city, town, or bus stop...',
  required = true,
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle typing with debouncing to respect Nominatim policy
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setSelectedLocation(null);

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      onChange('');
      return;
    }

    setLoading(true);
    setIsOpen(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchOsmLocations(val.trim());
        setSuggestions(results);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setLoading(false);
      }
    }, 450); // 450ms debounce
  };

  const handleSelectApproved = (item) => {
    setInputValue(item.name);
    setSelectedLocation(item);
    setIsOpen(false);
    onChange(item.name, item);
  };

  const handleRequestUnapproved = (item) => {
    setIsOpen(false);
    if (onRequestMissing) {
      onRequestMissing(item);
    }
  };

  // Check if current text is approved
  const isApproved = approvedCities.some(
    (c) => c.toLowerCase() === (inputValue || '').trim().toLowerCase()
  );

  return (
    <div className="form-group" ref={containerRef} style={{ position: 'relative' }}>
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{label}</span>
        {inputValue && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isApproved ? '#16a34a' : '#d97706',
            }}
          >
            {isApproved ? '● Approved Hub' : '▲ Not in Approved Network'}
          </span>
        )}
      </label>

      <div className="input-wrap" style={{ position: 'relative' }}>
        <svg
          className="input-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        <input
          type="text"
          className="form-control"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          style={{
            borderColor: inputValue && !isApproved ? '#f59e0b' : undefined,
            paddingRight: loading ? '35px' : '25px',
          }}
        />

        {loading && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.75rem',
              color: '#3b82f6',
            }}
          >
            ⏳
          </div>
        )}

        {inputValue && !loading && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setSelectedLocation(null);
              setSuggestions([]);
              setIsOpen(false);
              onChange('');
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              fontSize: '0.85rem',
            }}
            title="Clear location"
          >
            ✕
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0',
            marginTop: 4,
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '0.72rem',
              color: '#64748b',
              fontWeight: 700,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>OpenStreetMap Indian Locations</span>
            <span>OSM &bull; Nominatim</span>
          </div>

          {suggestions.length === 0 && !loading && (
            <div style={{ padding: '16px 14px', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
              No OpenStreetMap locations found for &ldquo;{inputValue}&rdquo;.
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => onRequestMissing && onRequestMissing({ name: inputValue })}
                >
                  ➕ Raise Request for &ldquo;{inputValue}&rdquo;
                </button>
              </div>
            </div>
          )}

          {suggestions.map((item, idx) => {
            const isItemApproved =
              item.isAlreadyApproved ||
              approvedCities.some((c) => c.toLowerCase() === (item.name || '').toLowerCase());

            return (
              <div
                key={`${item.osmId || idx}-${item.name}`}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: isItemApproved ? 'pointer' : 'default',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  background: isItemApproved ? '#ffffff' : '#fffdfa',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (isItemApproved) e.currentTarget.style.background = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isItemApproved ? '#ffffff' : '#fffdfa';
                }}
                onClick={() => {
                  if (isItemApproved) handleSelectApproved(item);
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.locationType || 'city'}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                    }}
                    title={item.displayName}
                  >
                    {item.displayName}
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>
                    OSM ID: {item.osmId} &bull; {item.latitude?.toFixed(4)}°, {item.longitude?.toFixed(4)}°
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isItemApproved ? (
                    <button
                      type="button"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#22c55e',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSelectApproved(item)}
                    >
                      ✓ Select
                    </button>
                  ) : item.hasPendingRequest ? (
                    <span
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      ⏳ Pending
                    </span>
                  ) : (
                    <button
                      type="button"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #3b82f6',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestUnapproved(item);
                      }}
                    >
                      + Request
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning if unapproved text is entered */}
      {inputValue && !isApproved && (
        <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⚠️ &ldquo;{inputValue}&rdquo; is not an approved destination in the network.</span>
          <button
            type="button"
            onClick={() => onRequestMissing && onRequestMissing({ name: inputValue })}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2563eb',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Request New Location &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

