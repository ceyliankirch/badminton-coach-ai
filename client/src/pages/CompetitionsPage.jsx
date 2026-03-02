import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTrophy, FaRobot, FaMedal, FaUsers, FaSave, FaTrash, FaEdit, FaChevronDown, FaChevronUp, FaPlus, FaTimes, FaFolder, FaFolderOpen } from 'react-icons/fa';
import CustomModal from '../components/CustomModal'; 

// =====================================================================
// COMPOSANT : MENU DÉROULANT SUR-MESURE
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
          borderRadius: '9999px', color: selectedOption && selectedOption.value === '' ? '#888' : 'white', fontSize: '0.9rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 5px rgba(204, 255, 0, 0.3)' : 'none'
        }}
      >
        {selectedOption ? selectedOption.label : 'Sélectionner...'}
        <FaChevronDown style={{ color: '#888', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', marginLeft: '10px' }} />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '5px',
          background: '#111', border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px', overflow: 'hidden', zIndex: 100,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          maxHeight: '200px', overflowY: 'auto'
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
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const initialFormState = {
    category: 'Tournoi',
    eventName: '',
    stage: 'Match de poule',
    tableau: 'Simple Homme', 
    result: '',
    scores: {
      set1: { me: '', opp: '' },
      set2: { me: '', opp: '' },
      set3: { me: '', opp: '' }
    },
    description: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour les dossiers et les cartes de matchs
  const [expandedFolders, setExpandedFolders] = useState({});
  const [expandedMatches, setExpandedMatches] = useState({});
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  
  // TOUJOURS false au départ = Dropdown affiché par défaut
  const [isAddingEvent, setIsAddingEvent] = useState(false); 

  const closeModal = () => setModal({ ...modal, isOpen: false });

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/competitions`, { headers: { 'x-auth-token': token } });
      setMatches(res.data);
    } catch (err) { console.error("Erreur fetch:", err); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCategoryChange = (cat) => {
      setFormData({ ...formData, category: cat, eventName: '' });
      setIsAddingEvent(false);
  };

  // --- LISTE DES ÉVÉNEMENTS (TOURNOIS) ---
  const uniqueEvents = [...new Set(matches
    .filter(m => m.category === formData.category && m.eventName)
    .map(m => m.eventName)
  )];
  if (formData.eventName && !uniqueEvents.includes(formData.eventName) && !isAddingEvent) {
      uniqueEvents.push(formData.eventName);
  }

  const eventOptions = [
      { value: '', label: `Sélectionner un ${formData.category === 'Tournoi' ? 'tournoi' : 'interclub'}...` },
      ...uniqueEvents.map(e => ({ value: e, label: e }))
  ];

  // --- GROUPEMENT DES MATCHS PAR DOSSIERS ---
  const groupedMatches = matches.reduce((acc, match) => {
    const groupName = match.eventName || (match.category === 'Tournoi' ? 'Tournoi non spécifié' : 'Interclub non spécifié');
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(match);
    return acc;
  }, {});

  const sortedGroupNames = Object.keys(groupedMatches).sort((a, b) => {
    const latestA = Math.max(...groupedMatches[a].map(m => new Date(m.date).getTime()));
    const latestB = Math.max(...groupedMatches[b].map(m => new Date(m.date).getTime()));
    return latestB - latestA;
  });

  // Gestion des scores
  const handleScoreChange = (set, player, value, nextFieldId) => {
    if (!/^\d*$/.test(value) || value.length > 2) return;
    setFormData(prev => ({
      ...prev,
      scores: { ...prev.scores, [set]: { ...prev.scores[set], [player]: value } }
    }));
    if (value.length === 2 && nextFieldId) {
      document.getElementById(nextFieldId)?.focus();
    }
  };

  const getSetWinner = (me, opp) => {
    if (!me || !opp) return null;
    return Number(me) > Number(opp) ? 'me' : (Number(opp) > Number(me) ? 'opp' : null);
  };

  const s1Winner = getSetWinner(formData.scores.set1.me, formData.scores.set1.opp);
  const s2Winner = getSetWinner(formData.scores.set2.me, formData.scores.set2.opp);
  const showSet3 = (s1Winner && s2Winner && s1Winner !== s2Winner);

  const isScoreConsistent = () => {
    let meWins = 0; let oppWins = 0;
    if (s1Winner === 'me') meWins++; else if (s1Winner === 'opp') oppWins++;
    if (s2Winner === 'me') meWins++; else if (s2Winner === 'opp') oppWins++;
    const s3Winner = getSetWinner(formData.scores.set3.me, formData.scores.set3.opp);
    if (s3Winner === 'me') meWins++; else if (s3Winner === 'opp') oppWins++;

    if (formData.result === 'Victoire' && oppWins > meWins) return false;
    if (formData.result === 'Défaite' && meWins > oppWins) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.result) {
        setModal({ isOpen: true, title: 'Attention', message: 'Tu dois indiquer si tu as gagné ou perdu.', type: 'info' });
        return;
    }
    if (!isScoreConsistent()) {
        setModal({ isOpen: true, title: 'Erreur de Score', message: `Tu as coché "${formData.result}" mais les scores indiquent l'inverse.`, type: 'danger' });
        return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/competitions/${editingId}`, formData, { headers: { 'x-auth-token': token } });
        setModal({ isOpen: true, title: 'Modifié !', message: 'Ton match a été mis à jour.', type: 'info' });
      } else {
        await axios.post(`${API_URL}/api/competitions`, formData, { headers: { 'x-auth-token': token } });
        setModal({ isOpen: true, title: 'Enregistré !', message: 'Ton match a été ajouté à l\'historique.', type: 'info' });
      }
      
      fetchMatches(); 
      setFormData(initialFormState);
      setEditingId(null);
      setIsAddingEvent(false); 
      
      // On ouvre automatiquement le dossier du tournoi qu'on vient d'enregistrer
      if (formData.eventName) {
          setExpandedFolders(prev => ({ ...prev, [formData.eventName]: true }));
      }
    } catch (err) { console.error("Erreur envoi:", err); }
    
    setLoading(false);
  };

  const editMatch = (match, e) => {
    e.stopPropagation();
    setFormData({
        category: match.category || 'Tournoi',
        eventName: match.eventName || '',
        stage: match.stage || 'Match de poule',
        tableau: match.tableau || 'Simple Homme',
        result: match.result || 'Victoire',
        scores: match.scores || initialFormState.scores,
        description: match.description || ''
    });
    setEditingId(match._id);
    setIsAddingEvent(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteMatch = (id, e) => {
    e.stopPropagation(); 
    setModal({
        isOpen: true, title: 'Supprimer ce match ?', message: 'Veux-tu vraiment retirer ce match ?', type: 'danger', 
        onConfirm: async () => {
            const token = localStorage.getItem('token');
            try {
              await axios.delete(`${API_URL}/api/competitions/${id}`, { headers: { 'x-auth-token': token } });
              setMatches(prev => prev.filter(m => m._id !== id));
            } catch (err) { console.error("Erreur suppression:", err); }
        }
    });
  };

  const toggleFolder = (folderName) => setExpandedFolders(p => ({ ...p, [folderName]: !p[folderName] }));
  const toggleMatch = (id) => setExpandedMatches(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      
      <CustomModal isOpen={modal.isOpen} onClose={closeModal} title={modal.title} message={modal.message} type={modal.type} onConfirm={modal.onConfirm} />

      <style>{`
        .input-dark { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; color: white; padding: 12px; width: 100%; outline: none; font-family: inherit; transition: 0.2s;}
        .input-dark:focus { border-color: #ccff00; }
        .choice-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #ccc; cursor: pointer; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
        .choice-btn.active-tournoi { border-color: var(--competition-color); color: var(--competition-color); background: rgba(255, 187, 0, 0.1); font-weight: bold; }
        .choice-btn.active-win { border-color: #4ade80; color: #4ade80; background: rgba(74, 222, 128, 0.1); font-weight: bold; }
        .choice-btn.active-lose { border-color: #f87171; color: #f87171; background: rgba(248, 113, 113, 0.1); font-weight: bold; }
        .score-grid { display: grid; grid-template-columns: 50px 1fr 1fr 1fr; gap: 10px; align-items: center; text-align: center; }
        .score-label { font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; }

        /* NOUVEAU DESIGN DOSSIERS & CARTES CARRÉES */
        .folder-header { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 15px 20px; border-radius: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); margin-top: 25px; transition: 0.2s; }
        .folder-header:hover { background: rgba(255,255,255,0.08); }
        .matches-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        
        .square-card { background: #1a1a1a; padding: 18px; border-radius: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; min-height: 160px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .square-card:hover { background: #222; transform: translateY(-3px); }
        
        .expanded-card { grid-column: 1 / -1; background: #1a1a1a; padding: 20px; border-radius: 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .expanded-card:hover { background: #222; }
      `}</style>

      {/* --- HEADER --- */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ width: '70px', height: '70px', margin: '0 auto 15px auto', background: 'var(--competition-bg)', border: '2px solid var(--competition-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--competition-color)', boxShadow: '0 0 20px rgba(255, 187, 0, 0.2)' }}>
          <FaTrophy size={30} />
        </div>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white', fontWeight: 800}}>Compétitions</h1>
      </header>

      {/* --- FORMULAIRE D'AJOUT/MODIF --- */}
      <div className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', padding: '25px', borderRadius: '20px', border: editingId ? '1px solid #ccff00' : '1px solid rgba(255,255,255,0.1)', marginBottom: '40px' }}>
        {editingId && <div style={{color: '#ccff00', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center'}}>✏️ Mode Modification</div>}
        
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div className={`choice-btn ${formData.category === 'Tournoi' ? 'active-tournoi' : ''}`} onClick={() => handleCategoryChange('Tournoi')}>
            <FaMedal /> Tournoi
          </div>
          <div className={`choice-btn ${formData.category === 'Interclub' ? 'active-tournoi' : ''}`} onClick={() => handleCategoryChange('Interclub')} >
            <FaUsers /> Interclub
          </div>
        </div>

        {/* --- SÉLECTION OU CRÉATION D'ÉVÉNEMENT (PAR DÉFAUT EN DROPDOWN) --- */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
          {isAddingEvent ? (
            <>
              {/* CHAMP TEXTE POUR NOUVEAU TOURNOI */}
              <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} placeholder={`Nom du nouveau ${formData.category === 'Tournoi' ? 'tournoi' : 'rencontre'}...`} className="input-dark" style={{ flex: 1, borderRadius: '9999px' }} autoFocus />
              <button type="button" onClick={() => { setIsAddingEvent(false); setFormData({ ...formData, eventName: '' }); }} style={{ background: 'rgba(248, 113, 113, 0.2)', color: '#f87171', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(248, 113, 113, 0.5)', cursor: 'pointer', flexShrink: 0 }}>
                <FaTimes size={18} />
              </button>
            </>
          ) : (
            <>
              {/* DROPDOWN POUR TOURNOI EXISTANT (Même si vide) */}
              <div style={{ flex: 1 }}>
                <CustomSelect name="eventName" value={formData.eventName} onChange={handleChange} options={eventOptions} />
              </div>
              <button type="button" onClick={() => { setIsAddingEvent(true); setFormData({ ...formData, eventName: '' }); }} style={{ background: 'var(--primary)', color: 'black', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0, boxShadow: '0 0 10px rgba(0, 255, 140, 0.4)' }}>
                <FaPlus size={18} />
              </button>
            </>
          )}
        </div>

        {/* STADE ET TABLEAU */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {formData.category === 'Tournoi' && (
                <div style={{ flex: 1 }}>
                    <CustomSelect name="stage" value={formData.stage} onChange={handleChange} options={[
                        { value: "Match de poule", label: "Poule" },
                        { value: "1/16e de finale", label: "1/16e de finale" },
                        { value: "1/8e de finale", label: "1/8e de finale" },
                        { value: "Quart de finale", label: "Quart de finale" },
                        { value: "Demi-finale", label: "Demi-finale" },
                        { value: "Finale", label: "Finale" }
                    ]} />
                </div>
            )}
            <div style={{ flex: 1 }}>
                <CustomSelect name="tableau" value={formData.tableau} onChange={handleChange} options={[
                    { value: "Simple Homme", label: "Simple Homme" },
                    { value: "Simple Dame", label: "Simple Dame" },
                    { value: "Double Homme", label: "Double Homme" },
                    { value: "Double Dame", label: "Double Dame" },
                    { value: "Mixte", label: "Mixte" }
                ]} />
            </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div className={`choice-btn ${formData.result === 'Victoire' ? 'active-win' : ''}`} onClick={() => setFormData({...formData, result:'Victoire'})}>
            VICTOIRE 🏆
          </div>
          <div className={`choice-btn ${formData.result === 'Défaite' ? 'active-lose' : ''}`} onClick={() => setFormData({...formData, result:'Défaite'})}>
            DÉFAITE ❌
          </div>
        </div>

        {formData.result && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.3s' }}>
                <div className="score-grid">
                    <div /> <div className="score-label">SET 1</div> <div className="score-label">SET 2</div> <div className="score-label" style={{ opacity: showSet3 ? 1 : 0.3 }}>SET 3</div>
                    
                    <div style={{ fontWeight: 'bold', color: '#ccff00', fontSize: '0.9rem' }}>MOI</div>
                    <input id="me1" type="text" className="input-dark" style={{textAlign:'center', borderRadius:'9999px'}} placeholder="21" value={formData.scores.set1.me} onChange={(e)=>handleScoreChange('set1','me',e.target.value, 'opp1')} />
                    <input id="me2" type="text" className="input-dark" style={{textAlign:'center', borderRadius:'9999px'}} placeholder="21" value={formData.scores.set2.me} onChange={(e)=>handleScoreChange('set2','me',e.target.value, 'opp2')} />
                    {showSet3 ? <input id="me3" type="text" className="input-dark" style={{textAlign:'center', borderRadius:'9999px', animation: 'fadeIn 0.3s'}} placeholder="21" value={formData.scores.set3.me} onChange={(e)=>handleScoreChange('set3','me',e.target.value, 'opp3')} /> : <div />}
                    
                    <div style={{ fontWeight: 'bold', color: '#f87171', fontSize: '0.9rem' }}>ADV</div>
                    <input id="opp1" type="text" className="input-dark" style={{textAlign:'center', borderRadius:'9999px'}} placeholder="19" value={formData.scores.set1.opp} onChange={(e)=>handleScoreChange('set1','opp',e.target.value, 'me2')} />
                    <input id="opp2" type="text" className="input-dark" style={{textAlign:'center', borderRadius:'9999px'}} placeholder="19" value={formData.scores.set2.opp} onChange={(e)=>handleScoreChange('set2','opp',e.target.value, showSet3 ? 'me3' : null)} />
                    {showSet3 ? <input id="opp3" type="text" className="input-dark" style={{textAlign:'center', borderRadius:'9999px', animation: 'fadeIn 0.3s'}} placeholder="19" value={formData.scores.set3.opp} onChange={(e)=>handleScoreChange('set3','opp',e.target.value, null)} /> : <div />}
                </div>
            </div>
        )}

        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Ressenti, stratégie, points forts/faibles..." className="input-dark" style={{ minHeight: '80px', marginBottom: '20px', resize: 'vertical', borderRadius: '12px' }} />

        <div style={{ display: 'flex', gap: '10px' }}>
            {editingId && (
                <button onClick={() => {setEditingId(null); setFormData(initialFormState); setIsAddingEvent(false);}} className="btn-primary" style={{ background: '#444', color: 'white', border: 'none', borderRadius: '9999px', padding: '15px', cursor: 'pointer' }}>
                    ANNULER
                </button>
            )}
            <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex: 1, padding: '15px', background: 'var(--competition-color)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}>
            {loading ? 'Analyse...' : <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}}><FaSave /> {editingId ? 'METTRE À JOUR' : 'ENREGISTRER LE MATCH'}</span>}
            </button>
        </div>
      </div>

      {/* --- HISTORIQUE --- */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#fff' }}>Historique des Matchs</h3>
      {matches.length === 0 && <p style={{color: '#666', textAlign: 'center'}}>Aucun match enregistré.</p>}

      {/* AFFICHAGE DES DOSSIERS */}
      {sortedGroupNames.map(folderName => (
          <div key={folderName}>
              
              {/* En-tête du dossier (Clic = Ouvrir/Fermer) */}
              <div className="folder-header" onClick={() => toggleFolder(folderName)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {expandedFolders[folderName] ? <FaFolderOpen color="#ccff00" size={20} /> : <FaFolder color="#aaa" size={20} />}
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>{folderName}</h3>
                  </div>
                  <div style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                      {groupedMatches[folderName].length} match(s)
                      {expandedFolders[folderName] ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
              </div>

              {/* Contenu du dossier (Grille de cartes) */}
              {expandedFolders[folderName] && (
                  <div className="matches-grid">
                      {groupedMatches[folderName].map(match => {
                          const isExpanded = expandedMatches[match._id];

                          return (
                              <div 
                                  key={match._id} 
                                  className={isExpanded ? 'expanded-card' : 'square-card'}
                                  onClick={() => toggleMatch(match._id)}
                                  style={{ borderTop: `4px solid ${match.result === 'Victoire' ? '#4ade80' : '#f87171'}` }}
                              >
                                  {/* Haut de la carte */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div>
                                          <h2 style={{ fontSize: '1.05rem', margin: '0 0 5px 0', color: 'white' }}>{match.eventName || 'Sans nom'}</h2>
                                          <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>{match.stage}</p>
                                      </div>
                                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                          <button onClick={(e) => editMatch(match, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0' }}>
                                              <FaEdit size={16} color="#aaa" onMouseOver={(e) => e.currentTarget.style.color = '#ccff00'} onMouseOut={(e) => e.currentTarget.style.color = '#aaa'} />
                                          </button>
                                          <button onClick={(e) => deleteMatch(match._id, e)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0' }}>
                                              <FaTrash size={14} color="#666" onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'} onMouseOut={(e) => e.currentTarget.style.color = '#666'} />
                                          </button>
                                      </div>
                                  </div>

                                  {/* Bas de la carte (Toujours visible, poussé en bas si fermé) */}
                                  <div style={{ marginTop: isExpanded ? '20px' : 'auto', paddingTop: '10px' }}>
                                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: match.result === 'Victoire' ? '#4ade80' : '#f87171', display: 'block' }}>
                                          {match.result.toUpperCase()}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(match.date).toLocaleDateString()}</span>
                                  </div>

                                  {/* DÉTAILS IA & SCORES (Visible seulement si la carte est ouverte) */}
                                  {isExpanded && (
                                      <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', animation: 'fadeIn 0.3s' }}>
                                          
                                          {/* SCORES RÉSUMÉS */}
                                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace', color: 'white', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px', textAlign: 'center' }}>
                                              Scores : {match.scores.set1.me}-{match.scores.set1.opp}
                                              {match.scores.set2.me && ` / ${match.scores.set2.me}-${match.scores.set2.opp}`}
                                              {match.scores.set3.me && ` / ${match.scores.set3.me}-${match.scores.set3.opp}`}
                                          </div>

                                          {match.description && (
                                              <p style={{ fontSize: '0.95rem', color: '#ddd', fontStyle: 'italic', marginBottom: '15px', lineHeight: '1.5' }}>
                                                  "{match.description}"
                                              </p>
                                          )}
                                          
                                          {/* ANALYSE IA */}
                                          {match.aiFeedback && (
                                              <div style={{ marginTop: '20px' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccff00', fontWeight: 'bold', fontSize: '1rem', marginBottom: '15px' }}>
                                                      <FaRobot /> Analyse du Coach IA
                                                  </div>
                                                  {(() => {
                                                      let aiData;
                                                      try { aiData = typeof match.aiFeedback === 'string' ? JSON.parse(match.aiFeedback) : match.aiFeedback; } 
                                                      catch (e) { aiData = null; }

                                                      if (aiData && aiData.resume && aiData.tactique && aiData.conclusion) {
                                                          return (
                                                              <div style={{ display: 'grid', gap: '15px' }}>
                                                                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid #3b82f6' }}>
                                                                      <h4 style={{ color: '#3b82f6', margin: '0 0 5px 0', fontSize: '0.9rem' }}>📝 Résumé</h4>
                                                                      <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{aiData.resume}</p>
                                                                  </div>
                                                                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid #ccff00' }}>
                                                                      <h4 style={{ color: '#ccff00', margin: '0 0 5px 0', fontSize: '0.9rem' }}>🎯 La Tactique</h4>
                                                                      <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{aiData.tactique}</p>
                                                                  </div>
                                                                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid #10b981' }}>
                                                                      <h4 style={{ color: '#10b981', margin: '0 0 5px 0', fontSize: '0.9rem' }}>🚀 Conclusion</h4>
                                                                      <p style={{ color: '#ccc', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{aiData.conclusion}</p>
                                                                  </div>
                                                              </div>
                                                          );
                                                      }

                                                      return (
                                                          <div style={{ background: 'rgba(204, 255, 0, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(204, 255, 0, 0.2)' }}>
                                                              <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: '#eee', margin: 0 }}>{match.aiFeedback}</p>
                                                          </div>
                                                      );
                                                  })()}
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      ))}
    </div>
  );
};

export default CompetitionsPage;