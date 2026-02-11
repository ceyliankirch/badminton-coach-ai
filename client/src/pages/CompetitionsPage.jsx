import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTrophy, FaYoutube, FaRobot, FaMedal, FaUsers, FaSave, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CustomModal from '../components/CustomModal'; 

// =====================================================================
// COMPOSANT : MENU DÉROULANT SUR-MESURE (Importé du Profil)
// =====================================================================
const CustomSelect = ({ label, name, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      {label && <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '12px 25px',
          background: isOpen ? '#1a1a1a' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isOpen ? '#ccff00' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '9999px', 
          color: 'white', fontSize: '0.9rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 5px rgba(204, 255, 0, 0.3)' : 'none'
        }}
      >
        {selectedOption.label}
        {/* NOUVEAU : Marge à droite (marginRight) ajoutée sur la flèche */}
        <FaChevronDown style={{ color: '#888', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', marginRight: '10px' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '5px',
          background: '#111', border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px', overflow: 'hidden', zIndex: 100,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange({ target: { name, value: opt.value } });
                setIsOpen(false);
              }}
              style={{
                padding: '12px 15px', color: value === opt.value ? '#ccff00' : 'white',
                background: value === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent',
                cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204, 255, 0, 0.1)'; e.currentTarget.style.color = '#ccff00'; }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = value === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent'; 
                e.currentTarget.style.color = value === opt.value ? '#ccff00' : 'white';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =====================================================================
// PAGE PRINCIPALE : COMPÉTITIONS
// =====================================================================
const CompetitionsPage = () => {
  // --- ÉTATS ---
  const [formData, setFormData] = useState({
    category: 'Tournoi',
    tableau: 'Simple Homme', // J'ai ajusté la valeur par défaut pour coller aux options
    result: 'Victoire',
    scores: {
      set1: { me: '', opp: '' },
      set2: { me: '', opp: '' },
      set3: { me: '', opp: '' }
    },
    description: '',
    videoUrl: ''
  });

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState({});

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', 
    onConfirm: null 
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // --- CHARGEMENT ---
  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get('http://localhost:5000/api/competitions', {
        headers: { 'x-auth-token': token }
      });
      setMatches(res.data);
    } catch (err) { console.error("Erreur fetch:", err); }
  };

  // --- ACTIONS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleScoreChange = (set, player, value) => {
    setFormData(prev => ({
      ...prev,
      scores: { ...prev.scores, [set]: { ...prev.scores[set], [player]: value } }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
        setModal({
            isOpen: true,
            title: 'Authentification requise',
            message: 'Tu dois être connecté pour enregistrer un match.',
            type: 'info'
        });
        setLoading(false);
        return;
    }

    try {
      await axios.post('http://localhost:5000/api/competitions', formData, {
        headers: { 'x-auth-token': token }
      });
      
      fetchMatches(); 
      
      setFormData({
        category: 'Tournoi', tableau: 'Simple Homme', result: 'Victoire',
        description: '', videoUrl: '',
        scores: { set1: { me: '', opp: '' }, set2: { me: '', opp: '' }, set3: { me: '', opp: '' } }
      });

      setModal({
          isOpen: true,
          title: 'Match enregistré !',
          message: 'Ton match a été ajouté à l\'historique avec succès.',
          type: 'info'
      });

    } catch (err) { console.error("Erreur envoi:", err); }
    setLoading(false);
  };

  const deleteMatch = (id, e) => {
    e.stopPropagation(); 
    setModal({
        isOpen: true,
        title: 'Supprimer ce match ?',
        message: 'Cette action est définitive. Veux-tu vraiment retirer ce match de ton historique ?',
        type: 'danger', 
        onConfirm: async () => {
            const token = localStorage.getItem('token');
            try {
              await axios.delete(`http://localhost:5000/api/competitions/${id}`, {
                headers: { 'x-auth-token': token }
              });
              setMatches(prev => prev.filter(m => m._id !== id));
            } catch (err) { console.error("Erreur suppression:", err); }
        }
    });
  };

  const toggleMatch = (id) => {
    setExpandedMatches(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  // --- RENDU ---
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      
      <CustomModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />

      <style>{`
        .input-dark {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: white;
            padding: 12px;
            width: 100%;
            outline: none;
            font-family: inherit;
        }
        .input-dark:focus { border-color: #ccff00; }
        
        .choice-btn {
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05);
            color: #ccc;
            cursor: pointer;
            text-align: center;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            transition: 0.2s;
        }
        
        .choice-btn.active-tournoi { border-color: var(--competition-color); color: var(--competition-color); background: rgba(255, 187, 0, 0.1); font-weight: bold; }
        .choice-btn.active-win { border-color: #4ade80; color: #4ade80; background: rgba(74, 222, 128, 0.1); font-weight: bold; }
        .choice-btn.active-lose { border-color: #f87171; color: #f87171; background: rgba(248, 113, 113, 0.1); font-weight: bold; }

        .score-grid { display: grid; grid-template-columns: 60px 1fr 1fr 1fr; gap: 10px; align-items: center; text-align: center; }
        .score-label { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; }
      `}</style>

      {/* --- HEADER --- */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          width: '70px', height: '70px', margin: '0 auto 15px auto', 
          background: 'var(--competition-bg)', 
          border: '2px solid var(--competition-color)', 
          borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'var(--competition-color)', 
          boxShadow: '0 0 20px rgba(255, 187, 0, 0.2)' 
        }}>
          <FaTrophy size={30} />
        </div>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white', fontWeight: 800}}>Compétitions</h1>
        <p style={{ color: 'var(--competition-color)', marginTop: '2px', fontSize: '0.9rem' }}>Suis tes matchs et analyse tes stats</p>
      </header>

      {/* --- FORMULAIRE D'AJOUT --- */}
      <div className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div className={`choice-btn ${formData.category === 'Tournoi' ? 'active-tournoi' : ''}`} onClick={() => setFormData({...formData, category:'Tournoi'})}>
            <FaMedal /> Tournoi
          </div>
          <div className={`choice-btn ${formData.category === 'Interclub' ? 'active-tournoi' : ''}`} onClick={() => setFormData({...formData, category:'Interclub'})} >
            <FaUsers /> Interclub
          </div>
        </div>

        {/* NOUVEAU MENU DÉROULANT AU LIEU DU <select> NATIF */}
        <div style={{ marginBottom: '20px' }}>
          <CustomSelect 
            name="tableau" 
            value={formData.tableau} 
            onChange={handleChange}
            options={[
              { value: "Simple Homme", label: "Simple Homme" },
              { value: "Simple Dame", label: "Simple Dame" },
              { value: "Double Homme", label: "Double Homme" },
              { value: "Double Dame", label: "Double Dame" },
              { value: "Mixte", label: "Mixte" }
            ]}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div className={`choice-btn ${formData.result === 'Victoire' ? 'active-win' : ''}`} onClick={() => setFormData({...formData, result:'Victoire'})}>
            VICTOIRE 🏆
          </div>
          <div className={`choice-btn ${formData.result === 'Défaite' ? 'active-lose' : ''}`} onClick={() => setFormData({...formData, result:'Défaite'})}>
            DÉFAITE ❌
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="score-grid">
            <div /> <div className="score-label">SET 1</div> <div className="score-label">SET 2</div> <div className="score-label">SET 3</div>
            <div style={{ fontWeight: 'bold', color: '#ccff00', fontSize: '0.9rem' }}>MOI</div>
            <input type="text" className="input-dark" style={{textAlign:'center', fontSize: '0.8rem', borderRadius:'9999px'}} placeholder="21" value={formData.scores.set1.me} onChange={(e)=>handleScoreChange('set1','me',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', margin:'0', fontSize: '0.8rem',borderRadius:'9999px'}} placeholder="21" value={formData.scores.set2.me} onChange={(e)=>handleScoreChange('set2','me',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', fontSize: '1rem', borderRadius:'9999px'}} placeholder="-" value={formData.scores.set3.me} onChange={(e)=>handleScoreChange('set3','me',e.target.value)} />
            <div style={{ fontWeight: 'bold', color: '#f87171', fontSize: '0.9rem' }}>ADV</div>
            <input type="text" className="input-dark" style={{textAlign:'center', fontSize: '1rem', borderRadius:'9999px'}} placeholder="19" value={formData.scores.set1.opp} onChange={(e)=>handleScoreChange('set1','opp',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', fontSize: '1rem', borderRadius:'9999px'}} placeholder="19" value={formData.scores.set2.opp} onChange={(e)=>handleScoreChange('set2','opp',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', fontSize: '1rem', borderRadius:'9999px'}} placeholder="-" value={formData.scores.set3.opp} onChange={(e)=>handleScoreChange('set3','opp',e.target.value)} />
          </div>
        </div>

        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Ressenti, stratégie, points forts/faibles..." className="input-dark" style={{ minHeight: '80px', marginBottom: '15px', resize: 'vertical', borderRadius: '12px' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FaYoutube size={24} color="#ef4444" />
          <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="Coller le lien YouTube ici" className="input-dark" style={{borderRadius: '9999px'}} />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ width: '100%', padding: '15px', background: 'var(--competition-color)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}>
          {loading ? 'Analyse IA en cours...' : <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><FaSave /> ENREGISTRER LE MATCH</span>}
        </button>
      </div>

      {/* --- HISTORIQUE (ACCORDÉON) --- */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#fff' }}>Historique des Matchs</h3>
      {matches.length === 0 && <p style={{color: '#666', textAlign: 'center'}}>Aucun match enregistré.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {matches.map((match) => (
          <div 
            key={match._id} 
            className="card" 
            onClick={() => toggleMatch(match._id)}
            style={{ 
              background: '#1a1a1a', 
              padding: '20px', 
              borderRadius: '16px', 
              borderLeft: `4px solid ${match.result === 'Victoire' ? '#4ade80' : '#f87171'}`,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              cursor: 'pointer', 
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1a1a1a'}
          >
            
            {/* --- HEADER (Toujours visible) --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: match.result === 'Victoire' ? '#4ade80' : '#f87171', display: 'block', marginBottom: '4px' }}>
                  {match.result.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                  {match.category} - {match.tableau}
                </span>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                  {new Date(match.date).toLocaleDateString()}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {match.scores.set1.me}-{match.scores.set1.opp}
                  {match.scores.set2.me && ` / ${match.scores.set2.me}-${match.scores.set2.opp}`}
                </span>

                <div style={{ color: '#888' }}>
                   {expandedMatches[match._id] ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                <button onClick={(e) => deleteMatch(match._id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}>
                  <FaTrash size={16} color="#444" onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#444'} />
                </button>
              </div>
            </div>

            {/* --- DÉTAILS (Visible seulement si ouvert) --- */}
            {expandedMatches[match._id] && (
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', animation: 'fadeIn 0.3s' }}>
                
                {match.description && (
                    <p style={{ fontSize: '0.95rem', color: '#ddd', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.5' }}>
                        "{match.description}"
                    </p>
                )}
                
                {match.aiFeedback && (
                  <div style={{ background: 'rgba(204, 255, 0, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(204, 255, 0, 0.2)', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccff00', fontWeight: 'bold', marginBottom: '5px', fontSize: '0.9rem' }}>
                      <FaRobot /> Coach IA
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#eee', margin: 0 }}>{match.aiFeedback}</p>
                  </div>
                )}

                {match.videoUrl && getEmbedUrl(match.videoUrl) && (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}>
                    <iframe src={getEmbedUrl(match.videoUrl)} width="100%" height="300" frameBorder="0" allowFullScreen title="Match Video" />
                  </div>
                )}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetitionsPage;