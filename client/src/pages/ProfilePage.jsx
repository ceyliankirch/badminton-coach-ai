import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUserEdit, FaMagic, FaPalette, FaSave, FaUser, FaEnvelope, FaLock, FaIdBadge, FaChevronDown } from 'react-icons/fa';
import CustomModal from '../components/CustomModal';

// =====================================================================
// COMPOSANT : MENU DÉROULANT SUR-MESURE (100% raccord avec ta DA)
// =====================================================================
const CustomSelect = ({ label, name, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      <label style={{ color: '#aaa', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>{label}</label>
      
      {/* BOUTON DU MENU */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '12px 15px',
          background: isOpen ? '#1a1a1a' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isOpen ? '#ccff00' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '10px', color: 'white', fontSize: '0.9rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isOpen ? '0 0 10px rgba(204, 255, 0, 0.2)' : 'none'
        }}
      >
        {selectedOption.label}
        <FaChevronDown style={{ color: '#888', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
      </div>

      {/* LISTE DES OPTIONS */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '5px',
          background: '#111', border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px', overflow: 'hidden', zIndex: 100,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange({ target: { name, value: opt.value } });
                setIsOpen(false);
              }}
              style={{
                padding: '12px 15px', color: value === opt.value ? '#ccff00' : 'white',
                background: value === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent',
                cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204, 255, 0, 0.1)'; e.currentTarget.style.color = '#ccff00'; }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = value === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent'; 
                e.currentTarget.style.color = value === opt.value ? '#ccff00' : 'white';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// =====================================================================
// PAGE PRINCIPALE : PROFIL
// =====================================================================
export default function ProfilePage({ setUser }) {
  const [userData, setUserData] = useState({ name: '', email: '', username: '', avatar: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '', username: '', password: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const [avatarForm, setAvatarForm] = useState({
    gender: 'a male',
    skin: 'light',
    hairColor: 'dark brown',
    hairStyle: 'short fade haircut',
    eyes: 'brown',
    clothing: 'modern sleek sportswear',
    expression: 'determined with a slight smirk',
    background: 'pastel yellow'
  });

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

  const handleAvatarChange = (e) => setAvatarForm({ ...avatarForm, [e.target.name]: e.target.value });
  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const handleGenerateAvatar = async () => {
    setLoadingGen(true);
    const token = localStorage.getItem('token');

    const engineeredPrompt = `A stylized, high-end 3D animated film caricature portrait focused tightly on the face and upper chest. 
    Subject: ${avatarForm.gender} with ${avatarForm.skin} skin. 
    Hair: ${avatarForm.hairColor} hair, ${avatarForm.hairStyle}. 
    Eyes: ${avatarForm.eyes} eyes. 
    Outfit: Wearing ${avatarForm.clothing}. 
    Expression: ${avatarForm.expression}. 
    Style details: Elegant, exaggerated proportions, smooth premium skin, no harsh realism. Expressive sculpt depth.
    Lighting: Soft and cinematic, delicate rim light. 
    Background: Clean, smooth ${avatarForm.background} gradient. 
    Overall vibe: Premium collectible card aesthetic.`;

    try {
      const res = await axios.post('http://localhost:5000/api/user/generate-avatar', 
        { prompt: engineeredPrompt }, 
        { headers: { 'x-auth-token': token } }
      );

      const newAvatarUrl = res.data.avatarUrl;
      const updatedUser = { ...userData, avatar: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setUser(updatedUser);

      setModal({ isOpen: true, title: 'Wouah !', message: 'Ton avatar 3D est prêt !', type: 'info' });
    } catch (err) {
      setModal({ isOpen: true, title: 'Erreur', message: 'La génération a échoué.', type: 'danger' });
    }
    setLoadingGen(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    const token = localStorage.getItem('token');

    try {
      const res = await axios.put('http://localhost:5000/api/user/profile', profileForm, {
        headers: { 'x-auth-token': token }
      });

      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUserData(res.data.user);
      setUser(res.data.user);
      setProfileForm(prev => ({ ...prev, password: '' }));

      setModal({ isOpen: true, title: 'Succès', message: 'Tes informations ont bien été mises à jour.', type: 'info' });
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Erreur lors de la mise à jour.';
      setModal({ isOpen: true, title: 'Erreur', message: errorMsg, type: 'danger' });
    }
    setLoadingProfile(false);
  };

  const inputStyle = {
    width: '100%', 
    padding: '12px 15px', 
    paddingLeft: '50px', // Augmenté à 50px pour éviter le chevauchement
    background: 'rgba(255, 255, 255, 0.05)', 
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', 
    color: 'white', 
    outline: 'none', 
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  };
  const iconStyle = { 
    position: 'absolute', 
    left: '18px', // Légèrement plus à droite pour un meilleur alignement
    top: '50%', 
    transform: 'translateY(-50%)', 
    color: '#888',
    pointerEvents: 'none',
    fontSize: '1.1rem' // Taille légèrement augmentée pour la lisibilité
  };
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} title={modal.title} message={modal.message} type={modal.type} />

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white' }}>Mon Profil</h1>
        <p style={{ color: '#888' }}>Personnalise ton alter ego et tes infos</p>
      </header>

      {/* --- AVATAR ACTUEL --- */}
      <div className="card" style={{ background: '#1a1a1a48', padding: '30px', borderRadius: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ 
          width: '150px', height: '150px', margin: '0 auto 15px auto', 
          borderRadius: '50%', border: '4px solid #ccff00', overflow: 'hidden', background: '#000'
        }}>
          {userData.avatar ? (
            <img src={userData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#444' }}>
              <FaUserEdit size={50} />
            </div>
          )}
        </div>
        <h2 style={{ color: 'white', margin: '0 0 5px 0' }}>{userData.name}</h2>
        <p style={{ color: '#ccff00', fontSize: '0.9rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>
          {userData.username ? `@${userData.username}` : 'Aucun pseudo'}
        </p>
        <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>{userData.email}</p>
      </div>

      {/* --- STUDIO 3D (AVEC LES NOUVEAUX MENUS CUSTOM) --- */}
      <div className="card" style={{ background: '#1a1a1a48', padding: '25px', borderRadius: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: '#ccff00', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaPalette /> Studio 3D (IA)
        </h3>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>Choisis tes traits, notre IA forgera ton avatar.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          
          <CustomSelect 
            label="Genre" name="gender" value={avatarForm.gender} onChange={handleAvatarChange}
            options={[ {value: "a male", label: "Homme"}, {value: "a female", label: "Femme"}, {value: "an androgynous person", label: "Androgyne"} ]}
          />

          <CustomSelect 
            label="Couleur de peau" name="skin" value={avatarForm.skin} onChange={handleAvatarChange}
            options={[ {value: "fair", label: "Très claire"}, {value: "light", label: "Claire"}, {value: "medium", label: "Mate"}, {value: "brown", label: "Brune"}, {value: "dark", label: "Foncée"} ]}
          />

          <CustomSelect 
            label="Cheveux (Couleur)" name="hairColor" value={avatarForm.hairColor} onChange={handleAvatarChange}
            options={[ {value: "black", label: "Noirs"}, {value: "dark brown", label: "Bruns"}, {value: "blonde", label: "Blonds"}, {value: "red", label: "Roux"}, {value: "white", label: "Blancs/Gris"}, {value: "neon blue", label: "Bleu Néon"} ]}
          />

          <CustomSelect 
            label="Cheveux (Coupe)" name="hairStyle" value={avatarForm.hairStyle} onChange={handleAvatarChange}
            options={[ {value: "short fade haircut", label: "Court avec dégradé"}, {value: "medium length messy hair", label: "Mi-longs ébouriffés"}, {value: "long straight hair", label: "Longs et lisses"}, {value: "curly voluminous hair", label: "Bouclés / Volumineux"}, {value: "bald", label: "Chauve"} ]}
          />

          <CustomSelect 
            label="Yeux" name="eyes" value={avatarForm.eyes} onChange={handleAvatarChange}
            options={[ {value: "brown", label: "Marron"}, {value: "blue", label: "Bleus"}, {value: "green", label: "Verts"}, {value: "grey", label: "Gris"} ]}
          />

          <CustomSelect 
            label="Vêtements" name="clothing" value={avatarForm.clothing} onChange={handleAvatarChange}
            options={[ {value: "modern sleek sportswear", label: "Sportswear moderne"}, {value: "a premium dark hoodie", label: "Hoodie sombre premium"}, {value: "cyberpunk streetwear", label: "Streetwear Cyberpunk"} ]}
          />

          <CustomSelect 
            label="Expression" name="expression" value={avatarForm.expression} onChange={handleAvatarChange}
            options={[ {value: "determined with a slight smirk", label: "Déterminé (sourire en coin)"}, {value: "highly focused and serious", label: "Concentré et sérieux"}, {value: "confident and playful", label: "Confiant et joueur"} ]}
          />

          <CustomSelect 
            label="Fond (Ambiance)" name="background" value={avatarForm.background} onChange={handleAvatarChange}
            options={[ {value: "pastel yellow", label: "Jaune Pastel"}, {value: "neon green", label: "Vert Néon"}, {value: "dark moody blue", label: "Bleu Sombre"}, {value: "cyberpunk purple", label: "Violet Cyberpunk"} ]}
          />

        </div>

        <button 
          onClick={handleGenerateAvatar} 
          disabled={loadingGen}
          style={{ 
            width: '100%', padding: '15px', background: 'linear-gradient(45deg, #ccff00, #00d4ff)', 
            border: 'none', color: 'black', fontWeight: 'bold', fontSize: '1rem', borderRadius: '12px', cursor: 'pointer'
          }}
        >
          {loadingGen ? 'Création de l\'Avatar en cours...' : <><FaMagic style={{ marginRight: '8px' }} /> Forger mon Avatar 3D</>}
        </button>
      </div>

      {/* --- INFOS PERSONNELLES --- */}
      <form onSubmit={handleUpdateProfile} className="card" style={{ background: 'rgba(26, 26, 26, 0.2)', padding: '25px', borderRadius: '20px' }}>
        <h3 style={{ color: 'white', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaUserEdit color="#00d4ff" /> Infos Personnelles
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <div  className="profile-input-container" style={{ position: 'relative' }}>
            <FaUser style={iconStyle} />
            <input type="text" name="name" placeholder="Nom complet" value={profileForm.name} onChange={handleProfileChange} style={inputStyle } required />
          </div>
          <div className="profile-input-container" style={{ position: 'relative' }}>
            <FaIdBadge style={iconStyle} />
            <input type="text" name="username" placeholder="Nom d'utilisateur (Pseudo)" value={profileForm.username} onChange={handleProfileChange} style={inputStyle} />
          </div>
          <div className="profile-input-container" style={{ position: 'relative' }}>
            <FaEnvelope style={iconStyle} />
            <input type="email" name="email" placeholder="Adresse Email" value={profileForm.email} onChange={handleProfileChange} style={inputStyle} required />
          </div>
          <div className="profile-input-container" style={{ position: 'relative' }}>
            <FaLock style={iconStyle} />
            <input type="password" name="password" placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)" value={profileForm.password} onChange={handleProfileChange} style={inputStyle} />
          </div>
        </div>

        <button 
          type="submit" disabled={loadingProfile}
          style={{ width: '100%', padding: '15px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {loadingProfile ? 'Mise à jour...' : <><FaSave style={{ marginRight: '8px' }} /> Sauvegarder les modifications</>}
        </button>
      </form>

    </div>
  );
}