import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaDumbbell, FaFire, FaSave, FaHistory, FaTrash, FaRunning, FaStopwatch, FaBolt } from 'react-icons/fa';
import CustomModal from '../components/CustomModal';

export default function PrepaPage() {
  const [focus, setFocus] = useState('');
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  // --- ÉTAT DU MODAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  // --- SUGGESTIONS ---
  const suggestions = [
    "Explosivité", 
    "Cardio", 
    "Footwork", 
    "Gainage", 
    "Vitesse",
    "Récup"
  ];

  const closeModal = () => setModal({ ...modal, isOpen: false });

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/prepa/history', {
        headers: { 'x-auth-token': token }
      });
      setHistory(res.data);
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async (e) => {
    if(e) e.preventDefault();
    if (!focus.trim()) return;

    setLoading(true);
    setProgram(null); 

    const token = localStorage.getItem('token'); 
    try {
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      const res = await axios.post('http://localhost:5000/api/prepa', { focus }, config);
      setProgram(res.data);
    } catch (err) {
      console.error(err);
      setModal({
        isOpen: true,
        title: 'Erreur',
        message: 'Impossible de générer le programme. Vérifie ta connexion.',
        type: 'info'
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setModal({ isOpen: true, title: 'Connexion requise', message: 'Connecte-toi pour sauvegarder.', type: 'info' });
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/prepa/save', { focus, program }, { headers: { 'x-auth-token': token } });
      fetchHistory(); 
      setModal({ isOpen: true, title: 'Sauvegardé !', message: 'Ajouté à l\'historique.', type: 'info' });
    } catch (err) { console.error(err); }
  };

  const handleDelete = (id) => {
    setModal({
      isOpen: true, title: 'Supprimer ?', message: 'Retirer ce programme de l\'historique ?', type: 'danger', 
      onConfirm: async () => {
        const token = localStorage.getItem('token');
        try {
          await axios.delete(`http://localhost:5000/api/prepa/${id}`, { headers: { 'x-auth-token': token } });
          setHistory(history.filter(h => h._id !== id));
        } catch (err) { console.error(err); }
      }
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      
      <CustomModal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} />

      {/* --- EN-TÊTE --- */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ width: '60px', height: '60px', background: 'rgba(204, 255, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: '#ccff00' }}>
          <FaDumbbell size={30} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: 'white' }}>Générateur Physique</h1>
        <p style={{ color: '#888', marginTop: '10px' }}>Crée des séances sur-mesure avec l'IA</p>
      </header>

      {/* --- CARD DE RECHERCHE --- */}
      <div className="card" style={{ background: 'rgba(26, 26, 26, 0)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
          
          <label style={{ color: '#ccc', fontWeight: 'bold' }}>Ton objectif aujourd'hui ?</label>
          
          {/* --- SUGGESTIONS (BOUTONS FILTRES) --- */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '5px' }}>
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button" 
                onClick={() => setFocus(tag)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '15px',
                  border: focus === tag ? '1px solid #ccff00' : '1px solid rgba(255,255,255,0.1)',
                  background: focus === tag ? 'rgba(204, 255, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                  color: focus === tag ? '#ccff00' : '#888',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s',
                  fontWeight: focus === tag ? 'bold' : 'normal'
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* INPUT AMÉLIORÉ */}
            <input 
              type="text" 
              placeholder="Ou écris ton propre objectif..." 
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: '14px', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                background: 'rgba(255, 255, 255, 0.03)', 
                color: 'white', 
                outline: 'none',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ccff00';
                e.target.style.background = 'rgba(204, 255, 0, 0.02)';
                e.target.style.boxShadow = '0 0 15px rgba(204, 255, 0, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
              }}
            />

            {/* BOUTON AMÉLIORÉ */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%',
                padding: '16px', 
                borderRadius: '14px', 
                background: loading ? '#444' : '#ccff00', 
                color: 'black', 
                fontWeight: '800', 
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(204, 255, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(204, 255, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 15px rgba(204, 255, 0, 0.3)';
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                  `}</style>
                  <div style={{ width: '18px', height: '18px', border: '2px solid black', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  GÉNÉRATION...
                </span>
              ) : (
                <>
                  <FaFire style={{ fontSize: '1.2rem' }} />
                  Générer ma séance
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* --- RÉSULTAT --- */}
      {program && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#ccff00', margin: 0 }}>Séance : {focus}</h2>
            <button onClick={handleSave} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaSave /> Sauvegarder
            </button>
          </div>

          <div style={{ display: 'grid', gap: '20px', marginBottom: '50px' }}>
            <div className="card" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', borderLeft: '4px solid #fbbf24' }}>
              <h3 style={{ color: '#fbbf24', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FaRunning /> Échauffement</h3>
              <ul style={{ paddingLeft: '20px', color: '#ddd', lineHeight: '1.6' }}>{program.warmup.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="card" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', borderLeft: '4px solid #ccff00' }}>
              <h3 style={{ color: '#ccff00', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FaBolt /> Corps de Séance</h3>
              <ul style={{ paddingLeft: '20px', color: '#ddd', lineHeight: '1.6' }}>{program.main.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
            <div className="card" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', borderLeft: '4px solid #34d399' }}>
              <h3 style={{ color: '#34d399', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FaStopwatch /> Retour au calme</h3>
              <ul style={{ paddingLeft: '20px', color: '#ddd', lineHeight: '1.6' }}>{program.cooldown.map((item, i) => <li key={i}>{item}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORIQUE --- */}
      {history.length > 0 && (
        <>
          <h3 style={{ color: 'white', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaHistory /> Historique
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            {history.map((prog) => (
              <div key={prog._id} className="card" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <button onClick={() => handleDelete(prog._id)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }} onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#666'}><FaTrash /></button>
                <h4 style={{ color: 'white', margin: '0 0 5px 0' }}>{prog.focus}</h4>
                <p style={{ color: '#666', fontSize: '0.8rem', margin: '0 0 15px 0' }}>{new Date(prog.date).toLocaleDateString()}</p>
                <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                  <p><strong>🔥 Warmup:</strong> {prog.content?.warmup?.length || 0} exos</p>
                  <p><strong>💪 Main:</strong> {prog.content?.main?.length || 0} exos</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}