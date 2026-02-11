import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBook, FaCheck, FaTrash } from 'react-icons/fa';

export default function TrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [theme, setTheme] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  // --- CHARGEMENT ---
  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/trainings', {
        headers: { 'x-auth-token': token }
      });
      setTrainings(res.data);
    } catch (err) {
      console.error("Erreur chargement entraînements:", err);
    }
  };

  // --- SAUVEGARDE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!theme.trim()) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      await axios.post('http://localhost:5000/api/trainings', 
        { theme, notes, rating },
        { headers: { 'x-auth-token': token } }
      );
      
      setTheme('');
      setNotes('');
      setRating(5);
      fetchTrainings();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
    setLoading(false);
  };

  // --- SUPPRESSION (Au cas où tu l'avais dans ton ancien style) ---
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette séance ?")) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/trainings/${id}`, {
        headers: { 'x-auth-token': token }
      });
      fetchTrainings();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  // Styles focus
  const handleFocus = (e) => {
    e.target.style.borderColor = '#ccff00';
    e.target.style.boxShadow = '0 0 5px rgba(204, 255, 0, 0.2)';
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 20px 100px 20px' }}>
      
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        {/* --- ICÔNE EN-TÊTE --- */}
        <div style={{ 
          width: '70px', height: '70px', margin: '0 auto 15px auto', 
          background: 'var(--journal-bg)', 
          border: '2px solid #00eeff', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'var(--journal-color)', 
          boxShadow: '0 0 20px var(--journal-color)' 
        }}>
          <FaBook size={30} />
        </div>
        
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white', fontWeight: '800'}}>Mon Journal</h1>
        <p style={{ color: 'var(--journal-color)', marginTop: '2px', fontSize: '0.9rem'}}>Enregistre et analyse tes séances</p>
      </header>

      {/* ========================================== */}
      {/* 1. LE NOUVEAU FORMULAIRE (DARK / NEON)     */}
      {/* ========================================== */}
      <form 
        onSubmit={handleSubmit} 
        className="card" 
        style={{ 
          background: 'rgba(26, 26, 26, 0.2)', padding: '25px', borderRadius: '20px', 
          marginBottom: '40px', border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <h3 style={{ color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FaBook color="var(--journal-color)" /> Nouvelle séance
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Thème de la séance
          </label>
          <input 
            type="text" value={theme} onChange={(e) => setTheme(e.target.value)}
            placeholder="Ex: Défense smash, Filet..." 
            style={{
              width: '100%', padding: '12px 25px', background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '9999px',
              color: 'white', outline: 'none', fontSize: '0.95rem', transition: 'all 0.3s'
            }}
            onFocus={handleFocus} onBlur={handleBlur} required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Tes sensations / Notes
          </label>
          <textarea 
            value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Comment t'es-tu senti ?..." 
            style={{
              width: '100%', padding: '15px', background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', /* Rectangle doux */
              color: 'white', outline: 'none', minHeight: '100px', resize: 'vertical',
              fontSize: '0.95rem', fontFamily: 'var(--font-main)', transition: 'all 0.3s'
            }}
            onFocus={handleFocus} onBlur={handleBlur}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>Note de satisfaction</span>
            <span style={{ color: 'var(--journal-color)' }}>{rating}/10</span>
          </label>
          <input 
            type="range" min="1" max="10" value={rating} onChange={(e) => setRating(e.target.value)}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--journal-color)' }}
          />
        </div>

        <button 
          type="submit" disabled={loading}
          style={{ 
            width: '100%', padding: '15px', background: 'var(--journal-color)', border: 'none', 
            color: 'black', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, 
            fontSize: '1rem', borderRadius: '9999px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase'
          }}
        >
          {loading ? 'Analyse IA...' : <><FaCheck style={{ marginRight: '8px' }} /> Enregistrer & Analyser</>}
        </button>
      </form>


      {/* ========================================== */}
      {/* 2. L'ANCIEN STYLE POUR L'HISTORIQUE        */}
      {/* ========================================== */}
      <h2 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#fff' }}>Historique de tes entraînements</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {trainings.map(training => (
          <div key={training._id} className="card" style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--card-border)', 
            padding: '20px', 
            borderRadius: '16px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem' }}>{training.theme}</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: 'var(--journal-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>{training.rating}/10</span>
                {/* Bouton de suppression discret */}
                <button onClick={() => handleDelete(training._id)} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '5px' }}>
                  <FaTrash />
                </button>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px', fontStyle: 'italic' }}>
              Le {new Date(training.date).toLocaleDateString()}
            </p>
            
            <p style={{ color: 'var(--text-main)', fontSize: '1rem', marginBottom: '15px', lineHeight: '1.5' }}>
              {training.notes}
            </p>

            {training.aiFeedback && (
              <div style={{ background: 'var(--journal-bg)', padding: '15px', borderRadius: '10px', borderLeft: '4px solid var(--journal-color)' }}>
                <strong style={{ color: 'var(--journal-color)', display: 'block', marginBottom: '5px' }}>Coach IA :</strong>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>{training.aiFeedback}</p>
              </div>
            )}
          </div>
        ))}

        {trainings.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            Aucun entraînement pour le moment.
          </p>
        )}
      </div>

    </div>
  );
}