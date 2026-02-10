import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- IMPORTS DES PAGES ---
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import PrepaPage from './pages/PrepaPage';
import CompetitionsPage from './pages/CompetitionsPage'; 

// --- IMPORTS DES COMPOSANTS ---
import AuthModal from './components/AuthModal';
import { IconHome, IconDumbbell, IconJournal } from './components/Icons';
import { FaTrophy } from 'react-icons/fa';

// --- PETIT COMPOSANT WRAPPER POUR L'ICÔNE ---
const IconTrophy = () => (
  <FaTrophy 
    size={24} 
    color="rgb(122, 170, 0)" 
    className="trophy-icon"
  />
);

// Composant pour les liens de navigation
function NavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function App() {
  const [user, setUser] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false); 

  // --- 1. VÉRIFICATION DE LA CONNEXION (MERN) ---
  useEffect(() => {
    // On regarde dans le navigateur si l'utilisateur est stocké
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // --- 2. FONCTION DE DÉCONNEXION ---
  const handleLogout = () => {
    if(window.confirm("Voulez-vous vous déconnecter ?")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = "/"; // Retour à l'accueil
    }
  };

  return (
    <BrowserRouter>
      
      {/* Modale d'Authentification */}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* --- BARRE DU HAUT --- */}
      <div className="top-bar">
        <div className="logo-box">B</div>
        
        {/* --- ZONE PROFIL / CONNEXION --- */}
        <div className="profile-chip" onClick={user ? handleLogout : () => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
           {user ? (
             // --- SI CONNECTÉ : HELLO PRÉNOM ---
             <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ccff00', marginRight: '10px' }}>
                   Hello {user.name} 👋
                </span>
                <div className="avatar-circle">
                  {/* On génère un avatar basé sur le prénom ou l'email */}
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                    alt="Avatar" 
                    style={{ width: '100%', borderRadius: '50%' }} 
                  />
                </div>
             </div>
           ) : (
             // --- SI DÉCONNECTÉ : BOUTON CONNEXION ---
             <span style={{ fontSize: '0.9rem', fontWeight: 'bold', padding: '0 10px', color: 'white' }}>
               Connexion
             </span>
           )}
        </div>
      </div>

      {/* --- CONTENU --- */}
      <div className="content-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prepa" element={<PrepaPage />} />
          <Route path="/trainings" element={<TrainingPage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
        </Routes>
      </div>

      {/* --- MENU FLOTTANT --- */}
      <nav className="bottom-nav">
        <NavItem to="/" icon={<IconHome />} label="Accueil" />
        <NavItem to="/prepa" icon={<IconDumbbell />} label="Prépa" />
        <NavItem to="/trainings" icon={<IconJournal />} label="Journal" />
        <NavItem to="/competitions" icon={<IconTrophy />} label="Compét" />
      </nav>

    </BrowserRouter>
  );
}

export default App;