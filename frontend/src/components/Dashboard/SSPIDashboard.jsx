import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import ClinicalCopilot from '../AI/ClinicalCopilot';
import './SSPIDashboard.css';

const SSPIDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // POST_OP cases = recovery queue
  const [recoveryCases, setRecoveryCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  // Full summary for selected case (patient + postop stay + observations)
  const [postopSummary, setPostopSummary] = useState(null);
  const [aldreteData, setAldreteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [error, setError] = useState(null);
  const [showDischargeForm, setShowDischargeForm] = useState(false);
  const [showObsForm, setShowObsForm] = useState(false);
  const [obsForm, setObsForm] = useState({
    observation_time: new Date().toISOString().slice(0, 16),
    activity_score: 0,
    respiration_score: 0,
    circulation_score: 0,
    consciousness_score: 0,
    oxygenation_score: 0,
    pain_score: 0,
    systolic_bp: '',
    spo2: '',
    notes: ''
  });
  const [submittingObs, setSubmittingObs] = useState(false);

  // ─── Fetch all POST_OP cases ─────────────────────────────────────────────
  const fetchRecoveryQueue = useCallback(async () => {
    setLoadingQueue(true);
    setError(null);
    try {
      const response = await api.getCases();
      const allCases = response.data.results || response.data;
      const postOpCases = allCases.filter(c => c.status === 'POST_OP');
      setRecoveryCases(postOpCases);
    } catch (err) {
      console.error('Error fetching recovery queue:', err);
      setError('Impossible de charger la file de récupération.');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // ─── Fetch PostOp summary + Aldrete for a case ───────────────────────────
  const fetchCaseDetails = useCallback(async (caseId) => {
    setLoading(true);
    try {
      const [summaryRes, aldreteRes] = await Promise.allSettled([
        api.getPostOpSummary(caseId),
        api.getAldreteScore(caseId)
      ]);

      if (summaryRes.status === 'fulfilled') {
        setPostopSummary(summaryRes.value.data);
      } else {
        setPostopSummary(null);
      }

      if (aldreteRes.status === 'fulfilled') {
        setAldreteData(aldreteRes.value.data);
      } else {
        setAldreteData(null);
      }
    } catch (err) {
      console.error('Error fetching case details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRecoveryQueue();
    const interval = setInterval(fetchRecoveryQueue, 60000);
    return () => clearInterval(interval);
  }, [fetchRecoveryQueue]);

  useEffect(() => {
    if (selectedCase) {
      fetchCaseDetails(selectedCase.id);
    } else {
      setPostopSummary(null);
      setAldreteData(null);
    }
  }, [selectedCase, fetchCaseDetails]);

  // ─── Start PostOp Stay ────────────────────────────────────────────────────
  const handleStartStay = async () => {
    if (!selectedCase) return;
    try {
      await api.startPostOpStay(selectedCase.id, {
        started_at: new Date().toISOString(),
        notes: ''
      });
      await fetchCaseDetails(selectedCase.id);
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      alert('Erreur: ' + detail);
    }
  };

  // ─── Submit an observation with Aldrete components ────────────────────────
  const handleSubmitObservation = async () => {
    if (!postopSummary?.stay?.id) {
      alert('Aucun séjour post-op actif. Démarrez d\'abord un séjour.');
      return;
    }
    setSubmittingObs(true);
    try {
      const payload = {
        stay: postopSummary.stay.id,
        observation_time: new Date(obsForm.observation_time).toISOString(),
        activity_score: parseInt(obsForm.activity_score),
        respiration_score: parseInt(obsForm.respiration_score),
        circulation_score: parseInt(obsForm.circulation_score),
        consciousness_score: parseInt(obsForm.consciousness_score),
        oxygenation_score: parseInt(obsForm.oxygenation_score),
        pain_score: parseInt(obsForm.pain_score) || 0,
        systolic_bp: obsForm.systolic_bp ? parseInt(obsForm.systolic_bp) : null,
        spo2: obsForm.spo2 ? parseInt(obsForm.spo2) : null,
        notes: obsForm.notes
      };
      await api.postPostOpObservation(selectedCase.id, payload);
      setShowObsForm(false);
      await fetchCaseDetails(selectedCase.id);
    } catch (err) {
      console.error('Error submitting observation:', err);
      const detail = err.response?.data ? JSON.stringify(err.response.data) : 'Erreur inconnue';
      alert('Erreur: ' + detail);
    } finally {
      setSubmittingObs(false);
    }
  };

  // ─── End PostOp Stay (discharge) ────────────────────────────────────────
  const handleEndStay = async () => {
    if (!selectedCase) return;
    if (!window.confirm('Confirmer la sortie de SSPI pour ce patient ?')) return;
    try {
      await api.endPostOpStay(selectedCase.id, {
        ended_at: new Date().toISOString()
      });
      await fetchRecoveryQueue();
      setSelectedCase(null);
      setShowDischargeForm(false);
      alert('Patient sorti de SSPI avec succès.');
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      alert('Erreur: ' + detail);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getAldreteStatus = (score) => {
    if (score === undefined || score === null) return 'calculating';
    if (score >= 9) return 'ready-discharge';
    if (score >= 7) return 'ready-transfer';
    return 'monitoring';
  };

  const getAldreteLabel = (score) => {
    if (score === undefined || score === null) return 'En calcul...';
    if (score >= 9) return '✅ Prêt pour la sortie';
    if (score >= 7) return '⏳ Transfert possible';
    return '⚠️ Surveillance requise';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const stay = postopSummary?.stay;
  const observations = postopSummary?.latest_observations || [];
  const latestObs = observations[0];
  const aldreteScore = aldreteData?.aldrete_score ?? latestObs?.aldrete_score ?? null;
  const aldreteComponents = aldreteData?.latest_observation || latestObs;

  return (
    <div className="sspi-dashboard">
      {/* Header */}
      <div className="sspi-header">
        <div className="header-left">
          <h1>🏥 Gestion de la Récupération Post-Opératoire</h1>
          <p>Salle de Surveillance Post-Interventionnelle (SSPI)</p>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <span className="user-role">SSPI</span>
            <span className="user-name">{user?.first_name || user?.username || 'Infirmier SSPI'}</span>
            <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="sspi-container">
        {/* ── Left Panel: Recovery Queue ── */}
        <div className="queue-panel">
          <div className="panel-header">
            <h2>File de Récupération ({recoveryCases.length})</h2>
            <button className="refresh-btn" onClick={fetchRecoveryQueue}>
              ↻ Actualiser
            </button>
          </div>

          {error && <div className="error-alert">{error}</div>}

          <div className="queue-list">
            {loadingQueue ? (
              <div className="empty-queue">Chargement...</div>
            ) : recoveryCases.length === 0 ? (
              <div className="empty-queue">Aucun patient en récupération post-opératoire</div>
            ) : (
              recoveryCases.map(c => (
                <div
                  key={c.id}
                  className={`queue-item ${selectedCase?.id === c.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="queue-status">
                    <span className="phase-badge phase-pacu">POST-OP</span>
                  </div>
                  <div className="queue-info">
                    <h4>{c.patient_full_name || 'Patient'}</h4>
                    <p className="procedure">{c.surgery_type || 'Chirurgie'}</p>
                    <p className="time">
                      {c.scheduled_at
                        ? new Date(c.scheduled_at).toLocaleDateString('fr-FR')
                        : 'Date non planifiée'}
                    </p>
                  </div>
                  <div className="queue-score">
                    <span className="aldrete-badge">--</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Panel: Patient Recovery Management ── */}
        <div className="recovery-panel">
          {selectedCase ? (
            <>
              {/* Patient Header */}
              <div className="patient-header">
                <div className="patient-info">
                  <h3>{selectedCase.patient_full_name}</h3>
                  <p className="mrn">Chirurgie: {selectedCase.surgery_type} | ID: {selectedCase.id?.substring(0, 8)}</p>
                </div>
                <div className="patient-actions">
                  {!stay ? (
                    <button className="btn-transfer" onClick={handleStartStay}>
                      ▶ Débuter séjour SSPI
                    </button>
                  ) : stay.status === 'ACTIVE' ? (
                    <>
                      <button className="btn-transfer" onClick={() => setShowObsForm(!showObsForm)}>
                        + Observation
                      </button>
                      <button className="btn-discharge" onClick={() => setShowDischargeForm(true)}>
                        Sortie SSPI
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#6ee7b7', fontSize: '13px', fontWeight: '600' }}>
                      ✅ Séjour terminé
                    </span>
                  )}
                </div>
              </div>

              {/* Observation Form */}
              {showObsForm && stay?.status === 'ACTIVE' && (
                <div className="aldrete-section">
                  <div className="section-title">
                    <h3>Nouvelle Observation</h3>
                    <button
                      className="refresh-btn"
                      onClick={() => setShowObsForm(false)}
                      style={{ fontSize: '11px' }}
                    >
                      ✕ Fermer
                    </button>
                  </div>
                  <div className="aldrete-grid">
                    {[
                      { key: 'activity_score', label: 'Activité', options: ['Immobile (0)', 'Membres partiels (1)', 'Tous membres (2)'] },
                      { key: 'respiration_score', label: 'Respiration', options: ['Apnée/Assistée (0)', 'Dyspnée (1)', 'Libre (2)'] },
                      { key: 'circulation_score', label: 'Circulation (PA)', options: ['±50% baseline (0)', '50–100% (1)', '≤20% (2)'] },
                      { key: 'consciousness_score', label: 'Conscience', options: ['Non éveillé (0)', 'Éveil possible (1)', 'Pleinement éveillé (2)'] },
                      { key: 'oxygenation_score', label: 'Oxygénation', options: ['SpO₂ < 90% (0)', 'SpO₂ 90–94% (1)', 'SpO₂ ≥ 95% (2)'] },
                    ].map(({ key, label, options }) => (
                      <div key={key} className="score-item">
                        <label>{label}</label>
                        <div className="score-options">
                          {options.map((opt, idx) => (
                            <label key={idx}>
                              <input
                                type="radio"
                                name={key}
                                value={idx}
                                checked={parseInt(obsForm[key]) === idx}
                                onChange={() => setObsForm({ ...obsForm, [key]: idx })}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#718096', display: 'block', marginBottom: '4px' }}>Douleur (0–10)</label>
                      <input
                        type="number" min="0" max="10"
                        value={obsForm.pain_score}
                        onChange={e => setObsForm({ ...obsForm, pain_score: e.target.value })}
                        style={{ background: '#0f1419', border: '1px solid #2d3748', color: '#cbd5e0', padding: '8px', borderRadius: '6px', width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#718096', display: 'block', marginBottom: '4px' }}>PA Systolique</label>
                      <input
                        type="number"
                        placeholder="120"
                        value={obsForm.systolic_bp}
                        onChange={e => setObsForm({ ...obsForm, systolic_bp: e.target.value })}
                        style={{ background: '#0f1419', border: '1px solid #2d3748', color: '#cbd5e0', padding: '8px', borderRadius: '6px', width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#718096', display: 'block', marginBottom: '4px' }}>SpO₂ (%)</label>
                      <input
                        type="number" min="70" max="100"
                        placeholder="98"
                        value={obsForm.spo2}
                        onChange={e => setObsForm({ ...obsForm, spo2: e.target.value })}
                        style={{ background: '#0f1419', border: '1px solid #2d3748', color: '#cbd5e0', padding: '8px', borderRadius: '6px', width: '100%' }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '12px', color: '#718096', display: 'block', marginBottom: '4px' }}>Notes</label>
                    <textarea
                      placeholder="Observations cliniques..."
                      value={obsForm.notes}
                      onChange={e => setObsForm({ ...obsForm, notes: e.target.value })}
                      rows={2}
                      style={{ background: '#0f1419', border: '1px solid #2d3748', color: '#cbd5e0', padding: '8px', borderRadius: '6px', width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-confirm"
                      onClick={handleSubmitObservation}
                      disabled={submittingObs}
                    >
                      {submittingObs ? 'Enregistrement...' : 'Enregistrer l\'observation'}
                    </button>
                  </div>
                </div>
              )}

              {/* ALDRETE Score Summary */}
              <div className="aldrete-section">
                <div className="section-title">
                  <h3>Score ALDRETE de Récupération</h3>
                  <span className={`aldrete-total ${getAldreteStatus(aldreteScore)}`}>
                    {aldreteScore !== null ? `${aldreteScore}/10` : '--/10'}
                  </span>
                </div>

                {loading ? (
                  <div className="loading">Calcul du score...</div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px', padding: '8px 12px', background: '#1a1f2e', borderRadius: '6px', fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                      {getAldreteLabel(aldreteScore)}
                    </div>

                    {aldreteComponents ? (
                      <div className="aldrete-grid">
                        {[
                          { label: 'Activité', val: aldreteComponents.activity_score },
                          { label: 'Respiration', val: aldreteComponents.respiration_score },
                          { label: 'Circulation', val: aldreteComponents.circulation_score },
                          { label: 'Conscience', val: aldreteComponents.consciousness_score },
                          { label: 'Oxygénation', val: aldreteComponents.oxygenation_score },
                        ].map(({ label, val }) => (
                          <div key={label} className="score-item" style={{ textAlign: 'center' }}>
                            <label style={{ display: 'block', marginBottom: '8px' }}>{label}</label>
                            <span style={{
                              display: 'inline-block',
                              background: val === 2 ? 'rgba(16,185,129,0.2)' : val === 1 ? 'rgba(251,146,60,0.2)' : 'rgba(239,68,68,0.2)',
                              color: val === 2 ? '#10b981' : val === 1 ? '#fb923c' : '#ef4444',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '18px',
                              fontWeight: '700'
                            }}>
                              {val}/2
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-score">
                        {stay
                          ? 'Aucune observation enregistrée. Utilisez le bouton "+ Observation" pour saisir les premiers paramètres.'
                          : 'Démarrez un séjour SSPI pour enregistrer les observations.'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Recovery Progress */}
              <div className="recovery-progress">
                <h3>Progression de la Récupération</h3>
                <div className="progress-timeline">
                  <div className={`progress-step ${stay ? 'complete' : 'active'}`}>
                    <div className="step-marker">1</div>
                    <div className="step-label">Post-Op</div>
                  </div>
                  <div className={`progress-step ${stay?.status === 'ACTIVE' ? 'active' : stay ? 'complete' : ''}`}>
                    <div className="step-marker">2</div>
                    <div className="step-label">Séjour SSPI</div>
                  </div>
                  <div className={`progress-step ${aldreteScore >= 9 ? 'active' : ''}`}>
                    <div className="step-marker">3</div>
                    <div className="step-label">Critères Aldrete ≥ 9</div>
                  </div>
                  <div className={`progress-step ${stay?.status === 'ENDED' ? 'active' : ''}`}>
                    <div className="step-marker">4</div>
                    <div className="step-label">Sortie SSPI</div>
                  </div>
                </div>
              </div>

              {/* Recent Observations */}
              {observations.length > 0 && (
                <div className="observations-section">
                  <h3>Dernières Observations ({observations.length})</h3>
                  <div className="obs-grid">
                    {latestObs?.systolic_bp && (
                      <div className="obs-card">
                        <span className="obs-label">PA Systolique</span>
                        <span className="obs-value">{latestObs.systolic_bp} mmHg</span>
                      </div>
                    )}
                    {latestObs?.spo2 && (
                      <div className="obs-card">
                        <span className="obs-label">SpO₂</span>
                        <span className="obs-value">{latestObs.spo2} %</span>
                      </div>
                    )}
                    {latestObs?.pain_score !== null && latestObs?.pain_score !== undefined && (
                      <div className="obs-card">
                        <span className="obs-label">Douleur</span>
                        <span className="obs-value">{latestObs.pain_score}/10</span>
                      </div>
                    )}
                    <div className="obs-card">
                      <span className="obs-label">Score Aldrete</span>
                      <span className="obs-value">{latestObs?.aldrete_score ?? '--'}/10</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#718096' }}>
                    Dernière observation:{' '}
                    {latestObs?.observation_time
                      ? new Date(latestObs.observation_time).toLocaleString('fr-FR')
                      : 'N/A'}
                  </div>
                </div>
              )}

              {/* Discharge Confirmation */}
              {showDischargeForm && stay?.status === 'ACTIVE' && (
                <div className="modal-overlay">
                  <div className="modal-content discharge-modal">
                    <div className="modal-header">
                      <h3>Confirmer la Sortie SSPI</h3>
                      <button className="close-btn" onClick={() => setShowDischargeForm(false)}>×</button>
                    </div>
                    <div className="modal-body">
                      <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', marginBottom: '12px' }}>
                        <p style={{ margin: 0, color: '#6ee7b7', fontSize: '13px' }}>
                          <strong>Patient:</strong> {selectedCase.patient_full_name}
                        </p>
                        <p style={{ margin: '4px 0 0', color: '#6ee7b7', fontSize: '13px' }}>
                          <strong>Score Aldrete:</strong> {aldreteScore ?? '--'}/10{' '}
                          {aldreteScore >= 9 ? '✅ Critères remplis' : '⚠️ Score insuffisant'}
                        </p>
                      </div>
                      <p style={{ color: '#cbd5e0', fontSize: '13px' }}>
                        Êtes-vous sûr de vouloir transférer ce patient hors de la SSPI ? Cette action terminera le séjour post-opératoire.
                      </p>
                    </div>
                    <div className="modal-footer">
                      <button className="btn-cancel" onClick={() => setShowDischargeForm(false)}>Annuler</button>
                      <button className="btn-confirm" onClick={handleEndStay}>Confirmer la Sortie</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <div>
                <p>Sélectionnez un patient dans la file de récupération</p>
                {recoveryCases.length === 0 && !loadingQueue && (
                  <p style={{ marginTop: '8px', fontSize: '13px', color: '#4a5568' }}>
                    Aucun patient en post-opératoire pour le moment.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Intégration de l'Assistant IA Gemini */}
      <ClinicalCopilot contextType="sspi" patientId={selectedCase ? selectedCase.patient : null} caseId={selectedCase ? selectedCase.id : null} />
    </div>
  );
};

export default SSPIDashboard;
