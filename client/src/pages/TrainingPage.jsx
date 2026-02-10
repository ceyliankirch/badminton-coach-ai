import { useState, useEffect } from 'react';
import { IconJournal, IconTrash } from '../components/Icons';

export default function TrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [formData, setFormData] = useState({ theme: '', notes: '', rating: 5 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Si pas connecté, on arrête là pour éviter les erreurs

    fetch('http://localhost:5000/api/trainings', {
      headers: { 'x-auth-token': token } // <--- LE PASS SANITAIRE
    })
      .then(res => res.json())
      .then(data => {
        // Sécurité anti-crash : on ne met à jour que si c'est bien une liste
        if (Array.isArray(data)) {
            setTrainings(data);
        } else {
            console.error("Erreur format données:", data);
        }
      })
      .catch(err => console.error("Erreur:", err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) return alert("Tu dois être connecté !");

    try {
      const response = await fetch('http://localhost:5000/api/trainings', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-auth-token': token // <--- AJOUT DU TOKEN
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        fetchTrainings(); 
        setFormData({ theme: '', notes: '', rating: 5 });
      } else {
          alert("Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const deleteTraining = async (id) => {
    if (!window.confirm("Veux-tu vraiment supprimer cette séance ?")) return;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/trainings/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      // ON VÉRIFIE QUE LE SERVEUR A DIT "OK" AVANT DE SUPPRIMER VISUELLEMENT
      if (response.ok) {
        setTrainings(trainings.filter(t => t._id !== id));
      } else {
        alert("Impossible de supprimer (Erreur serveur)");
      }
    } catch (err) {
      alert("Erreur de connexion");
    }
  };

  // --- RENDU (Inchangé) ---
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', background: 'rgba(204, 255, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: '#ccff00' }}>
          <IconJournal />
        </div>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Journal d'Entraînement</h1>
        <p style={{ color: '#888', marginTop: '5px' }}>Note tes séances et reçois des conseils</p>
      </header>
      
      <div className="card" style={{ marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#ccc', fontWeight: 'bold' }}>
              Thème de la séance
            </label>
            <input 
              type="text" placeholder="Ex: Défense smash, Filet..." 
              value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#ccc', fontWeight: 'bold' }}>
              Tes sensations / Notes
            </label>
            <textarea 
              placeholder="Comment t'es-tu senti ?..." 
              value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          <div>
            <label>Note de satisfaction : <span style={{ color: '#ccff00', fontWeight: 'bold' }}>{formData.rating}/10</span></label>
            <input 
              type="range" min="0" max="10" 
              value={formData.rating} onChange={e => setFormData({...formData, rating: e.target.value})}
              style={{ width: '100%', accentColor: '#ccff00', cursor: 'pointer' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? '⏳ Analyse IA...' : 'Enregistrer & Analyser'}
          </button>
        </form>
      </div>

      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Historique récent</h3>
        {trainings.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>Aucune séance enregistrée.</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {trainings.map(training => (
            <div key={training._id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>{training.theme}</h4>
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>{new Date(training.date).toLocaleDateString()}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    background: training.rating >= 7 ? 'rgba(204, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)', 
                    color: training.rating >= 7 ? '#ccff00' : '#ccc',
                    padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' 
                  }}>
                    {training.rating}/10
                  </div>
                  
                  <div className="delete-btn" onClick={() => deleteTraining(training._id)} title="Supprimer la séance">
                    <IconTrash />
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p style={{ color: '#ccc', margin: 0, fontStyle: 'italic', fontSize: '0.95rem' }}>"{training.notes}"</p>
                {training.aiFeedback && (
                  <div style={{ marginTop: 'auto', background: 'rgba(204, 255, 0, 0.03)', border: '1px solid rgba(204, 255, 0, 0.2)', borderRadius: '12px', padding: '15px' }}>
                    <strong style={{ color: '#ccff00', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '0.85rem' }}>
                      ✨ Conseil du Coach
                    </strong>
                    <p style={{ margin: 0, color: '#ddd', fontSize: '0.9rem', lineHeight: '1.5' }}>{training.aiFeedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}