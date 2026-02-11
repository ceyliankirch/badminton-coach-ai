// Icones minimalistes traits fins (stroke-width="1.5")
export const IconHome = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconDumbbell = () => (
  <svg className="nav-icon prepa-icon" viewBox="0 0 24 24">
    <path d="M6.5 6.5l11 11" /><path d="M21 21l-1-1" /><path d="M3 3l1 1" />
    <path d="M18 22l4-4" /><path d="M2 6l4-4" /><path d="M3 10l7-7" /><path d="M14 21l7-7" />
  </svg>
);

export const IconJournal = () => (
  <svg className="nav-icon journal-icon" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const IconUser = () => (
  <svg className="nav-icon" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconLightning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

export const IconTrash = () => (
  // On force la couleur stroke en rouge pétant (#ff3333)
  <svg className="nav-icon" viewBox="0 0 24 24" style={{ stroke: '#ff3333' }}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export const IconTrophy = ({ size = 24, color = "currentColor", className = "nav-icon trophy-icon" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" /* Même épaisseur que tes autres icônes */
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Base du trophée */}
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    {/* Bol du trophée */}
    <path d="M7 4h10v6a5 5 0 0 1-10 0V4" />
    {/* Anse gauche */}
    <path d="M7 8H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3" />
    {/* Anse droite */}
    <path d="M17 8h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3" />
  </svg>
);
