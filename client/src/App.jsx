import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// --- IMPORTS DES PAGES ---
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import PrepaPage from './pages/PrepaPage';
import CompetitionsPage from './pages/CompetitionsPage'; 
import ProfilePage from './pages/ProfilePage'; // <--- NOUVELLE PAGE

// --- IMPORTS DES COMPOSANTS ---
import AuthModal from './components/AuthModal';
import CustomModal from './components/CustomModal';
import { IconHome, IconDumbbell, IconJournal } from './components/Icons';
import { FaTrophy, FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'; // <--- NOUVELLES ICÔNES

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
  const [isModalOpen, setIsModalOpen] = useState(false); // AuthModal
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // <--- MENU DÉROULANT

  // --- ÉTAT POUR LE CUSTOM MODAL (Confirmation) ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

  // --- VÉRIFICATION DE LA CONNEXION ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // --- DÉCONNEXION ---
  const handleLogout = () => {
    setIsDropdownOpen(false); // Ferme le menu
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

      {/* --- BARRE DU HAUT --- */}
      <div className="top-bar">
        <div className="logo-box">B</div>
        
        {/* --- ZONE PROFIL (WRAPPER RELATIF POUR LE DROPDOWN) --- */}
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
                    <div className="avatar-circle" style={{ overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.2)' }}>
                      {/* LOGIQUE D'AFFICHAGE AVATAR */}
                      {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt="Avatar" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                      ) : (
                          // ILLUSTRATION SOMBRE "PAS DE PHOTO"
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

            {/* --- MENU DÉROULANT --- */}
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

      {/* --- CONTENU --- */}
      <div className="content-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prepa" element={<PrepaPage />} />
          <Route path="/trainings" element={<TrainingPage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
          <Route path="/profile" element={<ProfilePage setUser={setUser} />} /> {/* ROUTE PROFIL AJOUTÉE */}
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