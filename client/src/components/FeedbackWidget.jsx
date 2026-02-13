import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCommentDots, FaTimes, FaBug, FaLightbulb, FaPaperPlane, FaCheck } from 'react-icons/fa';
import axios from 'axios';

// Assure-toi que cette URL correspond à ta configuration (utilise import.meta.env.VITE_API_URL si tu en as une)
const API_URL = "http://localhost:5000/api"; 
// const API_URL = "https://badminton-coach-ai.onrender.com/api"; // Ligne pour la production

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug'); // 'bug' ou 'feature'
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // On récupère le token de l'utilisateur connecté
      const token = localStorage.getItem('token');
      
      // On envoie la donnée à notre propre Backend
      await axios.post(`${API_URL}/feedback`, 
        { type, message },
        { headers: { 'x-auth-token': token } } // L'autorisation pour le middleware 'auth'
      );

      setStatus('success');
      
      // On referme le widget après 3 secondes
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setMessage('');
      }, 3000);

    } catch (err) {
      console.error('Erreur lors de l\'envoi du retour:', err);
      setStatus('error');
    }
  };

  return (
    <div style={{ 
        position: 'fixed', 
        bottom: '100px', // Ajuste la hauteur si besoin
        left: '50%', 
        transform: 'translateX(-50%)', // Technique magique pour centrer
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center' // Centre le contenu
    }}>
      
      {/* LA FENÊTRE DE FEEDBACK */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'absolute',
              bottom: '70px', 
              
              // ❌ ENLÈVE right: '0'
              // ✅ AJOUTE CECI À LA PLACE :
              left: '50%',
              marginLeft: '-160px', // C'est la moitié de la largeur (320/2) pour la centrer parfaitement
              
              width: '320px',
              background: '#121212',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            {/* Header de la box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>Un retour ?</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                <FaTimes />
              </button>
            </div>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <FaCheck size={30} color="#4ade80" style={{ marginBottom: '10px' }} />
                <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>Merci pour ton aide !</p>
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '5px' }}>C'est enregistré dans la base.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Choix du type (Bug ou Idée) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div 
                    onClick={() => setType('bug')}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', background: type === 'bug' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${type === 'bug' ? '#ef4444' : 'transparent'}`, color: type === 'bug' ? '#ef4444' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem', fontWeight: 'bold' }}
                  >
                    <FaBug /> Bug
                  </div>
                  <div 
                    onClick={() => setType('feature')}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', background: type === 'feature' ? 'rgba(58, 237, 204, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${type === 'feature' ? '#3aedcc' : 'transparent'}`, color: type === 'feature' ? '#3aedcc' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem', fontWeight: 'bold' }}
                  >
                    <FaLightbulb /> Idée
                  </div>
                </div>

                {/* Champ de texte */}
                <textarea 
                  required
                  placeholder={type === 'bug' ? "Décris le problème rencontré..." : "Une idée pour améliorer l'app ?"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}
                />

                {/* Bouton Envoyer */}
                <button 
                  type="submit" 
                  disabled={status === 'sending'}
                  style={{ background: 'white', color: 'black', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}
                >
                  {status === 'sending' ? 'Envoi...' : <><FaPaperPlane /> Envoyer</>}
                </button>
                {status === 'error' && <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>Erreur serveur. Réessaie plus tard.</span>}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LE BOUTON CIRCULAIRE */}
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 28px', // C'est ça qui crée la forme allongée (haut/bas, gauche/droite)
          borderRadius: '99px', // Arrondi parfait des bords
          background: '#ffffff', // Fond blanc pur
          border: 'none',
          color: '#000000', // Texte noir
          fontSize: '1rem',
          fontWeight: '900', // Typo bien grasse
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '2px', // Espacement des lettres pour un look "Badge"
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(255, 255, 255, 0.15)', // Légère lueur blanche
          cursor: 'pointer'
        }}
      >
        {/* Si la fenêtre est ouverte on affiche la croix, sinon on affiche "BETA" */}
        {isOpen ? <FaTimes size={20} /> : "BETA"}
      </motion.button>    </div>
  );
}