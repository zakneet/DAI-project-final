import React, { useState, useRef, useEffect } from 'react';
import './ClinicalCopilot.css';

// ══════════════════════════════════════════════════════════
//  CONFIG OpenRouter — routeur automatique (toujours gratuit)
// ══════════════════════════════════════════════════════════
const OPENROUTER_API_KEY = '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';
const OPENROUTER_MODEL   = 'openrouter/auto'; // sélectionne automatiquement un modèle gratuit disponible
const SITE_URL           = 'http://localhost:5173';
const SITE_NAME          = 'DAI Clinical Platform';

const SYSTEM_PROMPT = `Tu es un assistant médical clinique expert intégré dans la plateforme DAI (Dispositif d'Aide à l'Intervention). 
Tu aides les médecins anesthésistes, IADE et SSPI à prendre des décisions cliniques.
Tu réponds toujours en français, de manière précise, professionnelle et structurée.
Tu peux analyser des scores cliniques (Aldrete, ASA, Mallampati, etc.), formuler des recommandations pré/post-opératoires, et synthétiser des informations médicales.
Si tu n'es pas sûr, tu le dis clairement. Tu ne remplaces jamais l'avis médical définitif du clinicien.
Formate tes réponses avec des listes à puces et des sections claires quand c'est utile.`;

const SUGGESTIONS = [
  "Évalue le score ASA d'un patient de 65 ans avec HTA et diabète",
  "Quels examens pré-opératoires pour une chirurgie abdominale ?",
  "Critères d'Aldrete pour sortie de SSPI",
  "Contre-indications à l'anesthésie locorégionale",
];

const CONTEXT_LABELS = {
  doctor: 'Tableau de Bord Médical',
  iade: 'Tableau de Bord IADE',
  sspi: 'Tableau de Bord SSPI',
};

