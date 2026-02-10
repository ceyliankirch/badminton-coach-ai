import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconJournal, IconDumbbell, IconLightning, IconTarget } from '../components/Icons';

// Composant Courbe (Sparkline)
const SparkLine = ({ color }) => (
  <svg viewBox="0 0 100 40" className="stat-graph" preserveAspectRatio="none">
    <path 
      d="M0,35 C20,35 25,10 40,15 C55,20 65,5 80,10 C90,15 95,25 100,30" 
      fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
    />
    <path 
      d="M0,35 C20,35 25,10 40,15 C55,20 65,5 80,10 C90,15 95,25 100,30 V40 H0 Z" 
      fill={color} opacity="0.1" 
    />
  </svg>
);

export default function HomePage() {
  const [stats, setStats] = useState({ count: 0, lastTheme: "-" });
  const [userName] = useState("Coach"); 

  useEffect(() => {
    fetch('http://localhost:5000/api/trainings')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setStats({ count: data.length, lastTheme: data[0].theme });
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
      
      {/* --- BLOC PROFIL --- */}
      <div className="card" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        justifyContent: 'center', padding: '30px', marginBottom: '40px', 
        textAlign: 'center', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' 
      }}>
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', 
          border: '3px solid #ccff00', padding: '5px', marginBottom: '15px',
          boxShadow: '0 0 20px rgba(204, 255, 0, 0.2)' 
        }}>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="Avatar" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#222' }}
          />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>
          Salut <span style={{ color: '#ccff00' }}>{userName}</span> !
        </h2>
        <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
          Prêt pour la séance du jour ?
        </p>
      </div>

      <header style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: '0', color: '#fff' }}>Vue d'ensemble</h3>
      </header>

      {/* --- STATS WIDGETS (Grille auto) --- */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '15px', marginBottom: '30px' 
      }}>
        
        <div className="stat-card">
          <div className="stat-header">
            <div>
              <span className="stat-value">{stats.count}</span>
              <span className="stat-label">Séances</span>
            </div>
            <div className="icon-circle-white"><IconLightning /></div>
          </div>
          <SparkLine color="#ccff00" />
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div style={{ overflow: 'hidden' }}>
              <span className="stat-value" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                {stats.lastTheme}
              </span>
              <span className="stat-label">Dernier Focus</span>
            </div>
            <div className="icon-circle-white"><IconTarget /></div>
          </div>
          <SparkLine color="#ffffff" />
        </div>
      </div>

      {/* --- ACTIONS RAPIDES (Grille auto) --- */}
      <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', color: '#fff' }}>Actions Rapides</h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        
        <Link to="/trainings" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
            <div style={{ background: 'rgba(204, 255, 0, 0.1)', padding: '12px', borderRadius: '12px', color: '#ccff00' }}>
               <IconJournal />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1rem', color: 'white' }}>Journal</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>Noter ma séance</p>
            </div>
            <div style={{ color: '#444' }}>➔</div>
          </div>
        </Link>

        <Link to="/prepa" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
            <div style={{ background: 'rgba(204, 255, 0, 0.1)', padding: '12px', borderRadius: '12px', color: '#ccff00' }}>
               <IconDumbbell />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 2px 0', fontSize: '1rem', color: 'white' }}>Générateur</h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>Nouveau programme</p>
            </div>
            <div style={{ color: '#444' }}>➔</div>
          </div>
        </Link>

      </div>
    </div>
  );
}