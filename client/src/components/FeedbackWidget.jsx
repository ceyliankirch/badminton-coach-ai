import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaBug, FaLightbulb, FaPaperPlane, FaCheck } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/feedback`, 
        { type, message },
        { headers: { 'x-auth-token': token } }
      );

      setStatus('success');
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
    /* ✅ ON UTILISE LA NOUVELLE CLASSE ICI */
    <div className="feedback-wrapper">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="feedback-window" /* ✅ ET ICI */
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
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
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div onClick={() => setType('bug')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: type === 'bug' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${type === 'bug' ? '#ef4444' : 'transparent'}`, color: type === 'bug' ? '#ef4444' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <FaBug /> Bug
                  </div>
                  <div onClick={() => setType('feature')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: type === 'feature' ? 'rgba(58, 237, 204, 0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${type === 'feature' ? '#3aedcc' : 'transparent'}`, color: type === 'feature' ? '#3aedcc' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <FaLightbulb /> Idée
                  </div>
                </div>

                <textarea required placeholder={type === 'bug' ? "Décris le problème rencontré..." : "Une idée pour améliorer l'app ?"} value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', resize: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }} />

                <button type="submit" disabled={status === 'sending'} style={{ background: 'white', color: 'black', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}>
                  {status === 'sending' ? 'Envoi...' : <><FaPaperPlane /> Envoyer</>}
                </button>
                {status === 'error' && <span style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>Erreur serveur. Réessaie plus tard.</span>}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LE BOUTON PILULE "BETA" */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 28px',
          borderRadius: '99px',
          background: '#ffffff',
          border: 'none',
          color: '#000000',
          fontSize: '1rem',
          fontWeight: '900',
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.8)',
          cursor: 'pointer'
        }}
      >
        {isOpen ? <FaTimes size={20} /> : "BETA"}
      </motion.button>
    </div>
  );
}