import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import './PatientDPI.css';

const PatientDPI = () => {
  const { patientId } = useParams();
  const [dpiData, setDpiData] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientDPI();
  }, [patientId]);

  const fetchPatientDPI = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch patient data and medical records in parallel
      const [patientRes, dpiRes] = await Promise.all([
        api.getPatient(patientId),
        api.client.get(`/dme/medical-records/patient/${patientId}/`)
      ]);
      
      setPatientData(patientRes.data);
      setDpiData(dpiRes.data);
    } catch (err) {
      console.error('Error fetching DPI:', err);
      setError('Failed to load patient DPI');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dpi-loader">Loading Patient DPI...</div>;
  }

  if (error) {
    return <div className="dpi-error">{error}</div>;
  }

  if (!dpiData) {
    return <div className="dpi-empty">No DPI data available</div>;
  }

  return (
    <div className="patient-dpi">
      <div className="dpi-header">
        <h2>📋 Patient DPI (Dossier Patient Intelligent)</h2>
        <button className="export-btn" onClick={() => alert('Export feature coming soon')}>
          📥 Export PDF
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="dpi-tabs">
        <button
          className={`dpi-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`dpi-tab ${activeTab === 'medical-history' ? 'active' : ''}`}
          onClick={() => setActiveTab('medical-history')}
        >
          Medical History
        </button>
        <button
          className={`dpi-tab ${activeTab === 'diagnoses' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagnoses')}
        >
          Diagnoses
        </button>
        <button
          className={`dpi-tab ${activeTab === 'medications' ? 'active' : ''}`}
          onClick={() => setActiveTab('medications')}
        >
          Medications
        </button>
        <button
          className={`dpi-tab ${activeTab === 'allergies' ? 'active' : ''}`}
          onClick={() => setActiveTab('allergies')}
        >
          Allergies
        </button>
        <button
          className={`dpi-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button
          className={`dpi-tab ${activeTab === 'scores' ? 'active' : ''}`}
          onClick={() => setActiveTab('scores')}
        >
          Scores
        </button>
      </div>

      {/* Tab Content */}
      <div className="dpi-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <h3>Patient Medical Summary</h3>
            <div className="overview-grid">
              <div className="overview-item">
                <label>Blood Group</label>
                <p>{dpiData.blood_group || 'Not recorded'}</p>
              </div>
              <div className="overview-item">
                <label>Height</label>
                <p>{dpiData.height ? `${dpiData.height} cm` : 'Not recorded'}</p>
              </div>
              <div className="overview-item">
                <label>Weight</label>
                <p>{dpiData.weight ? `${dpiData.weight} kg` : 'Not recorded'}</p>
              </div>
              <div className="overview-item">
                <label>BMI</label>
                <p>{dpiData.bmi ? dpiData.bmi.toFixed(1) : 'Not calculated'}</p>
              </div>
            </div>

            {dpiData.notes && (
              <div className="notes-section">
                <h4>Clinical Notes</h4>
                <p>{dpiData.notes}</p>
              </div>
            )}

            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Medical Events</span>
                <span className="stat-value">12</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Conditions</span>
                <span className="stat-value">3</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Current Medications</span>
                <span className="stat-value">5</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Known Allergies</span>
                <span className="stat-value">2</span>
              </div>
            </div>
          </div>
        )}

        {/* Medical History Tab */}
        {activeTab === 'medical-history' && (
          <div className="tab-pane">
            <h3>Medical History (Antécédents)</h3>
            {dpiData.history_items && dpiData.history_items.length > 0 ? (
              <div className="history-timeline">
                {dpiData.history_items.map((item, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-marker"></div>
                    <div className="history-content">
                      <h5>{item.condition_type}</h5>
                      <p>{item.description}</p>
                      <small>{new Date(item.date_diagnosed).toLocaleDateString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No medical history recorded</p>
            )}
          </div>
        )}

        {/* Diagnoses Tab */}
        {activeTab === 'diagnoses' && (
          <div className="tab-pane">
            <h3>Diagnoses (ICD-10)</h3>
            {dpiData.diagnoses && dpiData.diagnoses.length > 0 ? (
              <div className="diagnoses-list">
                {dpiData.diagnoses.map((diag, idx) => (
                  <div key={idx} className="diagnosis-card">
                    <div className="diagnosis-header">
                      <h5>{diag.icd10_code}</h5>
                      <span className={`severity ${diag.severity.toLowerCase()}`}>
                        {diag.severity}
                      </span>
                    </div>
                    <p>{diag.description}</p>
                    {diag.is_primary && <span className="primary-badge">Primary</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No diagnoses recorded</p>
            )}
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="tab-pane">
            <h3>Medications (Prescriptions)</h3>
            {dpiData.prescriptions && dpiData.prescriptions.length > 0 ? (
              <div className="medications-list">
                {dpiData.prescriptions.map((med, idx) => (
                  <div key={idx} className="medication-card">
                    <div className="med-header">
                      <h5>{med.drug_name}</h5>
                      <span className={`status ${med.status.toLowerCase()}`}>
                        {med.status}
                      </span>
                    </div>
                    <div className="med-details">
                      <div className="med-detail">
                        <label>Dose:</label>
                        <span>{med.dose}</span>
                      </div>
                      <div className="med-detail">
                        <label>Route:</label>
                        <span>{med.route}</span>
                      </div>
                      <div className="med-detail">
                        <label>Frequency:</label>
                        <span>{med.frequency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No medications recorded</p>
            )}
          </div>
        )}

        {/* Allergies Tab */}
        {activeTab === 'allergies' && (
          <div className="tab-pane">
            <h3>Allergies & Intolerances</h3>
            {dpiData.allergies && dpiData.allergies.length > 0 ? (
              <div className="allergies-list">
                {dpiData.allergies.map((allergy, idx) => (
                  <div key={idx} className={`allergy-card severity-${allergy.severity.toLowerCase()}`}>
                    <div className="allergy-header">
                      <h5>⚠️ {allergy.allergen}</h5>
                      <span className={`severity-badge ${allergy.severity.toLowerCase()}`}>
                        {allergy.severity}
                      </span>
                    </div>
                    <p><strong>Reaction:</strong> {allergy.reaction_description}</p>
                    <small>{allergy.is_active ? '✓ Active' : '✗ Inactive'}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No allergies recorded</p>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="tab-pane">
            <h3>Clinical Documents</h3>
            {dpiData.documents && dpiData.documents.length > 0 ? (
              <div className="documents-list">
                {dpiData.documents.map((doc, idx) => (
                  <div key={idx} className="document-item">
                    <span className="doc-icon">📄</span>
                    <div className="doc-info">
                      <h5>{doc.title}</h5>
                      <p>{doc.document_type}</p>
                      <small>{new Date(doc.upload_date).toLocaleDateString()}</small>
                    </div>
                    <button className="view-btn">View</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No documents uploaded</p>
            )}
          </div>
        )}

        {/* Scores Tab */}
        {activeTab === 'scores' && (
          <div className="tab-pane">
            <h3>Clinical Scores & Risk Assessment</h3>
            <div className="scores-grid">
              <div className="score-card">
                <h5>ASA Score</h5>
                <div className="score-value">II</div>
                <p className="score-meaning">Moderate Risk</p>
              </div>
              <div className="score-card">
                <h5>STOP-BANG</h5>
                <div className="score-value">3</div>
                <p className="score-meaning">Low Risk</p>
              </div>
              <div className="score-card">
                <h5>BMI Category</h5>
                <div className="score-value">Normal</div>
                <p className="score-meaning">18.5 - 24.9</p>
              </div>
              <div className="score-card">
                <h5>Surgical Risk</h5>
                <div className="score-value">Low</div>
                <p className="score-meaning">Overall Assessment</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDPI;
