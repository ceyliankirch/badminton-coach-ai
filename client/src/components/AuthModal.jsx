import { useState } from 'react';
import { auth, googleProvider, appleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true); // true = Login, false = Signup
  const [error, setError] = useState('');
  
  // Champs du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  // --- LOGIQUE DE SÉCURITÉ ---
  const validatePassword = (pass) => {
    // Min 8 caractères, 1 chiffre, 1 majuscule (optionnel mais recommandé)
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(pass);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // --- CONNEXION ---
        await signInWithEmailAndPassword(auth, email, password);
        onClose(); // On ferme le modal si succès
      } else {
        // --- INSCRIPTION ---
        if (password !== confirmPass) throw new Error("Les mots de passe ne correspondent pas.");
        if (!validatePassword(password)) throw new Error("Le mot de passe doit contenir 8 caractères et 1 chiffre.");
        if (username.length < 3) throw new Error("Le nom d'utilisateur est trop court.");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // On ajoute le nom d'utilisateur au profil Firebase
        await updateProfile(userCredential.user, { displayName: username });
        onClose();
      }
    } catch (err) {
      // Traduction basique des erreurs Firebase
      if (err.code === 'auth/email-already-in-use') setError("Cet email est déjà utilisé.");
      else if (err.code === 'auth/wrong-password') setError("Mot de passe incorrect.");
      else if (err.code === 'auth/user-not-found') setError("Aucun compte avec cet email.");
      else setError(err.message);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err) {
      setError("Erreur connexion sociale");
      console.error(err);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="card" style={modalStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* --- HEADER --- */}
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'white' }}>
          {isLogin ? 'Bon retour Coach !' : 'Rejoins la Team 🚀'}
        </h2>

        {/* --- ERREUR --- */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* --- SOCIAL BUTTONS --- */}
        <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
          <button style={googleBtnStyle} onClick={() => handleSocialLogin(googleProvider)}>
            <img src="https://img.icons8.com/color/48/google-logo.png" width="20" alt="G" /> 
            Continuer avec Google
          </button>
          <button style={appleBtnStyle} onClick={() => handleSocialLogin(appleProvider)}>
            <img src="https://img.icons8.com/ios-filled/50/ffffff/mac-os.png" width="20" alt="A" />
            Continuer avec Apple
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: '#666' }}>
          <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
          <span>OU</span>
          <div style={{ flex: 1, height: '1px', background: '#333' }}></div>
        </div>

        {/* --- FORMULAIRE CLASSIQUE --- */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {!isLogin && (
            <input 
              type="text" placeholder="Nom d'utilisateur" required 
              value={username} onChange={e => setUsername(e.target.value)}
            />
          )}
          
          <input 
            type="email" placeholder="Email" required 
            value={email} onChange={e => setEmail(e.target.value)}
          />
          
          <input 
            type="password" placeholder="Mot de passe" required 
            value={password} onChange={e => setPassword(e.target.value)}
          />

          {!isLogin && (
            <>
              <input 
                type="password" placeholder="Confirmer le mot de passe" required 
                value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              />
              <small style={{ color: '#888', fontSize: '0.75rem' }}>
                Politique : 8 caractères min, au moins 1 chiffre.
              </small>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>

        {/* --- TOGGLE LOGIN/SIGNUP --- */}
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#ccc', fontSize: '0.9rem' }}>
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            style={{ color: '#ccff00', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </span>
        </p>

      </div>
    </div>
  );
}

// --- STYLES INLINE (Pour aller vite, tu pourras mettre en CSS) ---
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
  zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center',
  padding: '20px'
};

const modalStyle = {
  width: '100%', maxWidth: '400px', 
  boxShadow: '0 0 50px rgba(204, 255, 0, 0.15)',
  animation: 'fadeIn 0.3s'
};

const googleBtnStyle = {
  background: 'white', color: '#333', border: 'none', padding: '12px',
  borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
};

const appleBtnStyle = {
  background: 'black', color: 'white', border: '1px solid #333', padding: '12px',
  borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
};

const errorStyle = {
  background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', padding: '10px',
  borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center'
};