import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes } from 'react-icons/fa';

export default function InstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showModal, setShowModal] = useState(false);

useEffect(() => {
  const handleBeforeInstallPrompt = (e) => {
    console.log("🔥 L'événement a été capturé !");
    e.preventDefault();
    setDeferredPrompt(e);
    
    // On force l'affichage pour voir si ça marche
    setShowModal(true); 
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
  // Test manuel : tape localStorage.clear() dans ta console si tu l'as déjà fermé une fois
  return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
}, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Badmin installé avec succès !');
    }
    
    setDeferredPrompt(null);
    setShowModal(false);
  };

  const handleDismiss = () => {
    setShowModal(false);
    // On sauvegarde son choix pour ne plus l'embêter
    localStorage.setItem('badmin_pwa_dismissed', 'true');
  };

  if (!showModal || !deferredPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999, // Toujours au-dessus du reste
      padding: '20px'
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(0, 255, 157, 0.3)',
        borderRadius: '24px',
        padding: '30px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        {/* Bouton Fermer (Croix) */}
        <button 
          onClick={handleDismiss}
          style={{
            position: 'absolute', top: '15px', right: '15px',
            background: 'transparent', border: 'none', color: '#888',
            cursor: 'pointer', padding: '5px'
          }}
        >
          <FaTimes size={20} />
        </button>

        {/* Icône */}
        <div style={{
          width: '70px', height: '70px', margin: '0 auto 20px',
          background: 'rgba(0, 255, 157, 0.1)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-color)', border: '2px solid rgba(0, 255, 187, 0.3)'
        }}>
          <FaDownload size={28} />
        </div>

        {/* Textes */}
        <h2 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '800' }}>
          Installer Badmin
        </h2>
        <p style={{ color: '#ccc', marginBottom: '25px', lineHeight: '1.5', fontSize: '0.95rem' }}>
          Ajoute l'application à ton écran d'accueil pour y accéder en 1 clic et profiter d'une expérience plein écran ! 🏸
        </p>

        {/* Boutons d'action */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={handleDismiss}
            style={{
              flex: 1, padding: '14px', borderRadius: '9999px',
              background: 'rgba(0, 255, 179, 0.05)', color: 'white',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '0.95rem'
            }}
          >
            Plus tard
          </button>
          <button 
            onClick={handleInstall}
            style={{
              flex: 1, padding: '14px', borderRadius: '9999px',
              background: 'rgb(0, 255, 179)', color: 'black',
              border: 'none', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '0.95rem',
              boxShadow: '0 4px 15px rgba(0, 255, 162, 0.3)'
            }}
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}