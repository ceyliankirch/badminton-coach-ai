import React, { useState } from 'react';
import { color, motion } from 'framer-motion';
import { FaRobot, FaDumbbell, FaChartLine, FaArrowRight, FaTimes, FaCheck, FaBook } from 'react-icons/fa';
// Si tu n'as pas IconJournal dans tes composants, utilise FaBook à la place
import { IconJournal } from '../components/Icons'; 
import emailjs from '@emailjs/browser';

// --- 1. COMPOSANT CARTE "FEATURES" (NOUVEAU DESIGN) ---
const FeatureCard = ({ icon, title, desc, color = "#a78bfa" }) => (
  <motion.div 
    whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
    style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: '1px solid rgba(255,255,255,0.05)', 
      padding: '25px', 
      borderRadius: '24px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-start',
      gap: '15px',
      height: '100%', 
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }} 
  >
    <div style={{ 
      width: '50px', height: '50px', 
      background: `rgba(${parseInt(color.slice(1,3),16)}, ${parseInt(color.slice(3,5),16)}, ${parseInt(color.slice(5,7),16)}, 0.1)`, 
      borderRadius: '14px', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      color: color, 
      fontSize: '1.4rem' 
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>{title}</h3>
      <p style={{ color: '#999', lineHeight: '1.5', fontSize: '0.9rem', margin: 0 }}>{desc}</p>
    </div>
  </motion.div>
);

// --- 2. MODALE D'INSCRIPTION BETA ---
const BetaModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');

  if (!isOpen) return null;

  const sendEmail = (e) => {
    e.preventDefault();
    setStatus('sending');

    // 2. Configuration EmailJS (REMPLACE PAR TES VRAIS IDs)
    const serviceId = 'service_30aj78g';    // ex: service_abc123
    const templateId = 'template_4zvfwee';  // ex: template_xyz789
    const publicKey = 'A22AlDWX2y_yw9yXz';     // ex: aBcdEfGhIjKlMnOp

    // 3. Préparation des variables à envoyer au template
    // Les clés ('user_name', 'user_email') doivent correspondre aux {{variables}} de ton template EmailJS
    const templateParams = {
        user_name: name,
        user_email: email,
    };

    // 4. Envoi de l'e-mail
    emailjs.send(serviceId, templateId, templateParams, publicKey)
      .then((response) => {
          console.log('SUCCESS!', response.status, response.text);
          setStatus('success');
          // Optionnel : Vider les champs après succès
          setName('');
          setEmail('');
      })
      .catch((err) => {
          console.error('FAILED...', err);
          setStatus('error'); // Gère l'état d'erreur pour l'interface
      });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '450px',
          boxShadow: '0 20px 50px rgba(124, 58, 237, 0.15)',
          position: 'relative'
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><FaTimes /></button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '60px', height: '60px', background: 'rgba(74, 222, 128, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#4ade80' }}>
              <FaCheck size={30} />
            </div>
            <h3 style={{ color: 'white', fontFamily: 'Montserrat', fontSize: '1.5rem' }}>Bienvenue dans la Team !</h3>
            <p style={{ color: '#aaa', marginTop: '10px' }}>Tu as bien été ajouté à la liste d'attente. Surveille tes e-mails !</p>
            <button onClick={() => { onClose(); setStatus('idle'); }} style={{ marginTop: '20px', padding: '12px 30px', background: '#4ade80', border: 'none', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>Fermer</button>
          </div>
        ) : status === 'error' ? (
             <div style={{ textAlign: 'center', padding: '20px 0' }}>
             <h3 style={{ color: '#ef4444', fontFamily: 'Montserrat', fontSize: '1.5rem' }}>Oups !</h3>
             <p style={{ color: '#aaa', marginTop: '10px' }}>Une erreur est survenue lors de l'envoi. Réessaie plus tard.</p>
             <button onClick={() => setStatus('idle')} style={{ marginTop: '20px', padding: '12px 30px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer', color: '#fff' }}>Réessayer</button>
           </div>
        ) : (
          <>
            {/* ... Le reste de ton formulaire (h2, p, form) reste identique ... */}
            <h2 style={{ color: 'white', fontFamily: 'Montserrat', fontWeight: '800', fontSize: '1.8rem', marginBottom: '10px' }}>Rejoindre la Bêta</h2>
            <p style={{ color: '#888', marginBottom: '30px', lineHeight: '1.6' }}>
              Accède aux fonctionnalités exclusives du Coach IA avant tout le monde. Places limitées.
            </p>
            <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" placeholder="Ton Prénom" required 
                value={name} onChange={e => setName(e.target.value)}
                style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontFamily: 'Montserrat' }}
              />
              <input 
                type="email" placeholder="Ton Email" required 
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none', fontFamily: 'Montserrat' }}
              />
              <button 
                type="submit" disabled={status === 'sending'}
                style={{ 
                  marginTop: '10px', padding: '15px', borderRadius: '99px', border: 'none', 
                  background: 'linear-gradient(90deg, #3ac6ed, #55f7d7)', 
                  color: 'black', fontWeight: '800', fontFamily: 'Montserrat', fontSize: '1rem', cursor: 'pointer',
                  opacity: status === 'sending' ? 0.7 : 1
                }}
              >
                {status === 'sending' ? 'Envoi en cours...' : 'Envoyer ma demande 🚀'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};
