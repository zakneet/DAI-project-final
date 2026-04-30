import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import anesthesiaBg from '../../assets/anesthesia_login_bg.png';
import './Auth.css';

const ICONS = {
  doctor: "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z",
  patient: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  nurse: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z",
  monitor: "M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z",
  email: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  lock: "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  eyeOff: "M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  badge: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  key: "M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z",
  briefcase: "M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
};

const Icon = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d={d} />
  </svg>
);

const Signup = () => {
  const [role, setRole] = useState('DOCTOR'); // 'DOCTOR', 'PATIENT', 'IADE', 'SSPI'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    specialty: '',
    license_number: '',
    password: '',
    registration_key: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Clés d'inscription pour IADE et SSPI
  const validationKeys = {
    IADE: 'IADE2025KEY',
    SSPI: 'SSPI2025KEY'
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation de la clé d'inscription pour IADE et SSPI
    if ((role === 'IADE' || role === 'SSPI') && formData.registration_key !== validationKeys[role]) {
      setError(`Clé d'inscription invalide pour le rôle ${role}.`);
      setLoading(false);
      return;
    }

    const submissionData = {
      ...formData,
      username: formData.email,
      role: role
    };

    const res = await register(submissionData);
    if (res.success) {
      navigate('/login');
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, text: 'Faible' };
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 1) return { score: 1, text: 'Faible' };
    if (score === 2) return { score: 2, text: 'Moyen' };
    if (score === 3) return { score: 3, text: 'Bon' };
    return { score: 4, text: 'Fort' };
  };

  const strength = getPasswordStrength(formData.password);
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.');

  return (
    <div className="auth-page animate-fade-in">
      {/* 🏥 Left Side: Hero Image Panel */}
      <div className="auth-side-image">
        <img src={anesthesiaBg} alt="Anesthesia Monitoring" className="auth-image-bg" />
        <div className="auth-side-overlay" />
        
        <div className="auth-side-content">
          <div className="auth-side-logo-container">
            <div className="auth-side-logo">DAI</div>
            <div className="auth-hds-badge">
              <Icon d={ICONS.shield} size={16} />
              HDS Certifié
            </div>
          </div>

          <div className="auth-side-stats">
            <div className="auth-stat-card">
              <div className="auth-stat-value">2 min</div>
              <div className="auth-stat-desc">
                C'est le temps moyen pour créer votre compte et sécuriser vos dossiers anesthésiques avec l'IA clinique.
              </div>
            </div>
          </div>

          <div className="auth-side-footer-text">
            "La précision technologique au service de la sécurité anesthésique hospitalière."
          </div>
        </div>
      </div>

      {/* 📝 Right Side: Form Panel */}
      <div className="auth-form-container">
        {/* 🏠 Re-init/Home Button */}
        <button className="auth-back-btn" onClick={() => navigate('/')} title="Retour à l'accueil">
          ← Retour
        </button>

        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <h1>Créez votre compte</h1>
            <p>Rejoignez DAI et digitalisez vos dossiers anesthésiques.</p>
          </div>

          <div className="role-toggle">
            <button type="button" className={`role-btn ${role === 'DOCTOR' ? 'active' : ''}`} onClick={() => setRole('DOCTOR')}>
              <Icon d={ICONS.doctor} size={22} />
              Médecin
            </button>
            <button type="button" className={`role-btn ${role === 'PATIENT' ? 'active' : ''}`} onClick={() => setRole('PATIENT')}>
              <Icon d={ICONS.patient} size={22} />
              Patient
            </button>
            <button type="button" className={`role-btn ${role === 'IADE' ? 'active' : ''}`} onClick={() => setRole('IADE')}>
              <Icon d={ICONS.nurse} size={22} />
              IADE
            </button>
            <button type="button" className={`role-btn ${role === 'SSPI' ? 'active' : ''}`} onClick={() => setRole('SSPI')}>
              <Icon d={ICONS.monitor} size={22} />
              SSPI
            </button>
          </div>

          {error && (
            <div className="auth-error">
              <Icon d={ICONS.shield} size={20} color="#dc2626" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Prénom</label>
                <div className="input-icon-wrapper">
                  <Icon d={ICONS.user} size={20} />
                  <input
                    type="text"
                    name="first_name"
                    className="form-input"
                    placeholder="Jean"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nom</label>
                <div className="input-icon-wrapper">
                  <Icon d={ICONS.user} size={20} />
                  <input
                    type="text"
                    name="last_name"
                    className="form-input"
                    placeholder="Dupont"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Adresse e-mail</label>
              <div className="input-icon-wrapper">
                <Icon d={ICONS.email} size={20} />
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder={role === 'DOCTOR' ? 'docteur@hopital.org' : role === 'PATIENT' ? 'patient@email.com' : 'iade@hopital.org'}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {isEmailValid && <Icon d={ICONS.check} size={20} color="#10b981" />}
              </div>
            </div>

            {(role === 'IADE' || role === 'SSPI') && (
              <div className="form-group">
                <label>Clé d'inscription ({role})</label>
                <div className="input-icon-wrapper">
                  <Icon d={ICONS.key} size={20} />
                  <input
                    type="password"
                    name="registration_key"
                    className="form-input"
                    placeholder="Clé fournie par l'admin"
                    value={formData.registration_key}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {role === 'DOCTOR' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Spécialité</label>
                  <div className="input-icon-wrapper">
                    <Icon d={ICONS.briefcase} size={20} />
                    <input
                      type="text"
                      name="specialty"
                      className="form-input"
                      placeholder="Anesthésie"
                      value={formData.specialty}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Numéro RPPS</label>
                  <div className="input-icon-wrapper">
                    <Icon d={ICONS.badge} size={20} />
                    <input
                      type="text"
                      name="license_number"
                      className="form-input"
                      placeholder="80000..."
                      value={formData.license_number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {(role === 'IADE' || role === 'SSPI') && (
              <div className="form-group">
                <label>Numéro de badge</label>
                <div className="input-icon-wrapper">
                  <Icon d={ICONS.badge} size={20} />
                  <input
                    type="text"
                    name="license_number"
                    className="form-input"
                    placeholder={role === 'IADE' ? 'IADE-00000' : 'SSPI-00000'}
                    value={formData.license_number}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Mot de passe</label>
              <div className="input-icon-wrapper password-input-wrapper">
                <Icon d={ICONS.lock} size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input"
                  placeholder="Min. 8 caractères"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon d={showPassword ? ICONS.eyeOff : ICONS.eye} size={20} />
                </button>
              </div>
              <div className={`password-strength-container strength-${strength.score}`}>
                <div className="password-strength-bar">
                  <div className="password-strength-fill"></div>
                </div>
                <span className="password-strength-text">{formData.password ? strength.text : ''}</span>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>

            <p className="terms-text">
              En vous inscrivant, vous acceptez nos <strong>Conditions d'utilisation</strong> et notre <strong>Politique de confidentialité</strong>.
            </p>
          </form>

          <div className="auth-footer">
            Vous avez déjà un compte ? <Link to="/login" className="auth-link">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
