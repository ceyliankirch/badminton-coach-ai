import React, { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Écoute l'événement qui indique que l'app peut être installée
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Affiche la vraie popup d'installation du téléphone/navigateur
    deferredPrompt.prompt();

    // Attend le choix de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Badmin a été installé avec succès !');
    }
    
    // Cache le bouton après l'action
    setDeferredPrompt(null);
  };

  // Si l'app est déjà installée ou non compatible, le composant est invisible
  if (!deferredPrompt) return null;

  return (
    <button 
      onClick={handleInstallClick} 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        background: '#ccff00', // Ton jaune fluo habituel
        color: 'black',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '9999px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(204, 255, 0, 0.3)',
        transition: 'transform 0.2s',
        margin: '10px auto'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <FaDownload /> Installer Badmin
    </button>
  );
}