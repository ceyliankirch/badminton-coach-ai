import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaUsers, FaDumbbell, FaBug, FaTrash, FaUserShield, 
  FaChartLine, FaChevronDown, FaPlus, FaCalendarAlt, FaLightbulb, FaEdit 
} from 'react-icons/fa';
import CustomModal from '../components/CustomModal';

export default function AdminDashboard() {
  // --- ÉTATS ---
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Interface & Responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);

  // Nouvelle Feature (avec champs priorité/status pour Kanban)
  const [newFeature, setNewFeature] = useState({ 
    title: '', description: '', startDate: '', endDate: '', 
    priority: 'medium', status: 'en_attente' 
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // --- EFFETS ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetchAdminData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAdminData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [resUsers, resFeedbacks, resFeatures] = await Promise.all([
        axios.get(`${API_URL}/api/admin/users`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_URL}/api/admin/feedbacks`, { headers: { 'x-auth-token': token } }),
        axios.get(`${API_URL}/api/admin/features`, { headers: { 'x-auth-token': token } })
      ]);
      setUsers(resUsers.data);
      setFeedbacks(resFeedbacks.data);
      setFeatures(resFeatures.data);
    } catch (err) {
      console.error("Erreur chargement admin:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE SUPPRESSION ---
  const askConfirmation = (title, message, confirmAction) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await confirmAction();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteUser = (id) => {
    askConfirmation("Supprimer l'utilisateur ?", "Action irréversible.", async () => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/users/${id}`, { headers: { 'x-auth-token': token } });
      setUsers(users.filter(u => u._id !== id));
      setModal({ isOpen: true, title: 'Succès', message: 'Utilisateur supprimé.', type: 'info' });
    });
  };

  const deleteFeature = (id) => {
    askConfirmation("Supprimer la feature ?", "Suppression définitive.", async () => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/features/${id}`, { headers: { 'x-auth-token': token } });
      setFeatures(features.filter(f => f._id !== id));
    });
  };

  const deleteFeedback = (id) => {
    askConfirmation("Supprimer ce feedback ?", "Le retour sera effacé.", async () => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/admin/feedbacks/${id}`, { headers: { 'x-auth-token': token } });
      setFeedbacks(feedbacks.filter(f => f._id !== id));
    });
  };

  // --- ACTIONS FEATURES (CRUD) ---
  const handleAddFeature = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API_URL}/api/admin/features`, newFeature, { headers: { 'x-auth-token': token } });
      setFeatures([...features, res.data]);
      setNewFeature({ title: '', description: '', startDate: '', endDate: '', priority: 'medium', status: 'en_attente' });
      setShowFeatureForm(false);
      setModal({ isOpen: true, title: 'Roadmap', message: 'Feature ajoutée !', type: 'info' });
    } catch (err) { alert("Erreur ajout"); }
  };

  const updateFeature = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put(`${API_URL}/api/admin/features/${id}`, editingFeature, { 
        headers: { 'x-auth-token': token } 
      });
      setFeatures(features.map(f => f._id === id ? res.data : f));
      setEditingFeature(null);
      setModal({ isOpen: true, title: 'Succès', message: 'Feature mise à jour !', type: 'info' });
    } catch (err) { alert("Erreur modification"); }
  };

  // --- ACTION KANBAN : Déplacer une carte ---
  // C'est cette fonction qui manquait peut-être et causait l'erreur !
  const updateFeatureStatus = async (feature, newStatus) => {
    const token = localStorage.getItem('token');
    try {
      // Optimiste UI update
      const updatedFeatures = features.map(f => f._id === feature._id ? { ...f, status: newStatus } : f);
      setFeatures(updatedFeatures);

      await axios.put(`${API_URL}/api/admin/features/${feature._id}`, { status: newStatus }, { headers: { 'x-auth-token': token } });
    } catch (err) {
      alert("Erreur lors du déplacement");
      fetchAdminData(); // On recharge si ça plante
    }
  };

  // --- STATS ---
  const stats = {
    total: users.length,
    coachs: users.filter(u => u.role === 'coach').length,
    bugs: feedbacks.filter(f => f.type === 'bug').length
  };

  // --- STYLES ---
  const inputStyle = {
    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', outline: 'none', fontSize: '14px'
  };

  const trashButtonStyle = {
    background: 'none', border: 'none', color: '#444', cursor: 'pointer',
    padding: '8px', transition: 'all 0.3s ease', display: 'flex'
  };

  const onTrashHover = (e) => {
    e.currentTarget.style.color = '#ef4444';
    e.currentTarget.style.transform = 'scale(1.2) rotate(8deg)';
  };

  const onTrashLeave = (e) => {
    e.currentTarget.style.color = '#444';
    e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'white' }}>Chargement du Dashboard...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '10px 10px 100px 10px' : '20px 20px 100px 20px' }}>
      
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} title={modal.title} message={modal.message} type={modal.type} />
      
      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '30px', textAlign: 'center', border: '1px solid #ef4444', background: '#0a0a0a', borderRadius: '20px' }}>
            <FaTrash size={40} color="#ef4444" style={{ marginBottom: '15px' }} />
            <h2 style={{ color: 'white', margin: '0 0 10px 0' }}>{confirmModal.title}</h2>
            <p style={{ color: '#888', marginBottom: '25px' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} style={{ flex: 1, padding: '12px', background: '#222', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Annuler</button>
              <button onClick={confirmModal.onConfirm} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '15px', fontSize: isMobile ? '1.5rem' : '2rem' }}>
          <FaUserShield color="var(--primary)" /> Admin Panel
        </h1>
      </header>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '15px', marginBottom: '40px' }}>
        <StatCard icon={<FaUsers />} label="Utilisateurs" value={stats.total} color="#3498db" />
        <StatCard icon={<FaDumbbell />} label="Coachs" value={stats.coachs} color="#3aedcc" />
        <StatCard icon={<FaBug />} label="Bugs Signalés" value={stats.bugs} color="#ef4444" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        
        {/* TABLEAU UTILISATEURS */}
        <section className="card" style={{ background: 'rgba(26,26,26,0.4)', padding: isMobile ? '15px' : '25px', borderRadius: '20px' }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>Membres & Activité</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', color: 'white' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', fontSize: '0.8rem', color: '#666' }}>
                  <th style={{ padding: '12px' }}>UTILISATEUR</th>
                  <th style={{ padding: '12px' }}>RÔLE</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>SÉANCES</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '15px 12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#555' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '15px 12px' }}>
                      <span style={{ 
                        fontSize: '10px', padding: '3px 8px', borderRadius: '6px', 
                        background: u.role === 'admin' ? '#ef4444' : u.role === 'coach' ? '#3aedcc' : '#333',
                        color: u.role === 'coach' ? 'black' : 'white', fontWeight: 'bold', textTransform: 'uppercase'
                      }}>
                        {u.role === 'user' || !u.role ? 'JOUEUR' : u.role}
                      </span>
                    </td>
                    <td style={{ padding: '15px 12px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold' }}>{u.trainingCount || 0}</td>
                    <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                      <button onClick={() => deleteUser(u._id)} style={trashButtonStyle} onMouseEnter={onTrashHover} onMouseLeave={onTrashLeave}><FaTrash size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- ROADMAP KANBAN PRODUCTIVITÉ --- */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaChartLine color="var(--primary)" /> Roadmap Features
            </h3>
            <button onClick={() => setShowFeatureForm(!showFeatureForm)} style={{ padding: '8px 15px', borderRadius: '8px', background: 'var(--primary)', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
              {showFeatureForm ? 'Fermer' : '+ Nouvelle Feature'}
            </button>
          </div>

          {showFeatureForm && (
            <form onSubmit={handleAddFeature} className="card" style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid var(--primary)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                <input type="text" placeholder="Titre..." value={newFeature.title} onChange={e => setNewFeature({...newFeature, title: e.target.value})} style={inputStyle} required />
                <select value={newFeature.priority} onChange={e => setNewFeature({...newFeature, priority: e.target.value})} style={inputStyle}>
                  <option value="low">Prio Basse 🟢</option>
                  <option value="medium">Prio Moyenne 🟡</option>
                  <option value="high">Prio Haute 🔴</option>
                </select>
                <select value={newFeature.status} onChange={e => setNewFeature({...newFeature, status: e.target.value})} style={inputStyle}>
                  <option value="en_attente">À faire</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{color: '#888', fontSize: '0.8rem'}}>Début</label>
                  <input type="date" value={newFeature.startDate} onChange={e => setNewFeature({...newFeature, startDate: e.target.value})} style={{...inputStyle, marginTop: '5px'}} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{color: '#888', fontSize: '0.8rem'}}>Fin</label>
                  <input type="date" value={newFeature.endDate} onChange={e => setNewFeature({...newFeature, endDate: e.target.value})} style={{...inputStyle, marginTop: '5px'}} />
                </div>
              </div>

              <textarea placeholder="Description technique..." value={newFeature.description} onChange={e => setNewFeature({...newFeature, description: e.target.value})} style={{ ...inputStyle, height: '80px', resize: 'none' }} required />
              
              <button type="submit" style={{ padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Ajouter au Kanban</button>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px', alignItems: 'start' }}>
            
            <KanbanColumn 
              title="📌 À FAIRE" 
              color="#facc15" 
              features={features.filter(f => f.status === 'en_attente' || !f.status)} // Sécurité pour les anciens items
              updateStatus={updateFeatureStatus}
              deleteFeature={deleteFeature}
              setEditingFeature={setEditingFeature}
            />

            <KanbanColumn 
              title="⚙️ EN COURS" 
              color="#3b82f6" 
              features={features.filter(f => f.status === 'en_cours')} 
              updateStatus={updateFeatureStatus}
              deleteFeature={deleteFeature}
              setEditingFeature={setEditingFeature}
            />

            <KanbanColumn 
              title="✅ TERMINÉ" 
              color="#22c55e" 
              features={features.filter(f => f.status === 'termine')} 
              updateStatus={updateFeatureStatus}
              deleteFeature={deleteFeature}
              setEditingFeature={setEditingFeature}
            />
          </div>
        </section>

        {/* FEEDBACKS BETA */}
        <section>
          <h3 style={{ color: 'white', marginBottom: '20px' }}><FaBug color="#ef4444" /> Retours Beta</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {feedbacks.map(f => (
              <div key={f._id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${f.type === 'bug' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(58, 237, 204, 0.2)'}`, padding: '15px', borderRadius: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: f.type === 'bug' ? '#ef4444' : '#3aedcc', color: 'black' }}>{f.type.toUpperCase()}</span>
                  <button onClick={() => deleteFeedback(f._id)} style={trashButtonStyle} onMouseEnter={onTrashHover} onMouseLeave={onTrashLeave}><FaTrash size={12}/></button>
                </div>
                <p style={{ color: 'white', fontSize: '0.85rem', fontStyle: 'italic' }}>"{f.message}"</p>
                <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '10px' }}>Par {f.userId?.name || 'Inconnu'} • {new Date(f.date).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', borderLeft: `4px solid ${color}`, display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ color: color, fontSize: '1.5rem' }}>{icon}</div>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
        <div style={{ color: '#ffffff', fontSize: '1.6rem', fontWeight: 'bold' }}>{value}</div>
      </div>
    </div>
  );
}

