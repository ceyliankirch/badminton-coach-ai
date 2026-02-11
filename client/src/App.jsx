import React, { useState, useEffect } from 'react'; // Ajout de React pour cloneElement
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- IMPORTS DES PAGES (Inchangés) ---
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import PrepaPage from './pages/PrepaPage';
import CompetitionsPage from './pages/CompetitionsPage'; 
import ProfilePage from './pages/ProfilePage';

// --- IMPORTS DES COMPOSANTS (Inchangés) ---
import AuthModal from './components/AuthModal';
import CustomModal from './components/CustomModal';
import { IconHome, IconDumbbell, IconJournal } from './components/Icons';
import { LuTrophy } from 'react-icons/lu'; // Lucide Iconsimport { FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

// --- 1. WRAPPER MIS À JOUR ---
// Il accepte maintenant une prop "color" passée par NavItem
const IconTrophy = ({ color = "#8a9a2a" }) => (
  <LuTrophy 
    size={22} 
    className="nav-icon trophy-icon"
    style={{ 
      stroke: color, 
      fill: 'none', 
      transition: 'all 0.3s ease',
      display: 'block' 
    }} 
  />
);

// --- 2. NAVITEM MIS À JOUR ---
// Utilise React.cloneElement pour forcer la couleur de l'icône si actif
function NavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  // On injecte la couleur NOIRE si actif, sinon la couleur par défaut (kaki)
  const iconWithProps = React.cloneElement(icon, { 
    color: isActive ? "#000000" : "#8a9a2a" 
  });

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      {iconWithProps}
      <span>{label}</span>
    </Link>
  );
}

function App() {
  const [user, setUser] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setConfirmModal({
      isOpen: true,
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      type: 'danger', 
      onConfirm: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = "/"; 
      }
    });
  };

  return (
    <BrowserRouter>
      <CustomModal 
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
      />

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} setUser={setUser} />

      <div className="top-bar">
        <div className="logo-box">B</div>
        <div style={{ position: 'relative' }}>
            <div 
                className="profile-chip" 
                onClick={() => user ? setIsDropdownOpen(!isDropdownOpen) : setIsModalOpen(true)} 
                style={{ cursor: 'pointer' }}
            >
               {user ? (
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ccff00', marginRight: '10px' }}>
                        Hello {user.name}
                    </span>
                    <div className="avatar-circle" style={{ overflow: 'hidden'}}>
                      {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#444' }}>
                            <FaUserCircle size={20} />
                          </div>
                      )}
                    </div>
                 </div>
               ) : (
                 <span style={{ fontSize: '0.9rem', fontWeight: 'bold', padding: '0 10px', color: 'white' }}>
                   Connexion
                 </span>
               )}
            </div>

            {isDropdownOpen && user && (
                <div className="dropdown-menu" onMouseLeave={() => setIsDropdownOpen(false)}>
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaUser /> Mon Profil
                    </Link>
                    <div className="dropdown-item danger" onClick={handleLogout}>
                        <FaSignOutAlt /> Déconnexion
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="content-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prepa" element={<PrepaPage />} />
          <Route path="/trainings" element={<TrainingPage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
          <Route path="/profile" element={<ProfilePage setUser={setUser} />} />
        </Routes>
      </div>

      <nav className="bottom-nav">
        {/* On passe les composants d'icônes normalement, NavItem s'occupe de la couleur */}
        <NavItem to="/" icon={<IconHome />} label="Accueil" />
        <NavItem to="/prepa" icon={<IconDumbbell />} label="Prépa" />
        <NavItem to="/trainings" icon={<IconJournal />} label="Journal" />
        <NavItem to="/competitions" icon={<IconTrophy />} label="Compét" />
      </nav>
    </BrowserRouter>
  );
}

export default App;