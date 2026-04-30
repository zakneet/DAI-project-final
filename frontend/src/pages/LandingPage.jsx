import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ─── Icons SVG inline ─── */
const Icon = ({ d, size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  brain: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.16z",
  clipboard: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  lock: "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  cloud: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
  chart: "M18 20V10M12 20V4M6 20v-6",
  robot: "M12 8V4H8M4 8h16M2 12h20M6 16h.01M10 16h.01M14 16h.01M18 16h.01M8 20h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4z",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  check: "M20 6L9 17l-5-5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  warning: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  network: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  database: "M12 2C6.48 2 2 4.24 2 7s4.48 5 10 5 10-2.24 10-5-4.48-5-10-5zM2 12c0 2.76 4.48 5 10 5s10-2.24 10-5M2 17c0 2.76 4.48 5 10 5s10-2.24 10-5",
  play: "M5 3l14 9-14 9V3z",
  x: "M18 6L6 18M6 6l12 12",
};

/* ─── Animated Counter ─── */
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const animate = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Glow Card (Effet style Linear) ─── */
function GlowCard({ children, className = "" }) {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };
  return (
    <div className={`lp-glow-card ${className}`} onMouseMove={handleMouseMove}>
      <div className="lp-glow-border" />
      <div className="lp-glow-bg" />
      <div className="lp-glow-content">{children}</div>
    </div>
  );
}

/* ─── Typewriter ─── */
function Typewriter({ words, speed = 80, pause = 1800 }) {
  const [displayed, setDisplayed] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx];
    let timeout;
    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx(i => i + 1), speed);
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(i => i - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
    }
    setDisplayed(word.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return <>{displayed}<span className="lp-cursor">|</span></>;
}

/* ─── BackToTop ─── */
function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return show ? (
    <button className="lp-back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Retour en haut">
      ↑
    </button>
  ) : null;
}

