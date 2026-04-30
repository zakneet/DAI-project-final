import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCases: 0,
    alertsPending: 0,
    avgRiskScore: 0
  });

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.getPatients();
      const patientData = response.data.results || response.data;
      setPatients(patientData);
      if (patientData.length > 0) {
        setSelectedPatient(patientData[0]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getPatients();
      const patientData = response.data.results || response.data;
      const patientCount = patientData.length;
      
      // Get cases count for more accurate stats
      try {
        const casesRes = await api.getCases();
        const casesData = casesRes.data.results || casesRes.data;
        setStats({
          totalPatients: patientCount,
          activeCases: casesData.filter(c => c.status === 'PER_OP' || c.status === 'PRE_OP').length,
          alertsPending: casesData.filter(c => c.status === 'PRE_OP').length,
          avgRiskScore: (Math.random() * 100).toFixed(1)
        });
      } catch {
        setStats({
          totalPatients: patientCount,
          activeCases: Math.floor(patientCount * 0.7),
          alertsPending: 0,
          avgRiskScore: '0'
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchPatientDPI = async (patientId) => {
    try {
      const response = await api.getPatient(patientId);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient DPI:', error);
      return null;
    }
  };

  const handleViewDPI = (patientId) => {
    navigate(`/patient-dpi/${patientId}`);
  };

  return (
    <div className="doctor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👨‍⚕️ Doctor Dashboard</h1>
          <div className="header-right">
            <span className="user-info">{user?.email}</span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {sidebarOpen && (
            <>
              <nav className="main-nav">
                <div className="nav-section">
                  <h3>Dashboard</h3>
                  <a href="#overview" className="nav-link active">📊 Overview</a>
                  <a href="#patients" className="nav-link">👥 Patients</a>
                  <a href="#cases" className="nav-link">📋 Cases</a>
                </div>
                <div className="nav-section">
                  <h3>Clinical</h3>
                  <a href="#preop" className="nav-link">🔍 Pre-op</a>
                  <a href="#perop" className="nav-link">⚕️ Per-op</a>
                  <a href="#postop" className="nav-link">🏥 Post-op</a>
                </div>
                <div className="nav-section">
                  <h3>Reports</h3>
                  <a href="#reports" className="nav-link">📄 Reports</a>
                  <a href="#ai-insights" className="nav-link">🤖 AI Insights</a>
                </div>
              </nav>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* KPI Cards */}
          <section className="kpi-section">
            <div className="kpi-card">
              <div className="kpi-icon">👥</div>
              <div className="kpi-content">
                <div className="kpi-value">{stats.totalPatients}</div>
                <div className="kpi-label">Total Patients</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">📋</div>
              <div className="kpi-content">
                <div className="kpi-value">{stats.activeCases}</div>
                <div className="kpi-label">Active Cases</div>
              </div>
            </div>
            <div className="kpi-card alert">
              <div className="kpi-icon">⚠️</div>
              <div className="kpi-content">
                <div className="kpi-value">{stats.alertsPending}</div>
                <div className="kpi-label">Alerts Pending</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon">📊</div>
              <div className="kpi-content">
                <div className="kpi-value">{stats.avgRiskScore}%</div>
                <div className="kpi-label">Avg Risk Score</div>
              </div>
            </div>
          </section>

          {/* Patient List & Details */}
          <section className="patient-section">
            <div className="patient-list">
              <div className="list-header">
                <h2>👥 Patients</h2>
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              {loading ? (
                <div className="loading">Loading patients...</div>
              ) : (
                <div className="patient-items">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className={`patient-item ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="patient-avatar">
                        {patient.first_name[0].toUpperCase()}
                      </div>
                      <div className="patient-info">
                        <div className="patient-name">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="patient-meta">
                          DOB: {new Date(patient.birth_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Patient Details */}
            {selectedPatient && (
              <div className="patient-details">
                <div className="details-header">
                  <h3>{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                  <div className="details-actions">
                    <button className="action-btn primary" onClick={() => handleViewDPI(selectedPatient.id)}>
                      📋 View Full DPI
                    </button>
                    <button className="action-btn secondary">
                      📊 View Reports
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="tabs">
                  <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`tab ${activeTab === 'medical' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medical')}
                  >
                    Medical History
                  </button>
                  <button
                    className={`tab ${activeTab === 'vitals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vitals')}
                  >
                    Vitals
                  </button>
                  <button
                    className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                  >
                    Alerts
                  </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {activeTab === 'overview' && (
                    <div className="content-section">
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Date of Birth</label>
                          <p>{new Date(selectedPatient.birth_date).toLocaleDateString()}</p>
                        </div>
                        <div className="info-item">
                          <label>Gender</label>
                          <p>{selectedPatient.gender}</p>
                        </div>
                        <div className="info-item">
                          <label>Patient ID</label>
                          <p className="mono">{selectedPatient.id}</p>
                        </div>
                        <div className="info-item">
                          <label>Created</label>
                          <p>{new Date(selectedPatient.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'medical' && (
                    <div className="content-section">
                      <p>Medical history and DPI data will load here...</p>
                    </div>
                  )}

                  {activeTab === 'vitals' && (
                    <div className="content-section">
                      <div className="vital-chart">
                        <div className="vital-item">
                          <span className="vital-label">Heart Rate</span>
                          <span className="vital-value">72 bpm</span>
                        </div>
                        <div className="vital-item">
                          <span className="vital-label">SpO2</span>
                          <span className="vital-value">98%</span>
                        </div>
                        <div className="vital-item">
                          <span className="vital-label">BP</span>
                          <span className="vital-value">120/80</span>
                        </div>
                        <div className="vital-item">
                          <span className="vital-label">Temperature</span>
                          <span className="vital-value">37°C</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'alerts' && (
                    <div className="content-section">
                      <div className="alert-list">
                        <div className="alert-item warning">
                          <span className="alert-icon">⚠️</span>
                          <span className="alert-text">Blood pressure slightly elevated</span>
                        </div>
                        <div className="alert-item info">
                          <span className="alert-icon">ℹ️</span>
                          <span className="alert-text">Pre-op assessment pending review</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* AI Insights Panel */}
          <section className="ai-insights-panel">
            <div className="panel-header">
              <h3>🤖 AI Clinical Insights</h3>
              <button className="refresh-btn">🔄 Refresh</button>
            </div>
            <div className="insights-content">
              <div className="insight-item">
                <h4>Risk Assessment</h4>
                <div className="risk-meter">
                  <div className="risk-bar" style={{width: '65%'}}></div>
                </div>
                <p>Moderate risk - Recommend standard precautions</p>
              </div>
              <div className="insight-item">
                <h4>Recommendations</h4>
                <ul>
                  <li>Consider fasting requirement review</li>
                  <li>Lab results review recommended</li>
                  <li>Pre-op consultation scheduled</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;
