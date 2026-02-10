import { useState, useEffect } from 'react';
import { IconJournal, IconTrash } from '../components/Icons'; // <-- Import IconTrash

export default function TrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [formData, setFormData] = useState({ theme: '', notes: '', rating: 5 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = () => {
    fetch('http://localhost:5000/api/trainings')
      .then(res => res.json())
      .then(data => setTrainings(data))
      .catch(err => console.error("Erreur:", err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        fetchTrainings(); // On recharge la liste
        setFormData({ theme: '', notes: '', rating: 5 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- NOUVELLE FONCTION : SUPPRIMER ---
  const deleteTraining = async (id) => {
    // Petite confirmation avant de supprimer
    if (!window.confirm("Veux-tu vraiment supprimer cette séance ?")) return;

    try {
      await fetch(`http://localhost:5000/api/trainings/${id}`, {
        method: 'DELETE'
      });
      // On met à jour la liste localement en filtrant l'élément supprimé
      setTrainings(trainings.filter(t => t._id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        {/* ... header inchangé ... */}
        <div style={{ width: '50px', height: '50px', background: 'rgba(204, 255, 0, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: '#ccff00' }}>
          <IconJournal />
        </div>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Journal d'Entraînement</h1>
        <p style={{ color: '#888', marginTop: '5px' }}>Note tes séances et reçois des conseils</p>
      </header>
      
      <div className="card" style={{ marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
        {/* ... formulaire inchangé ... */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Thème de la séance</label>
            <input 
              type="text" placeholder="Ex: Défense smash, Filet..." 
              value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})}
              required
            />
          </div>
          <div>
            <label>Tes sensations / Notes</label>
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
              
              {/* EN-TÊTE DE LA CARTE AVEC LE BOUTON SUPPRIMER */}
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>{training.theme}</h4>
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>{new Date(training.date).toLocaleDateString()}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Badge Note */}
                  <div style={{ 
                    background: training.rating >= 7 ? 'rgba(204, 255, 0, 0.15)' : 'rgba(255, 255, 255, 0.1)', 
                    color: training.rating >= 7 ? '#ccff00' : '#ccc',
                    padding: '5px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' 
                  }}>
                    {training.rating}/10
                  </div>
                  
                  {/* --- BOUTON POUBELLE --- */}
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