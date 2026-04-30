import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import './AlertsPanel.css';

const AlertsPanel = ({ compact = false }) => {
  const [alerts, setAlerts] = useState([]);
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, critical, warning, info

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.getAlerts();
      setAlerts(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    // Mark as read on backend
    api.updateAlert(alertId, { is_read: true }).catch(err => {
      console.error('Error marking alert as read:', err);
    });
  };

  const handleExpandAlert = (alertId) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const getAlertSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'severity-critical';
      case 'warning':
        return 'severity-warning';
      case 'info':
        return 'severity-info';
      default:
        return 'severity-info';
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType?.toUpperCase()) {
      case 'VITAL_ABNORMAL':
        return '⚠️';
      case 'RISK_ALERT':
        return '🚨';
      case 'MEDICATION':
        return '💊';
      case 'INFECTION':
        return '🦠';
      case 'COMPLICATION':
        return '⚠️';
      case 'ADMISSION':
        return '📋';
      case 'DISCHARGE':
        return '✓';
      default:
        return 'ℹ️';
    }
  };

  const filterAlerts = () => {
    let filtered = alerts.filter(alert => !dismissedAlerts.has(alert.id));

    if (filter !== 'all') {
      filtered = filtered.filter(alert =>
        alert.severity?.toLowerCase() === filter.toLowerCase()
      );
    }

    return filtered;
  };

  const displayAlerts = filterAlerts();
  const criticalCount = displayAlerts.filter(a => a.severity?.toLowerCase() === 'critical').length;
  const warningCount = displayAlerts.filter(a => a.severity?.toLowerCase() === 'warning').length;

  if (compact) {
    // Compact view for dashboard integration
    return (
      <div className="alerts-panel compact">
        <div className="alerts-header">
          <h3>⚡ Alerts</h3>
          <div className="alert-counts">
            {criticalCount > 0 && <span className="count critical">{criticalCount}</span>}
            {warningCount > 0 && <span className="count warning">{warningCount}</span>}
          </div>
        </div>

        <div className="alerts-list compact-list">
          {displayAlerts.length === 0 ? (
            <div className="no-alerts">All systems normal</div>
          ) : (
            displayAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`alert-item ${getAlertSeverityClass(alert.severity)}`}>
                <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                <div className="alert-content">
                  <p className="alert-title">{alert.message}</p>
                  <small className="alert-patient">{alert.patient_name}</small>
                </div>
                <button
                  className="dismiss-btn"
                  onClick={() => handleDismissAlert(alert.id)}
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {displayAlerts.length > 5 && (
          <div className="alerts-footer">
            <a href="/alerts">View all {displayAlerts.length} alerts →</a>
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="alerts-panel full">
      <div className="panel-header">
        <h2>Alert Center</h2>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchAlerts}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({displayAlerts.length})
        </button>
        <button
          className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
          onClick={() => setFilter('critical')}
        >
          🔴 Critical ({criticalCount})
        </button>
        <button
          className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
          onClick={() => setFilter('warning')}
        >
          🟡 Warning ({warningCount})
        </button>
        <button
          className={`filter-btn ${filter === 'info' ? 'active' : ''}`}
          onClick={() => setFilter('info')}
        >
          ℹ️ Info
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-container">
        {loading && <div className="loading">Loading alerts...</div>}

        {displayAlerts.length === 0 && !loading ? (
          <div className="empty-state">
            <p>✓ No {filter !== 'all' ? filter.toLowerCase() : ''} alerts</p>
            <small>All systems operating normally</small>
          </div>
        ) : (
          <div className="alerts-list">
            {displayAlerts.map(alert => (
              <div
                key={alert.id}
                className={`alert-item ${getAlertSeverityClass(alert.severity)} ${
                  expandedAlerts.has(alert.id) ? 'expanded' : ''
                }`}
              >
                <div className="alert-header" onClick={() => handleExpandAlert(alert.id)}>
                  <div className="alert-left">
                    <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                    <div className="alert-main">
                      <p className="alert-title">{alert.message}</p>
                      <div className="alert-meta">
                        <span className="patient-name">{alert.patient_name}</span>
                        <span className="alert-type">{alert.type?.replace(/_/g, ' ')}</span>
                        <span className="alert-time">{formatTime(alert.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="alert-right">
                    <span className={`severity-badge ${getAlertSeverityClass(alert.severity)}`}>
                      {alert.severity?.toUpperCase()}
                    </span>
                    <button className="expand-btn">
                      {expandedAlerts.has(alert.id) ? '▼' : '▶'}
                    </button>
                  </div>
                </div>

                {expandedAlerts.has(alert.id) && (
                  <div className="alert-details">
                    <div className="detail-group">
                      <span className="detail-label">Description:</span>
                      <p>{alert.description || 'No additional details'}</p>
                    </div>

                    {alert.affected_values && (
                      <div className="detail-group">
                        <span className="detail-label">Affected Values:</span>
                        <div className="values-list">
                          {Object.entries(alert.affected_values).map(([key, value]) => (
                            <div key={key} className="value-item">
                              <span className="value-name">{key}:</span>
                              <span className="value-data">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.recommended_action && (
                      <div className="detail-group">
                        <span className="detail-label">Recommended Action:</span>
                        <p className="action-text">{alert.recommended_action}</p>
                      </div>
                    )}

                    <div className="alert-actions">
                      <button
                        className="action-btn acknowledge"
                        onClick={() => handleDismissAlert(alert.id)}
                      >
                        ✓ Acknowledge
                      </button>
                      <button className="action-btn escalate">
                        📞 Escalate
                      </button>
                      <button className="action-btn view-patient">
                        👁️ View Patient
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (isoString) => {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString();
};

export default AlertsPanel;