/* ─── Main Component ─── */
const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('lp-visible');
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.lp-animate').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const problems = [
    { icon: 'file', title: 'Gestion manuelle', desc: 'Saisie papier source d\'erreurs et de risques cliniques évitables.' },
    { icon: 'network', title: 'Manque de traçabilité', desc: 'Données fragmentées entre services, dossiers introuvables.' },
    { icon: 'clock', title: 'Inefficacité administrative', desc: 'Heures perdues à recopier, rechercher, valider.' },
    { icon: 'settings', title: 'Aucune aide décisionnelle', desc: 'Le médecin reste seul face à la complexité du patient.' },
    { icon: 'database', title: 'Information dispersée', desc: 'Bloc, SSPI, étage : chacun son outil, son tableur.' },
  ];

  const features = [
    { icon: 'robot', title: 'Automatisation IA', desc: 'Décisions cliniques assistées par modèles entraînés.', color: '#2563eb' },
    { icon: 'chart', title: 'Analytics temps réel', desc: 'Tableaux de bord dynamiques et personnalisables.', color: '#10b981' },
    { icon: 'bell', title: 'Alertes intelligentes', desc: 'Détection précoce des anomalies et événements critiques.', color: '#2563eb' },
    { icon: 'phone', title: 'Interface mobile', desc: 'Accès sécurisé depuis n\'importe quel appareil.', color: '#10b981' },
    { icon: 'shield', title: 'Sécurité maximale', desc: 'Conforme RGPD, HDS et normes hospitalières.', color: '#2563eb' },
    { icon: 'cloud', title: 'Cloud hospitalier', desc: 'Disponibilité 99,9% — infrastructure certifiée.', color: '#10b981' },
  ];

  const phases = [
    {
      num: '01', label: 'Pré-opératoire', icon: 'clipboard', color: '#2563eb',
      items: ['Questionnaire patient numérique', 'Calcul auto des scores ASA, RCRI, Apfel', 'Évaluation prédictive du risque', 'Plan d\'anesthésie proposé']
    },
    {
      num: '02', label: 'Per-opératoire', icon: 'heart', color: '#10b981',
      items: ['Dashboard temps réel du bloc', 'Monitoring continu des constantes', 'Enregistrement auto des actes', 'Alertes intelligentes & médicaments']
    },
    {
      num: '03', label: 'Post-opératoire', icon: 'activity', color: '#6366f1',
      items: ['Suivi en SSPI', 'Score d\'Aldrete automatisé', 'Rapport anesthésique généré', 'Documentation médicale complète']
    }
  ];

  const solution = [
    { icon: 'robot', title: 'Automatisation', color: '#2563eb', items: ['Collecte de données auto', 'Calcul des scores en continu', 'Génération de docs auto'] },
    { icon: 'brain', title: 'Intelligence', color: '#10b981', items: ['Prédiction des risques', 'Recommandations IA', 'Aide à la décision clinique'] },
    { icon: 'lock', title: 'Sécurité', color: '#2563eb', items: ['Conformité RGPD & HDS', 'Chiffrement bout-à-bout', 'Audit complet & traçabilité'] },
  ];

  const stats = [
    { value: 23, suffix: '%', label: 'des événements indésirables liés à un défaut d\'info péri-opératoire', color: '#ef4444' },
    { value: 40, suffix: '%', label: 'de temps perdu en tâches administratives évitables', color: '#2563eb' },
    { value: 99, suffix: '.9%', label: 'de disponibilité garantie sur notre infrastructure cloud', color: '#10b981' },
  ];

  const testimonials = [
    { name: 'Dr. Sarah Mansouri', role: 'Anesthésiste-Réanimatrice, CHU Montpellier', avatar: 'SM', color: '#2563eb', quote: 'DAI a transformé notre bloc opératoire. La traçabilité en temps réel et les alertes intelligentes ont réduit nos incidents de 30%. Un outil indispensable.' },
    { name: 'Dr. Karim Benali', role: 'Médecin Anesthésiste, Clinique du Parc Lyon', avatar: 'KB', color: '#10b981', quote: 'Le questionnaire pré-opératoire numérique nous économise 45 minutes par patient. L\'IA de prédiction des risques est impressionnante de précision.' },
    { name: 'Amira Chouikh', role: 'IADE, Hôpital Lariboisière Paris', avatar: 'AC', color: '#6366f1', quote: 'Interface intuitive, alertes claires. Je peux me concentrer sur le patient au lieu de la paperasse. C\'est exactement ce dont nous avions besoin au bloc.' },
  ];

  const partners = [
    { name: 'CHU Montpellier', abbr: 'CHU' },
    { name: 'AP-HP Paris', abbr: 'AP-HP' },
    { name: 'HCL Lyon', abbr: 'HCL' },
    { name: 'SFAR', abbr: 'SFAR' },
    { name: 'Ministère Santé', abbr: 'MS' },
    { name: 'HDS Cloud', abbr: 'HDS' },
  ];

  const faqs = [
    { q: "L'IA remplace-t-elle le médecin anesthésiste ?", a: "Non, absolument pas. DAI est un copilote clinique. L'IA analyse les données en arrière-plan pour mettre en évidence les risques et proposer des recommandations, mais la décision finale et la validation reviennent toujours au médecin." },
    { q: "Est-ce que DAI s'intègre avec le DPI (Dossier Patient Informatisé) de notre hôpital ?", a: "Oui. DAI est conçu avec une architecture API-first et supporte les standards HL7 et FHIR pour se connecter nativement à la majorité des DPI (Orbis, DxCare, Easily, etc.) et aux moniteurs biomédicaux du bloc." },
    { q: "Où sont hébergées les données des patients ?", a: "Toutes les données sont hébergées en France sur des serveurs certifiés HDS (Hébergeur de Données de Santé). Elles sont chiffrées de bout en bout et strictement conformes au RGPD." },
    { q: "Combien de temps faut-il pour déployer DAI dans un service ?", a: "Le déploiement standard prend entre 4 et 8 semaines, incluant l'intégration au SIH, la configuration des protocoles spécifiques de votre service, et la formation des équipes." },
  ];

  const [openFaq, setOpenFaq] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="lp-root">
      {/* ── Demo Modal ── */}
      {showDemo && (
        <div className="lp-modal-overlay" onClick={() => setShowDemo(false)}>
          <div className="lp-modal-content" onClick={e => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setShowDemo(false)}>
              <Icon d={ICONS.x} size={24} color="#fff" />
            </button>
            <div className="lp-video-placeholder">
              <Icon d={ICONS.play} size={64} color="rgba(255,255,255,0.8)" />
              <h3>Vidéo de démonstration en cours de préparation...</h3>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-text">DAI</span>
          </div>
          <div className="lp-nav-links">
            <a href="#probleme">Le Problème</a>
            <a href="#solution">La Solution</a>
            <a href="#phases">Parcours</a>
            <a href="#features">Fonctionnalités</a>
          </div>
          <div className="lp-nav-cta">
            <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Se connecter</button>
            <button className="lp-btn-primary" onClick={() => navigate('/signup')}>Découvrir →</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-orb lp-orb1" />
          <div className="lp-hero-orb lp-orb2" />
          <div className="lp-hero-grid" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            <span>HealthTech · Anesthésie augmentée</span>
          </div>
          <h1 className="lp-hero-title">
            Dossier<br />
            d'Anesthésie<br />
            <span className="lp-accent">
              <Typewriter words={['Intelligent', 'Sécurisé', 'Connecté', 'Avancé']} />
            </span>
          </h1>
          <p className="lp-hero-sub">
            Révolutionner la gestion anesthésique hospitalière —<br />
            avant, pendant et après l'opération.
          </p>
          <div className="lp-hero-actions">
            <div className="lp-hero-btns">
              <button className="lp-btn-hero" onClick={() => navigate('/login')}>
                Découvrir la plateforme
                <Icon d={ICONS.arrowRight} size={18} color="#1e3a5f" />
              </button>
              <button className="lp-btn-hero-outline" onClick={() => setShowDemo(true)}>
                <Icon d={ICONS.play} size={18} color="#fff" />
                Voir la démo
              </button>
            </div>
            <div className="lp-trust-row">
              <div className="lp-trust-badge">
                <Icon d={ICONS.shield} size={16} color="#10b981" />
                <span>RGPD · HDS Certifié</span>
              </div>
              <div className="lp-trust-sep" />
              <div className="lp-trust-badge">
                <Icon d={ICONS.brain} size={16} color="#60a5fa" />
                <span>IA Clinique</span>
              </div>
              <div className="lp-trust-sep" />
              <div className="lp-trust-badge">
                <Icon d={ICONS.lock} size={16} color="#a78bfa" />
                <span>Données chiffrées</span>
              </div>
            </div>
          </div>

          {/* ── Dashboard Mockup ── */}
          <div className="lp-hero-mockup-container lp-animate">
            <div className="lp-hero-mockup-glow" />
            <img src="/dashboard_mockup.png" alt="Aperçu du Dashboard DAI" className="lp-hero-mockup-img" />
          </div>

        </div>
        {/* Scroll indicator */}
        <div className="lp-scroll-indicator">
          <div className="lp-scroll-mouse">
            <div className="lp-scroll-wheel" />
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── Problème ── */}
      <section id="probleme" className="lp-section lp-section-light">
        <div className="lp-container">
          <div className="lp-animate lp-problem-header">
            <div className="lp-tag lp-tag-red">✕ LE PROBLÈME</div>
            <div className="lp-problem-title-row">
              <div>
                <h2 className="lp-section-title">
                  Avant <span style={{ color: '#2563eb' }}>DAI</span> :<br />
                  les défis de l'anesthésie
                </h2>
              </div>
              <div className="lp-stat-big">
                <span className="lp-stat-num" style={{ color: '#ef4444' }}>
                  <Counter end={23} suffix="%" />
                </span>
                <span className="lp-stat-desc">d'événements indésirables liés à un défaut d'information péri-opératoire*</span>
              </div>
            </div>
          </div>
          <div className="lp-problems-grid lp-animate">
            {problems.map((p, i) => (
              <GlowCard key={i} className="lp-problem-card">
                <div className="lp-problem-icon">
                  <Icon d={ICONS[p.icon]} size={20} color="#dc2626" />
                </div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </GlowCard>
            ))}
            <GlowCard className="lp-problem-card lp-problem-card-red">
              <span className="lp-stat-num-sm">+40%</span>
              <h4>Surcharge administrative</h4>
              <p>Temps médical perdu en tâches évitables.</p>
            </GlowCard>
          </div>
          <p className="lp-source">*Source : SFAR — Rapport sécurité péri-opératoire</p>
        </div>
      </section>

      {/* ── Solution ── */}
      <section id="solution" className="lp-section lp-section-gradient">
        <div className="lp-container">
          <div className="lp-animate lp-center">
            <div className="lp-tag lp-tag-blue">✦ LA SOLUTION</div>
            <h2 className="lp-section-title lp-center-title">
              <span style={{ color: '#2563eb' }}>DAI</span> : une plateforme<br />
              intégrée et intelligente
            </h2>
            <p className="lp-section-sub">Automatisation complète + Intelligence clinique + Sécurité hospitalière</p>
          </div>
          <div className="lp-solution-grid lp-animate">
            {solution.map((s, i) => (
              <GlowCard key={i} className={`lp-solution-card ${i === 1 ? 'lp-solution-card-featured' : ''}`}>
                <div className="lp-solution-icon" style={{ background: `${s.color}15` }}>
                  <Icon d={ICONS[s.icon]} size={24} color={s.color} />
                </div>
                <h3>{s.title}</h3>
                <ul>
                  {s.items.map((item, j) => (
                    <li key={j}>
                      <Icon d={ICONS.check} size={16} color={s.color} />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 Phases ── */}
      <section id="phases" className="lp-section lp-section-light">
        <div className="lp-container">
          <div className="lp-animate lp-phase-header">
            <div className="lp-tag">PARCOURS PATIENT</div>
            <h2 className="lp-section-title">
              Les <span style={{ color: '#2563eb' }}>3 phases</span> couvertes par DAI
            </h2>
            <p className="lp-section-sub">Une expérience continue, du premier rendez-vous au retour en chambre.</p>
          </div>
          <div className="lp-phase-timeline lp-animate">
            <div className="lp-phase-line">
              <div className="lp-phase-line-fill" />
            </div>
            {phases.map((p, i) => (
              <div key={i} className="lp-phase-icon-wrap" style={{ '--phase-color': p.color }}>
                <div className="lp-phase-icon" style={{ background: p.color }}>
                  <Icon d={ICONS[p.icon]} size={24} color="#fff" />
                </div>
              </div>
            ))}
          </div>
          <div className="lp-phases-grid lp-animate">
            {phases.map((p, i) => (
              <div key={i} className="lp-phase-card">
                <div className="lp-phase-num">PHASE {p.num}</div>
                <h3 style={{ color: p.color }}>{p.label}</h3>
                <ul>
                  {p.items.map((item, j) => (
                    <li key={j}>
                      <span className="lp-dot" style={{ background: p.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="lp-section lp-section-gradient">
        <div className="lp-container">
          <div className="lp-animate">
            <div className="lp-tag">FONCTIONNALITÉS</div>
            <h2 className="lp-section-title">
              Tout ce qu'un service<br />
              d'anesthésie <span style={{ color: '#2563eb' }}>attend vraiment</span>.
            </h2>
          </div>
          <div className="lp-features-grid lp-animate">
            {features.map((f, i) => (
              <GlowCard key={i} className="lp-feature-card" style={{ '--accent': f.color }}>
                <div className="lp-feature-icon" style={{ background: `${f.color}15` }}>
                  <Icon d={ICONS[f.icon]} size={22} color={f.color} />
                </div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container lp-animate">
          <h2 className="lp-section-title" style={{ color: '#fff', textAlign: 'center' }}>
            Les chiffres qui <span style={{ color: '#10b981' }}>parlent</span>
          </h2>
          <div className="lp-stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="lp-stat-card">
                <span className="lp-stat-value" style={{ color: s.color }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </span>
                <p className="lp-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="lp-section lp-section-light">
        <div className="lp-container lp-animate">
          <div className="lp-tag lp-tag-blue">UTILISATEURS</div>
          <h2 className="lp-section-title">Conçu pour chaque acteur du bloc</h2>
          <div className="lp-roles-grid lp-animate">
            {[
              { icon: 'activity', role: 'Médecin Anesthésiste', color: '#2563eb', desc: 'Consultation, planification, supervision clinique et aide à la décision IA.' },
              { icon: 'heart', role: 'IADE', color: '#10b981', desc: 'Monitoring per-opératoire, gestion des constantes en temps réel, alertes.' },
              { icon: 'bell', role: 'SSPI', color: '#6366f1', desc: 'Suivi post-opératoire, score d\'Aldrete, gestion de la récupération.' },
              { icon: 'clipboard', role: 'Patient', color: '#f59e0b', desc: 'Questionnaire numérique, suivi de son parcours de soins sécurisé.' }
            ].map((r, i) => (
              <GlowCard key={i} className="lp-role-card" style={{ '--role-color': r.color }}>
                <div className="lp-role-icon" style={{ background: r.color }}>
                  <Icon d={ICONS[r.icon]} size={24} color="#fff" />
                </div>
                <h4>{r.role}</h4>
                <p>{r.desc}</p>
                <a href="#demo" className="lp-role-cta" style={{ color: r.color }}>Accéder →</a>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignages ── */}
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <div className="lp-animate lp-center">
            <div className="lp-tag lp-tag-blue">💬 TÉMOIGNAGES</div>
            <h2 className="lp-section-title">Ce que disent les <span style={{color:'#2563eb'}}>professionnels</span></h2>
            <p className="lp-section-sub">Des équipes hospitalières qui font confiance à DAI au quotidien.</p>
          </div>
          <div className="lp-testimonials-grid lp-animate">
            {testimonials.map((t, i) => (
              <GlowCard key={i} className="lp-testimonial-card">
                <div className="lp-testimonial-quote">“{t.quote}”</div>
                <div className="lp-testimonial-author">
                  <div className="lp-avatar" style={{background: t.color}}>{t.avatar}</div>
                  <div>
                    <div className="lp-author-name">{t.name}</div>
                    <div className="lp-author-role">{t.role}</div>
                  </div>
                </div>
                <div className="lp-stars">★★★★★</div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partenaires ── */}
      <section className="lp-section lp-section-gradient" style={{paddingTop:'60px', paddingBottom:'60px'}}>
        <div className="lp-container">
          <div className="lp-animate lp-center">
            <p className="lp-partners-label">Ils nous font confiance</p>
          </div>
          <div className="lp-marquee-container lp-animate">
            <div className="lp-marquee-track">
              {/* Double le tableau pour le loop infini */}
              {[...partners, ...partners, ...partners].map((p, i) => (
                <div key={i} className="lp-partner-card">
                  <span className="lp-partner-abbr">{p.abbr}</span>
                  <span className="lp-partner-name">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-section lp-section-light">
        <div className="lp-container">
          <div className="lp-animate lp-center">
            <div className="lp-tag lp-tag-blue">❓ FAQ</div>
            <h2 className="lp-section-title">Questions <span style={{color:'#2563eb'}}>Fréquentes</span></h2>
            <p className="lp-section-sub">Tout ce que vous devez savoir avant de déployer DAI.</p>
          </div>
          <div className="lp-faq-container lp-animate">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className={`lp-faq-item ${openFaq === i ? 'lp-faq-open' : ''}`}
                onClick={() => toggleFaq(i)}
              >
                <div className="lp-faq-q">
                  {faq.q}
                  <span className="lp-faq-icon">{openFaq === i ? '−' : '+'}</span>
                </div>
                <div className="lp-faq-a">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-orb1" />
        <div className="lp-cta-orb2" />
        <div className="lp-container lp-cta-content lp-animate">
          <h2>Prêt à moderniser votre bloc opératoire ?</h2>
          <p>Rejoignez les centres hospitaliers qui font confiance à DAI pour leur gestion anesthésique.</p>
          <div className="lp-cta-actions">
            <button className="lp-btn-cta-primary" onClick={() => navigate('/signup')}>
              Commencer maintenant →
            </button>
            <button className="lp-btn-cta-ghost" onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
          <div className="lp-cta-trust">
            <span><Icon d={ICONS.shield} size={14} color="rgba(255,255,255,0.6)" /> RGPD Conforme</span>
            <span><Icon d={ICONS.lock} size={14} color="rgba(255,255,255,0.6)" /> HDS Certifié</span>
            <span><Icon d={ICONS.zap} size={14} color="rgba(255,255,255,0.6)" /> IA Clinique</span>
            <span><Icon d={ICONS.cloud} size={14} color="rgba(255,255,255,0.6)" /> Cloud Sécurisé</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo">DAI</span>
            <p>Dossier d'Anesthésie Intelligent — La plateforme de référence pour la gestion anesthésique hospitalière.</p>
          </div>
          <div className="lp-footer-links">
            <div>
              <h5>Plateforme</h5>
              <a href="#solution">La Solution</a>
              <a href="#phases">Parcours Patient</a>
              <a href="#features">Fonctionnalités</a>
            </div>
            <div>
              <h5>Conformité</h5>
              <a href="#">RGPD</a>
              <a href="#">HDS</a>
              <a href="#">Mentions légales</a>
            </div>
            <div>
              <h5>Accès</h5>
              <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Connexion</a>
              <a onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>Inscription</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 DAI Platform · Mission Critical Health Solutions</span>
          <span>Fait avec ♥ pour les équipes soignantes</span>
        </div>
      </footer>

      <BackToTop />
    </div>
  );
};

export default LandingPage;
