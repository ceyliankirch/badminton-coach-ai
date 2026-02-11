import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import { IconJournal, IconDumbbell } from '../components/Icons';
import { FaTrophy, FaRobot, FaSyncAlt, FaExternalLinkAlt } from 'react-icons/fa'; 
import CustomModal from '../components/CustomModal';

export default function HomePage() {
  const [userName, setUserName] = useState("Coach");
  const [userAvatar, setUserAvatar] = useState(null); // Pour stocker l'avatar custom
  const [stats, setStats] = useState({ trainingCount: 0, compCount: 0, prepaCount: 0 });
  const [recentTrainings, setRecentTrainings] = useState([]); 
  
  // Message initial invitant à l'action
  const [aiSummary, setAiSummary] = useState("Clique sur le bouton reload pour lancer une analyse détaillée de tes performances.");
  const [loadingAi, setLoadingAi] = useState(false); 

  // --- ÉTAT DU MODAL ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  
  const closeModal = () => setModal({ ...modal, isOpen: false });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser.name);
        setUserAvatar(parsedUser.avatar); // On récupère l'avatar s'il existe
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const config = { headers: { 'x-auth-token': token } };

    const fetchData = async () => {
      try {
        const [resTrainings, resPrepa, resComps] = await Promise.all([
          axios.get('http://localhost:5000/api/trainings', config),
          axios.get('http://localhost:5000/api/prepa/history', config),
          axios.get('http://localhost:5000/api/competitions', config)
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
  }, []);

  // --- REFRESH IA (APPEL API) ---
  const refreshAi = async (e) => {
    e.stopPropagation(); // Empêche d'ouvrir le modal quand on clique juste sur le refresh
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoadingAi(true);
    setAiSummary("Analyse approfondie de tes données en cours..."); 

    try {
      const res = await axios.get('http://localhost:5000/api/home/summary', {
        headers: { 'x-auth-token': token }
      });
      setAiSummary(res.data.summary);
      
      // Optionnel : Tu peux décommenter ça si tu veux que le modal s'ouvre direct après chargement
      /* setModal({
        isOpen: true,
        title: 'Analyse du Coach IA 🤖',
        message: res.data.summary,
        type: 'info'
      });
      */
      
    } catch (err) {
      setAiSummary("Impossible de générer l'analyse pour le moment.");
    }
    setLoadingAi(false);
  };

  // --- OUVERTURE DU MODAL (LECTURE) ---
  const openAiModal = () => {
    setModal({
      isOpen: true,
      title: 'Analyse du Coach IA 🤖',
      message: aiSummary,
      type: 'info'
    });
  };

  // --- STYLE COMMUN ---
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px 100px 20px' }}>
      
      {/* MODAL POUR LIRE LE TEXTE COMPLET */}
      <CustomModal 
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
        }
        @media (min-width: 768px) {
          .dashboard-grid { grid-template-columns: repeat(3, 1fr); }
          .ai-card-full { grid-column: span 3; }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .ai-card-full:hover {
          border-color: #ccff00 !important;
          transform: translateY(-2px);
        }
      `}</style>

      {/* --- EN-TÊTE PROFIL --- */}
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '40vh', marginBottom: '20px', textAlign: 'center',
      }}>
        <div style={{ 
          width: '120px', height: '120px', 
          borderRadius: '50%', 
          border: '4px solid #ccff00', 
          padding: '5px', marginBottom: '20px',
          boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)',
          background: '#0a0a0a', // Fond noir pour éviter la transparence
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {userAvatar ? (
             <img 
               src={userAvatar} 
               alt="Avatar 3D" 
               style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
             />
          ) : (
             <img 
               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
               alt="Avatar Default" 
               style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#222' }}
             />
          )}
        </div>
        <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'white', fontWeight: '900', letterSpacing: '-1px' }}>
          Hello <span style={{ color: '#ccff00' }}>{userName}</span> !
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#888', fontSize: '1.1rem' }}>
          Prêt à tout casser aujourd'hui ? 🔥
        </p>
      </div>

      <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#fff' }}>Vue d'ensemble</h3>
      
      <div className="dashboard-grid">

        {/* 1. CARTE COACH IA (LARGE & CLIQUABLE) */}
        <div 
          className="ai-card-full" 
          onClick={openAiModal} 
          style={{ 
            ...gridCardStyle, 
            background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.08), rgba(26, 26, 26, 1))',
            border: '1px solid rgba(204, 255, 0, 0.2)', 
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* EN-TÊTE DE LA CARTE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <FaRobot color="#ccff00" size={18} />
                   <span style={{ color: '#ccff00', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                     COACH IA
                   </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Icône indiquant qu'on peut agrandir */}
                    <FaExternalLinkAlt size={12} color="#666" />
                    
                    {/* Bouton Reload */}
                    <div 
                        onClick={refreshAi}
                        style={{
                            width: '24px', height: '24px',
                            background: '#ccff00',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 0 10px rgba(204, 255, 0, 0.2)',
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

            {/* CONTENU TEXTE (TRONQUÉ PROPREMENT SANS BARRE GRISE) */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <p style={{ 
                    color: 'white', 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    lineHeight: '1.5', 
                    fontStyle: loadingAi ? 'italic' : 'normal',
                    // CSS Magique pour couper après 3 lignes
                    display: '-webkit-box',
                    WebkitLineClamp: '3', 
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    opacity: 0.9
                }}>
                   {aiSummary}
                </p>
                {/* J'ai supprimé la div dégradée ici pour enlever la barre grise */}
            </div>
          </div>
        </div>

        {/* 2. JOURNAL */}
        <Link to="/trainings" style={gridCardStyle} 
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ccff00'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(26, 26, 26, 0.2)', padding: '8px', borderRadius: '8px', color: '#ccff00' }}>
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
              onMouseEnter={e => e.currentTarget.style.borderColor = '#00d4ff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ background: 'rgba(0, 212, 255, 0.1)', padding: '8px', borderRadius: '8px', color: '#00d4ff' }}>
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

      </div>

      {/* --- LISTE BAS DE PAGE --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#fff' }}>Derniers entraînements</h3>
        <Link to="/trainings" style={{ color: '#ccff00', fontSize: '0.85rem', textDecoration: 'none' }}>Voir tout</Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
        
        {recentTrainings.length > 0 ? (
          recentTrainings.map(training => (
            <Link to="/trainings" key={training._id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', transition: 'transform 0.2s', borderRadius: '12px' }}>
                <div style={{ 
                    background: training.rating >= 7 ? 'rgba(204, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
                    padding: '10px', borderRadius: '10px', 
                    color: training.rating >= 7 ? '#ccff00' : 'white' 
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
                    <span style={{ fontSize: '0.8rem', color: training.rating >= 7 ? '#ccff00' : '#888', fontWeight: 'bold' }}>
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
              <div style={{ background: '#ccff00', padding: '10px', borderRadius: '10px', color: 'black' }}>
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