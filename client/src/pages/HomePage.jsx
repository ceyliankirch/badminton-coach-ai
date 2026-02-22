import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import { IconJournal, IconDumbbell } from '../components/Icons';
// ✅ AJOUT DE FaChartLine POUR LA CARTE STATS
import { FaTrophy, FaRobot, FaSyncAlt, FaExternalLinkAlt, FaUser, FaChartLine } from 'react-icons/fa';
import CustomModal from '../components/CustomModal';

export default function HomePage() {
  // --- ÉTATS ---
  const [userData, setUserData] = useState(null); 
  const [stats, setStats] = useState({ trainingCount: 0, compCount: 0, prepaCount: 0 });
  const [recentTrainings, setRecentTrainings] = useState([]); 
  
  const [aiSummary, setAiSummary] = useState("Clique sur le bouton reload pour lancer une analyse détaillée.");
  const [loadingAi, setLoadingAi] = useState(false); 

  // Phrase de motivation (uniquement si connecté)
  const [motivationPhrase, setMotivationPhrase] = useState("Prêt à tout casser aujourd'hui ? 🔥");

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // --- CONSTANTES ---
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  const closeModal = () => setModal({ ...modal, isOpen: false });

  useEffect(() => {
    // 1. Récupération User
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        setUserData(JSON.parse(storedUser));
        fetchMotivation(); 
    }

    // 2. Récupération des Données (Privé)
    const token = localStorage.getItem('token');
    if (!token) return; 

    const config = { headers: { 'x-auth-token': token } };

    const fetchData = async () => {
      try {
        const [resTrainings, resPrepa, resComps] = await Promise.all([
          axios.get(`${API_URL}/api/trainings`, config),
          axios.get(`${API_URL}/api/prepa/history`, config),
          axios.get(`${API_URL}/api/competitions`, config)
        ]);

        setStats({
          trainingCount: resTrainings.data.length,
          prepaCount: resPrepa.data.length,
          compCount: resComps.data.length
        });

        if (Array.isArray(resTrainings.data)) {
          setRecentTrainings(resTrainings.data.slice(0, 4));
        }

      } catch (err) {
        console.error("Erreur dashboard:", err);
      }
    };

    fetchData();
  }, [API_URL]);

  const fetchMotivation = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/home/motivation`);
      setMotivationPhrase(res.data.message);
    } catch (err) {
      console.log("Erreur chargement motivation");
    }
  };


  // --- REFRESH IA ---
  const refreshAi = async (e) => {
    e.stopPropagation(); 
    const token = localStorage.getItem('token');
    
    if (!token) {
        setModal({ isOpen: true, title: 'Mode Invité', message: 'Connecte-toi pour utiliser le Coach IA !', type: 'info' });
        return;
    }

    setLoadingAi(true);
    setAiSummary("Analyse approfondie de tes données en cours..."); 

    try {
      const res = await axios.get(`${API_URL}/api/home/summary`, {
        headers: { 'x-auth-token': token }
      });
      setAiSummary(res.data.summary);
      
    } catch (err) {
      setAiSummary("Impossible de générer l'analyse pour le moment.");
    }
    setLoadingAi(false);
  };

  const openAiModal = () => {
    setModal({
      isOpen: true,
      title: 'Analyse du Coach IA 🤖',
      message: aiSummary,
      type: 'info'
    });
  };

  // --- STYLE ---
  const gridCardStyle = {
    background: 'rgba(26, 26, 26, 0.2)', 
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '110px', 
    transition: 'transform 0.2s, border-color 0.2s',
    cursor: 'pointer',
    textDecoration: 'none',
    overflow: 'hidden'
  };

  const guestAvatarStyle = {
    width: '100%', height: '100%', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 100px 20px' }}>
      
      <CustomModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      {/* ✅ CSS MIS À JOUR POUR LE NOUVEAU LAYOUT */}
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr; /* Mobile : 2 colonnes */
          gap: 15px;
          margin-bottom: 30px;
        }
        .ai-card-full {
          grid-column: span 2; /* Mobile : Prend toute la largeur (2 colonnes) */
        }
        @media (min-width: 768px) {
          .dashboard-grid { grid-template-columns: repeat(4, 1fr); } /* Ordi : 4 colonnes */
          .ai-card-full { grid-column: span 4; } /* Ordi : Prend toute la largeur (4 colonnes) */
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .ai-card-full:hover {
          border-color: var(--primary) !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* --- EN-TÊTE PROFIL --- */}
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '40vh', marginBottom: '20px', textAlign: 'center',
      }}>
        
        {/* AVATAR */}
        <div style={{ 
          width: '150px', height: '150px',
          borderRadius: '50%', 
          border: userData ? '4px solid var(--primary)' : '4px solid #333', 
          padding: '5px', marginBottom: '20px',
          boxShadow: userData ? '0 0 30px rgba(0, 255, 140, 0.3)' : 'none',
          background: '#0a0a0a46', 
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
           {userData?.avatar ? (
             <img 
               src={userData.avatar} 
               alt="Avatar" 
               referrerPolicy="no-referrer"
               style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
             />
           ) : (
             <div style={guestAvatarStyle}>
                <FaUser size={60} color="#555" /> 
             </div>
           )}
        </div>

        {/* TEXTE DYNAMIQUE */}
        <h1 style={{ margin: 0, fontSize: '2.3rem', color: 'white', fontWeight: '900', letterSpacing: '-1px' }}>
          Hello <span style={{ color: 'var(--primary)' }}>{userData ? userData.name : 'Champion'}</span> !
        </h1>
        
        <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: '0.9rem', fontStyle: 'italic', maxWidth: '400px', lineHeight: '1.4' }}>
          {userData ? motivationPhrase : "Connecte-toi pour utiliser toutes mes fonctionnalités."}
        </p>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#fff' }}>Vue d'ensemble</h3>
      
      <div className="dashboard-grid">

        {/* 1. CARTE COACH IA (1.5x plus haute = 165px) */}
        <div 
          className="ai-card-full" 
          onClick={openAiModal} 
          style={{ 
            ...gridCardStyle, 
            height: '165px', // ✅ Hauteur modifiée ici
            background: 'linear-gradient(135deg, rgba(0, 255, 157, 0.08), rgba(26, 26, 26, 1))',
            border: '1px solid rgba(0, 255, 145, 0.2)', 
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <FaRobot color="var(--primary)" size={18} />
                   <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                     COACH IA
                   </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                   <FaExternalLinkAlt size={16} color="#666" style={{ margin: '4px'}}/>
                   <div 
                       onClick={refreshAi}
                       style={{
                           width: '24px', height: '24px',
                           background: 'var(--primary)',
                           borderRadius: '50%',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           cursor: 'pointer',
                           boxShadow: '0 0 10px rgba(0, 255, 110, 0.2)',
                       }}
                   >
                       <FaSyncAlt 
                           size={10} 
                           color="black" 
                           style={{ animation: loadingAi ? 'spin 1s linear infinite' : 'none' }} 
                       />
                   </div>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <p style={{ 
                    color: 'white', 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    lineHeight: '1.5', 
                    fontStyle: loadingAi ? 'italic' : 'normal',
                    display: '-webkit-box',
                    WebkitLineClamp: '4', // ✅ Augmenté pour profiter de la nouvelle hauteur
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    opacity: 0.9
                }}>
                   {aiSummary}
                </p>
            </div>
          </div>
        </div>

        {/* 2. JOURNAL */}
        <Link to="/trainings" style={gridCardStyle} 
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--journal-color)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--journal-bg)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'var(--journal-bg)', padding: '8px', borderRadius: '8px', color: '#ccff00' }}>
               <IconJournal />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats.trainingCount}</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Journal</h3>
          </div>
        </Link>

        {/* 3. PRÉPA */}
        <Link to="/prepa" style={gridCardStyle}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--prepa-color)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'var(--prepa-bg)', padding: '8px', borderRadius: '8px', color: '#00d4ff' }}>
               <IconDumbbell />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats.prepaCount}</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Prépa Physique</h3>
          </div>
        </Link>

        {/* 4. COMPÉTITIONS */}
        <Link to="/competitions" style={gridCardStyle}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#fbbf24'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '8px', borderRadius: '8px', color: '#fbbf24' }}>
               <FaTrophy size={20} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{stats.compCount}</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Compétitions</h3>
          </div>
        </Link>

        {/* 5. MON COACH IA (Anciennement STATS) */}
        <Link to="/coach-chat" style={{ ...gridCardStyle, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(0, 255, 157, 0.1)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                <FaRobot size={20} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>EN LIGNE</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem' }}>Mon Coach</h3>
            <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '0.75rem' }}>Pose tes questions à l'IA</p>
          </div>
        </Link>

      </div>

      {/* --- LISTE BAS DE PAGE --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>Derniers entraînements</h3>
        <Link to="/trainings" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none' }}>Voir tout</Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
        
        {recentTrainings.length > 0 ? (
          recentTrainings.map(training => (
            <Link to="/trainings" key={training._id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', transition: 'transform 0.2s', borderRadius: '12px' }}>
                <div style={{ 
                    background: training.rating >= 7 ? 'rgba(0, 204, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
                    padding: '10px', borderRadius: '10px', 
                    color: training.rating >= 7 ? '#009dff' : 'white' 
                }}>
                   <IconJournal />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {training.theme}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#666', fontSize: '0.8rem' }}>
                      {new Date(training.date).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: training.rating >= 7 ? '#005d82' : '#888', fontWeight: 'bold' }}>
                      {training.rating}/10
                    </span>
                  </div>
                </div>
                <div style={{ color: '#444', fontSize: '0.8rem' }}>➔</div>
              </div>
            </Link>
          ))
        ) : (
          <Link to="/trainings" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ background: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '1px dashed #555', borderRadius: '12px' }}>
              <div style={{ background: 'var(--journal-bg)', padding: '10px', borderRadius: '10px', color: 'black' }}>
                 <IconJournal />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', color: 'white' }}>Commencer le Journal</h3>
                <p style={{ margin: 0, color: '#888', fontSize: '0.8rem' }}>Enregistre ta première séance !</p>
              </div>
            </div>
          </Link>
        )}

      </div>
    </div>
  );
}