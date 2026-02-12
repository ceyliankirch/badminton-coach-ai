import React, { useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- IMPORTS DES PAGES ---
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import PrepaPage from './pages/PrepaPage';
import CompetitionsPage from './pages/CompetitionsPage'; 
import ProfilePage from './pages/ProfilePage';

// --- IMPORTS DES COMPOSANTS ---
import AuthModal from './components/AuthModal';
import CustomModal from './components/CustomModal';
import { IconHome, IconDumbbell, IconJournal } from './components/Icons';
import { LuTrophy } from 'react-icons/lu'; 
import { FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa'; // Ajout de FaChevronDown

// --- 1. WRAPPER TROPHÉE ---
const IconTrophy = ({ color = "var(--text-muted)" }) => (
  <LuTrophy 
    size={22} 
    className="nav-icon trophy-icon"
    style={{ 
      fill: 'none', 
      transition: 'all 0.3s ease',
      display: 'block' 
    }} 
  />
);

// --- 2. NAVITEM ---
function NavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  const iconWithProps = React.cloneElement(icon, { 
    color: isActive ? "#000000" : "#ffffff" 
  });

  return (
    <Link to={to} className={`nav-item ${isActive ? 'active' : ''}`}>
      {iconWithProps}
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
        isOpen={modal.isOpen}
        onClose={closeModal}
        type="logout" 
        title="Déconnexion"
        message="Es-tu sûr de vouloir quitter l'application ?"
        onConfirm={handleLogout}
      />

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} setUser={setUser} />

      <div className="top-bar">
        <Link to="/" className="logo-box">
          <img src="/assets/bdmcoach_logo.svg" alt="Logo" className="logo" />
        </Link>
        
        <div style={{ position: 'relative' }}>
            <div 
                onClick={() => user ? setIsDropdownOpen(!isDropdownOpen) : setIsModalOpen(true)} 
                style={{ 
                  cursor: 'pointer',
                  marginTop: '20px', 
                  display: 'flex', 
                  alignItems: 'center',
                  padding: '5px 10px' 
                }}
            >
               {user ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff' }}>
                        Hello {user.name}
                    </span>
                    <FaChevronDown 
                      size={12} 
                      style={{ 
                        color: '#ffffff', 
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.3s ease'
                      }} 
                    />
                 </div>
               ) : (
                 <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>
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
        <NavItem to="/" icon={<IconHome />} label="Accueil" />
        <NavItem to="/prepa" icon={<IconDumbbell />} label="Prépa" />
        <NavItem to="/trainings" icon={<IconJournal />} label="Journal" />
        <NavItem to="/competitions" icon={<IconTrophy />} label="Compét" />
      </nav>
    </BrowserRouter>
  );
}

export default App;