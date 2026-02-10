import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrophy, FaYoutube, FaRobot, FaMedal, FaUsers, FaSave, FaTrash } from 'react-icons/fa';

const CompetitionsPage = () => {
  // --- ÉTATS ---
  const [formData, setFormData] = useState({
    category: 'Tournoi',
    tableau: 'Simple',
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

  // --- CHARGEMENT ---
  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/competitions');
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
    try {
      await axios.post('http://localhost:5000/api/competitions', formData);
      fetchMatches();
      setFormData(prev => ({
        ...prev,
        description: '',
        videoUrl: '',
        scores: { set1: { me: '', opp: '' }, set2: { me: '', opp: '' }, set3: { me: '', opp: '' } }
      }));
    } catch (err) { console.error("Erreur envoi:", err); }
    setLoading(false);
  };

  const deleteMatch = async (id) => {
    if (window.confirm("Supprimer ce match ?")) {
      try {
        await axios.delete(`http://localhost:5000/api/competitions/${id}`);
        fetchMatches();
      } catch (err) { console.error("Erreur suppression:", err); }
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  return (
    <div className="competitions-wrapper">
      <style>{`
        .competitions-wrapper { padding: 20px; max-width: 800px; margin: 0 auto; color: white; padding-bottom: 100px; }
        .section-title { font-size: 2rem; font-weight: 800; background: linear-gradient(90deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 30px; display: flex; align-items: center; gap: 15px; }
        
        .glass-card { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; padding: 24px; margin-bottom: 25px; }
        .input-dark { background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: white; padding: 12px; width: 100%; outline: none; }
        
        .horizontal-group { display: flex; gap: 12px; margin-bottom: 20px; }
        .choice-btn { flex: 1; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px; text-align: center; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; }
        .choice-btn.active-tournoi { border-color: #8b5cf6; background: rgba(139, 92, 246, 0.15); color: #c4b5fd; }
        .choice-btn.active-win { border-color: #22c55e; background: rgba(34, 197, 94, 0.15); color: #4ade80; }
        .choice-btn.active-lose { border-color: #ef4444; background: rgba(239, 68, 68, 0.15); color: #f87171; }
        
        .score-box { background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.05); }
        .score-grid { display: grid; grid-template-columns: 50px 1fr 1fr 1fr; gap: 8px; align-items: center; text-align: center; }
        .btn-neon { width: 100%; background: linear-gradient(135deg, #7c3aed, #2563eb); border: none; padding: 15px; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3); transition: 0.3s; }
        
        .match-card { border-left: 4px solid #334155; }
        .match-card.win { border-left-color: #10b981; }
        .match-card.lose { border-left-color: #ef4444; }
      `}</style>

      <h1 className="section-title">
        <FaTrophy style={{ color: '#fbbf24' }} /> Compétitions
      </h1>

      <div className="glass-card">
        {/* Type Sélection */}
        <div className="horizontal-group">
          <div className={`choice-btn ${formData.category === 'Tournoi' ? 'active-tournoi' : ''}`} onClick={() => setFormData({...formData, category:'Tournoi'})}>
            <FaMedal /> Tournoi
          </div>
          <div className={`choice-btn ${formData.category === 'Interclub' ? 'active-tournoi' : ''}`} onClick={() => setFormData({...formData, category:'Interclub'})}>
            <FaUsers /> Interclub
          </div>
        </div>

        <select name="tableau" value={formData.tableau} onChange={handleChange} className="input-dark" style={{marginBottom: '20px'}}>
          <option>Simple</option><option>Double</option><option>Mixte</option>
        </select>

        {/* Résultat Sélection */}
        <div className="horizontal-group">
          <div className={`choice-btn ${formData.result === 'Victoire' ? 'active-win' : ''}`} onClick={() => setFormData({...formData, result:'Victoire'})}>
            VICTOIRE 🏆
          </div>
          <div className={`choice-btn ${formData.result === 'Défaite' ? 'active-lose' : ''}`} onClick={() => setFormData({...formData, result:'Défaite'})}>
            DÉFAITE ❌
          </div>
        </div>

        {/* Grille de Scores */}
        <div className="score-box">
          <div className="score-grid">
            <div /> <div style={{fontSize:'0.7rem', color:'#64748b'}}>SET 1</div> <div style={{fontSize:'0.7rem', color:'#64748b'}}>SET 2</div> <div style={{fontSize:'0.7rem', color:'#64748b'}}>SET 3</div>
            <div style={{color: '#60a5fa', fontWeight:'bold', fontSize:'0.8rem'}}>MOI</div>
            <input type="text" className="input-dark" style={{textAlign:'center', padding:'8px'}} placeholder="21" value={formData.scores.set1.me} onChange={(e)=>handleScoreChange('set1','me',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', padding:'8px'}} placeholder="21" value={formData.scores.set2.me} onChange={(e)=>handleScoreChange('set2','me',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', padding:'8px'}} placeholder="-" value={formData.scores.set3.me} onChange={(e)=>handleScoreChange('set3','me',e.target.value)} />
            <div style={{color: '#f87171', fontWeight:'bold', fontSize:'0.8rem'}}>ADV</div>
            <input type="text" className="input-dark" style={{textAlign:'center', padding:'8px'}} placeholder="15" value={formData.scores.set1.opp} onChange={(e)=>handleScoreChange('set1','opp',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', padding:'8px'}} placeholder="15" value={formData.scores.set2.opp} onChange={(e)=>handleScoreChange('set2','opp',e.target.value)} />
            <input type="text" className="input-dark" style={{textAlign:'center', padding:'8px'}} placeholder="-" value={formData.scores.set3.opp} onChange={(e)=>handleScoreChange('set3','opp',e.target.value)} />
          </div>
        </div>

        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Décris ton match..." className="input-dark" style={{minHeight:'80px', marginBottom:'15px'}} />
        
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px'}}>
          <FaYoutube size={24} color="#ef4444" />
          <input type="text" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="Lien Vidéo YouTube" className="input-dark" />
        </div>

        <button onClick={handleSubmit} disabled={loading} className="btn-neon">
          {loading ? 'Analyse en cours...' : <><FaSave /> ENREGISTRER LE MATCH</>}
        </button>
      </div>

      {/* --- HISTORIQUE --- */}
      {matches.map((match) => (
        <div key={match._id} className={`glass-card match-card ${match.result === 'Victoire' ? 'win' : 'lose'}`}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <div>
              <span style={{fontWeight:'bold', color: match.result === 'Victoire' ? '#4ade80' : '#f87171'}}>
                {match.result.toUpperCase()}
              </span>
              <span style={{marginLeft:'10px', fontSize:'0.8rem', color:'#94a3b8'}}>
                {match.category} - {match.tableau}
              </span>
            </div>
            
            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <span style={{background:'rgba(255,255,255,0.05)', padding:'5px 12px', borderRadius:'8px', fontSize:'0.9rem', fontFamily:'monospace'}}>
                {match.scores.set1.me}-{match.scores.set1.opp} / {match.scores.set2.me}-{match.scores.set2.opp}
                {match.scores.set3.me && ` / ${match.scores.set3.me}-${match.scores.set3.opp}`}
              </span>

              {/* BOUTON SUPPRIMER avec ta classe et icône rouge */}
              <button onClick={() => deleteMatch(match._id)} className="delete-btn">
                <FaTrash size={14} color="#ef4444" />
              </button>
            </div>
          </div>

          <p style={{fontSize:'0.9rem', color:'#cbd5e1', fontStyle:'italic', marginBottom:'15px'}}>"{match.description}"</p>
          
          {match.aiFeedback && (
            <div style={{background:'rgba(96, 165, 250, 0.05)', padding:'15px', borderRadius:'12px', border:'1px solid rgba(96, 165, 250, 0.15)'}}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', color:'#60a5fa', fontWeight:'bold', marginBottom:'5px', fontSize:'0.9rem'}}>
                <FaRobot /> Coach IA
              </div>
              <p style={{fontSize:'0.85rem', lineHeight:'1.4', color:'#bfdbfe'}}>{match.aiFeedback}</p>
            </div>
          )}

          {match.videoUrl && getEmbedUrl(match.videoUrl) && (
            <div style={{marginTop:'15px', borderRadius:'12px', overflow:'hidden'}}>
              <iframe src={getEmbedUrl(match.videoUrl)} width="100%" height="200" frameBorder="0" allowFullScreen title="vid" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CompetitionsPage;