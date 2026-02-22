import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaArrowLeft, FaRobot, FaCircle } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function CoachChatPage() {
    // Initialisation avec l'heure
    const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const [messages, setMessages] = useState([
        { role: 'ai', content: "Salut ! Je suis ton coach Badmin. Pose-moi n'importe quelle question sur ta technique, ta tactique ou ton entraînement !", time: getCurrentTime() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input, time: getCurrentTime() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/chat`, { message: input }, {
                headers: { 'x-auth-token': token }
            });

            setMessages(prev => [...prev, { role: 'ai', content: res.data.reply, time: getCurrentTime() }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: "Problème de connexion... On reprend l'entraînement dans un instant !", time: getCurrentTime() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* 🎨 CSS GLOBAL POUR LA PAGE DE CHAT */}
            <style>{`
                /* Conteneur principal */
                .chat-app-container {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    bottom: 90px; /* Esquive ta barre de nav mobile */
                    display: flex;
                    flex-direction: column;
                    z-index: 100;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }

                /* Responsive PC / Tablette */
                @media (min-width: 768px) {
                    .chat-app-container {
                        position: relative; /* S'intègre dans ton layout PC sans forcer le fixed */
                        bottom: 0;
                        height: 100dvh;
                        max-width: 80vw;
                        margin: 0 auto;
                    }
                }

                /* Animations des bulles de chargement */
                .typing-indicator { display: flex; gap: 4px; padding: 4px 8px; align-items: center; }
                .typing-dot {
                    width: 6px; height: 6px; background-color: #888; border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out both;
                }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes typing { 0%, 80%, 100% { transform: scale(0); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }

                /* Scrollbar invisible mais fonctionnelle */
                .chat-scroll-area::-webkit-scrollbar { width: 6px; }
                .chat-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>

            <div className="chat-app-container">
                
                {/* 1. HEADER PREMIUM */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '15px 20px', 
                    background: 'rgb(0, 30, 24)',
                    backdropFilter: 'blur(10px)', /* Effet flou iOS */
                    WebkitBackdropFilter: 'blur(10px)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Link to="/" style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                            <FaArrowLeft size={20} />
                        </Link>
                        
                        {/* Avatar Coach */}
                        <div style={{ position: 'relative' }}>
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '50%', 
                                background: 'linear-gradient(135deg, var(--primary) 0%, #00d2ff 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 10px rgba(0, 255, 140, 0.3)'
                            }}>
                                <FaRobot size={22} color="black" />
                            </div>
                            <FaCircle size={10} color="#10B981" style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-dark)', borderRadius: '50%' }} />
                        </div>

                        <div>
                            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: 'white' }}>Coach Badmin</h1>
                            <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>Toujours là pour toi</span>
                        </div>
                    </div>
                </div>

                {/* 2. ZONE DE MESSAGES */}
                <div className="chat-scroll-area" style={{ 
                    flex: 1, overflowY: 'auto', padding: '20px', 
                    display: 'flex', flexDirection: 'column', gap: '12px' 
                }}>
                    {/* Date du jour (Simulée pour le design) */}
                    <div style={{ textAlign: 'center', margin: '10px 0' }}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', color: '#888', fontSize: '0.7rem', padding: '4px 12px', borderRadius: '12px' }}>Aujourd'hui</span>
                    </div>

                    {messages.map((msg, index) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div key={index} style={{
                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isUser ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    background: isUser ? 'linear-gradient(135deg, #00d2ff 0%, var(--primary) 100%)' : '#1a1f1d',
                                    color: isUser ? 'black' : '#e0e0e0',
                                    padding: '12px 16px',
                                    // Bords arrondis asymétriques (effet "queue de bulle")
                                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5',
                                    boxShadow: isUser ? '0 4px 15px rgba(0, 255, 140, 0.2)' : '0 2px 5px rgba(0,0,0,0.2)',
                                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                    wordWrap: 'break-word'
                                }}>
                                    {msg.content}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: '#666', marginTop: '4px', padding: '0 4px' }}>
                                    {msg.time}
                                </span>
                            </div>
                        );
                    })}

                    {loading && (
                        <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                            <div style={{ background: '#1a1f1d', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} style={{ height: '10px' }} />
                </div>

                {/* 3. INPUT GLASSMORPHISM */}
                <form onSubmit={handleSend} style={{ 
                    display: 'flex', alignItems: 'flex-end', gap: '10px', 
                    padding: '12px 15px 70px 15px', /* Esquive ta barre de nav mobile */
                    background: 'rgba(5, 11, 10, 0.85)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    borderTop: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div style={{ 
                        flex: 1, 
                        background: 'rgba(255,255,255,0.06)', 
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 4px 4px 15px'
                    }}>
                        <textarea 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Message..."
                            rows={1}
                            style={{ 
                                flex: 1, background: 'transparent', border: 'none',
                                color: 'white', outline: 'none', resize: 'none',
                                maxHeight: '100px', fontSize: '0.95rem',
                                padding: '8px 0', fontFamily: 'inherit'
                            }}
                        />
                        <button type="submit" disabled={!input.trim()} style={{ 
                            width: '40px', height: '40px', minWidth: '40px', borderRadius: '50%', 
                            background: input.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: input.trim() ? 'pointer' : 'default',
                            transition: 'background 0.3s',
                            marginLeft: '8px'
                        }}>
                            <FiSend size={18} color={input.trim() ? "black" : "#666"} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                        </button>
                    </div>
                </form>        
            </div>
        </>
    );
}