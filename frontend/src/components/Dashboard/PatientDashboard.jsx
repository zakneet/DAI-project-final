import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import PatientOnboarding from './PatientOnboarding';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [caseStatus, setCaseStatus] = useState(null);    // statut du dossier
  const [activeCaseDecision, setActiveCaseDecision] = useState(null); // décision médecin
  const [questionnaireStatus, setQuestionnaireStatus] = useState(null); // statut du questionnaire
  const [patientProfile, setPatientProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientStatus();
    // eslint-disable-next-line
  }, []);

  const fetchPatientStatus = async () => {
    try {
      const patientId = user?.patient_id;

      // 1. Check Onboarding Status
      try {
        const profileRes = await api.getMyPatientProfile();
        setPatientProfile(profileRes.data);
      } catch (err) {
        console.log("No profile found or error fetching profile", err);
      }

      if (!patientId) {
        setLoading(false);
        return;
      }

      // 2. Fetch Cases
      const casesRes = await api.getCasesByPatient(patientId);
      const cases = casesRes.data;
      if (cases && cases.length > 0) {
        const activeCase = cases.find(c => c.status === 'PRE_OP') || cases[0];
        setCaseStatus(activeCase.status);
        setActiveCaseDecision(activeCase.decision);

        // Récupérer le questionnaire associé
        const qsRes = await api.getQuestionnaires();
        const existing = qsRes.data.find(q => q.anesthesia_case === activeCase.id);
        if (existing) {
          setQuestionnaireStatus(existing.validation_status);
        }
      }
    } catch (err) {
      console.error('Erreur chargement statut patient', err);
    } finally {
      setLoading(false);
    }
  };

  const questionnaireDone = questionnaireStatus === 'SUBMITTED' || questionnaireStatus === 'VALIDATED';

  // Si le patient n'a pas complété l'onboarding, on l'affiche en premier
  if (patientProfile && patientProfile.onboarding_completed === false) {
    return <PatientOnboarding onComplete={fetchPatientStatus} />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';
    let statusText = '';
    
    if (loading) return '';
    if (!caseStatus) {
      statusText = 'votre dossier est en attente de création.';
    } else if (questionnaireDone) {
      statusText = 'vous êtes prêt(e) pour votre consultation.';
    } else {
      statusText = "n'oubliez pas de compléter votre questionnaire médical.";
    }
    return `${greeting} ${user?.first_name || 'Patient'}, ${statusText}`;
  };

  const getProgress = () => {
    let prog = 0;
    if (caseStatus) prog += 50;
    if (questionnaireDone) prog += 50;
    return prog;
  };

  const progress = getProgress();

  return (
    <div className="pd-wrapper animate-fade-in">
      <div className="pd-container" style={{ animation: 'staggerFadeUp 0.6s ease forwards' }}>

        {/* Patient Identity */}
        <div className="pd-panel pd-identity-card" style={{ animationDelay: '0.1s' }}>
          <div className="pd-identity-info">
            <h2>{user?.first_name || 'Patient'} {user?.last_name || ''}</h2>
            <p style={{ color: 'var(--primary)', fontWeight: '600', marginBottom: '12px' }}>{getGreeting()}</p>
            {caseStatus && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  backgroundColor: caseStatus === 'PRE_OP' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: caseStatus === 'PRE_OP' ? '#f59e0b' : '#10b981',
                }}>
                  Dossier : {caseStatus}
                </span>
                {activeCaseDecision && (
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    backgroundColor: activeCaseDecision === 'AUTHORIZED' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                    color: activeCaseDecision === 'AUTHORIZED' ? '#10b981' : '#3b82f6',
                    border: '1px solid currentColor'
                  }}>
                    Décision : {
                      activeCaseDecision === 'AUTHORIZED' ? 'Autorisée' :
                        activeCaseDecision === 'EXAMS_REQUIRED' ? 'Examens requis' :
                          activeCaseDecision === 'SPECIALIST_OPINION' ? 'Avis spécialisé' : 'Récusée'
                    }
                  </span>
                )}
              </div>
            )}
          </div>
          <button className="pd-logout-btn" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Déconnexion
          </button>
        </div>

        {/* Main Actions & Progress */}
        <div className="pd-grid-main" style={{ animationDelay: '0.2s' }}>
          
          <div className="pd-action-card">
            <div className="pd-action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h3>Questionnaire Médical</h3>
            <p>Complétez vos antécédents et traitements actuels.</p>
            {questionnaireDone ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginTop: '12px', fontWeight: '600' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                Questionnaire {questionnaireStatus === 'VALIDATED' ? 'validé' : 'soumis'}
              </div>
            ) : (
              <button
                className="pd-btn-primary"
                onClick={() => navigate('/patient-dashboard/questionnaire')}
              >
                {questionnaireStatus === 'DRAFT' ? 'Continuer le questionnaire' : 'Compléter le questionnaire'}
              </button>
            )}
          </div>

          <div className="pd-panel pd-progress-card">
            <h3>Avancement</h3>
            <div className="pd-progress-circle-wrap">
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }} strokeLinecap="round" />
              </svg>
              <div className="pd-progress-text">
                <span>{progress}%</span>
                <small>Prêt</small>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="pd-panel status-tracker" style={{ animationDelay: '0.3s' }}>
          <div className="pd-tracker-title">
            <span className="dot">•</span> Suivi de votre dossier
          </div>
          {loading ? (
            <div style={{ color: '#475569', fontSize: '0.85rem' }}>Chargement...</div>
          ) : (
            <div className="pd-pills">
              <div className={`pd-pill ${caseStatus ? 'success' : 'pending'}`}>
                {caseStatus ? '✓' : '⏳'} Dossier créé
              </div>
              <div className={`pd-pill ${questionnaireDone ? 'success' : questionnaireStatus === 'DRAFT' ? 'pending' : 'pending'}`}>
                {questionnaireDone ? '✓' : questionnaireStatus === 'DRAFT' ? '✏️' : '⏳'} Questionnaire
                {questionnaireStatus === 'DRAFT' && ' (en cours)'}
                {questionnaireDone && ` (${questionnaireStatus === 'VALIDATED' ? 'validé' : 'soumis'})`}
              </div>
            </div>
          )}
        </div>

        {/* Info Grid: Documents & Support */}
        <div className="pd-grid-2" style={{ animationDelay: '0.4s' }}>
          <div className="pd-panel pd-docs-card">
            <h3 className="pd-panel-title">Mes Documents</h3>
            <div className="pd-doc-list">
              <div className="pd-doc-item">
                <div className="pd-doc-icon">📝</div>
                <div className="pd-doc-info">
                  <strong>Consignes pré-opératoires</strong>
                  <small>À lire avant l'intervention</small>
                </div>
                <button className="pd-btn-icon">⬇️</button>
              </div>
              <div className="pd-doc-item">
                <div className="pd-doc-icon">🏥</div>
                <div className="pd-doc-info">
                  <strong>Livret d'accueil</strong>
                  <small>Guide de la clinique</small>
                </div>
                <button className="pd-btn-icon">⬇️</button>
              </div>
            </div>
          </div>

          <div className="pd-panel pd-support-card">
            <h3 className="pd-panel-title">Besoin d'aide ?</h3>
            <p>Notre équipe médicale est à votre disposition pour toute question concernant votre intervention.</p>
            <div className="pd-support-actions">
              <button className="pd-btn-secondary">📞 Contacter la clinique</button>
              <button className="pd-btn-outline" style={{ marginTop: '10px' }}>❓ Foire aux questions</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;
