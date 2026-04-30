import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import './Dashboard.css'; // Uses existing classes + some inline/new if needed

const DMEPanel = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dmeData, setDmeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // history, allergies, diagnoses, prescriptions
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.getPatients();
      setPatients(res.data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDME = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    setShowForm(false);
    try {
      const res = await api.getDMEPatient(patient.id);
      setDmeData(res.data);
    } catch (err) {
      console.error('Error fetching DME:', err);
      setDmeData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitForm = async () => {
    if (!dmeData) return;
    try {
      const payload = {
        ...formData,
        medical_record: dmeData.id
      };

      if (activeTab === 'history') await api.postDMEHistory(payload);
      if (activeTab === 'allergies') await api.postDMEAllergy(payload);
      if (activeTab === 'diagnoses') await api.postDMEDiagnosis(payload);
      if (activeTab === 'prescriptions') await api.postDMEPrescription(payload);

      // Reload
      await loadPatientDME(selectedPatient);
      setShowForm(false);
      setFormData({});
    } catch (err) {
      console.error('Error saving DME entry:', err);
      alert('Erreur lors de la sauvegarde');
    }
  };

  if (loading && !patients.length) {
    return <div className="dashboard-loading"><div className="loader"></div></div>;
  }

  return (
    <div className="dme-container" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', height: '100%' }}>
      {/* ─── Liste des patients (Gauche) ─── */}
      <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: '#f8fbff' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Patients (DPI)</h2>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {patients.map(p => (
            <div 
              key={p.id} 
              onClick={() => loadPatientDME(p)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                background: selectedPatient?.id === p.id ? 'rgba(91,141,239,0.08)' : 'transparent',
                borderLeft: selectedPatient?.id === p.id ? '4px solid var(--accent-primary)' : '4px solid transparent',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {p.full_name || `${p.first_name} ${p.last_name}`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Né(e) le: {p.birth_date} • {p.gender}
              </div>
              {p.id_card_number && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  CIN: {p.id_card_number}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Détails du DPI (Droite) ─── */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {!selectedPatient ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Sélectionnez un patient pour voir son Dossier Patient Informatisé
          </div>
        ) : loading ? (
          <div className="dashboard-loading"><div className="loader"></div></div>
        ) : !dmeData ? (
          <div style={{ padding: '24px' }}>Erreur de chargement du DPI</div>
        ) : (
          <>
            {/* Header Patient */}
            <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f8fbff 0%, #ffffff 100%)', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                DPI - {selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}
              </h2>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span><strong>Âge:</strong> {selectedPatient.age} ans</span>
                <span><strong>GS:</strong> <span className="badge badge-emerald">{selectedPatient.blood_type || dmeData.blood_group || 'Inconnu'}</span></span>
                <span><strong>Taille:</strong> {dmeData.height ? `${dmeData.height} cm` : '--'}</span>
                <span><strong>Poids:</strong> {dmeData.weight ? `${dmeData.weight} kg` : '--'}</span>
                <span><strong>Tel:</strong> {selectedPatient.phone || '--'}</span>
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#fff' }}>
              {[
                { id: 'history', label: `Antécédents (${dmeData.history_items?.length || 0})` },
                { id: 'allergies', label: `Allergies (${dmeData.allergies?.length || 0})` },
                { id: 'diagnoses', label: `Diagnostics (${dmeData.diagnoses?.length || 0})` },
                { id: 'prescriptions', label: `Traitements (${dmeData.prescriptions?.length || 0})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                  style={{
                    flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu de l'onglet */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                  {activeTab === 'history' && 'Antécédents Médicaux'}
                  {activeTab === 'allergies' && 'Allergies & Intolérances'}
                  {activeTab === 'diagnoses' && 'Diagnostics Actifs'}
                  {activeTab === 'prescriptions' && 'Traitements en Cours'}
                </h3>
                <button 
                  className="btn-primary btn-sm"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? 'Annuler' : '+ Ajouter'}
                </button>
              </div>

              {showForm && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  
                  {activeTab === 'history' && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <select className="form-input" onChange={e => handleFormChange('type', e.target.value)}>
                        <option value="">Sélectionner le type...</option>
                        <option value="CARDIAC">Cardiaque</option>
                        <option value="PULMONARY">Pulmonaire</option>
                        <option value="METABOLIC">Métabolique</option>
                        <option value="SURGICAL">Chirurgical</option>
                        <option value="OTHER">Autre</option>
                      </select>
                      <textarea className="form-input" placeholder="Description de l'antécédent" onChange={e => handleFormChange('description', e.target.value)}></textarea>
                    </div>
                  )}

                  {activeTab === 'allergies' && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <input className="form-input" type="text" placeholder="Allergène (ex: Pénicilline)" onChange={e => handleFormChange('allergen', e.target.value)} />
                      <select className="form-input" onChange={e => handleFormChange('severity', e.target.value)}>
                        <option value="">Sévérité...</option>
                        <option value="MILD">Légère</option>
                        <option value="MODERATE">Modérée</option>
                        <option value="SEVERE">Sévère</option>
                        <option value="LIFE_THREATENING">Menaçante pour la vie</option>
                      </select>
                      <textarea className="form-input" placeholder="Réaction" onChange={e => handleFormChange('reaction', e.target.value)}></textarea>
                    </div>
                  )}

                  {activeTab === 'diagnoses' && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <input className="form-input" type="text" placeholder="Code (ex: I10 HTA)" onChange={e => handleFormChange('icd10_code', e.target.value)} />
                      <textarea className="form-input" placeholder="Description du diagnostic" onChange={e => handleFormChange('description', e.target.value)}></textarea>
                    </div>
                  )}

                  {activeTab === 'prescriptions' && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <input className="form-input" type="text" placeholder="Médicament" onChange={e => handleFormChange('medication_name', e.target.value)} />
                      <input className="form-input" type="text" placeholder="Dosage (ex: 50mg)" onChange={e => handleFormChange('dosage', e.target.value)} />
                      <select className="form-input" onChange={e => handleFormChange('route', e.target.value)}>
                        <option value="PO">Per os (Oral)</option>
                        <option value="IV">Intraveineuse</option>
                        <option value="IM">Intramusculaire</option>
                      </select>
                      <input className="form-input" type="datetime-local" onChange={e => handleFormChange('start_date', e.target.value)} />
                    </div>
                  )}

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={submitForm}>Enregistrer</button>
                  </div>
                </div>
              )}

              {/* Listes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeTab === 'history' && (dmeData.history_items?.length > 0 ? dmeData.history_items.map(item => (
                  <div key={item.id} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.type}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                  </div>
                )) : <div style={{ color: 'var(--text-muted)' }}>Aucun antécédent</div>)}

                {activeTab === 'allergies' && (dmeData.allergies?.length > 0 ? dmeData.allergies.map(item => (
                  <div key={item.id} style={{ background: 'rgba(239,68,68,0.05)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>{item.allergen} — {item.severity}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.reaction}</div>
                  </div>
                )) : <div style={{ color: 'var(--text-muted)' }}>Aucune allergie</div>)}

                {activeTab === 'diagnoses' && (dmeData.diagnoses?.length > 0 ? dmeData.diagnoses.map(item => (
                  <div key={item.id} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>[{item.icd10_code}]</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.description}</div>
                  </div>
                )) : <div style={{ color: 'var(--text-muted)' }}>Aucun diagnostic</div>)}

                {activeTab === 'prescriptions' && (dmeData.prescriptions?.length > 0 ? dmeData.prescriptions.map(item => (
                  <div key={item.id} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.medication_name} — {item.dosage} ({item.route})</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Début: {new Date(item.start_date).toLocaleDateString()}</div>
                  </div>
                )) : <div style={{ color: 'var(--text-muted)' }}>Aucun traitement</div>)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DMEPanel;
