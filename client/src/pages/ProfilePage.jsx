import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserEdit, FaCamera, FaMagic, FaSave } from 'react-icons/fa';
import CustomModal from '../components/CustomModal';

export default function ProfilePage({ setUser }) {
  const [userData, setUserData] = useState({ name: '', email: '', avatar: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingGen, setLoadingGen] = useState(false);
  
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserData(parsed);
      // Si l'utilisateur a déjà un avatar 3D généré, on l'affiche
      if (parsed.avatar) setPreviewUrl(parsed.avatar);
    }
  }, []);

  // --- GESTION DU FICHIER ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Prévisualisation locale immédiate
    }
  };

  // --- GÉNÉRATION AVEC GEMINI (via Backend) ---
  const handleGenerateAvatar = async () => {
    if (!selectedFile) {
      setModal({ isOpen: true, title: 'Aucune photo', message: 'Importe une photo de toi d\'abord !', type: 'info' });
      return;
    }

    setLoadingGen(true);
    const token = localStorage.getItem('token');

    // On prépare les données pour l'envoi
    const formData = new FormData();
    formData.append('image', selectedFile);
    // LE PROMPT SPÉCIFIQUE DEMANDÉ
    formData.append('prompt', "A stylized, high-end animated film caricature of character in the attached photo. It’s an ultra-close portrait focused tightly on the face and upper chest. The character has elegant, exaggerated proportions with smooth, premium skin no harsh realism. His expression is a determined person crossing his arms and with a little smile, playful smirk with bright eyes. The hair is a modern fade with volume on top, sculpted in stylized, expressive clusters with soft highlights. Lighting is soft and cinematic, featuring a delicate rim light. The background is a clean, smooth pastel yellow gradient. Overall vibe: A premium, clean collectible card aesthetic with expressive sculpt depth.");

    try {
      // NOTE : Tu devras créer cette route '/api/user/generate-avatar' dans ton backend
      // Elle doit recevoir l'image, l'envoyer à Gemini Pro Vision/Banana, et renvoyer l'URL
      const res = await axios.post('http://localhost:5000/api/user/generate-avatar', formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Simulation de réussite si pas de backend prêt (A RETIRER EN PROD)
      // const fakeUrl = URL.createObjectURL(selectedFile); // Juste pour tester l'UI
      
      const newAvatarUrl = res.data.avatarUrl; // L'URL retournée par ton backend/Cloudinary

      // Mise à jour locale
      const updatedUser = { ...userData, avatar: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setUser(updatedUser); // Met à jour le state global dans App.jsx

      setModal({ isOpen: true, title: 'Wouah !', message: 'Ton avatar 3D est prêt et magnifique.', type: 'info' });

    } catch (err) {
      console.error(err);
      setModal({ isOpen: true, title: 'Erreur', message: 'La génération a échoué. Vérifie ton backend.', type: 'danger' });
    }
    setLoadingGen(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} title={modal.title} message={modal.message} type={modal.type} />

      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: 'white' }}>Mon Profil</h1>
        <p style={{ color: '#888' }}>Gère ton identité de champion</p>
      </header>

      {/* --- CARTE AVATAR --- */}
      <div className="card" style={{ background: '#1a1a1a', padding: '30px', borderRadius: '20px', marginBottom: '20px', textAlign: 'center' }}>
        
        {/* ZONE IMAGE */}
        <div style={{ 
          width: '150px', height: '150px', margin: '0 auto 20px auto', 
          borderRadius: '50%', border: '4px solid #ccff00', overflow: 'hidden', position: 'relative', background: '#000'
        }}>
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            // ILLUSTRATION SOMBRE "PAS DE PHOTO"
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#333' }}>
              <FaUserEdit size={50} />
            </div>
          )}
          
          {/* Label pour l'input file caché */}
          <label htmlFor="file-upload" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)',
            color: 'white', padding: '5px', fontSize: '0.8rem', cursor: 'pointer'
          }}>
            <FaCamera /> Modifier
          </label>
          <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        <h2 style={{ color: 'white', margin: '0 0 5px 0' }}>{userData.name}</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{userData.email}</p>

        {/* BOUTON MAGIC GENERATION */}
        {selectedFile && (
          <button 
            onClick={handleGenerateAvatar} 
            disabled={loadingGen}
            className="btn-primary" 
            style={{ 
              marginTop: '20px', background: 'linear-gradient(45deg, #ccff00, #00d4ff)', border: 'none', color: 'black'
            }}
          >
            {loadingGen ? 'Magie en cours...' : <><FaMagic style={{ marginRight: '8px' }} /> Générer l'Avatar 3D</>}
          </button>
        )}
      </div>

      {/* --- FORMULAIRE INFO (Exemple) --- */}
      <div className="card" style={{ background: '#1a1a1a', padding: '20px', borderRadius: '20px' }}>
        <h3 style={{ color: '#ccff00', marginTop: 0 }}>Mes Infos</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Nom d'utilisateur</label>
            <input type="text" value={userData.name} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>Email</label>
            <input type="email" value={userData.email} readOnly style={{ opacity: 0.7, cursor: 'not-allowed' }} />
          </div>
        </div>
      </div>
    </div>
  );
}