import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import './AIInsightsPanel.css';

const AIInsightsPanel = ({ patientId = null, compact = false }) => {
  const [insights, setInsights] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(patientId);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [confidenceFilter, setConfidenceFilter] = useState(0.6);

  useEffect(() => {
    if (!patientId) {
      fetchPatients();
    } else {
      fetchInsights(patientId);
    }
  }, [patientId]);

  useEffect(() => {
    if (selectedPatient && !patientId) {
      fetchInsights(selectedPatient);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await api.getPatients();
      setPatients(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchInsights = async (pId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.client.get(`/ai/patient-insights/${pId}/`);
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (insightType) => {
    if (!selectedPatient && !patientId) {
      alert('Please select a patient');
      return;
    }

    const pId = patientId || selectedPatient;
    try {
      setLoading(true);
      let response;

      switch (insightType) {
        case 'risk':
          response = await api.client.post(`/ai/analyze-scores/`, {
            patient_id: pId
          });
          break;
        case 'report':
          response = await api.client.post(`/ai/generate-report/`, {
            patient_id: pId
          });
          break;
        case 'treatment':
          response = await api.client.post(`/ai/treatment-plan/`, {
            patient_id: pId
          });
          break;
        default:
          return;
      }

      setInsights(prev => ({
        ...prev,
        [insightType]: response.data
      }));
    } catch (err) {
      console.error(`Error generating ${insightType} insight:`, err);
      setError(`Failed to generate ${insightType} insight`);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (!confidence) return '#718096';
    if (confidence >= 0.9) return '#22c55e';
    if (confidence >= 0.75) return '#f59e0b';
    if (confidence >= 0.6) return '#3b82f6';
    return '#ef4444';
  };

  const getConfidenceLevel = (confidence) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.6) return 'Moderate';
    return 'Low';
  };

  const renderRiskFactors = () => {
    if (!insights?.risk_analysis) return null;

    const factors = insights.risk_analysis.risk_factors || [];
    const filtered = factors.filter(f => f.confidence >= confidenceFilter);

    return (
      <div className="risk-factors-section">
        <div className="section-header">
          <h3>Risk Factors</h3>
          <div className="confidence-slider">
            <label>Confidence Threshold:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
            />
            <span>{Math.round(confidenceFilter * 100)}%</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="no-data">No risk factors above selected threshold</p>
        ) : (
          <div className="risk-grid">
            {filtered.map((factor, idx) => (
              <div key={idx} className="risk-card">
                <div className="risk-header">
                  <span className="risk-name">{factor.name}</span>
                  <span
                    className="confidence-badge"
                    style={{ color: getConfidenceColor(factor.confidence) }}
                  >
                    {Math.round(factor.confidence * 100)}%
                  </span>
                </div>
                <p className="risk-description">{factor.description}</p>
                <div className="risk-details">
                  {factor.category && (
                    <span className="risk-category">{factor.category}</span>
                  )}
                  {factor.severity && (
                    <span className={`risk-severity ${factor.severity.toLowerCase()}`}>
                      {factor.severity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderScoresAnalysis = () => {
    if (!insights?.risk_analysis?.score_analysis) return null;

    const scores = insights.risk_analysis.score_analysis;

    return (
      <div className="scores-section">
        <h3>Score Analysis</h3>
        <div className="scores-grid">
          {Object.entries(scores).map(([key, value]) => (
            <div key={key} className="score-item">
              <span className="score-label">{key}</span>
              <span className="score-value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!insights?.risk_analysis?.recommendations) return null;

    const recommendations = Array.isArray(insights.risk_analysis.recommendations)
      ? insights.risk_analysis.recommendations
      : [];

    return (
      <div className="recommendations-section">
        <h3>Recommendations</h3>
        {recommendations.length === 0 ? (
          <p className="no-data">No recommendations available</p>
        ) : (
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-item">
                <span className="rec-icon">💡</span>
                <div className="rec-content">
                  <p className="rec-text">{rec}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderClinicalReport = () => {
    if (!insights?.report) return null;

    const report = insights.report;

    return (
      <div className="clinical-report">
        {report.summary && (
          <div className="report-section">
            <h4>Summary</h4>
            <p>{report.summary}</p>
          </div>
        )}

        {report.clinical_findings && (
          <div className="report-section">
            <h4>Clinical Findings</h4>
            <div className="findings-list">
              {Array.isArray(report.clinical_findings) ? (
                report.clinical_findings.map((finding, idx) => (
                  <div key={idx} className="finding-item">
                    <span className="finding-icon">📊</span>
                    <span>{finding}</span>
                  </div>
                ))
              ) : (
                <p>{report.clinical_findings}</p>
              )}
            </div>
          </div>
        )}

        {report.assessment && (
          <div className="report-section">
            <h4>Assessment</h4>
            <p>{report.assessment}</p>
          </div>
        )}

        {report.important_notes && (
          <div className="report-section important">
            <h4>⚠️ Important Notes</h4>
            <p>{report.important_notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderTreatmentPlan = () => {
    if (!insights?.treatment_plan) return null;

    const plan = insights.treatment_plan;

    return (
      <div className="treatment-plan">
        {plan.overview && (
          <div className="plan-section">
            <h4>Treatment Overview</h4>
            <p>{plan.overview}</p>
          </div>
        )}

        {plan.interventions && (
          <div className="plan-section">
            <h4>Recommended Interventions</h4>
            <div className="interventions-list">
              {Array.isArray(plan.interventions) ? (
                plan.interventions.map((intervention, idx) => (
                  <div key={idx} className="intervention-item">
                    <span className="intervention-priority">{idx + 1}</span>
                    <div className="intervention-content">
                      <p className="intervention-name">{intervention.name}</p>
                      <small className="intervention-details">{intervention.details}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p>{plan.interventions}</p>
              )}
            </div>
          </div>
        )}

        {plan.monitoring && (
          <div className="plan-section">
            <h4>Monitoring Parameters</h4>
            <div className="monitoring-list">
              {Array.isArray(plan.monitoring) ? (
                plan.monitoring.map((param, idx) => (
                  <div key={idx} className="monitoring-item">
                    <span className="monitor-name">{param}</span>
                  </div>
                ))
              ) : (
                <p>{plan.monitoring}</p>
              )}
            </div>
          </div>
        )}

        {plan.followup && (
          <div className="plan-section">
            <h4>Follow-up</h4>
            <p>{plan.followup}</p>
          </div>
        )}
      </div>
    );
  };

  if (compact && !patientId) {
    return (
      <div className="ai-insights-panel compact">
        <div className="panel-header">
          <h3>🤖 AI Insights</h3>
          <button className="help-icon" title="AI-generated clinical insights">?</button>
        </div>
        <div className="compact-content">
          <p className="placeholder">Select a patient to view AI insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-insights-panel full">
      {/* Header */}
      <div className="panel-header">
        <h2>🤖 AI Clinical Insights</h2>
      </div>

      {/* Patient Selector (if not fixed) */}
      {!patientId && (
        <div className="patient-selector">
          <label>Select Patient:</label>
          <select value={selectedPatient || ''} onChange={(e) => setSelectedPatient(e.target.value)}>
            <option value="">-- Choose a patient --</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="error-alert">{error}</div>}

      {loading && <div className="loading">Generating AI insights...</div>}

      {selectedPatient || patientId ? (
        <>
          {/* Tab Navigation */}
          <div className="insights-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
              onClick={() => setActiveTab('risk')}
            >
              Risk Analysis
            </button>
            <button
              className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              Clinical Report
            </button>
            <button
              className={`tab-btn ${activeTab === 'treatment' ? 'active' : ''}`}
              onClick={() => setActiveTab('treatment')}
            >
              Treatment Plan
            </button>
          </div>

          {/* Tab Content */}
          <div className="insights-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="action-buttons">
                  <button
                    className="generate-btn"
                    onClick={() => generateInsight('risk')}
                    disabled={loading}
                  >
                    Analyze Risk Factors
                  </button>
                  <button
                    className="generate-btn"
                    onClick={() => generateInsight('report')}
                    disabled={loading}
                  >
                    Generate Report
                  </button>
                  <button
                    className="generate-btn"
                    onClick={() => generateInsight('treatment')}
                    disabled={loading}
                  >
                    Create Treatment Plan
                  </button>
                </div>

                {insights && (
                  <div className="overview-content">
                    <div className="insight-card">
                      <h4>AI Model Information</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Provider:</span>
                          <span className="info-value">{insights.provider || 'Claude AI'}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Last Updated:</span>
                          <span className="info-value">{new Date(insights.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Data Points Analyzed:</span>
                          <span className="info-value">{insights.data_points_analyzed || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'risk' && (
              <div className="risk-tab">
                {insights?.risk_analysis ? (
                  <>
                    {renderRiskFactors()}
                    {renderScoresAnalysis()}
                    {renderRecommendations()}
                  </>
                ) : (
                  <div className="empty-message">
                    Click "Analyze Risk Factors" to generate risk analysis
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && (
              <div className="report-tab">
                {insights?.report ? (
                  renderClinicalReport()
                ) : (
                  <div className="empty-message">
                    Click "Generate Report" to create a clinical report
                  </div>
                )}
              </div>
            )}

            {activeTab === 'treatment' && (
              <div className="treatment-tab">
                {insights?.treatment_plan ? (
                  renderTreatmentPlan()
                ) : (
                  <div className="empty-message">
                    Click "Create Treatment Plan" to generate a treatment plan
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>Select a patient to view AI clinical insights</p>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;
