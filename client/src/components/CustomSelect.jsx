import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';

export default function CustomSelect({ name, value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le menu si on clique ailleurs sur la page
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%', zIndex: 100 }}>
      {/* Bouton de sélection */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 15px 12px 50px', // On garde le padding à gauche pour l'icône de ProfilePage
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          minHeight: '45px'
        }}
      >
        <span style={{ textTransform: 'capitalize' }}>{selectedOption.label}</span>
        <FaChevronDown style={{ 
          color: '#888', 
          fontSize: '0.8rem', 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }} />
      </div>

      {/* Liste déroulante */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          right: 0,
          background: '#1a1a1a', // Fond sombre solide
          border: '1px solid #333',
          borderRadius: '10px',
          zIndex: 999,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(name, opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 15px',
                color: value === opt.value ? '#3aedcc' : 'white', // Vert badminton si sélectionné
                background: value === opt.value ? 'rgba(58, 237, 204, 0.1)' : 'transparent',
                cursor: 'pointer',
                fontSize: '0.9rem',
                borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}