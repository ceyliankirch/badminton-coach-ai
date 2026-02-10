import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase'; 

// --- IMPORTS DES PAGES ---
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import PrepaPage from './pages/PrepaPage';
import CompetitionsPage from './pages/CompetitionsPage'; 

// --- IMPORTS DES COMPOSANTS ---
import AuthModal from './components/AuthModal';
import { IconHome, IconDumbbell, IconJournal } from './components/Icons';
import { FaTrophy } from 'react-icons/fa'; // Import de l'icône

// --- PETIT COMPOSANT WRAPPER POUR L'ICÔNE ---
// Cela assure que l'icône prend la couleur du parent (active ou pas) et la bonne taille
const IconTrophy = () => (
  <FaTrophy 
    size={24} 
    className="trophy-icon" // Classe CSS pour cibler uniquement le trophée
  />
);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    alert("Déconnecté !");
  };

  return (
    <BrowserRouter>
      
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* --- BARRE DU HAUT --- */}
      <div className="top-bar">
        <div className="logo-box">B</div>
        {/* Zone Profil... (je garde ton code existant ici pour raccourcir l'affichage) */}
        <div className="profile-chip" onClick={user ? handleLogout : () => setIsModalOpen(true)}>
             {user ? (
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white', marginRight: '10px' }}>
                        {user.displayName || "Coach"}
                    </span>
                    <div className="avatar-circle">
                      <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" style={{ width: '100%', borderRadius: '50%' }} />
                    </div>
                 </div>
            ) : (
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', padding: '0 10px' }}>Connexion</span>
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
        
        {/* Ici on utilise notre nouveau composant IconTrophy */}
        <NavItem to="/competitions" icon={<IconTrophy />} label="Compét" />
      </nav>

    </BrowserRouter>
  );
}

export default App;