// --- 3. PAGE PRINCIPALE ---
export default function LandingPage({ onEnterApp }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ 
      // FIX DU PADDING : On force la page à prendre tout l'écran
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      zIndex: 9999, overflowY: 'auto', margin: 0, padding: 0,
      fontFamily: 'Montserrat, sans-serif', background: '#050505', color: 'white'
    }}>
      
      {/* EFFETS DE FOND (Gradients) */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(58, 237, 204, 0.15) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: -1 }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(80px)', zIndex: -1 }} />

      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 5%', position: 'relative', zIndex: 10 }}>
        <div style={{ fontWeight: '800', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Remplace par ton logo SVG si tu l'as, sinon un placeholder */}
            <img src="/assets/badmin_logo_large.png" alt="Logo" style={{height: '40px'}} onError={(e) => {e.target.style.display='none'; e.target.parentElement.innerHTML = '<div style="width:20px; height:20px; background:#333; border-radius:4px"></div>'}} />
        </div>
        <button onClick={onEnterApp} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '99px', color: 'white', cursor: 'pointer', fontSize: '0.9rem', transition: '0.3s' }}>
          Connexion Membre
        </button>
      </nav>

      {/* HERO SECTION */}
      <header style={{ padding: '60px 5% 0 5%', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
          <span style={{ background: 'rgba(58, 237, 204, 0.1)', color: '#3aedcc', padding: '8px 16px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 'bold', border: '1px solid rgba(58, 237, 201, 0.2)' }}>
            ✨ L'Intelligence Artificielle au service de ton jeu
          </span>
          
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: '900', lineHeight: '1.1', margin: '30px 0', background: 'linear-gradient(180deg, #fff 0%, #aaa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ton Coach Badminton <br />
            <span style={{ color: '#3aedcc', WebkitTextFillColor: '#3aedcc' }}>Disponible 24/7.</span>
          </h1>
          
          <p style={{ maxWidth: '600px', margin: '0 auto 50px auto', color: '#888', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Analyse tes performances, génère des programmes physiques sur-mesure et suis ta progression grâce à la puissance de l'IA.
          </p>

          {/* VISUEL ORDINATEUR */}
          <div style={{ 
             maxWidth: '900px', margin: '0 auto', 
             background: 'rgba(255,255,255,0.03)', 
             border: '1px solid rgba(255,255,255,0.1)', 
             borderRadius: '20px 20px 0 0', 
             padding: '20px', 
             backdropFilter: 'blur(10px)',
             boxShadow: '0 -20px 60px rgba(58, 237, 210, 0.15)',
             transform: 'perspective(1000px) rotateX(5deg)',
             overflow: 'hidden'
          }}>
            <img 
                src="/assets/laptop-screenshot.png" 
                alt="Interface Preview" 
                style={{ width: '100%', borderRadius: '10px', opacity: 0.9, display: 'block' }} 
                onError={(e) => {e.target.style.display='none'; e.target.parentElement.innerHTML = '<div style="height:300px; display:flex; align-items:center; justify-content:center; color:#444">Ajoute une image laptop-screenshot.png dans public/assets</div>'}} 
            />
          </div>
        </motion.div>
      </header>

      {/* NOUVELLE SECTION FEATURES (Design Asymétrique) */}
      <section style={{ position: 'relative', zIndex: 10, background: '#050505', padding: '100px 5%', overflow: 'hidden' }}>
        
        {/* Titre Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '15px' }}>
                Tout ce dont tu as besoin <br/>
                <span style={{ background: 'linear-gradient(90deg, #3aedba, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>pour performer.</span>
            </h2>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'center' }}>
          
          {/* GRILLE DE CARTES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
             <FeatureCard icon={<FaRobot />} title="Coach IA" desc="Analyse tes matchs et reçois des conseils tactiques personnalisés instantanés." color="#3aedba" />
             <FeatureCard icon={<FaDumbbell />} title="Prépa Physique" desc="Des programmes sur-mesure (Cardio, Explosivité) adaptés à ta forme." color="#f472b6" />
             <FeatureCard icon={<FaChartLine />} title="Statistiques" desc="Visualise ta progression avec des graphiques clairs sur tes résultats." color="#60a5fa" />
             <FeatureCard icon={typeof IconJournal !== 'undefined' ? <IconJournal /> : <FaBook />} title="Journal de Bord" desc="Centralise tes sensations et tes objectifs pour ne jamais perdre le fil." color="#24acfb" />
          </div>

          {/* IMAGE MOBILE FLOTTANTE */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'auto', height: '200px', zIndex: -1 }} />
            
            <motion.img 
                src="/assets/phone-screenshot.png" 
                alt="App Mobile" 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                style={{ 
                    width: '70%', 
                }} 
                onError={(e) => {e.target.style.display='none'; e.target.parentElement.innerHTML = '<div style="width:280px; height:500px; background:#111; border-radius:30px; display:flex; align-items:center; justify-content:center; color:#444; border:4px solid #333">Ajoute phone-screenshot.jpg</div>'}} 
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '40px', color: '#444', fontSize: '0.9rem', position: 'relative', zIndex: 10 }}>
        &copy; 2026 Badminton Coach AI. Tous droits réservés.
      </footer>

      {/* BOUTON FLOTTANT "REJOINDRE LA BETA" */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        onClick={() => setModalOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          background: 'linear-gradient(135deg, #00ffe1, #00d5ff)',
          padding: '15px 30px', borderRadius: '99px',
          boxShadow: '0 10px 30px rgba(58, 180, 237, 0.4)',
          cursor: 'pointer', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '10px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'black'}}>Rejoindre la Bêta</span>
        <FaArrowRight style={{ color: 'black' }} />
      </motion.div>

      {/* MODALE */}
      <BetaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

    </div>
  );
}