function KanbanColumn({ title, color, features, updateStatus, deleteFeature, setEditingFeature }) {
  const getPriorityColor = (p) => {
    if (p === 'high') return '#ef4444';   
    if (p === 'medium') return '#facc15'; 
    return '#22c55e';                     
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '15px', borderTop: `4px solid ${color}`, minHeight: '200px' }}>
      <h4 style={{ color: color, textAlign: 'center', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title} ({features.length})
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {features.map(f => (
          <div key={f._id} style={{ background: '#1a1a1a', padding: '15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            
            {/* Header Carte : Priorité & Flèches */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', background: getPriorityColor(f.priority || 'medium'), color: 'black', textTransform: 'uppercase' }}>
                {f.priority || 'Normal'}
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {f.status !== 'en_attente' && (
                  <button onClick={() => updateStatus(f, 'en_attente')} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '14px' }} title="Reculer">⬅️</button>
                )}
                {f.status !== 'termine' && (
                  <button onClick={() => updateStatus(f, f.status === 'en_attente' ? 'en_cours' : 'termine')} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '14px' }} title="Avancer">➡️</button>
                )}
              </div>
            </div>

            {/* Contenu */}
            <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>{f.title}</div>
            <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {f.description}
            </div>

            {/* Footer : Créateur et Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '5px' }}>
              <div style={{ fontSize: '0.7rem', color: '#555' }}>
                {f.createdBy?.name || 'Admin'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* On enlève l'édition pour simplifier si besoin, ou on la garde mais il faut gérer l'ouverture du form */}
                <button onClick={() => deleteFeature(f._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash size={12}/></button>
              </div>
            </div>

            {/* Barre de progression (Visuelle) */}
            {f.status === 'en_cours' && (
               <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                 <div style={{ width: '50%', height: '100%', background: 'var(--primary)' }}></div>
               </div>
            )}
          </div>
        ))}
        {features.length === 0 && <div style={{ textAlign: 'center', color: '#444', fontSize: '0.8rem', fontStyle: 'italic', padding: '20px' }}>Vide</div>}
      </div>
    </div>
  );
}