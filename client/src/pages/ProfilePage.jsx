import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUserEdit, FaUser, FaEnvelope, FaLock, FaIdBadge, 
  FaCheckCircle, FaSpinner, FaDumbbell, FaUserTag, FaShieldAlt 
} from 'react-icons/fa';
import CustomModal from '../components/CustomModal';
import CustomSelect from '../components/CustomSelect'; // ✅ Import bien présent
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

export default function ProfilePage({ setUser }) {
  // --- ÉTATS ---
  const [userData, setUserData] = useState({ name: '', email: '', username: '', avatar: '', role: 'joueur' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', username: '', password: '', role: 'joueur' });
  
  const [coachCode, setCoachCode] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [avatarList, setAvatarList] = useState([]);

  // ✅ États pour la modal de sécurité
  const [adminAuthModal, setAdminAuthModal] = useState({ isOpen: false, targetRole: '' });
  const [adminPassword, setAdminPassword] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- 1. GÉNÉRATION DE LA GALERIE ---
  useEffect(() => {
    const generateAvatars = async () => {
      try {
        const avatars = await Promise.all(
          Array.from({ length: 12 }).map(async (_, i) => {
            const avatar = createAvatar(adventurer, {
              seed: `badminton-player-${i}-${Math.floor(Math.random() * 1000)}`,
              backgroundColor: ['1a1a1a'],
            });
            return await avatar.toDataUri();
          })
        );
        setAvatarList(avatars);
      } catch (err) {
        console.error("Erreur génération avatars:", err);
      }
    };
    generateAvatars();
  }, []);

  // --- 2. RÉCUPÉRATION DES INFOS USER ---
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserData(parsed);
      setProfileForm({ 
        name: parsed.name || '', 
        email: parsed.email || '', 
        username: parsed.username || '', 
        password: '',
        role: parsed.role || 'joueur'
      });
    }
  }, []);

  // --- 3. ACTIONS ---
  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  // ✅ GESTION DU CHANGEMENT DE RÔLE (CustomSelect envoie 'name' et 'value')
// ✅ Gestion du changement de rôle avec sécurité renforcée
  const handleRoleChange = (name, value) => {
    // 1. Si on veut devenir ADMIN et qu'on ne l'est pas déjà
    if (value === 'admin' && userData.role !== 'admin') {
      setAdminAuthModal({ isOpen: true, targetRole: 'admin' });
      return; // On arrête là, la modal prend le relais
    } 
    
    // 2. Si on veut devenir COACH et qu'on ne l'est pas déjà (on vérifie si c'est différent de coach)
    else if (value === 'coach' && userData.role !== 'coach') {
      setAdminAuthModal({ isOpen: true, targetRole: 'coach' });
      return; // On arrête là
    } 
    
    // 3. Sinon (retour au rôle joueur ou rôle déjà possédé), on change juste la valeur
    else {
      setProfileForm({ ...profileForm, role: value });
    }
  };

  // ✅ VALIDATION DU MOT DE PASSE DANS LA MODAL
