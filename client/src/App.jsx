import React, { useState, useEffect } from 'react'; 
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';

// --- IMPORTS DES PAGES ---
import HomePage from './pages/HomePage';
import TrainingPage from './pages/TrainingPage';
import PrepaPage from './pages/PrepaPage';
import CompetitionsPage from './pages/CompetitionsPage'; 
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import CoachSpace from './pages/CoachSpace';

// --- IMPORTS DES COMPOSANTS ---
import AuthModal from './components/AuthModal';
import CustomModal from './components/CustomModal';
import InstallModal from './components/InstallModal';
import FeedbackWidget from './components/FeedbackWidget';
import { IconHome, IconDumbbell, IconJournal } from './components/Icons';
import { LuTrophy } from 'react-icons/lu'; 
import { FaUser, FaDumbbell, FaTools, FaLock, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

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
  const [isModalOpen, setIsModalOpen] = useState(false); // Pour AuthModal
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showApp, setShowApp] = useState(false);

  // --- ÉTAT DU MODAL DE CONFIRMATION (Logout / Delete) ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '', // Optionnel si ton CustomModal le gère
    onConfirm: null
  });

  const closeConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setShowApp(true);
    }
  }, []);

  if (!user && !showApp) {
    return <LandingPage onEnterApp={() => setShowApp(true)} />;
  }

  // --- LOGIQUE DE DÉCONNEXION ---
  const handleLogout = () => {
    setIsDropdownOpen(false);
    
    // On configure le modal pour le mode "LOGOUT" (Orange)
    setConfirmModal({
      isOpen: true,
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      type: 'logout', // Utilise le type 'logout' qu'on a créé
      confirmText: 'Se déconnecter',
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
      
      {/* --- LE MODAL UNIVERSEL --- */}
      {/* Il lit les infos depuis l'état confirmModal */}
      <CustomModal 
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        onConfirm={confirmModal.onConfirm}
      />

      {/* Modal d'Authentification */}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} setUser={setUser} />

      {/* Modale d'installation PWA */}
      <InstallModal />

      {/* --- TOP BAR --- */}
      <div className="top-bar">
        <Link to="/" className="logo-box">
          <img src="/assets/badmin_logo_large.png" alt="Logo" className="logo" />
        </Link>
        
        <div style={{ position: 'relative' }}>
            <div 
                onClick={() => user ? setIsDropdownOpen(!isDropdownOpen) : setIsModalOpen(true)} 
                style={{ 
                  cursor: 'pointer', 
                  marginTop: '20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '10px 20px', 
                  boxSizing: 'border-box'
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

            {/* Menu Déroulant */}
            {isDropdownOpen && user && (
                <div className="dropdown-menu" onMouseLeave={() => setIsDropdownOpen(false)}>
                    
                    {/* 1. MON PROFIL (Pour tout le monde) */}
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                        <FaUser /> Mon Profil
                    </Link>

                    {/* 2. ESPACE COACH (Visible uniquement si Coach ou Admin) */}
                    {(user.role === 'coach' || user.role === 'admin') && (
                        <Link 
                            to="/coach-space" 
                            className="dropdown-item" 
                            onClick={() => setIsDropdownOpen(false)}
                            style={{ color: '#3aedcc' }} // Petit vert néon pour différencier
                        >
                            <FaDumbbell /> Espace Coach
                        </Link>
                    )}

                    {/* 3. GESTION ADMIN (Visible uniquement si Admin) */}
                    {user.role === 'admin' && (
                        <Link 
                            to="/admin" 
                            className="dropdown-item" 
                            onClick={() => setIsDropdownOpen(false)}
                            style={{ color: '#ef8044' }} // Petit rouge pour l'admin
                        >
                            <FaTools /> Gestion Admin
                        </Link>
                    )}

                    {/* 4. DÉBLOQUER COACH (Visible uniquement si Player) */}
                    {user.role === 'player' && (
                        <div 
                            className="dropdown-item" 
                            onClick={() => { setIsDropdownOpen(false); /* handleBecomeCoach() n'est pas défini dans ce fichier mais tu avais ça */ }}
                            style={{ opacity: 0.6, fontSize: '0.85rem' }} 
                        >
                            <FaLock /> Accès Coach
                        </div>
                    )}

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0' }}></div>


                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '5px 0' }}></div>

                    {/* 6. DÉCONNEXION */}
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
          <Route path="/admin" element={ user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" /> } />
          <Route path="/coach-space" element={ user && (user.role === 'coach' || user.role === 'admin') ? <CoachSpace /> : <Navigate to="/" /> } />
        </Routes>
      </div>
      <FeedbackWidget userEmail={user?.email} />

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