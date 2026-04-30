import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import '../Dashboard/PatientDashboard.css';

const SECTION_LABELS = {
  identity_context: { fr: 'Identité & Contexte', ar: 'الهوية والسياق' },
  medical_history: { fr: 'Antécédents Médicaux', ar: 'التاريخ الطبي' },
  dialysis: { fr: 'Dialyse', ar: 'غسيل الكلى' },
  treatment: { fr: 'Traitements', ar: 'الأدوية' },
  surgical_history: { fr: 'Chirurgie', ar: 'الجراحة' },
  anesthesia_history: { fr: 'Anesthésie', ar: 'التخدير' },
  hospitalization_history: { fr: 'Hospitalisation', ar: 'الإقامة بالمستشفى' },
  allergies: { fr: 'Allergies', ar: 'الحساسية' },
  habits: { fr: 'Habitudes', ar: 'العادات' },
  bleeding_risk: { fr: 'Risque Hémorragique', ar: 'خطر النزيف' },
  family_history: { fr: 'Famille', ar: 'التاريخ العائلي' },
  functional_capacity: { fr: 'Capacité Physique', ar: 'القدرة البدنية' },
  sleep_apnea: { fr: 'Apnée du Sommeil', ar: 'انقطاع التنفس' },
  cardio_symptoms: { fr: 'Cœur & Rythme', ar: 'القلب والنبض' },
  airway_spine: { fr: 'Voies Aériennes', ar: 'التنفس والظهر' },
  duke_activity: { fr: 'Activité (Duke)', ar: 'النشاط البدني' },
  ponv: { fr: 'Nausées (PONV)', ar: 'الغثيان' },
  nyha: { fr: 'Symptômes NYHA', ar: 'الأعراض' },
  vascular: { fr: 'Artériopathie', ar: 'أمراض الأوعية' },
  respiratory: { fr: 'Respiratoire', ar: 'الجهاز التنفسي' },
  women: { fr: 'Femmes', ar: 'النساء' },
  children: { fr: 'Pédiatrie', ar: 'الأطفال' },
  patient_satisfaction: { fr: 'Satisfaction', ar: 'الرضا' },
};

const PatientQuestionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('loading'); // loading | no_case | form | submitted
  const [lang, setLang] = useState('fr');
  const [anesthesiaCase, setAnesthesiaCase] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [scores, setScores] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [computing, setComputing] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initQuestionnaire();
    // eslint-disable-next-line
  }, []);

  const initQuestionnaire = async () => {
    setStep('loading');
    try {
      let patientId = user?.patient_id;
      
      // Sécurité : si role=PATIENT mais pas d'ID, on tente un refresh du profil
      if (!patientId && user?.role === 'PATIENT') {
        console.log("Patient ID manquant, tentative de récupération du profil...");
        const me = await api.getMe();
        patientId = me.data.patient_id;
      }

      if (!patientId) {
        setStep('no_case');
        return;
      }

      const casesRes = await api.getCasesByPatient(patientId);
      const cases = casesRes.data;
      if (!cases || cases.length === 0) {
        setStep('no_case');
        return;
      }

      const activeCase = cases.find(c => c.status === 'PRE_OP') || cases[0];
      setAnesthesiaCase(activeCase);

      const qsRes = await api.getQuestionnaires();
      const existing = qsRes.data.find(q => q.anesthesia_case === activeCase.id);

      let qId;
      if (existing) {
        qId = existing.id;
        if (existing.validation_status === 'SUBMITTED' || existing.validation_status === 'VALIDATED') {
          const scoresRes = await api.getScores();
          setScores(scoresRes.data.filter(s => s.anesthesia_case === activeCase.id));
          setQuestionnaire(existing);
          setStep('submitted');
          return;
        }
      } else {
        const newQ = await api.createQuestionnaire({
          anesthesia_case: activeCase.id,
          language: lang,
        });
        qId = newQ.data.id;
      }

      const formRes = await api.getQuestionnaireForm(qId);
      const { questionnaire: q, questions: qs, responses: existingResponses } = formRes.data;

      const responseMap = {};
      existingResponses.forEach(r => { responseMap[r.question_code] = r.answer_value; });

      setQuestionnaire(q);
      setQuestions(qs);
      setResponses(responseMap);
      setActiveSection(qs[0]?.section || null);
      setStep('form');
    } catch (err) {
      console.error('Erreur initialisation questionnaire', err);
      setError('Erreur lors du chargement du dossier. Assurez-vous d\'être connecté en tant que patient.');
      setStep('no_case');
    }
  };

  const handleCreateTestCase = async () => {
    setStep('loading');
    setError(null);
    try {
      let patientId = user?.patient_id;

      // Un peu plus robuste si l'ID est manquant
      if (!patientId) {
        const me = await api.getMe();
        patientId = me.data.patient_id;
      }
      
      if (!patientId) {
        throw new Error("Votre profil patient n'est pas encore initialisé. Veuillez contacter le support ou vous reconnecter.");
      }

      await api.createCase({
        patient: patientId,
        surgery_type: "Chirurgie Test (Générale)",
        status: "PRE_OP",
      });
      
      initQuestionnaire();
    } catch (err) {
      setError("Impossible de créer un dossier de test : " + err.message);
      setStep('no_case');
    }
  };

  const handleChange = (code, value) => {
    setResponses(prev => ({ ...prev, [code]: value }));
  };

  const handleSave = async (code, value) => {
    if (!value && value !== false) return;
    try {
      await api.createResponse({
        questionnaire: questionnaire.id,
        question_code: code,
        answer_value: value.toString(),
      });
    } catch {
      // ignore unique_together errors
    }
  };

  const handleSubmit = async () => {
    setComputing(true);
    try {
      const res = await api.computeScores(questionnaire.id);
      setScores(res.data.scores);
      setAlerts(res.data.alerts);
      await api.updateQuestionnaire(questionnaire.id, { validation_status: 'SUBMITTED' });
      setStep('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur soumission', err);
    } finally {
      setComputing(false);
    }
  };

  const sections = [...new Set(questions.map(q => q.section))];
  const currentSectionIndex = sections.indexOf(activeSection);
  const isLastSection = currentSectionIndex === sections.length - 1;

  // ── Render Helpers ──

  const renderProgress = () => (
    <div className="pq-stepper">
      {sections.map((sec, i) => {
        const isCurrent = sec === activeSection;
        const isPast = i < currentSectionIndex;
        return (
          <div 
            key={sec} 
            className={`pq-step ${isCurrent ? 'active' : ''} ${isPast ? 'past' : ''}`}
            onClick={() => setActiveSection(sec)}
            title={SECTION_LABELS[sec]?.[lang] || sec}
          >
            <div className="pq-step-dot">{isPast ? '✓' : i + 1}</div>
          </div>
        );
      })}
    </div>
  );

  if (step === 'loading') {
    return (
      <div className="pd-wrapper animate-fade-in">
        <div className="pd-container pq-center">
          <div className="pd-spinner" />
          <p className="pq-loading-text">{lang === 'fr' ? 'Chargement de votre dossier...' : 'جاري تحميل ملفك...'}</p>
        </div>
      </div>
    );
  }

  if (step === 'no_case') {
    return (
      <div className="pd-wrapper animate-fade-in">
        <div className="pd-container pq-narrow">
          <div className="pd-panel pq-empty-state">
            <span className="pq-icon-large">⏳</span>
            <h3>{lang === 'fr' ? 'Aucun dossier disponible' : 'لا يوجد ملف متاح'}</h3>
            <p>{error || (lang === 'fr' ? "Votre médecin n'a pas encore créé votre dossier pré-opératoire." : "طبيبك لم يقم بإنشاء ملفك التحضيري بعد.")}</p>
            <div className="pq-actions-vertical">
              <button className="pd-btn-primary" onClick={handleCreateTestCase}>
                {lang === 'fr' ? 'Créer un dossier de test (Dev)' : 'إنشاء ملف تجريبي (تطوير)'}
              </button>
              <button className="pd-btn-secondary" onClick={() => navigate('/patient-dashboard')}>
                {lang === 'fr' ? '← Tableau de bord' : '← لوحة التحكم'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'submitted') {
    return (
      <div className="pd-wrapper animate-fade-in">
        <div className="pd-container pq-narrow">
          <header className="pq-header">
            <h2>{lang === 'fr' ? 'Résultats du Questionnaire' : 'نتائج الاستبيان'}</h2>
          </header>

          <div className="pd-panel pq-results-card">
            <div className="pq-success-banner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              <div>
                <p><strong>{lang === 'fr' ? 'Questionnaire envoyé' : 'تم إرسال الاستبيان'}</strong></p>
                <p>{lang === 'fr' ? 'Vos réponses sont prêtes pour l\'anesthésiste.' : 'إجاباتك جاهزة لطبيب التخدير.'}</p>
              </div>
            </div>

            {scores.length > 0 && (
              <div className="pq-scores-list">
                <h4>{lang === 'fr' ? 'SCALES CLINIQUES' : 'المقاييس السريرية'}</h4>
                <div className="pq-grid">
                  {scores.map((s, i) => (
                    <div key={i} className="pq-score-item">
                      <span className="pq-score-label">{s.score_type}</span>
                      <span className="pq-score-val">{s.score_value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {alerts.length > 0 && (
              <div className="pq-alerts-list">
                <h4>{lang === 'fr' ? 'POINTS D\'ATTENTION' : 'نقاط الاهتمام'}</h4>
                {alerts.map((a, i) => (
                  <div key={i} className={`pq-alert-box ${a.severity ? a.severity.toLowerCase() : ''}`}>
                    <strong>{a.type}</strong>: {a.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="pd-btn-secondary pq-mt-20" onClick={() => navigate('/patient-dashboard')}>
            ← {lang === 'fr' ? 'Retour au tableau de bord' : 'العودة للوحة التحكم'}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: form ──
  const sectionQuestions = questions.filter(q => q.section === activeSection);

  return (
    <div className={`pd-wrapper animate-fade-in ${lang === 'ar' ? 'rtl' : ''}`}>
      <div className="pd-container pq-wide">
        
        <header className="pq-header-main">
          <div className="pq-title-group">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              {lang === 'fr' ? 'Questionnaire Pré-anesthésique' : 'استبيان ما قبل التخدير'}
            </h2>
            {anesthesiaCase && (
              <span className="pq-subtitle">
                {(!anesthesiaCase.surgery_type || anesthesiaCase.surgery_type === 'UNKNOWN') ? <em>Non renseignée</em> : anesthesiaCase.surgery_type.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase())} · {anesthesiaCase.patient_full_name}
              </span>
            )}
          </div>
          <div className="pq-lang-toggle">
            <button className={lang === 'fr' ? 'active' : ''} onClick={() => setLang('fr')}>FR</button>
            <button className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>AR</button>
          </div>
        </header>

        {renderProgress()}

        <main className="pq-main-layout">
          <aside className="pq-side-nav">
             {sections.map((sec, i) => (
               <button 
                 key={sec} 
                 className={`pq-nav-btn ${activeSection === sec ? 'active' : ''}`}
                 onClick={() => setActiveSection(sec)}
               >
                 <span className="pq-nav-num">{i + 1}</span>
                 {SECTION_LABELS[sec]?.[lang] || sec}
               </button>
             ))}
          </aside>

          <section className="pd-panel pq-form-panel">
            <h3 className="pq-section-title">
              {SECTION_LABELS[activeSection]?.[lang] || activeSection?.replace(/_/g, ' ')}
            </h3>

            <div className="pq-questions-list">
              {sectionQuestions.map(q => (
                <div key={q.id} className="pq-q-group">
                  <label className="pq-label">
                    {lang === 'fr' ? q.label_fr : (q.label_ar || q.label_fr)}
                    {q.is_required && <span className="pq-required">*</span>}
                  </label>

                  {q.answer_type === 'BOOLEAN' && (
                    <div className="pq-toggle-group">
                      <button
                        className={`pq-toggle-btn pink ${responses[q.question_code] === 'true' ? 'selected' : ''}`}
                        onClick={() => { handleChange(q.question_code, 'true'); handleSave(q.question_code, 'true'); }}
                      >
                        {lang === 'fr' ? 'Oui' : 'نعم'}
                      </button>
                      <button
                        className={`pq-toggle-btn gray ${responses[q.question_code] === 'false' ? 'selected' : ''}`}
                        onClick={() => { handleChange(q.question_code, 'false'); handleSave(q.question_code, 'false'); }}
                      >
                        {lang === 'fr' ? 'Non' : 'لا'}
                      </button>
                    </div>
                  )}

                  {q.answer_type === 'TEXT' && (
                    <input
                      type="text"
                      className="pq-text-input"
                      value={responses[q.question_code] || ''}
                      onChange={e => handleChange(q.question_code, e.target.value)}
                      onBlur={e => handleSave(q.question_code, e.target.value)}
                      placeholder="..."
                    />
                  )}

                  {q.answer_type === 'NUMBER' && (
                    <input
                      type="number"
                      className="pq-text-input"
                      value={responses[q.question_code] || ''}
                      onChange={e => handleChange(q.question_code, e.target.value)}
                      onBlur={e => handleSave(q.question_code, e.target.value)}
                      placeholder="0"
                    />
                  )}

                  {q.answer_type === 'CHOICE' && (
                    <div className="pq-choice-group">
                      {(q.choices || []).map(choice => (
                        <button
                          key={choice.value}
                          className={`pq-choice-btn ${responses[q.question_code] === choice.value ? 'selected' : ''}`}
                          onClick={() => { handleChange(q.question_code, choice.value); handleSave(q.question_code, choice.value); }}
                        >
                          {lang === 'fr' ? choice.label_fr : choice.label_ar}
                        </button>
                      ))}
                      {(!q.choices || q.choices.length === 0) && (
                        <select
                          className="pq-select"
                          value={responses[q.question_code] || ''}
                          onChange={e => { handleChange(q.question_code, e.target.value); handleSave(q.question_code, e.target.value); }}
                        >
                          <option value="">{lang === 'fr' ? 'Sélectionner...' : 'اختر...'}</option>
                          <option value="I">I</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                          <option value="IV">IV</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <footer className="pq-form-footer">
              <button
                className="pq-btn-back"
                disabled={currentSectionIndex === 0}
                onClick={() => setActiveSection(sections[currentSectionIndex - 1])}
              >
                {lang === 'fr' ? '← Précédent' : '← السابق'}
              </button>

              <div style={{ display: 'flex', gap: '16px', flex: 1, justifyContent: 'flex-end', marginLeft: '16px' }}>
                {!isLastSection && (
                  <button className="pq-btn-next" onClick={() => {
                    setActiveSection(sections[currentSectionIndex + 1]);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>
                    {lang === 'fr' ? 'Suivant →' : 'التالي →'}
                  </button>
                )}
                <button 
                  className="pq-btn-submit" 
                  onClick={handleSubmit} 
                  disabled={computing}
                  style={{ flex: isLastSection ? 1 : 'none', minWidth: '220px', margin: 0 }}
                >
                  {computing 
                    ? (lang === 'fr' ? 'Calcul...' : 'جاري الحساب...') 
                    : (lang === 'fr' ? '✓ Soumettre & Calculer' : '✓ إرسال وحساب النتائج')}
                </button>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PatientQuestionnaire;
