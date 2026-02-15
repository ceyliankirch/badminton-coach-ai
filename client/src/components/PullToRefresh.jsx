import React, { useState, useRef } from 'react';

const PullToRefresh = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Configuration
  const threshold = 150; // Distance pour déclencher
  const maxPull = 220;   // Distance max visuelle

  const handleTouchStart = (e) => {
    if (window.scrollY <= 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    const y = e.touches[0].clientY;
    
    // Si on scrolle normalement, on ne fait rien
    if (window.scrollY > 0) return;

    if (y > startY && !refreshing) {
      // On capture l'événement seulement si on tire vers le bas
      if (e.cancelable) e.preventDefault();
      
      const pullDistance = y - startY;
      // Effet élastique logarithmique
      const dampedDistance = Math.min(pullDistance * 0.55, maxPull); 
      setCurrentY(dampedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;

    if (currentY > threshold) {
      setRefreshing(true);
      setCurrentY(80); // Hauteur de chargement
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setRefreshing(false);
          setCurrentY(0);
        }, 500);
      }
    } else {
      setCurrentY(0);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: '100vh' }} // Conteneur simple
    >
      {/* 1. INDICATEUR (ARRIÈRE-PLAN FIXE) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: currentY + 'px', // La zone s'agrandit avec le tirage
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0, // Derrière le contenu (si le contenu a un background)
        opacity: currentY > 0 ? 1 : 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        {/* La Pilule Centrée */}
        <div style={{ 
            color: '#3aedcc', 
            fontWeight: 'bold', 
            border: '1px solid rgba(58, 237, 204, 0.2)',
            padding: '8px 20px', 
            borderRadius: '30px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transform: `scale(${Math.min(currentY / 100, 1)})`, // Petit effet de zoom à l'apparition
            transition: 'transform 0.1s ease'
        }}>
           {refreshing ? (
             <>
               <span className="spin">🏸</span> 
               Mise à jour...
             </>
           ) : (
             <>⬇️ Tire pour actualiser</>
           )}
        </div>
      </div>

      {/* 2. CONTENU DE L'APP (AVANT-PLAN QUI GLISSE) */}
      <div style={{ 
        transform: `translateY(${currentY}px)`,
        transition: refreshing ? 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
        touchAction: 'pan-y', // Très important pour le scroll natif
        position: 'relative',
        zIndex: 10, // Devant l'indicateur
        minHeight: '100vh'
      }}>
        {children}
      </div>

      {/* Petit style pour l'animation de rotation */}
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .spin {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;