import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import ClinicalCopilot from '../AI/ClinicalCopilot';
import './IADEDashboard.css';

const IADEDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // activeCases = cases with status PER_OP
  const [activeCases, setActiveCases] = useState([]);
  // onDeckCases = cases with status PRE_OP (next to enter OR)
  const [onDeckCases, setOnDeckCases] = useState([]);
  // selected case from the list
  const [selectedCase, setSelectedCase] = useState(null);
  // perop summary data for the selected case
  const [peropSummary, setPeropSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [error, setError] = useState(null);
  const [showEventLog, setShowEventLog] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [newEvent, setNewEvent] = useState({
    event_type: 'PROCEDURE',
    title: '',
    description: '',
    timestamp: new Date().toISOString(),
    // Only used when event_type === MEDICATION
    medication_administration: {
      drug_name: '',
      dose: '',
      route: '',
      administered_at: new Date().toISOString()
    }
  });
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // ─── Fetch all cases, split by status ───────────────────────────────────────
  const fetchCases = useCallback(async () => {
    setLoadingCases(true);
    setError(null);
    try {
      const response = await api.getCases();
      const allCases = response.data.results || response.data;

      const perOp = allCases.filter(c => c.status === 'PER_OP');
      const preOp = allCases.filter(c => c.status === 'PRE_OP').slice(0, 5);

      setActiveCases(perOp);
      setOnDeckCases(preOp);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Impossible de charger les sessions. Vérifiez que le serveur backend est lancé.');
    } finally {
      setLoadingCases(false);
    }
  }, []);

  // ─── Fetch PerOp summary for a given case UUID ───────────────────────────────
  const fetchPeropSummary = useCallback(async (caseId) => {
    setLoading(true);
    try {
      const response = await api.getPerOpSummary(caseId);
      setPeropSummary(response.data);
    } catch (err) {
      console.error('Error fetching perop summary:', err);
      setPeropSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, [fetchCases]);

  useEffect(() => {
    if (selectedCase) {
      fetchPeropSummary(selectedCase.id);
    } else {
      setPeropSummary(null);
    }
  }, [selectedCase, fetchPeropSummary]);

  // ─── Start a PerOp session for the selected case ──────────────────────────
  const handleStartSession = async () => {
    if (!selectedCase) return;
    if (!window.confirm('Démarrer la session per-opératoire pour ce patient ?')) return;
    try {
      await api.startPerOpSession(selectedCase.id, {
        started_at: new Date().toISOString(),
        notes: ''
      });
      await fetchPeropSummary(selectedCase.id);
      await fetchCases();
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      alert('Erreur: ' + detail);
    }
  };

  // ─── End the PerOp session ────────────────────────────────────────────────
  const handleEndSession = async () => {
    if (!selectedCase) return;
    if (!window.confirm('Terminer la session per-opératoire ?')) return;
    try {
      await api.endPerOpSession(selectedCase.id, {
        ended_at: new Date().toISOString()
      });
      await fetchPeropSummary(selectedCase.id);
      await fetchCases();
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      alert('Erreur: ' + detail);
    }
  };

  // ─── Log an intraoperative event ────────────────────────────────────────────
  const handleLogEvent = async () => {
    if (!newEvent.title.trim()) {
      alert('Veuillez saisir un titre pour l\'événement.');
      return;
    }
    if (!peropSummary?.session?.id) {
      alert('Aucune session active. Démarrez d\'abord la session per-opératoire.');
      return;
    }
    setSubmittingEvent(true);
    try {
      const payload = {
        event_type: newEvent.event_type,
        title: newEvent.title,
        description: newEvent.description,
        timestamp: new Date().toISOString(),
        session: peropSummary.session.id,
        anesthesia_case: selectedCase.id
      };

      // Add medication details when event type is MEDICATION
      if (newEvent.event_type === 'MEDICATION') {
        if (!newEvent.medication_administration.drug_name || !newEvent.medication_administration.dose) {
          alert('Pour un événement médicament, veuillez saisir le nom du médicament et la dose.');
          setSubmittingEvent(false);
          return;
        }
        payload.medication_administration = {
          drug_name: newEvent.medication_administration.drug_name,
          dose: newEvent.medication_administration.dose,
          route: newEvent.medication_administration.route || '',
          administered_at: new Date().toISOString()
        };
      }

      await api.postPerOpEvent(selectedCase.id, payload);
      setNewEvent({
        event_type: 'PROCEDURE',
        title: '',
        description: '',
        timestamp: new Date().toISOString(),
        medication_administration: { drug_name: '', dose: '', route: '', administered_at: new Date().toISOString() }
      });
      await fetchPeropSummary(selectedCase.id);
    } catch (err) {
      console.error('Error logging event:', err);
      alert('Erreur lors de la création de l\'événement.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  // ─── Log a Quick Action Event ─────────────────────────────────────────
  const handleQuickAction = async (actionType) => {
    if (!peropSummary?.session?.id) {
      alert('Veuillez démarrer la session per-opératoire d\'abord.');
      return;
    }
    setSubmittingEvent(true);
    try {
      let payload = {
        event_type: 'PROCEDURE',
        title: actionType,
        description: 'Action rapide enregistrée',
        timestamp: new Date().toISOString(),
        session: peropSummary.session.id,
        anesthesia_case: selectedCase.id
      };

      if (actionType.includes('Propofol')) {
        payload.event_type = 'MEDICATION';
        payload.medication_administration = {
          drug_name: 'Propofol',
          dose: 'Bolus Standard',
          route: 'IV',
          administered_at: new Date().toISOString()
        };
      }

      await api.postPerOpEvent(selectedCase.id, payload);
      await fetchPeropSummary(selectedCase.id);
    } catch (err) {
      console.error('Error logging quick action:', err);
      alert('Erreur lors de l\'enregistrement rapide.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getVitalsByType = (vitals, type) => {
    const v = vitals?.find(vt => vt.vital_type === type);
    return v ? parseFloat(v.value) : null;
  };

  const getVitalAlertStatus = (val, low, critLow, high, critHigh) => {
    if (val === null) return 'normal';
    if (val < critLow || val > critHigh) return 'critical';
    if (val < low || val > high) return 'warning';
    return 'normal';
  };

  const formatElapsed = (startedAt) => {
    if (!startedAt) return '--:--';
    const diff = Math.floor((Date.now() - new Date(startedAt)) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return `${h}h${String(m).padStart(2, '0')}`;
  };

  const getSparklineSVG = (colorClass) => {
    // Generate a simple decorative sparkline based on status color
    const strokeColor = colorClass === 'critical' ? '#ef4444' : colorClass === 'warning' ? '#f59e0b' : '#10b981';
    return (
      <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
        <path d="M0,20 Q10,10 20,25 T40,15 T60,20 T80,5 T100,15" fill="none" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
      </svg>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sessionStatus = peropSummary?.session?.status;
  const latestVitals = peropSummary?.latest_vitals || [];

  const hrVal = getVitalsByType(latestVitals, 'HEART_RATE');
  const spo2Val = getVitalsByType(latestVitals, 'SPO2');
  const sysVal = getVitalsByType(latestVitals, 'SYSTOLIC_BP');
  const diaVal = getVitalsByType(latestVitals, 'DIASTOLIC_BP');
  const tempVal = getVitalsByType(latestVitals, 'TEMPERATURE');
  const etco2Val = getVitalsByType(latestVitals, 'ETCO2');

  return (
    <div className={`iade-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="iade-header">
        <div className="header-left">
          <h1>🩺 Gestion de Bloc Opératoire</h1>
          <p>Anesthésie &amp; Soins Per-Opératoires</p>
        </div>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={() => setDarkMode(!darkMode)} title="Basculer le thème">
            {darkMode ? '☀️ Clair' : '🌙 Sombre'}
          </button>
          <div className="user-profile">
            <span className="user-role">IADE</span>
            <span className="user-name">{user?.first_name || user?.username || 'Infirmier Anesthésiste'}</span>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="iade-container">
        {/* ── Left Panel: Active Sessions ── */}
        <div className="sessions-panel">
          <div className="panel-header">
            <h2>Sessions Actives ({activeCases.length})</h2>
            <span className="live-badge">● LIVE</span>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <div className="sessions-list">
            {loadingCases ? (
              <div className="empty-sessions">Chargement...</div>
            ) : activeCases.length === 0 ? (
              <div className="empty-sessions">Aucune session per-opératoire active</div>
            ) : (
              activeCases.map(c => (
                <div
                  key={c.id}
                  className={`session-card ${selectedCase?.id === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="session-status">
                    <div className="status-pulse"></div>
                    <span>En cours</span>
                  </div>
                  <div className="session-info">
                    <h4>{c.patient_full_name || 'Patient'}</h4>
                    <p className="procedure">{c.surgery_type || 'Chirurgie'}</p>
                    <p className="surgeon">ID: {c.id?.substring(0, 8)}</p>
                  </div>
                  <div className="session-time">
                    <span className="elapsed">
                      {peropSummary?.session?.started_at && selectedCase?.id === c.id
                        ? formatElapsed(peropSummary.session.started_at)
                        : 'PER_OP'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* On-Deck Patients */}
          <div className="ondeck-section">
            <h3>Patients En Attente</h3>
            <div className="ondeck-list">
              {onDeckCases.length === 0 ? (
                <p className="empty-text">Aucun patient en attente</p>
              ) : (
                onDeckCases.map(c => (
                  <div key={c.id} className="ondeck-item">
                    <div className="ondeck-info">
                      <p className="ondeck-name">{c.patient_full_name || 'Patient'}</p>
                      <p className="ondeck-proc">{c.surgery_type || 'Chirurgie'}</p>
                    </div>
                    <span className="ondeck-time">PRÉ-OP</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Session Details & Vitals ── */}
        <div className="details-panel">
          {selectedCase ? (
            <>
              {/* Patient Context Banner */}
              <div className="patient-context-banner">
                <div className="pcb-header">
                  <h3>{selectedCase.patient_full_name}</h3>
                  <span className="pcb-badge">ASA {selectedCase.asa_score || '2'}</span>
                </div>
                <div className="pcb-details">
                  <div className="pcb-item">
                    <span className="pcb-label">Intervention</span>
                    <span className="pcb-val">{selectedCase.surgery_type}</span>
                  </div>
                  <div className="pcb-item">
                    <span className="pcb-label">Allergies</span>
                    <span className="pcb-val warning">{selectedCase.allergies || 'Aucune connue'}</span>
                  </div>
                  <div className="pcb-item">
                    <span className="pcb-label">Poids / Taille</span>
                    <span className="pcb-val">78 kg / 175 cm</span>
                  </div>
                  <div className="pcb-item">
                    <span className="pcb-label">Groupe Sanguin</span>
                    <span className="pcb-val">O+</span>
                  </div>
                </div>
              </div>

              {/* Session Control Bar */}
              <div className="vitals-section">
                <div className="section-header">
                  <h3>Monitoring & Constantes</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!peropSummary?.session ? (
                      <button className="log-btn" onClick={handleStartSession}>
                        ▶ Démarrer session
                      </button>
                    ) : sessionStatus === 'ACTIVE' ? (
                      <button className="end-session-btn" onClick={handleEndSession}>
                        ⏹ Terminer session
                      </button>
                    ) : (
                      <span style={{ color: '#718096', fontSize: '13px' }}>Session terminée</span>
                    )}
                  </div>
                </div>

                {/* Vitals Monitor */}
                {loading ? (
                  <div className="vitals-loader">Chargement des constantes...</div>
                ) : latestVitals.length > 0 ? (
                  <div className="vitals-grid">
                    {hrVal !== null && (
                      <div className="vital-card">
                        <span className="vital-label">Fréquence Cardiaque</span>
                        <span className={`vital-value ${getVitalAlertStatus(hrVal, 60, 50, 100, 110)}`}>
                          {hrVal} bpm
                        </span>
                        <span className="vital-trend">Normal: 60–100</span>
                        {getSparklineSVG(getVitalAlertStatus(hrVal, 60, 50, 100, 110))}
                      </div>
                    )}
                    {spo2Val !== null && (
                      <div className="vital-card">
                        <span className="vital-label">SpO₂ (Oxygène)</span>
                        <span className={`vital-value ${spo2Val < 90 ? 'critical' : spo2Val < 95 ? 'warning' : 'normal'}`}>
                          {spo2Val} %
                        </span>
                        <span className="vital-trend">Cible: ≥ 95%</span>
                        {getSparklineSVG(spo2Val < 90 ? 'critical' : spo2Val < 95 ? 'warning' : 'normal')}
                      </div>
                    )}
                    {sysVal !== null && diaVal !== null && (
                      <div className="vital-card">
                        <span className="vital-label">Pression Artérielle</span>
                        <span className="vital-value normal">
                          {sysVal}/{diaVal}
                        </span>
                        <span className="vital-trend">Normal: 110–140/70–90</span>
                        {getSparklineSVG('normal')}
                      </div>
                    )}
                    {tempVal !== null && (
                      <div className="vital-card">
                        <span className="vital-label">Température</span>
                        <span className={`vital-value ${tempVal < 36 || tempVal > 38 ? 'warning' : 'normal'}`}>
                          {tempVal} °C
                        </span>
                        <span className="vital-trend">Normal: 36.5–37.5</span>
                        {getSparklineSVG(tempVal < 36 || tempVal > 38 ? 'warning' : 'normal')}
                      </div>
                    )}
                    {etco2Val !== null && (
                      <div className="vital-card">
                        <span className="vital-label">EtCO₂</span>
                        <span className={`vital-value ${etco2Val < 35 || etco2Val > 45 ? 'warning' : 'normal'}`}>
                          {etco2Val} mmHg
                        </span>
                        <span className="vital-trend">Normal: 35–45</span>
                        {getSparklineSVG(etco2Val < 35 || etco2Val > 45 ? 'warning' : 'normal')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="vitals-loader">
                    {peropSummary?.session
                      ? 'Aucune constante enregistrée pour cette session.'
                      : 'Démarrez une session per-opératoire pour afficher les constantes.'}
                  </div>
                )}
              </div>

              {/* Quick Actions & Event Logging */}
              {peropSummary?.session?.status === 'ACTIVE' && (
                <div className="event-section">
                  <div className="section-header">
                    <h3>Actions & Événements</h3>
                    <button
                      className="toggle-log-btn"
                      onClick={() => setShowEventLog(!showEventLog)}
                    >
                      {showEventLog ? '▼ Formulaire manuel' : '▶ Formulaire manuel'}
                    </button>
                  </div>

                  {/* Quick Action Buttons */}
                  {!showEventLog && (
                    <div className="quick-actions-grid">
                      <button className="qa-btn" onClick={() => handleQuickAction('Induction Anesthésique')}>
                        <span className="qa-icon">😴</span> Induction
                      </button>
                      <button className="qa-btn" onClick={() => handleQuickAction('Intubation')}>
                        <span className="qa-icon">🌬️</span> Intubation
                      </button>
                      <button className="qa-btn" onClick={() => handleQuickAction('Incision')}>
                        <span className="qa-icon">🔪</span> Incision
                      </button>
                      <button className="qa-btn" onClick={() => handleQuickAction('Bolus Propofol')}>
                        <span className="qa-icon">💉</span> Propofol
                      </button>
                      <button className="qa-btn" onClick={() => handleQuickAction('Extubation')}>
                        <span className="qa-icon">🗣️</span> Extubation
                      </button>
                      <button className="qa-btn qa-warning" onClick={() => handleQuickAction('Incident Mineur')}>
                        <span className="qa-icon">⚠️</span> Incident
                      </button>
                    </div>
                  )}

                  {showEventLog && (
                    <div className="event-form">
                      <div className="form-group">
                        <label>Type d'événement</label>
                        <select
                          value={newEvent.event_type}
                          onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                        >
                          <option value="PROCEDURE">🔧 Procédure</option>
                          <option value="MEDICATION">💊 Médicament</option>
                          <option value="INCIDENT">⚠️ Incident</option>
                          <option value="TECHNICAL">🖥️ Technique</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Titre *</label>
                        <input
                          type="text"
                          placeholder="ex: Intubation, Propofol, Incident respiratoire..."
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        />
                      </div>

                      {/* Medication-specific fields */}
                      {newEvent.event_type === 'MEDICATION' && (
                        <>
                          <div className="form-group">
                            <label>Médicament *</label>
                            <input
                              type="text"
                              placeholder="ex: Propofol, Fentanyl..."
                              value={newEvent.medication_administration.drug_name}
                              onChange={(e) => setNewEvent({
                                ...newEvent,
                                medication_administration: { ...newEvent.medication_administration, drug_name: e.target.value }
                              })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Dose *</label>
                            <input
                              type="text"
                              placeholder="ex: 200mg, 2mg/kg..."
                              value={newEvent.medication_administration.dose}
                              onChange={(e) => setNewEvent({
                                ...newEvent,
                                medication_administration: { ...newEvent.medication_administration, dose: e.target.value }
                              })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Voie d'administration</label>
                            <input
                              type="text"
                              placeholder="ex: IV, IM, SC..."
                              value={newEvent.medication_administration.route}
                              onChange={(e) => setNewEvent({
                                ...newEvent,
                                medication_administration: { ...newEvent.medication_administration, route: e.target.value }
                              })}
                            />
                          </div>
                        </>
                      )}

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          placeholder="Détails supplémentaires..."
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <button className="log-btn" onClick={handleLogEvent} disabled={submittingEvent}>
                        {submittingEvent ? 'Enregistrement...' : 'Enregistrer l\'événement'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Events Timeline */}
              <div className="events-timeline">
                <h3>Chronologie des Événements ({latestEvents.length})</h3>
                <div className="timeline">
                  {latestEvents.length === 0 ? (
                    <p className="empty-text">Aucun événement enregistré pour cette session.</p>
                  ) : (
                    [...latestEvents].reverse().map((event, idx) => (
                      <div key={event.id || idx} className="timeline-item">
                        <div
                          className="timeline-marker"
                          style={{ backgroundColor: eventTypeColors[event.event_type] || '#60a5fa' }}
                        ></div>
                        <div className="timeline-content">
                          <div className="event-header">
                            <strong>{event.title || event.event_type}</strong>
                            <span className="event-time">
                              {event.timestamp
                                ? new Date(event.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                : '--:--'}
                            </span>
                          </div>
                          <p>{event.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Session Notes */}
              {peropSummary?.session && (
                <div className="session-notes">
                  <h3>Notes Cliniques</h3>
                  <div className="notes-content">
                    {peropSummary.session.notes || 'Aucune note. Utilisez l\'enregistrement d\'événements ci-dessus.'}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                    Session démarrée:{' '}
                    {peropSummary.session.started_at
                      ? new Date(peropSummary.session.started_at).toLocaleString('fr-FR')
                      : 'N/A'}
                    {' | '}Durée: {formatElapsed(peropSummary.session.started_at)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <div>
                <p>Sélectionnez une session active pour voir les détails</p>
                {activeCases.length === 0 && !loadingCases && (
                  <p style={{ marginTop: '8px', fontSize: '13px', color: '#4a5568' }}>
                    Aucun patient en salle d'opération pour le moment.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* ── Right Panel: AI Assistant ── */}
        <div className="copilot-panel">
          <ClinicalCopilot contextType="iade" patientId={selectedCase ? selectedCase.patient : null} caseId={selectedCase ? selectedCase.id : null} />
        </div>
      </div>
    </div>
  );
};

export default IADEDashboard;