const verifyRolePassword = async () => {
    const isCorrect = adminAuthModal.targetRole === 'admin' 
      ? adminPassword === "8tAC47TOXqMWgXgPgdxGXjd"  // Mot de passe pour devenir ADMIN
      : adminPassword === "oZlSEnEs2mweAYAgdiQgcrQ"; // Mot de passe pour devenir COACH

    if (isCorrect) {
      const token = localStorage.getItem('token');
      const targetRole = adminAuthModal.targetRole;

      try {
        // 🚀 On lance la mise à jour immédiate vers le Backend
        const res = await axios.put(`${API_URL}/api/user/profile`, 
          { ...profileForm, role: targetRole }, 
          { headers: { 'x-auth-token': token } }
        );

        // Mise à jour du stockage local
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUserData(res.data.user);
        setUser(res.data.user);
        
        // On ferme la modal de sécurité
        setAdminAuthModal({ isOpen: false, targetRole: '' });
        setAdminPassword('');

        // Message de succès final
        setModal({ 
          isOpen: true, 
          title: 'Accès Accordé !', 
          message: `Tu es désormais ${targetRole}. La page va s'actualiser.`, 
          type: 'info' 
        });

        // Rechargement pour mettre à jour les menus (Navbar)
        setTimeout(() => window.location.reload(), 1500);

      } catch (err) {
        setModal({ isOpen: true, title: 'Erreur', message: 'Échec de la mise à jour automatique.', type: 'danger' });
      }
    } else {
      setModal({ isOpen: true, title: 'Erreur', message: 'Mot de passe incorrect', type: 'danger' });
      setAdminPassword('');
    }
  };

  const selectAvatar = async (uri) => {
    setLoadingAvatar(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/api/user/update-avatar`, { avatarUrl: uri }, { headers: { 'x-auth-token': token } });
      const updatedUser = { ...userData, avatar: res.data.avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setUser(updatedUser); 
      setModal({ isOpen: true, title: 'Super !', message: 'Ton avatar a été mis à jour.', type: 'info' });
    } catch (err) {
      setModal({ isOpen: true, title: 'Erreur', message: 'Échec de la sauvegarde.', type: 'danger' });
    }
    setLoadingAvatar(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_URL}/api/user/profile`, profileForm, { headers: { 'x-auth-token': token } });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUserData(res.data.user);
      setUser(res.data.user);
      setProfileForm(prev => ({ ...prev, password: '' })); 
      setModal({ isOpen: true, title: 'Succès', message: 'Profil mis à jour !', type: 'info' });
      if (res.data.user.role !== userData.role) window.location.reload();
    } catch (err) {
      setModal({ isOpen: true, title: 'Erreur', message: 'Mise à jour échouée.', type: 'danger' });
    }
    setLoadingProfile(false);
  };

  const handleBecomeCoach = async (e) => {
    e.preventDefault(); 
    if (!coachCode) return;
    const token = localStorage.getItem('token');
    try {
        const res = await axios.post(`${API_URL}/api/auth/become-coach`, { secretCode: coachCode }, { headers: { 'x-auth-token': token } });
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUserData(res.data.user);
        setUser(res.data.user);
        setModal({ isOpen: true, title: 'Félicitations ! 🎉', message: 'Le mode Coach est activé.', type: 'info' });
        setCoachCode(''); 
        window.location.reload();
    } catch (err) {
        setModal({ isOpen: true, title: 'Accès Refusé', message: 'Code incorrect.', type: 'danger' });
    }
  };

  // --- STYLES ---
  const inputStyle = {
    width: '100%', padding: '12px 15px', paddingLeft: '50px',
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: 'white', outline: 'none', fontSize: '0.9rem', fontFamily: 'Montserrat, sans-serif'
  };
  const iconStyle = { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#888', zIndex: 10 };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} title={modal.title} message={modal.message} type={modal.type} />

      {/* ✅ MODAL DE SÉCURITÉ (Design custom) */}
      {adminAuthModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '30px', textAlign: 'center', border: '1px solid var(--primary)', background: '#111', borderRadius: '15px' }}>
            <FaShieldAlt size={40} color="var(--primary)" style={{ marginBottom: '15px' }} />
            <h2 style={{ color: 'white', margin: '0 0 10px 0' }}>Zone Sécurisée</h2>
            <p style={{ color: '#888', marginBottom: '20px' }}>Entrez le code pour devenir {adminAuthModal.targetRole}</p>
            <input 
              type="password" 
              value={adminPassword} 
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Mot de passe..."
              style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '8px', color: 'white', marginBottom: '20px', outline: 'none', textAlign: 'center' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && verifyRolePassword()}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setAdminAuthModal({ isOpen: false, targetRole: '' })} style={{ flex: 1, padding: '10px', background: '#222', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Annuler</button>
              <button type="button" onClick={verifyRolePassword} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* AVATAR ACTUEL ET INFOS (Inchangé) */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white' }}>Mon Profil</h1>
        <p style={{ color: '#888' }}>Personnalise ton identité</p>
      </header>

      <div className="card" style={{ background: '#1a1a1a48', padding: '30px', borderRadius: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ width: '140px', height: '140px', margin: '0 auto 15px auto', borderRadius: '50%', border: '4px solid var(--primary)', overflow: 'hidden', background: '#000' }}>
          {userData.avatar ? <img src={userData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaUser size={50} color="#333" />}
        </div>
        <h2 style={{ color: 'white', margin: 0 }}>{userData.name}</h2>
        <span style={{ 
            marginTop: '10px', display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase',
            background: userData.role === 'coach' ? 'rgba(58, 237, 204, 0.1)' : userData.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.1)',
            color: userData.role === 'coach' ? '#3aedcc' : userData.role === 'admin' ? '#ef4444' : '#888'
        }}>
            {userData.role}
        </span>
      </div>

      {/* FORMULAIRE INFOS */}
      <div className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', padding: '25px', borderRadius: '20px' }}>
        <h3 style={{ color: 'white', marginTop: 0 }}>Paramètres Compte</h3>
        <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <FaUser style={iconStyle} />
                    <input type="text" name="name" placeholder="Nom" value={profileForm.name} onChange={handleProfileChange} style={inputStyle} required />
                </div>

                {/* ✅ LE CUSTOM SELECT EST ICI */}
                <div style={{ position: 'relative' }}>
                    <FaUserTag style={iconStyle} />
                    <CustomSelect 
                        name="role" 
                        value={profileForm.role} 
                        onChange={handleRoleChange} 
                        options={[
                            { value: "joueur", label: "Joueur" },
                            { value: "coach", label: "Coach" },
                            { value: "admin", label: "Admin" }
                        ]}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <FaIdBadge style={iconStyle} />
                    <input type="text" name="username" placeholder="Pseudo" value={profileForm.username} onChange={handleProfileChange} style={inputStyle} />
                </div>
                <div style={{ position: 'relative' }}>
                    <FaEnvelope style={iconStyle} />
                    <input type="email" name="email" placeholder="Email" value={profileForm.email} onChange={handleProfileChange} style={inputStyle} required />
                </div>
                <div style={{ position: 'relative' }}>
                    <FaLock style={iconStyle} />
                    <input type="password" name="password" placeholder="Changer mot de passe" value={profileForm.password} onChange={handleProfileChange} style={inputStyle} />
                </div>
            </div>
            
            <button type="submit" disabled={loadingProfile} className="btn-save" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontWeight: 'bold' }}>
                {loadingProfile ? 'Enregistrement...' : 'Sauvegarder les infos'}
            </button>
        </form>
      </div>
    </div>
  );
}