const ClinicalCopilot = ({ contextType = 'doctor', patientId, caseId, onClose }) => {
  const storageKey = `ai_chat_${patientId || 'global'}_${caseId || 'global'}`;

  const [messages, setMessages]   = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_messages`);
    if (saved) return JSON.parse(saved);
    return [{
      id: 1, role: 'ai',
      text: "Bonjour ! Je suis votre **AI Assistant DAI**, spécialisé en anesthésie et soins péri-opératoires.\n\nComment puis-je vous aider aujourd'hui ?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  });

  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_history`);
    if (saved) return JSON.parse(saved);
    return [];
  });

  const messagesEndRef            = useRef(null);
  const textareaRef               = useRef(null);

  // Persist messages & history
  useEffect(() => {
    localStorage.setItem(`${storageKey}_messages`, JSON.stringify(messages));
    localStorage.setItem(`${storageKey}_history`, JSON.stringify(chatHistory));
  }, [messages, chatHistory, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(), role: 'user', text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    let contextNote = '';
    if (patientId) contextNote = `\n[Contexte actif : Patient ID ${patientId}${caseId ? `, Dossier ${caseId}` : ''}]`;

    const newHistory = [...chatHistory, { role: 'user', content: text }];

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SITE_URL,
          'X-Title': SITE_NAME,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + contextNote },
            ...newHistory
          ]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Erreur HTTP ${res.status}`);
      }

      const data   = await res.json();
      const aiText = data.choices?.[0]?.message?.content?.trim() || "Désolé, je n'ai pas pu formuler de réponse.";

      setChatHistory([...newHistory, { role: 'assistant', content: aiText }]);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'ai', text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

    } catch (err) {
      console.error('OpenRouter error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'ai',
        text: `❌ **Erreur** : ${err.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);

  const handleNewConversation = () => {
    const initialMsg = [{
      id: Date.now(), role: 'ai',
      text: "Nouvelle conversation démarrée. Comment puis-je vous aider ?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setMessages(initialMsg);
    setChatHistory([]);
    localStorage.setItem(`${storageKey}_messages`, JSON.stringify(initialMsg));
    localStorage.setItem(`${storageKey}_history`, JSON.stringify([]));
  };

  // Format texte simple (gras, retours à la ligne, listes)
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ai-list-item">{parts.slice(1)}</li>;
      }
      if (line === '') return <br key={i} />;
      return <p key={i} className="ai-para">{parts}</p>;
    });
  };

  return (
    <div className={`ai-page-layout ${contextType === 'iade' ? 'compact-mode' : ''}`}>
      {/* ── Sidebar ── */}
      {contextType !== 'iade' && (
        <aside className="ai-sidebar">
          {/* Back button */}
          <button className="ai-back-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            {CONTEXT_LABELS[contextType] || 'Dashboard'}
          </button>

          {/* Brand */}
          <div className="ai-sidebar-brand">
            <div className="ai-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a4 4 0 0 1-4 4h-1c-.55 0-1 .45-1 1v1a2 2 0 1 1-4 0v-1c0-.55-.45-1-1-1H9a4 4 0 0 1-4-4v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
                <path d="M9 14h.01"/><path d="M15 14h.01"/>
              </svg>
            </div>
            <div>
              <div className="ai-brand-name">AI Assistant</div>
              <div className="ai-brand-tag">DAI · Clinique</div>
            </div>
          </div>

          {/* New conversation */}
          <button className="ai-new-chat-btn" onClick={handleNewConversation}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvelle conversation
          </button>

          {/* Suggestions */}
          <div className="ai-sidebar-section-label">Suggestions rapides</div>
          <div className="ai-suggestions-list">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="ai-suggestion-btn" onClick={() => sendMessage(s)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
                {s}
              </button>
            ))}
          </div>

          {/* Active Context & Generation Plans */}
          {(patientId || caseId) && (
            <div className="ai-context-card">
              <div className="ai-context-label">Contexte actif</div>
              {patientId && <div className="ai-context-val">👤 Patient ID: {String(patientId).substring(0, 8)}</div>}
              {caseId && <div className="ai-context-val">📋 Dossier: {String(caseId).substring(0, 8)}</div>}
              
              <div className="ai-sidebar-section-label" style={{marginTop: '15px'}}>Actions Intelligentes</div>
              <button 
                className="ai-suggestion-btn" 
                style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981', color: '#065f46', marginTop: '8px', fontWeight: 'bold' }}
                onClick={() => sendMessage("Génère un plan de traitement et d'action détaillé pour ce patient en tenant compte de tous ses scores cliniques. Le patient peut-il être opéré dans cet état ?")}
              >
                ⚡ Générer Plan de Traitement
              </button>
            </div>
          )}

          <div className="ai-model-info">
            <div className="ai-model-dot"></div>
            OpenRouter · Auto Free
          </div>
        </aside>
      )}

      {/* ── Main Chat ── */}
      <main className="ai-main">
        {/* Header */}
        <div className={`ai-main-header ${contextType === 'iade' ? 'compact' : ''}`}>
          <div className="ai-main-header-left">
            <div className="ai-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a4 4 0 0 1-4 4h-1c-.55 0-1 .45-1 1v1a2 2 0 1 1-4 0v-1c0-.55-.45-1-1-1H9a4 4 0 0 1-4-4v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
                <path d="M9 14h.01"/><path d="M15 14h.01"/>
              </svg>
            </div>
            <div>
              <h2 className="ai-main-title">AI Assistant DAI</h2>
              <p className="ai-main-sub">
                {contextType === 'iade' ? 'Assistant clinique' : 'Assistant clinique en anesthésie · Plateforme DAI'}
              </p>
            </div>
          </div>
          <div className="ai-status-online">
            <span className="ai-status-dot"></span>
            En ligne
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg-row ${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="ai-avatar ai">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a4 4 0 0 1-4 4h-1c-.55 0-1 .45-1 1v1a2 2 0 1 1-4 0v-1c0-.55-.45-1-1-1H9a4 4 0 0 1-4-4v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
                    <path d="M9 14h.01"/><path d="M15 14h.01"/>
                  </svg>
                </div>
              )}
              <div className="ai-msg-col">
                <div className={`ai-bubble ${msg.role}`}>
                  <div className="ai-bubble-text">{formatText(msg.text)}</div>
                </div>
                <div className={`ai-msg-meta ${msg.role}`}>
                  {msg.role === 'ai' ? 'AI Assistant DAI' : 'Vous'} · {msg.time}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="ai-avatar user">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="ai-msg-row ai">
              <div className="ai-avatar ai">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a4 4 0 0 1-4 4h-1c-.55 0-1 .45-1 1v1a2 2 0 1 1-4 0v-1c0-.55-.45-1-1-1H9a4 4 0 0 1-4-4v-1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 12 2z"/>
                  <path d="M9 14h.01"/><path d="M15 14h.01"/>
                </svg>
              </div>
              <div className="ai-msg-col">
                <div className="ai-bubble ai">
                  <div className="ai-typing">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div className="ai-input-zone">
          <div className="ai-input-box">
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              placeholder="Posez votre question clinique... (Entrée pour envoyer)"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isTyping}
            />
            <button
              className={`ai-send-btn${!input.trim() || isTyping ? ' disabled' : ''}`}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className="ai-disclaimer">
            L'AI Assistant DAI est un outil d'aide à la décision. Il ne remplace pas le jugement clinique du médecin.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ClinicalCopilot;
