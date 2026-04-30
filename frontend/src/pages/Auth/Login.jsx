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
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  card: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",
  microsoft: "M2 2h9v9H2zM13 2h9v9h-9zM2 13h9v9H2zM13 13h9v9h-9z"
};

const Icon = ({ d, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d={d} />
  </svg>
);

const Login = () => {
  const [role, setRole] = useState('DOCTOR'); // 'DOCTOR', 'PATIENT', 'IADE', 'SSPI'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCPSModal, setShowCPSModal] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const isEmailValid = email.includes('@') && email.includes('.');

  const getRoleName = (r) => {
    switch(r) {
      case 'DOCTOR': return 'Médecin';
      case 'PATIENT': return 'Patient';
      case 'IADE': return 'IADE';
      case 'SSPI': return 'SSPI';
      default: return r;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // In this app, email is used as username for login as well
    const res = await login(email, password);
    if (res.success) {
      if (res.role !== role) {
        logout();
        const roleName = getRoleName(res.role);
        const expectedName = getRoleName(role);
        setError(`Accès ${expectedName} refusé : Ce compte est enregistré en tant que ${roleName}. Veuillez utiliser le bouton approprié.`);
      } else {
        switch(res.role) {
          case 'DOCTOR': navigate('/doctor-dashboard'); break;
          case 'PATIENT': navigate('/patient-dashboard'); break;
          case 'IADE': navigate('/iade-dashboard'); break;
          case 'SSPI': navigate('/sspi-dashboard'); break;
          default: navigate('/');
        }
      }
    } else {
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page animate-fade-in">
      {/* 💳 CPS Modal Overlay */}
      {showCPSModal && (
        <div className="cps-modal-overlay" onClick={() => setShowCPSModal(false)}>
          <div className="cps-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cps-reader-icon">
              <div className="cps-reader-base"></div>
              <div className="cps-reader-card"></div>
            </div>
            <h3 className="cps-modal-title">Lecture de la Carte CPS</h3>
            <p className="cps-modal-desc">
              Veuillez insérer votre Carte de Professionnel de Santé dans le lecteur connecté pour vous authentifier.
            </p>
            <button className="cps-modal-btn" onClick={() => setShowCPSModal(false)}>
              Annuler
            </button>
          </div>
        </div>
      )}

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
              <div className="auth-stat-value">-30%</div>
              <div className="auth-stat-desc">
                Réduction des événements indésirables grâce au monitoring intelligent et à la traçabilité.
              </div>
            </div>
          </div>

          <div className="auth-side-footer-text">
            "La précision technologique au service de la sécurité anesthésique hospitalière."
          </div>
        </div>
      </div>

      {/* 📝 Right Side: Login Form Panel */}
      <div className="auth-form-container">
        {/* 🏠 Re-init/Home Button */}
        <button className="auth-back-btn" onClick={() => navigate('/')} title="Retour à l'accueil">
          ← Retour
        </button>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Bienvenue</h1>
            <p>Connectez-vous à votre plateforme sécurisée.</p>
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
            <div className="form-group">
              <label>Adresse e-mail</label>
              <div className="input-icon-wrapper">
                <Icon d={ICONS.email} size={20} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="nom@hopital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {isEmailValid && <Icon d={ICONS.check} size={20} color="#10b981" className="input-icon-check" />}
              </div>
            </div>

            <div className="form-group">
              <label>Mot de passe</label>
              <div className="input-icon-wrapper password-input-wrapper">
                <Icon d={ICONS.lock} size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="auth-actions">
              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? 'Connexion en cours...' : 'Se connecter'}
                {!loading && <Icon d={ICONS.arrowRight} size={20} color="#fff" />}
              </button>
              
              <div className="auth-separator">Ou</div>

              <button type="button" className="btn-auth-sso" onClick={() => alert("Redirection vers Pro Santé Connect...")}>
                <Icon d={ICONS.microsoft} size={18} color="#1e3a5f" />
                Connexion via Pro Santé Connect
              </button>

              <button type="button" className="btn-auth-cps" onClick={() => setShowCPSModal(true)}>
                <Icon d={ICONS.card} size={20} color="#2563eb" />
                Se connecter avec Carte CPS
              </button>
            </div>
          </form>

          <div className="auth-footer">
            Vous n'avez pas de compte ? <Link to="/signup" className="auth-link">S'inscrire</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
