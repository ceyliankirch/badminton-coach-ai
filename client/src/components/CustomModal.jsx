import React from 'react';

// Styles en ligne pour la simplicité (tu peux les mettre dans ton CSS)
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fond noir semi-transparent
  backdropFilter: 'blur(5px)', // Effet de flou derrière
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease-out'
};

const cardStyle = {
  background: '#1a1a1a',
  padding: '25px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  transform: 'scale(1)',
  animation: 'scaleUp 0.2s ease-out'
};

const buttonBase = {
  padding: '10px 20px',
  borderRadius: '10px',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '0.9rem',
  marginTop: '20px',
  minWidth: '100px'
};

export default function CustomModal({ isOpen, onClose, title, message, type = 'info', onConfirm }) {
  if (!isOpen) return null;

  // Configuration des couleurs selon le type
  const isDanger = type === 'danger';
  const confirmColor = isDanger ? '#ef4444' : '#ccff00';
  const confirmTextColor = isDanger ? 'white' : 'black';

  return (
    <div style={overlayStyle} onClick={onClose}>
      {/* On empêche le clic sur la carte de fermer le modal */}
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* TITRE */}
        <h3 style={{ margin: '0 0 10px 0', color: isDanger ? '#ef4444' : 'white', fontSize: '1.2rem' }}>
          {title}
        </h3>
        
        {/* MESSAGE */}
        <p style={{ color: '#ccc', margin: 0, lineHeight: '1.5', fontSize: '0.95rem' }}>
          {message}
        </p>

        {/* BOUTONS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          
          {/* S'il y a une fonction onConfirm, c'est une question (Oui/Non) */}
          {onConfirm && (
            <button 
              onClick={onClose} 
              style={{ ...buttonBase, background: 'rgba(255,255,255,0.1)', color: 'white' }}
            >
              Annuler
            </button>
          )}

          {/* Bouton Principal (Confirmer ou OK) */}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm(); // Si confirmation requise
              onClose(); // Ferme le modal
            }} 
            style={{ ...buttonBase, background: confirmColor, color: confirmTextColor }}
          >
            {onConfirm ? (isDanger ? 'Supprimer' : 'Confirmer') : 'OK'}
          </button>

        </div>
      </div>
      
      {/* Animation CSS simple injectée */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.9); } to { transform: scale(1); } }
      `}</style>
    </div>
  );
}