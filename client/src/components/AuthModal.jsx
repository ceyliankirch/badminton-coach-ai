import { useState } from 'react';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Signup
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); // Pour le bandeau vert
  
  // Champs du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [firstName, setFirstName] = useState(''); // On utilise firstName maintenant

  if (!isOpen) return null;

  // --- LOGIQUE DE SÉCURITÉ ---
  const validatePassword = (pass) => {
    // Regex corrigée : Accepte tout (.), force 1 chiffre (\d), min 8 caractères
    const regex = /^(?=.*\d).{8,}$/;
    return regex.test(pass);
  };

const handleAuth = async (e) => {
    e.preventDefault();
    console.log("🚀 Tentative d'authentification lancée..."); // TEST 1
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        console.log("📡 Envoi de la requête login à l'API..."); // TEST 2
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      });       
      
      console.log("✅ Réponse reçue du serveur :", res.data); // TEST 3
        
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        // Fermeture et refresh
        onClose(); 
        window.location.reload(); 

      } else {
        // --- INSCRIPTION ---
        if (password !== confirmPass) throw new Error("Les mots de passe ne correspondent pas.");
        if (!validatePassword(password)) throw new Error("Le mot de passe doit contenir 8 caractères et 1 chiffre.");
        if (firstName.length < 2) throw new Error("Le prénom est trop court.");

        // Envoi au backend (le backend attend 'name', on lui envoie firstName)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        name: firstName,
        email,
        password
      });       

        // SUCCÈS : On ne ferme pas, on redirige vers le Login avec un bandeau
        setSuccessMsg("Compte créé avec succès ! Connectez-vous.");
        setIsLogin(true); // Bascule vers l'écran de connexion
        setPassword(''); // On vide le mot de passe par sécurité
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || err.message || "Une erreur est survenue");
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'white' }}>
          {isLogin ? 'Bon retour Coach !' : 'Rejoins la Team 🚀'}
        </h2>

        {/* --- BANDEAU SUCCÈS (Nouveau) --- */}
        {successMsg && <div style={successStyle}>{successMsg}</div>}

        {/* --- BANDEAU ERREUR --- */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* --- FORMULAIRE --- */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Champ Prénom au lieu de Nom d'utilisateur */}
          {!isLogin && (
            <input 
              type="text" placeholder="Ton Prénom" required 
              value={firstName} onChange={e => setFirstName(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: 'none' }}
            />
          )}
          
          <input 
            type="email" placeholder="Email" required 
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: 'none' }}
          />
          
          <input 
            type="password" placeholder="Mot de passe" required 
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: 'none' }}
          />

          {!isLogin && (
            <>
              <input 
                type="password" placeholder="Confirmer le mot de passe" required 
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                style={{ padding: '10px', borderRadius: '8px', border: 'none' }}
              />
              <small style={{ color: '#888', fontSize: '0.75rem' }}>
                Politique : 8 caractères min, au moins 1 chiffre.
              </small>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '10px', borderRadius: '999px', cursor: 'pointer', background: 'var(--primary)', border: 'none', fontWeight: 'bold' }}>
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        {/* --- TOGGLE LOGIN/SIGNUP --- */}
        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </span>
        </p>

      </div>
    </div>
  );
}

// --- STYLES ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const modalStyle = { width: '100%', maxWidth: '400px', background: '#1a1a1a', padding: '20px', borderRadius: '15px', boxShadow: '0 0 50px rgba(204, 255, 0, 0.15)', animation: 'fadeIn 0.3s' };
const errorStyle = { background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' };
// Nouveau style pour le succès
const successStyle = { background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #4ade80' };