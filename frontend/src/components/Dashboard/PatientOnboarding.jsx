import React, { useState } from 'react';
import { api } from '../../api/client';
import './PatientDashboard.css';

const PatientOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Identity (Some pre-filled if needed, though they shouldn't be here if user just signed up and only provided username/password, or maybe they did provide it during signup)
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'M',
    id_card_number: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    profession: '',
    nationality: 'Algérienne',
    blood_type: '',
    // Step 5 - Habits
    is_smoker: false,
    is_alcohol_user: false,
    physical_activity: 'NONE',
  });

  // Steps 2 to 4 data for DME
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalSteps = 6;

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const addHistory = (type, description) => {
    if (!description) return;
    setMedicalHistory(prev => [...prev, { type, description }]);
  };

  const removeHistory = (index) => {
    setMedicalHistory(prev => prev.filter((_, i) => i !== index));
  };

  const addAllergy = (allergen, severity, reaction) => {
    if (!allergen) return;
    setAllergies(prev => [...prev, { allergen, severity, reaction }]);
  };

  const removeAllergy = (index) => {
    setAllergies(prev => prev.filter((_, i) => i !== index));
  };

  const addPrescription = (medication_name, dosage, route) => {
    if (!medication_name) return;
    setPrescriptions(prev => [...prev, { medication_name, dosage, route }]);
  };

  const removePrescription = (index) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Update Patient Profile (sets onboarding_completed = True)
      await api.updateMyPatientProfile({
        ...formData,
        onboarding_completed: true
      });

      // 2. Fetch or Create my DME Record
      const dmeRes = await api.getMyDMERecord();
      const recordId = dmeRes.data.id;

      // 3. Send all DME entries
      const promises = [];
      
      medicalHistory.forEach(item => {
        promises.push(api.postDMEHistory({ ...item, medical_record: recordId }));
      });
      
      allergies.forEach(item => {
        promises.push(api.postDMEAllergy({ ...item, medical_record: recordId }));
      });
      
      prescriptions.forEach(item => {
        // start_date is required, we use now
        promises.push(api.postDMEPrescription({ 
          ...item, 
          medical_record: recordId, 
          start_date: new Date().toISOString() 
        }));
      });

      await Promise.all(promises);

      // Finish
      if (onComplete) onComplete();

    } catch (err) {
      console.error('Error during onboarding submission:', err);
      setError('Une erreur est survenue lors de l\'enregistrement de votre dossier.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="pq-stepper">
      {[1,2,3,4,5,6].map(s => (
        <div key={s} className={`pq-step ${step === s ? 'active' : ''} ${step > s ? 'past' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="pd-wrapper animate-fade-in" style={{ backgroundColor: '#fff' }}>
      <div className="pd-container pq-wide">
        
        <div className="pq-header-main" style={{ marginBottom: '20px' }}>
          <div className="pq-title-group">
            <h2>Création de votre Dossier Médical</h2>
            <p className="pq-subtitle">Veuillez compléter ces informations pour finaliser votre inscription.</p>
          </div>
        </div>

        {renderStepIndicator()}

        <div className="pq-form-panel">
          {error && <div className="error-alert">{error}</div>}

          {/* ÉTAPE 1: Identité & Contact */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h3 className="pq-section-title">1. Informations Personnelles & Confidentielles</h3>
              <div className="pq-grid">
                <div className="pq-q-group">
                  <label className="pq-label">Nom <span className="pq-required">*</span></label>
                  <input className="pq-text-input" type="text" name="last_name" value={formData.last_name} onChange={handleTextChange} />
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Prénom <span className="pq-required">*</span></label>
                  <input className="pq-text-input" type="text" name="first_name" value={formData.first_name} onChange={handleTextChange} />
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Date de naissance <span className="pq-required">*</span></label>
                  <input className="pq-text-input" type="date" name="birth_date" value={formData.birth_date} onChange={handleTextChange} />
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Sexe <span className="pq-required">*</span></label>
                  <select className="pq-select" name="gender" value={formData.gender} onChange={handleTextChange}>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Numéro de carte d'identité (CIN) <span className="pq-required">*</span></label>
                  <input className="pq-text-input" type="text" name="id_card_number" value={formData.id_card_number} onChange={handleTextChange} placeholder="Numéro officiel" />
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Téléphone <span className="pq-required">*</span></label>
                  <input className="pq-text-input" type="tel" name="phone" value={formData.phone} onChange={handleTextChange} placeholder="05..." />
                </div>
                <div className="pq-q-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="pq-label">Adresse Complète</label>
                  <input className="pq-text-input" type="text" name="address" value={formData.address} onChange={handleTextChange} placeholder="Votre adresse de résidence" />
                </div>
              </div>
              
              <h4 style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Contact en cas d'urgence</h4>
              <div className="pq-grid">
                <div className="pq-q-group">
                  <label className="pq-label">Nom du contact</label>
                  <input className="pq-text-input" type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleTextChange} />
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Téléphone du contact</label>
                  <input className="pq-text-input" type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleTextChange} />
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Lien de parenté</label>
                  <input className="pq-text-input" type="text" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleTextChange} placeholder="Ex: Conjoint, Parent..." />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2: Antécédents Médicaux */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h3 className="pq-section-title">2. Antécédents Médicaux et Chirurgicaux</h3>
              <p className="pq-subtitle" style={{ marginBottom: '20px' }}>Avez-vous des maladies chroniques ou avez-vous déjà été opéré ?</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select id="hist_type" className="pq-select" style={{ flex: 1 }}>
                  <option value="METABOLIC">Maladie Métabolique (ex: Diabète)</option>
                  <option value="CARDIAC">Maladie Cardiaque (ex: HTA)</option>
                  <option value="PULMONARY">Maladie Pulmonaire (ex: Asthme)</option>
                  <option value="SURGICAL">Opération Chirurgicale</option>
                  <option value="OTHER">Autre</option>
                </select>
                <input id="hist_desc" type="text" className="pq-text-input" style={{ flex: 2 }} placeholder="Description (ex: Diabète type 2)" />
                <button 
                  className="pd-btn-primary" 
                  style={{ width: 'auto' }}
                  onClick={() => {
                    const type = document.getElementById('hist_type').value;
                    const desc = document.getElementById('hist_desc').value;
                    addHistory(type, desc);
                    document.getElementById('hist_desc').value = '';
                  }}
                >
                  Ajouter
                </button>
              </div>

              <div className="pq-questions-list">
                {medicalHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: '#f8fbff', borderRadius: '10px' }}>
                    Aucun antécédent ajouté (Je suis en bonne santé)
                  </div>
                ) : (
                  medicalHistory.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
                      <div>
                        <strong>{item.type}</strong>: {item.description}
                      </div>
                      <button onClick={() => removeHistory(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ÉTAPE 3: Allergies */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h3 className="pq-section-title">3. Allergies et Intolérances</h3>
              <p className="pq-subtitle" style={{ marginBottom: '20px' }}>Êtes-vous allergique à des médicaments, aliments ou substances (latex, iode...) ?</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input id="alg_name" type="text" className="pq-text-input" style={{ flex: 1.5 }} placeholder="Allergène (ex: Pénicilline)" />
                <select id="alg_sev" className="pq-select" style={{ flex: 1 }}>
                  <option value="MODERATE">Modérée</option>
                  <option value="MILD">Légère</option>
                  <option value="SEVERE">Sévère</option>
                </select>
                <input id="alg_reac" type="text" className="pq-text-input" style={{ flex: 1.5 }} placeholder="Réaction (ex: Éruption cutanée)" />
                <button 
                  className="pd-btn-primary" 
                  style={{ width: 'auto' }}
                  onClick={() => {
                    const name = document.getElementById('alg_name').value;
                    const sev = document.getElementById('alg_sev').value;
                    const reac = document.getElementById('alg_reac').value;
                    addAllergy(name, sev, reac);
                    document.getElementById('alg_name').value = '';
                    document.getElementById('alg_reac').value = '';
                  }}
                >
                  Ajouter
                </button>
              </div>

              <div className="pq-questions-list">
                {allergies.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: '#f8fbff', borderRadius: '10px' }}>
                    Aucune allergie connue
                  </div>
                ) : (
                  allergies.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', borderRadius: '8px' }}>
                      <div>
                        <strong style={{ color: '#dc2626' }}>{item.allergen} ({item.severity})</strong>: {item.reaction}
                      </div>
                      <button onClick={() => removeAllergy(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ÉTAPE 4: Traitements */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h3 className="pq-section-title">4. Traitements Actuels</h3>
              <p className="pq-subtitle" style={{ marginBottom: '20px' }}>Prenez-vous des médicaments actuellement ?</p>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input id="med_name" type="text" className="pq-text-input" style={{ flex: 2 }} placeholder="Médicament" />
                <input id="med_dose" type="text" className="pq-text-input" style={{ flex: 1 }} placeholder="Dosage" />
                <select id="med_route" className="pq-select" style={{ flex: 1 }}>
                  <option value="PO">Oral (Comprimé/Sirop)</option>
                  <option value="IV">Intraveineuse</option>
                  <option value="IM">Intramusculaire</option>
                  <option value="INHAL">Inhalation</option>
                </select>
                <button 
                  className="pd-btn-primary" 
                  style={{ width: 'auto' }}
                  onClick={() => {
                    const name = document.getElementById('med_name').value;
                    const dose = document.getElementById('med_dose').value;
                    const route = document.getElementById('med_route').value;
                    addPrescription(name, dose, route);
                    document.getElementById('med_name').value = '';
                    document.getElementById('med_dose').value = '';
                  }}
                >
                  Ajouter
                </button>
              </div>

              <div className="pq-questions-list">
                {prescriptions.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', background: '#f8fbff', borderRadius: '10px' }}>
                    Aucun traitement en cours
                  </div>
                ) : (
                  prescriptions.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--panel-border)', borderRadius: '8px' }}>
                      <div>
                        <strong>{item.medication_name}</strong> - {item.dosage} ({item.route})
                      </div>
                      <button onClick={() => removePrescription(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✖</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ÉTAPE 5: Habitudes */}
          {step === 5 && (
            <div className="animate-fade-in">
              <h3 className="pq-section-title">5. Habitudes de vie & Groupe Sanguin</h3>
              
              <div className="pq-grid">
                <div className="pq-q-group">
                  <label className="pq-label">Groupe Sanguin</label>
                  <select className="pq-select" name="blood_type" value={formData.blood_type} onChange={handleTextChange}>
                    <option value="">Je ne sais pas</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="pq-q-group">
                  <label className="pq-label">Activité Physique</label>
                  <select className="pq-select" name="physical_activity" value={formData.physical_activity} onChange={handleTextChange}>
                    <option value="NONE">Sédentaire</option>
                    <option value="LIGHT">Légère</option>
                    <option value="MODERATE">Modérée</option>
                    <option value="INTENSE">Intense</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_smoker" checked={formData.is_smoker} onChange={handleCheckboxChange} style={{ width: '20px', height: '20px' }} />
                  <span className="pq-label" style={{ margin: 0 }}>Je fume (Tabac, Vapoteuse...)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_alcohol_user" checked={formData.is_alcohol_user} onChange={handleCheckboxChange} style={{ width: '20px', height: '20px' }} />
                  <span className="pq-label" style={{ margin: 0 }}>Je consomme de l'alcool régulièrement</span>
                </label>
              </div>
            </div>
          )}

          {/* ÉTAPE 6: Confirmation */}
          {step === 6 && (
            <div className="animate-fade-in pq-center" style={{ minHeight: 'auto', padding: '20px 0' }}>
              <h3 className="pq-section-title" style={{ textAlign: 'center', border: 'none' }}>6. Confirmation et Validation</h3>
              <p className="pq-subtitle" style={{ maxWidth: '600px', margin: '0 auto 20px', lineHeight: '1.6' }}>
                Je certifie sur l'honneur que les informations fournies dans ce dossier médical sont exactes et complètes. 
                Ces informations sont strictement confidentielles et ne seront accessibles qu'à l'équipe médicale du bloc opératoire.
              </p>

              <div className="signature-pad-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="signature-header">
                  <span>Signature du Patient</span>
                </div>
                <div style={{ height: '120px', background: '#fff', border: '2px dashed var(--border-color)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  [Zone de signature électronique]
                </div>
              </div>
            </div>
          )}

          {/* Boutons de navigation */}
          <div className="pq-form-footer">
            {step > 1 ? (
              <button className="pq-btn-back" onClick={() => setStep(step - 1)} disabled={loading}>
                Précédent
              </button>
            ) : <div />}

            {step < totalSteps ? (
              <button 
                className="pq-btn-next" 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.id_card_number || !formData.phone)}
              >
                Suivant
              </button>
            ) : (
              <button className="pq-btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Création en cours...' : 'Valider mon dossier médical'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientOnboarding;
