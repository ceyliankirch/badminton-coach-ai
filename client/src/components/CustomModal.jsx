import React from 'react';

// --- STYLES ---
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(5px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 99999,
  animation: 'fadeIn 0.2s ease-out'
};

const cardStyle = {
  background: '#1a1a1a',
  padding: '30px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  maxWidth: '400px',
  width: '90%',
  textAlign: 'center',
  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
  animation: 'scaleUp 0.2s ease-out'
};

const buttonBase = {
  padding: '12px 24px',
  borderRadius: '25px',
  border: 'none',
  fontWeight: '800', // Plus gras pour le style moderne
  cursor: 'pointer',
  fontSize: '0.95rem',
  marginTop: '20px',
  minWidth: '100px',
  transition: 'transform 0.1s'
};

export default function CustomModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'danger', ou 'logout'
  onConfirm,
  confirmText // Permet de forcer le texte du bouton (ex: "Quitter")
}) {
  if (!isOpen) return null;

  // --- CONFIGURATION DYNAMIQUE SELON LE TYPE ---
  let config = {
    color: 'var(--primary)',     // Vert par défaut
    textColor: 'black',
    defaultBtn: 'OK'
  };

  switch (type) {
    case 'danger': // SUPPRESSION
      config = {
        color: '#ef4444', // Rouge vif
        textColor: 'white',
        defaultBtn: 'Supprimer'
      };
      break;
    case 'logout': // DÉCONNEXION
      config = {
        color: '#f59e0b', // Orange/Ambre (Attention mais pas danger mortel)
        textColor: 'black',
        defaultBtn: 'Se déconnecter'
      };
      break;
    default: // INFO
      config = {
        color: 'var(--primary)', // Vert Néon
        textColor: 'black',
        defaultBtn: 'Confirmer'
      };
      break;
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{...cardStyle, borderTop: `4px solid ${config.color}`}} onClick={(e) => e.stopPropagation()}>
        
        {/* TITRE */}
        <h3 style={{ margin: '0 0 15px 0', color: 'white', fontSize: '1.4rem' }}>
          {title}
        </h3>
        
        {/* MESSAGE */}
        <p style={{ color: '#ccc', margin: 0, lineHeight: '1.6', fontSize: '1rem' }}>
          {message}
        </p>

        {/* BOUTONS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
          
          {/* Bouton Annuler (visible seulement si onConfirm existe) */}
          {onConfirm && (
            <button 
              onClick={onClose} 
              style={{ ...buttonBase, background: 'rgba(255,255,255,0.05)', color: '#aaa' }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              Annuler
            </button>
          )}

          {/* Bouton Principal */}
          <button 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }} 
            style={{ ...buttonBase, background: config.color, color: config.textColor }}
          >
            {/* Si confirmText est fourni, on l'utilise, sinon on utilise le défaut du type */}
            {confirmText || (onConfirm ? config.defaultBtn : 'OK')}
          </button>

        </div>
      </div>
      
      {/* Animations CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}