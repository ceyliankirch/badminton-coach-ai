import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserEdit, FaSave, FaUser, FaEnvelope, FaLock, FaIdBadge, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import CustomModal from '../components/CustomModal';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

export default function ProfilePage({ setUser }) {
  // --- ÉTATS ---
  const [userData, setUserData] = useState({ name: '', email: '', username: '', avatar: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', username: '', password: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [avatarList, setAvatarList] = useState([]);

  // --- 0. CONSTANTE API (PROD & DEV) ---
  const API_URL = import.meta.env.VITE_API_URL;

  // --- 1. GÉNÉRATION DE LA GALERIE DICEBEAR ---
  useEffect(() => {
    const generateAvatars = async () => {
      try {
        const avatars = await Promise.all(
          Array.from({ length: 12 }).map(async (_, i) => {
            const avatar = createAvatar(adventurer, {
              seed: `badminton-player-${i}-${Math.floor(Math.random() * 1000)}`,
              backgroundColor: ['1a1a1a'],
            });
            // .toDataUri() est asynchrone dans les versions v7+
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
        password: '' 
      });
    }
  }, []);

  // --- 3. ACTIONS ---
  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const selectAvatar = async (uri) => {
    setLoadingAvatar(true);
    const token = localStorage.getItem('token');
    try {
      // MODIFICATION ICI : Utilisation de API_URL
      const res = await axios.post(`${API_URL}/api/user/update-avatar`, 
        { avatarUrl: uri }, 
        { headers: { 'x-auth-token': token } }
      );

      const updatedUser = { ...userData, avatar: res.data.avatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setUser(updatedUser); // Mise à jour globale pour la TopBar

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
      // MODIFICATION ICI : Utilisation de API_URL
      const res = await axios.put(`${API_URL}/api/user/profile`, profileForm, {
        headers: { 'x-auth-token': token }
      });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUserData(res.data.user);
      setUser(res.data.user);
      setProfileForm(prev => ({ ...prev, password: '' })); 
      setModal({ isOpen: true, title: 'Succès', message: 'Profil mis à jour !', type: 'info' });
    } catch (err) {
      setModal({ isOpen: true, title: 'Erreur', message: 'Mise à jour échouée.', type: 'danger' });
    }
    setLoadingProfile(false);
  };

  // --- STYLES ---
  const inputStyle = {
    width: '100%', padding: '12px 15px', paddingLeft: '50px',
    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', color: 'white', outline: 'none', fontSize: '0.9rem'
  };
  const iconStyle = { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#888' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} title={modal.title} message={modal.message} type={modal.type} />

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white' }}>Mon Profil</h1>
        <p style={{ color: '#888' }}>Personnalise ton identité</p>
      </header>

      {/* AVATAR ACTUEL */}
      <div className="card" style={{ background: '#1a1a1a48', padding: '30px', borderRadius: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ 
          width: '140px', height: '140px', margin: '0 auto 15px auto', 
          borderRadius: '50%', border: '4px solid var(--primary)', overflow: 'hidden', background: '#000'
        }}>
          {userData.avatar ? (
            <img src={userData.avatar} alt="Avatar Actuel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
              <FaUser size={50} color="#333" />
            </div>
          )}
        </div>
        <h2 style={{ color: 'white', margin: 0 }}>{userData.name}</h2>
      </div>

      {/* GALERIE DICEBEAR */}
      <div className="card" style={{ background: '#1a1a1a48', padding: '25px', borderRadius: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--primary)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaUserEdit /> Galerie d'Avatars
        </h3>

        {avatarList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><FaSpinner className="spin" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
            {avatarList.map((uri, idx) => (
              <div 
                key={idx}
                onClick={() => selectAvatar(uri)}
                style={{
                  position: 'relative', cursor: 'pointer', borderRadius: '15px',
                  border: userData.avatar === uri ? '3px solid var(--primary)' : '2px solid transparent',
                  background: 'rgba(255,255,255,0.02)', padding: '5px', transition: 'all 0.2s',
                  transform: userData.avatar === uri ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <img src={uri} alt="Option" style={{ width: '100%', borderRadius: '10px' }} />
                {userData.avatar === uri && (
                  <FaCheckCircle style={{ position: 'absolute', top: '-5px', right: '-5px', color: 'var(--primary)', background: '#1a1a1a', borderRadius: '50%' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORMULAIRE INFOS */}
      <form onSubmit={handleUpdateProfile} className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', padding: '25px', borderRadius: '20px' }}>
        <h3 style={{ color: 'white', marginTop: 0 }}>Paramètres Compte</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <FaUser style={iconStyle} />
            <input type="text" name="name" placeholder="Nom" value={profileForm.name} onChange={handleProfileChange} style={inputStyle} required />
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
        <button type="submit" disabled={loadingProfile} className="btn-save" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
          {loadingProfile ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </form>

    </div>
  );
}