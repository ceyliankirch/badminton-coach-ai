import { useState, useEffect } from 'react';
import { IconDumbbell, IconTrash } from '../components/Icons'; 

export default function PrepaPage() {
  const [focus, setFocus] = useState('Explosivité');
  const [program, setProgram] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    // 1. On récupère le token
    const token = localStorage.getItem('token');
    if (!token) return; // Si pas connecté, on ne charge pas l'historique

    // 2. On l'ajoute dans les headers
    fetch('http://localhost:5000/api/prepa/history', {
      headers: { 'x-auth-token': token }
    })
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error(err));
  };

  const generateProgram = async () => {
    setLoading(true);
    setProgram(null);
    
    // On récupère le token (au cas où tu aurais protégé la génération aussi)
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Tu dois être connecté pour générer un programme !");
        setLoading(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/prepa', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-auth-token': token // AJOUT DU TOKEN ICI
        },
        body: JSON.stringify({ focus })
      });
      const data = await response.json();
      if (response.ok) setProgram(data);
    } catch (err) {
      alert("Erreur génération");
    } finally {
      setLoading(false);
    }
  };

  const saveProgram = async () => {
    if (!program) return;

    const token = localStorage.getItem('token');
    if (!token) return alert("Connecte-toi pour sauvegarder !");

    try {
      const response = await fetch('http://localhost:5000/api/prepa/save', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-auth-token': token // AJOUT DU TOKEN ICI
        },
        body: JSON.stringify({ focus, program })
      });
      if (response.ok) {
        alert("Sauvegardé !");
        fetchHistory(); // On recharge l'historique après sauvegarde
      }
    } catch (err) {
      alert("Erreur sauvegarde");
    }
  };

  const deleteProgram = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Supprimer ce programme de l'historique ?")) return;

    const token = localStorage.getItem('token');

    try {
      await fetch(`http://localhost:5000/api/prepa/${id}`, {
        method: 'DELETE',
        headers: { 
            'x-auth-token': token // AJOUT DU TOKEN ICI
        }
      });
      
      setHistory(history.filter(item => item._id !== id));
      
      if (program && program._id === id) {
        setProgram(null);
      }
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
      
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', background: 'rgba(204, 255, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: '#ccff00' }}>
          <IconDumbbell />
        </div>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Générateur Physique</h1>
        <p style={{ color: '#888', marginTop: '5px' }}>Crée ta séance sur mesure avec l'IA</p>
      </header>

      <div className="card" style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '15px', marginLeft: '10px', color: '#ccc', fontSize: '0.9rem' }}>
          Objectif de la séance :
        </label>
        <select value={focus} onChange={(e) => setFocus(e.target.value)} style={{ marginBottom: '20px' }}>
          <option value="Explosivité">⚡ Explosivité & Puissance</option>
          <option value="Endurance">🏃‍♂️ Cardio & Endurance</option>
          <option value="Gainage">💪 Renforcement & Gainage</option>
          <option value="Jeu de jambes">🦶 Agilité & Jeu de jambes</option>
          <option value="Récupération">🧘‍♂️ Souplesse & Récupération</option>
        </select>
        <button className="btn-primary" onClick={generateProgram} disabled={loading}>
          {loading ? '⏳ L\'IA travaille...' : 'Générer un Nouveau Programme'}
        </button>
      </div>

      {program && (
        <div style={{ animation: 'fadeIn 0.5s', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#ccff00', margin: 0 }}>✨ Programme : {program.focus || focus}</h3>
            <button onClick={() => setProgram(null)} style={{ background: 'transparent', border: '1px solid #444', color: '#888', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}>Fermer ✕</button>
          </div>
          <div style={{ display: 'grid', gap: '15px', marginBottom: '20px' }}>
            <Section title="🔥 Échauffement" exercises={program.warmup || (program.content && program.content.warmup)} />
            <Section title="💣 Corps de séance" exercises={program.main || (program.content && program.content.main)} highlight />
            <Section title="🧊 Retour au calme" exercises={program.cooldown || (program.content && program.content.cooldown)} />
          </div>
          {/* On n'affiche le bouton sauvegarder que si le programme n'a pas d'ID (donc s'il vient d'être généré et pas chargé depuis l'historique) */}
          {!program._id && (
            <button className="btn-primary" onClick={saveProgram} style={{ background: 'white', color: 'black' }}>
              💾 Sauvegarder dans l'historique
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: '40px', paddingBottom: '100px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>📚 Historique</h3>
        {history.length === 0 && <p style={{ color: '#666' }}>Aucun programme sauvegardé.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {history.map(item => (
            <div 
              key={item._id} 
              className="card" 
              onClick={() => {
                setProgram(item);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{ 
                padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', 
                cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', minHeight: '120px' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ccff00'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <div>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.focus}</span>
                <br/>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(item.date).toLocaleDateString()}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                 <span style={{ color: '#ccff00', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Voir ➔
                </span>

                <div className="delete-btn" onClick={(e) => deleteProgram(item._id, e)} title="Supprimer ce programme">
                  <IconTrash />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Composant Section inchangé
function Section({ title, exercises, highlight }) {
  if (!exercises) return null;
  return (
    <div className="card" style={{ borderLeft: highlight ? '3px solid #ccff00' : '1px solid rgba(255,255,255,0.1)' }}>
      <h3 style={{ marginTop: 0, fontSize: '1rem', color: highlight ? '#ccff00' : 'white' }}>{title}</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {exercises.map((exo, i) => (
          <li key={i} style={{ marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'start', color: '#ddd' }}>
            <input type="checkbox" />
            <span style={{ lineHeight: '1.4' }}>{exo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}