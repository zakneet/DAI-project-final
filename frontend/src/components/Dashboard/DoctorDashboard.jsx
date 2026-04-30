import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CaseReviewDetail from '../PreOp/CaseReviewDetail';
import RiskCalculatorModal from '../PreOp/RiskCalculatorModal';
import TemplateManager from '../Admin/TemplateManager';
import AuditViewer from '../Admin/AuditViewer';
import UserProfile from './UserProfile';
import DMEPanel from './DMEPanel';
import ClinicalCopilot from '../AI/ClinicalCopilot';
import './Dashboard.css';

const ICONS = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  bot: "M12 8V4H8 M12 8h4V4 M12 8v4 M6 12h12v8H6z M4 16h2 M18 16h2", // simplified robot
  calculator: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z",
  settings: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  fileText: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  chevronRight: "M9 18l6-6-6-6",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  play: "M5 3l14 9-14 9V3z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2"
};

// Simple SVG sparklines
const SparklineUp = ({ color = "#10b981" }) => (
  <svg className="sparkline-svg" width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 20L15 12L25 16L45 4L58 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M45 4L58 10V24H2V20" fill={`url(#gradient-${color})`} opacity="0.2"/>
    <defs>
      <linearGradient id={`gradient-${color}`} x1="30" y1="4" x2="30" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor={color}/>
        <stop offset="1" stopColor={color} stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const SparklineDown = ({ color = "#ef4444" }) => (
  <svg className="sparkline-svg" width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 4L15 12L25 8L45 20L58 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M45 20L58 14V24H2V4" fill={`url(#gradient-${color})`} opacity="0.2"/>
    <defs>
      <linearGradient id={`gradient-${color}`} x1="30" y1="2" x2="30" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor={color}/>
        <stop offset="1" stopColor={color} stopOpacity="0"/>
      </linearGradient>
    </defs>
  </svg>
);

const Icon = ({ d, size = 20, color = 'currentColor', fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ patients: 0, cases: 0, questionnaires: 0, scores: 0 });
  const [cases, setCases] = useState([]);
  const [patients, setPatients] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Navigation State
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, dme, ai, calc, templates, audit, profile
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // New Expert Features States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, BLOC, WAITING
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [patientsRes, casesRes, questionnairesRes, scoresRes] = await Promise.all([
        api.getPatients(),
        api.getCases(),
        api.getQuestionnaires(),
        api.getScores()
      ]);

      const patientsList = patientsRes.data.results || patientsRes.data;
      const casesList = casesRes.data.results || casesRes.data;
      const questionnairesList = questionnairesRes.data.results || questionnairesRes.data;
      const scoresList = scoresRes.data.results || scoresRes.data;

      setStats({
        patients: patientsRes.data.count || patientsList.length,
        cases: casesRes.data.count || casesList.length,
        questionnaires: questionnairesRes.data.count || questionnairesList.length,
        scores: scoresRes.data.count || scoresList.length
      });

      const pMap = {};
      patientsList.forEach(p => pMap[p.id] = p);
      setPatients(pMap);

      setCases(casesList);

      const alerts = casesList.filter(c => {
        const caseScores = scoresList.filter(s => s.anesthesia_case === c.id);
        const asaScore = caseScores.find(s => s.score_type === 'ASA');
        return asaScore && parseInt(asaScore.score_value) >= 3;
      }).map(c => ({
        id: c.id,
        type: 'CRITICAL_RISK',
        message: `Risque élevé détecté pour ${pMap[c.patient]?.first_name || 'Patient'}`,
        caseId: c.id
      }));
      setNotifications(alerts);

    } catch (error) {
      console.error("Erreur lors de la récupération des données", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRE_OP': return <span className="status-badge badge-preop">Pré-op</span>;
      case 'PER_OP': return <span className="status-badge badge-perop">Bloc</span>;
      case 'POST_OP': return <span className="status-badge badge-postop">Post-op</span>;
      case 'SSPI': return <span className="status-badge badge-sspi">SSPI</span>;
      case 'CLOSED': return <span className="status-badge badge-closed">Terminé</span>;
      default: return <span className="status-badge badge-closed">{status}</span>;
    }
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case 'AUTHORIZED': return <span className="status-badge badge-auth">Autorisé</span>;
      case 'EXAMS_REQUIRED': return <span className="status-badge badge-exam">Examens</span>;
      case 'SPECIALIST_OPINION': return <span className="status-badge badge-spe">Avis Spé.</span>;
      case 'REFUSED': return <span className="status-badge badge-refused">Refusé</span>;
      default: return <span className="status-badge badge-closed">En attente</span>;
    }
  };

  const filteredCases = cases.filter(c => {
    const p = patients[c.patient] || {};
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(searchLow) || c.id.toLowerCase().includes(searchLow);
    
    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'BLOC') return c.status === 'PER_OP';
    if (filterStatus === 'WAITING') return c.status === 'PRE_OP' || c.status === 'ATTENTE';
    return true;
  });

  const handleOpenAiDrawer = (caseId = null) => {
    if (caseId) setSelectedCaseId(caseId);
    setIsAiDrawerOpen(true);
  };

  // Handle Command Palette Keyboard Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsAiDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render Sub-views
  const renderContent = () => {
    if (loading && !selectedCaseId) {
      return (
        <div className="dashboard-loading">
          <div className="loader"></div>
          <p>Synchronisation des données cliniques...</p>
        </div>
      );
    }

    if (selectedCaseId) {
      return <CaseReviewDetail caseId={selectedCaseId} onBack={() => setSelectedCaseId(null)} onUpdate={fetchData} />;
    }

    switch (activeView) {
      case 'dme':
        return <DMEPanel />;
      case 'ai':
        return <ClinicalCopilot contextType="doctor" onClose={() => setActiveView('dashboard')} />;
      case 'templates':
        return <TemplateManager onBack={() => setActiveView('dashboard')} />;
      case 'audit':
        return <AuditViewer onBack={() => setActiveView('dashboard')} />;
      case 'profile':
        return <UserProfile onBack={() => setActiveView('dashboard')} />;
      case 'calc':
        return <RiskCalculatorModal isOpen={true} onClose={() => setActiveView('dashboard')} />;
      
      case 'dashboard':
      default:
        return (
          <div className="animate-fade-in">
            <div className="page-header">
              <h1 className="page-title">Tableau de Bord</h1>
              <p className="page-subtitle">Vue d'ensemble de votre activité clinique aujourd'hui.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card-premium card-blue">
                <div className="stat-header">
                  <span className="stat-title">Patients</span>
                  <div className="stat-icon-wrapper blue"><Icon d={ICONS.users} size={24} /></div>
                </div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center' }}>
                  {stats.patients}
                  <SparklineUp color="#3b82f6" />
                </div>
                <div className="stat-footer">
                  <span className="stat-trend up">↑ 12%</span>
                  <span className="stat-period">vs mois dernier</span>
                </div>
              </div>
              <div className="stat-card-premium card-violet">
                <div className="stat-header">
                  <span className="stat-title">Dossiers Actifs</span>
                  <div className="stat-icon-wrapper violet"><Icon d={ICONS.folder} size={24} /></div>
                </div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center' }}>
                  {stats.cases}
                  <SparklineUp color="#8b5cf6" />
                </div>
                <div className="stat-footer">
                  <span className="stat-trend up">↑ 4</span>
                  <span className="stat-period">nouveaux aujourd'hui</span>
                </div>
              </div>
              <div className="stat-card-premium card-amber">
                <div className="stat-header">
                  <span className="stat-title">Bilans</span>
                  <div className="stat-icon-wrapper amber"><Icon d={ICONS.fileText} size={24} /></div>
                </div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center' }}>
                  {stats.questionnaires}
                  <SparklineDown color="#f59e0b" />
                </div>
                <div className="stat-footer">
                  <span className="stat-trend down">↓ 2%</span>
                  <span className="stat-period">taux de complétion</span>
                </div>
              </div>
              <div className="stat-card-premium card-emerald">
                <div className="stat-header">
                  <span className="stat-title">Analyses IA</span>
                  <div className="stat-icon-wrapper emerald"><Icon d={ICONS.bot} size={24} /></div>
                </div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center' }}>
                  {stats.scores}
                  <SparklineUp color="#10b981" />
                </div>
                <div className="stat-footer">
                  <span className="stat-trend up">↑ 24%</span>
                  <span className="stat-period">de temps gagné</span>
                </div>
              </div>
            </div>

            {/* EXPERT: Mini-Planning Horizontal */}
            <div className="mini-planning-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="planning-header">
                <span className="planning-title">
                  <Icon d={ICONS.clock} size={18} color="var(--dash-primary)" />
                  Planning du Bloc Opératoire
                </span>
                <span className="badge badge-bloc">EN COURS</span>
              </div>
              <div className="planning-track">
                {/* Simulated slots for today */}
                <div className="planning-slot" style={{ width: '25%', background: '#10b981' }} title="08:00 - 10:00 (Terminé)">O. Tolouse</div>
                <div className="planning-slot" style={{ width: '30%', background: '#3b82f6' }} title="10:00 - 13:00 (En cours)">C. Fekih</div>
                <div className="planning-slot" style={{ width: '20%', background: '#8b5cf6' }} title="14:00 - 16:00 (Prévu)">S. Amari</div>
                <div className="planning-slot" style={{ width: '25%', background: 'transparent', borderRight: 'none', color: '#94a3b8' }}>Disponible</div>
              </div>
              <div className="planning-labels">
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>18:00</span>
              </div>
            </div>

            <div className="dashboard-content-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="table-section">
                <div className="table-header" style={{ marginBottom: '8px' }}>
                  <h3 className="table-title">Dossiers Récents</h3>
                </div>
                
                {/* EXPERT: Table Filters */}
                <div className="table-filters">
                  <button className={`filter-pill ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>
                    Tous
                  </button>
                  <button className={`filter-pill ${filterStatus === 'WAITING' ? 'active' : ''}`} onClick={() => setFilterStatus('WAITING')}>
                    En Attente
                  </button>
                  <button className={`filter-pill ${filterStatus === 'BLOC' ? 'active' : ''}`} onClick={() => setFilterStatus('BLOC')}>
                    Au Bloc
                  </button>
                </div>

                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Chirurgie</th>
                      <th>Étape</th>
                      <th>Décision</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map(c => {
                      const patient = patients[c.patient] || { first_name: 'Inconnu', last_name: '' };
                      
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="patient-cell">
                              <div className="patient-avatar">{patient.first_name?.charAt(0) || '?'}</div>
                              <div className="patient-info">
                                <span className="name">{patient.first_name} {patient.last_name}</span>
                                <span className="id">#{c.id.substring(0, 8).toUpperCase()}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="surgery-type">{c.surgery_type ? c.surgery_type.replace(/_/g, ' ') : 'Non définie'}</span>
                          </td>
                          <td>{getStatusBadge(c.status)}</td>
                          <td>{getDecisionBadge(c.decision)}</td>
                          <td>
                            <div className="table-actions">
                              <div className="row-quick-actions">
                                <button className="btn-icon-sm" title="Voir DPI" onClick={() => setSelectedCaseId(c.id)}>
                                  <Icon d={ICONS.eye} size={14} />
                                </button>
                                <button className="btn-icon-sm" title="Analyse IA" onClick={() => handleOpenAiDrawer(c.id)}>
                                  <Icon d={ICONS.bot} size={14} />
                                </button>
                              </div>
                              <button className="btn-action-primary" onClick={() => setSelectedCaseId(c.id)}>
                                Réviser <Icon d={ICONS.chevronRight} size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCases.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                          Aucun dossier trouvé pour cette recherche.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Timeline Section */}
              <div className="timeline-section">
                <h3 className="timeline-title">Activité Récente</h3>
                <div className="timeline-list">
                  <div className="timeline-item recent">
                    <div className="timeline-icon"><Icon d={ICONS.activity} size={18} /></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-action">Alerte IA Résolue</span>
                        <span className="timeline-time">10:45</span>
                      </div>
                      <p className="timeline-desc">Patient #5A6120A9 stabilisé par Dr. Fekih.</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon"><Icon d={ICONS.clock} size={18} color="#94a3b8" /></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-action">Chirurgie Terminée</span>
                        <span className="timeline-time">09:30</span>
                      </div>
                      <p className="timeline-desc">Passage en SSPI pour le patient #BDE1BAEE.</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon"><Icon d={ICONS.fileText} size={18} color="#94a3b8" /></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-action">Nouveau Bilan</span>
                        <span className="timeline-time">08:15</span>
                      </div>
                      <p className="timeline-desc">Questionnaire pré-op complété (Risque ASA 3).</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-icon"><Icon d={ICONS.users} size={18} color="#94a3b8" /></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-action">Connexion</span>
                        <span className="timeline-time">08:00</span>
                      </div>
                      <p className="timeline-desc">Vous avez ouvert la session médicale.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const userName = user?.first_name ? `${user.first_name} ${user.last_name}` : 'Dr. Anesthésiste';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">DAI</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-nav-title">Menu Principal</div>
          <button 
            className={`sidebar-item ${activeView === 'dashboard' && !selectedCaseId ? 'active' : ''}`} 
            onClick={() => {setActiveView('dashboard'); setSelectedCaseId(null);}}
          >
            <Icon d={ICONS.home} /> Vue d'ensemble
          </button>
          <button 
            className={`sidebar-item ${activeView === 'dme' ? 'active' : ''}`} 
            onClick={() => setActiveView('dme')}
          >
            <Icon d={ICONS.folder} /> Dossiers Patients
          </button>
          <button 
            className={`sidebar-item sidebar-item-ai ${activeView === 'ai' ? 'active' : ''}`} 
            onClick={() => setActiveView('ai')}
          >
            <Icon d={ICONS.bot} /> AI Assistant DAI
          </button>
          
          <div className="sidebar-nav-title">Outils & Config</div>
          <button className={`sidebar-item ${activeView === 'calc' ? 'active' : ''}`} onClick={() => setActiveView('calc')}>
            <Icon d={ICONS.calculator} /> Calc. de Risque
          </button>
          <button className={`sidebar-item ${activeView === 'templates' ? 'active' : ''}`} onClick={() => setActiveView('templates')}>
            <Icon d={ICONS.fileText} /> Questionnaires
          </button>
          <button className={`sidebar-item ${activeView === 'audit' ? 'active' : ''}`} onClick={() => setActiveView('audit')}>
            <Icon d={ICONS.settings} /> Log d'Audit
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={logout}>
            <Icon d={ICONS.logout} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-search" onClick={() => setIsCommandPaletteOpen(true)} style={{ cursor: 'text' }}>
            <Icon d={ICONS.search} />
            <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Rechercher un patient, un ID... (Ctrl+K)</span>
          </div>
          
          <div className="header-actions">
            <div style={{position: 'relative'}}>
              <button className="btn-icon" onClick={() => setIsNotifOpen(!isNotifOpen)}>
                <Icon d={ICONS.bell} />
                {notifications.length > 0 && <span className="notif-badge"></span>}
              </button>
              
              {isNotifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">Alertes Cliniques</div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">Aucune alerte active</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="notif-item" onClick={() => {
                        setSelectedCaseId(n.caseId);
                        setIsNotifOpen(false);
                      }}>
                        <div className="id-notif-type">Alerte Prioritaire</div>
                        <div className="notif-msg">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <button className="user-profile-btn" onClick={() => setActiveView('profile')}>
              <div className="user-avatar">{initial}</div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">Médecin</span>
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content-area">
          {renderContent()}
        </div>
      </main>

      {/* EXPERT: Command Palette Modal */}
      {isCommandPaletteOpen && (
        <div className="command-palette-overlay" onClick={() => setIsCommandPaletteOpen(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus
              type="text" 
              className="command-palette-input"
              placeholder="Tapez une commande ou cherchez un patient..." 
              value={commandSearch}
              onChange={e => setCommandSearch(e.target.value)}
            />
            <div className="command-palette-results">
              <div className="command-item">
                <Icon d={ICONS.search} size={16} />
                <span>Rechercher "{commandSearch || '...'}" dans les dossiers</span>
              </div>
              {!commandSearch && (
                <>
                  <div className="sidebar-nav-title" style={{ marginTop: '12px' }}>Actions Rapides</div>
                  <div className="command-item" onClick={() => { setActiveView('preop'); setIsCommandPaletteOpen(false); }}>
                    <Icon d={ICONS.fileText} size={16} />
                    <span>Nouveau Bilan Pré-Op</span>
                  </div>
                  <div className="command-item" onClick={() => { handleOpenAiDrawer(); setIsCommandPaletteOpen(false); }}>
                    <Icon d={ICONS.bot} size={16} />
                    <span>Ouvrir l'Assistant IA</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPERT: AI Sliding Drawer */}
      {isAiDrawerOpen && (
        <div className="ai-drawer-overlay" onClick={() => setIsAiDrawerOpen(false)}>
          <div className="ai-drawer" onClick={e => e.stopPropagation()}>
            <ClinicalCopilot contextType="doctor" onClose={() => setIsAiDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
