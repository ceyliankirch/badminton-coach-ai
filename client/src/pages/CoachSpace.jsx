import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaTrash, FaRobot, FaSave, FaClock, FaUsers, FaDumbbell } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CoachSpace() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const [loading, setLoading] = useState(false);

    // 1. ÉTAT GLOBAL DE LA SÉANCE
    const [sessionData, setSessionData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        group: '',
        theme: '',
        playerCount: '',
        freePlayDuration: 15,
        feedback: ''
    });

    // 2. ÉTAT DES BLOCS D'EXERCICES
    const [blocks, setBlocks] = useState({
        warmup: [],
        routines: [],
        matchSituations: []
    });

    // --- FONCTIONS UTILITAIRES ---

    const handleSessionChange = (e) => {
        setSessionData({ ...sessionData, [e.target.name]: e.target.value });
    };

    const addExercise = (blockName) => {
        setBlocks({
            ...blocks,
            [blockName]: [...blocks[blockName], { name: '', duration: 10, description: '', variants: '' }]
        });
    };

    const updateExercise = (blockName, index, field, value) => {
        const newBlocks = { ...blocks };
        newBlocks[blockName][index][field] = value;
        setBlocks(newBlocks);
    };

    const removeExercise = (blockName, index) => {
        const newBlocks = { ...blocks };
        newBlocks[blockName].splice(index, 1);
        setBlocks(newBlocks);
    };

    // Calcul automatique de la durée de la séance
    const calculateTotalDuration = () => {
        let total = Number(sessionData.freePlayDuration) || 0;
        ['warmup', 'routines', 'matchSituations'].forEach(block => {
            blocks[block].forEach(ex => total += Number(ex.duration) || 0);
        });
        return total;
    };

    // --- SOUMISSION DU FORMULAIRE ---
    const handleSaveSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = { ...sessionData, ...blocks };
            
            await axios.post(`${API_URL}/api/coach/sessions`, payload, {
                headers: { 'x-auth-token': token }
            });
            
            alert("Séance sauvegardée avec succès !");
            // Optionnel : navigate('/coach/dashboard') si tu as une liste des séances
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setLoading(false);
        }
    };

    // --- GÉNÉRATION IA (On la connectera à Llama à l'étape suivante) ---
    // --- GÉNÉRATION IA ---
    const [isGenerating, setIsGenerating] = useState(false); // Ajoute ce petit state juste sous tes autres const [..., set...]

    const handleGenerateAI = async () => {
        // On vérifie que le coach a au moins donné un thème
        if (!sessionData.theme) {
            alert("⚠️ Remplis au moins le champ 'Thème' pour que l'IA sache quoi préparer !");
            return;
        }

        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/coach/generate`, {
                theme: sessionData.theme,
                group: sessionData.group,
                playerCount: sessionData.playerCount
            }, {
                headers: { 'x-auth-token': token }
            });

            const aiData = res.data;

            // 1. On met à jour le titre proposé par l'IA
            setSessionData(prev => ({ ...prev, title: aiData.title }));

            // 2. On remplit tous les blocs d'exercices !
            setBlocks({
                warmup: aiData.warmup || [],
                routines: aiData.routines || [],
                matchSituations: aiData.matchSituations || []
            });

        } catch (err) {
            console.error(err);
            alert("L'IA a eu un petit souci. Vérifie ta connexion.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- COMPOSANT RÉUTILISABLE POUR UN EXERCICE ---
    const ExerciseCard = ({ blockName, index, exercise }) => (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input type="text" placeholder="Nom de l'exercice" value={exercise.name} onChange={(e) => updateExercise(blockName, index, 'name', e.target.value)} style={inputStyle} />
                <input type="number" placeholder="Min" value={exercise.duration} onChange={(e) => updateExercise(blockName, index, 'duration', e.target.value)} style={{ ...inputStyle, width: '70px' }} />
                <button type="button" onClick={() => removeExercise(blockName, index)} style={{ background: '#ff4444', border: 'none', borderRadius: '8px', width: '40px', color: 'white', cursor: 'pointer' }}><FaTrash /></button>
            </div>
            <textarea placeholder="Déroulement / Consignes..." value={exercise.description} onChange={(e) => updateExercise(blockName, index, 'description', e.target.value)} style={{ ...inputStyle, minHeight: '60px', marginBottom: '10px' }} />
            <textarea placeholder="Variantes (ex: Si niveau +, imposer le revers)" value={exercise.variants} onChange={(e) => updateExercise(blockName, index, 'variants', e.target.value)} style={{ ...inputStyle, minHeight: '40px', background: 'rgba(0, 255, 140, 0.05)', border: '1px dashed rgba(0, 255, 140, 0.3)' }} />
        </div>
    );

    return (
        <div style={{ paddingBottom: '90px', background: 'var(--bg-dark)', minHeight: '100vh', color: 'white' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#111816', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Link to="/" style={{ color: 'white' }}><FaArrowLeft size={20} /></Link>
                    <h1 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>Créateur de Séance</h1>
                </div>
                <div style={{ background: 'var(--primary)', color: 'black', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaClock /> {calculateTotalDuration()} min
                </div>
            </div>

            <form onSubmit={handleSaveSession} style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                
                {/* BOUTON MAGIQUE IA */}
                {/* BOUTON MAGIQUE IA */}
                <button type="button" onClick={handleGenerateAI} disabled={isGenerating} style={{ width: '100%', background: 'linear-gradient(135deg, #00d2ff 0%, var(--primary) 100%)', border: 'none', padding: '15px', borderRadius: '15px', color: 'black', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '25px', cursor: isGenerating ? 'wait' : 'pointer', boxShadow: '0 4px 15px rgba(0, 255, 140, 0.3)', opacity: isGenerating ? 0.7 : 1 }}>
                    {isGenerating ? (
                        <>
                            <span className="dot-typing" style={{ background: 'black' }}></span>
                            <span className="dot-typing" style={{ background: 'black' }}></span>
                            <span className="dot-typing" style={{ background: 'black' }}></span>
                        </>
                    ) : (
                        <><FaRobot size={20} /> Générer la séance avec l'IA</>
                    )}
                </button>

                {/* INFOS GÉNÉRALES */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Infos Générales</h2>
                    <input type="text" name="title" placeholder="Nom de la séance (ex: Perf D9/P10)" value={sessionData.title} onChange={handleSessionChange} required style={inputStyle} />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input type="date" name="date" value={sessionData.date} onChange={handleSessionChange} style={inputStyle} />
                        <input type="text" name="group" placeholder="Groupe" value={sessionData.group} onChange={handleSessionChange} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <input type="text" name="theme" placeholder="Thème (ex: Fixation)" value={sessionData.theme} onChange={handleSessionChange} style={inputStyle} />
                        <input type="number" name="playerCount" placeholder="Joueurs" value={sessionData.playerCount} onChange={handleSessionChange} style={{ ...inputStyle, width: '100px' }} />
                    </div>
                </div>

                {/* 1. ÉCHAUFFEMENT */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={sectionTitleStyle}>Échauffement</h2>
                        <button type="button" onClick={() => addExercise('warmup')} style={addBtnStyle}><FaPlus /> Ajouter</button>
                    </div>
                    {blocks.warmup.map((ex, i) => <ExerciseCard key={`warmup-${i}`} blockName="warmup" index={i} exercise={ex} />)}
                    {blocks.warmup.length === 0 && <p style={emptyTextStyle}>Aucun exercice d'échauffement</p>}
                </div>

                {/* 2. ROUTINES */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={sectionTitleStyle}>Routines & Gammes</h2>
                        <button type="button" onClick={() => addExercise('routines')} style={addBtnStyle}><FaPlus /> Ajouter</button>
                    </div>
                    {blocks.routines.map((ex, i) => <ExerciseCard key={`routines-${i}`} blockName="routines" index={i} exercise={ex} />)}
                    {blocks.routines.length === 0 && <p style={emptyTextStyle}>Aucune routine</p>}
                </div>

                {/* 3. SITUATIONS DE MATCH */}
                <div style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={sectionTitleStyle}>Situations de Match</h2>
                        <button type="button" onClick={() => addExercise('matchSituations')} style={addBtnStyle}><FaPlus /> Ajouter</button>
                    </div>
                    {blocks.matchSituations.map((ex, i) => <ExerciseCard key={`situations-${i}`} blockName="matchSituations" index={i} exercise={ex} />)}
                    {blocks.matchSituations.length === 0 && <p style={emptyTextStyle}>Aucune situation</p>}
                </div>

                {/* 4. JEU LIBRE */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Jeu Libre</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input type="number" name="freePlayDuration" value={sessionData.freePlayDuration} onChange={handleSessionChange} style={{ ...inputStyle, width: '80px' }} />
                        <span>minutes allouées pour les matchs libres.</span>
                    </div>
                </div>

                {/* 5. BILAN (POST-SÉANCE) */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Bilan Coach (Notes)</h2>
                    <textarea name="feedback" placeholder="Que faudra-t-il améliorer la prochaine fois ?" value={sessionData.feedback} onChange={handleSessionChange} style={{ ...inputStyle, minHeight: '80px' }} />
                </div>

                {/* BOUTON SAUVEGARDER */}
                <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--primary)', border: 'none', padding: '15px', borderRadius: '15px', color: 'black', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px', cursor: 'pointer' }}>
                    <FaSave size={20} /> {loading ? "Sauvegarde..." : "Enregistrer la séance"}
                </button>

            </form>
        </div>
    );
}

// --- STYLES CSS INLINE (Pour aller vite et garder ton design) ---
const sectionStyle = {
    background: '#1a1f1d',
    padding: '20px',
    borderRadius: '15px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.05)'
};

const sectionTitleStyle = {
    fontSize: '1.1rem',
    color: 'var(--primary)',
    margin: '0 0 15px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '12px',
    color: 'white',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
};

const addBtnStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    fontSize: '0.85rem'
};

const emptyTextStyle = {
    color: '#666',
    fontSize: '0.9rem',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: 0
};