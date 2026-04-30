import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import './Admin.css';

const AuditViewer = ({ onBack }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [expandedLog, setExpandedLog] = useState(null);

  const formatAction = (action) => {
    const map = {
      'UPDATE': 'Mise à jour',
      'CREATE': 'Création',
      'END_POSTOP_STAY': 'Fin de surveillance',
      'START_POSTOP_STAY': 'Admission Réveil',
      'CREATE_POSTOP_OBSERVATION': 'Observation Post-Op',
      'RESOLVE_ALERT': 'Alerte résolue',
      'END_PEROP_SESSION': 'Fin d\'anesthésie',
      'CREATE_PEROP_EVENT': 'Événement consigné',
      'START_PEROP_SESSION': 'Début anesthésie',
      'LOGIN': 'Connexion',
      'LOGOUT': 'Déconnexion',
      'COMPUTE_SCORES': 'Calcul des scores',
      'ACKNOWLEDGE_ALERT': 'Alerte acquittée',
      'CREATE_VITAL_MEASUREMENT': 'Signes vitaux',
    };
    return map[action] || action;
  };

  const formatEntity = (entity) => {
    const map = {
      'AnesthesiaCase': 'Dossier',
      'PostOpStay': 'S.S.P.I',
      'PostOpObservation': 'Observations',
      'Alert': 'Alerte',
      'PerOpSession': 'Session Per-Op',
      'PerOpEvent': 'Événement',
      'Patient': 'Patient',
      'VitalSignMeasurement': 'Monitorage',
    };
    return map[entity] || entity;
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLow = searchTerm.toLowerCase();
    const actionMatches = log.action.toLowerCase().includes(searchLow) ||
      log.actor.toLowerCase().includes(searchLow) ||
      log.entity_type.toLowerCase().includes(searchLow);
    const filterMatches = filterAction === "" || log.action === filterAction;
    return actionMatches && filterMatches;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action))];

  if (loading) {
    return (
      <div className="pq-center">
        <div className="loader"></div>
        <p>Génération du rapport de traçabilité...</p>
      </div>
    );
  }

  return (
    <div className="admin-container animate-fade-in">
      <header className="admin-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', width: 'fit-content' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Retour au Tableau de Bord
          </button>
          <div>
            <h1 className="feed-title-blue" style={{ fontSize: '1.6rem' }}>
              Audit et Traçabilité Système
            </h1>
            <p style={{ color: 'var(--dash-text-muted)', marginTop: '6px', fontSize: '0.95rem', fontWeight: '500' }}>
              Historique complet des actions cliniques effectuées sur la plateforme.
            </p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
          <span style={{ fontSize: '1.1rem' }}>🔄</span>
          Rafraîchir les données
        </button>
      </header>

      <div className="glass-card section-card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '16px' }}>
          <input
            type="text"
            placeholder="Rechercher par médecin, action, ou ID..."
            className="admin-input"
            style={{ marginBottom: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="admin-select"
            style={{ marginBottom: 0 }}
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
          >
            <option value="">Toutes les actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="admin-body">
        <table className="template-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Entité</th>
              <th>Auteur</th>
              <th>Date et Heure</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <React.Fragment key={log.id}>
                <tr className="template-row" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="type-badge" style={{ background: 'var(--dash-primary-light)', color: 'var(--dash-primary)', padding: '4px 10px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '800' }}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--dash-text-main)', fontSize: '0.9rem', fontWeight: '600' }}>{formatEntity(log.entity_type)}</span>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--dash-text-main)' }}>{log.actor || 'Système'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--dash-text-muted)', fontWeight: '600' }}>
                    {new Date(log.created_at).toLocaleDateString('fr-FR')} • {new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <button className="btn-action">
                      {expandedLog === log.id ? 'Fermer' : 'Voir Détails'}
                    </button>
                  </td>
                </tr>
                {expandedLog === log.id && (
                  <tr>
                    <td colSpan="5" style={{ padding: '16px', background: 'var(--dash-bg)' }}>
                      <div style={{
                        background: 'var(--dash-surface)',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid var(--dash-border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} style={{ borderBottom: '1px solid var(--dash-border)', paddingBottom: '8px' }}>
                              <div style={{ fontSize: '0.65rem', color: 'var(--dash-text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>
                                {key.replace(/_/g, ' ')}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--dash-text-main)' }}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </div>
                            </div>
                          ))}
                          {Object.keys(log.details).length === 0 && (
                            <span style={{ color: 'var(--dash-text-muted)', fontStyle: 'italic' }}>Aucune donnée supplémentaire.</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="empty-state" style={{ padding: '40px' }}>
            Aucun log ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditViewer;
