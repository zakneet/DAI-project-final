# 📋 DAI-BMAD — Dossier d'Anesthésie Intelligent
## Documentation Complète du Projet

> **Version** : 1.0 | **Statut** : Production-Ready (60% intégré) | **Stack** : Django + React/Vite

---

## 🏥 1. C'est quoi ce projet ?

**DAI-BMAD** est une application web médicale dédiée à la gestion complète du **parcours anesthésique** dans un établissement hospitalier.

Il numérise et centralise tout le suivi d'un patient qui va être opéré :
- Avant l'opération **(Pré-op)** → questionnaire clinique, scores de risque
- Pendant l'opération **(Per-op / Bloc opératoire)** → constantes en temps réel, événements
- Après l'opération **(Post-op / SSPI)** → réveil, score de sortie Aldrete

Le système intègre également :
- Un **module IA** (Claude / Gemini) pour des recommandations cliniques assistées
- Un **DPI / DME** (Dossier Patient Informatisé / Dossier Médical Électronique)
- Un **système d'alertes** cliniques
- Un **système de rapports** exportables
- Un **audit trail** complet de toutes les actions

---

## 👥 2. Les Utilisateurs & Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| **DOCTOR** | Médecin anesthésiste | Dashboard patient, DPI complet, pré-op, supervision générale |
| **IADE** | Infirmier(e) Anesthésiste DE | Monitoring per-opératoire, constantes, événements bloc |
| **SSPI** | Équipe Salle de Soins Post-Interventionnels | Réveil patient, score Aldrete, décision de sortie |
| **ADMIN** | Administrateur système | Gestion des utilisateurs, configuration, paramètres |
| **PATIENT** | Patient | Accès à ses propres données médicales |

---

## 🏗️ 3. Architecture Générale

```
DAI-BMAD
├── Backend (Django — API REST)         → http://localhost:8000
│   ├── patient          → Identité patient
│   ├── casefile         → Dossier anesthésique (pivot)
│   ├── preop            → Phase pré-opératoire
│   ├── perop            → Phase per-opératoire (bloc)
│   ├── postop           → Phase post-opératoire (SSPI)
│   ├── dme              → Dossier Médical Électronique
│   ├── ai_agent         → Intégration IA (Claude/Gemini)
│   ├── alert            → Système d'alertes
│   ├── report           → Génération de rapports
│   ├── audit            → Traçabilité des actions
│   ├── common           → Auth, rôles, permissions
│   ├── settings_app     → Configuration clinique
│   └── dai_api          → Configuration Django centrale
│
└── Frontend (React + Vite)             → http://localhost:5173
    ├── DoctorDashboard       → Tableau de bord médecin
    ├── IADEDashboard         → Monitoring bloc opératoire
    ├── SSPIDashboard         → Gestion réveil SSPI
    ├── PatientDPI            → Dossier patient complet (7 onglets)
    ├── AlertsPanel           → Panneau d'alertes
    ├── AIInsightsPanel       → Recommandations IA
    └── VitalsChart           → Graphiques des constantes
```

---

## 🗃️ 4. Modules Backend — Détail Complet

### 4.1 `patient` — Identité Patient
Gère toutes les données d'identification du patient.

**Entité principale :** `Patient`
- Nom, prénom, date de naissance, sexe
- Numéro de dossier
- Point d'entrée de tous les modules cliniques

---

### 4.2 `casefile` — Dossier Anesthésique *(Module Pivot)*
C'est **le cœur du système**. Tout tourne autour du dossier anesthésique.

**Entité principale :** `AnesthesiaCase`

**Cycle de vie du dossier :**
```
PRE_OP → PER_OP → POST_OP → CLOSED
```

**Endpoints :**
```
GET  /api/cases/              → Liste des dossiers
POST /api/cases/              → Créer un dossier
POST /api/cases/{id}/state/   → Changer l'état du dossier
```

---

### 4.3 `preop` — Phase Pré-Opératoire
Gère le questionnaire médical avant l'opération et le calcul des scores de risque clinique.

**Entités :**
- `PreOpQuestionnaire` — Le formulaire pré-op
- `QuestionTemplate` — Les modèles de questions
- `PreOpQuestionnaireResponse` — Les réponses du patient
- `ClinicalScore` — Les scores calculés

**Scores cliniques calculés automatiquement :**

| Score | Description |
|-------|-------------|
| **DUKE** | Capacité fonctionnelle cardiaque |
| **LEE** | Risque cardiaque révisé |
| **STOP-BANG** | Risque d'apnée du sommeil |
| **APFEL** | Risque de nausées post-op (PONV) |
| **GOLD** | Sévérité BPCO |
| **CHILD-PUGH** | Sévérité de l'insuffisance hépatique |
| **NYHA** | Insuffisance cardiaque fonctionnelle |
| **CHA₂DS₂-VASc** | Risque AVC en FA |
| **ARISCAT** | Complications pulmonaires post-op |
| **ALDRETE** | Score de sortie SSPI |

**Endpoints :**
```
GET  /api/preop-questionnaires/{id}/form/            → Formulaire
POST /api/preop-questionnaires/{id}/save-responses/  → Sauvegarder réponses
POST /api/preop-questionnaires/{id}/compute-scores/  → Calculer les scores
```

---

### 4.4 `perop` — Phase Per-Opératoire (Bloc)
Gère tout ce qui se passe au bloc opératoire pendant l'intervention.

**Entités :**
- `PerOpSession` — La session bloc
- `VitalSignMeasurement` — Les constantes vitales enregistrées
- `PerOpEvent` — Les événements (injection médicament, incident, etc.)
- `MedicationAdministration` — Les administrations médicamenteuses

**Constantes surveillées :**
- Fréquence cardiaque (60-100 bpm)
- SpO₂ (≥97%, critique <90%)
- Pression artérielle (110-140/70-90 mmHg)
- Température (36.5-37.5°C)
- Profondeur anesthésie BIS (40-60)
- Pression des voies aériennes (15-30 cm H₂O)

**Endpoints :**
```
POST /api/cases/{id}/perop/sessions/start/   → Démarrer session bloc
POST /api/cases/{id}/perop/sessions/end/     → Terminer session bloc
GET  /api/cases/{id}/perop/vitals/           → Lire les constantes
POST /api/cases/{id}/perop/vitals/           → Enregistrer une constante
GET  /api/cases/{id}/perop/events/           → Lire les événements
POST /api/cases/{id}/perop/events/           → Enregistrer un événement
GET  /api/cases/{id}/perop/summary/          → Résumé de la session
```

---

### 4.5 `postop` — Phase Post-Opératoire (SSPI)
Gère le réveil du patient en Salle de Soins Post-Interventionnels.

**Entités :**
- `PostOpStay` — Le séjour en SSPI
- `PostOpObservation` — Les observations infirmières

**Score de sortie Aldrete (0–10) :**

| Composante | Score |
|-----------|-------|
| Conscience | 0–2 |
| Activité motrice | 0–2 |
| Circulation | 0–2 |
| Respiration | 0–2 |
| Oxygénation (SpO₂) | 0–2 |

- **≥ 9** → Sortie autorisée
- **7–8** → Transfert en chambre
- **< 7** → Maintien en SSPI

**Endpoints :**
```
POST /api/cases/{id}/postop/stay/start/        → Débuter séjour SSPI
POST /api/cases/{id}/postop/stay/end/          → Terminer séjour
GET  /api/cases/{id}/postop/observations/      → Lire les observations
POST /api/cases/{id}/postop/observations/      → Créer une observation
GET  /api/cases/{id}/postop/scores/aldrete/    → Consulter le score Aldrete
GET  /api/cases/{id}/postop/summary/           → Résumé SSPI
```

---

### 4.6 `dme` — Dossier Médical Électronique
Gère l'ensemble des antécédents et données médicales persistantes du patient.

**Modèles (6 entités) :**

| Modèle | Description |
|--------|-------------|
| `MedicalRecord` | Dossier principal (1-1 avec Patient) |
| `MedicalHistory` | Antécédents médicaux |
| `Diagnosis` | Diagnostics avec codes CIM-10 |
| `Prescription` | Ordonnances et traitements |
| `ClinicalDocument` | Documents médicaux (fichiers / URLs) |
| `Allergie` | Allergies avec niveau de sévérité |

**Endpoints :**
```
GET    /api/dme/medical-records/                     → Liste des dossiers
POST   /api/dme/medical-records/                     → Créer un dossier
GET    /api/dme/medical-records/{id}/                → Détail d'un dossier
PATCH  /api/dme/medical-records/{id}/                → Modifier
DELETE /api/dme/medical-records/{id}/                → Supprimer
GET    /api/dme/medical-records/patient/{patient_id}/ → Dossier d'un patient
(+ endpoints similaires pour history, diagnoses, prescriptions, documents, allergies)
```

---

### 4.7 `ai_agent` — Module Intelligence Artificielle
Intègre des LLMs (Claude / Gemini) pour produire des recommandations cliniques assistées. **L'IA est uniquement consultative** — elle ne prend aucune décision critique.

**Providers supportés :**
- **Claude** (Anthropic API) — Recommandé
- **Gemini** (Google API) — Alternatif

**Pattern d'architecture :**
```python
AIProvider (classe abstraite)
├── ClaudeProvider
└── GeminiProvider
AIService.get_provider() → retourne le provider actif
```

**Fonctionnalités IA :**

| Endpoint | Retourne |
|----------|---------|
| `POST /api/ai/generate-report/` | `{summary, risk_factors, recommendations}` |
| `POST /api/ai/analyze-scores/` | `{overall_risk, critical_alerts, trends}` |
| `POST /api/ai/treatment-plan/` | `{anesthetic_considerations, monitoring_priorities}` |
| `GET  /api/ai/health/` | Statut du service IA |

**Configuration :**
```bash
# Claude
export CLAUDE_API_KEY="sk-ant-..."

# Gemini
export GOOGLE_API_KEY="AIza..."
```

---

### 4.8 `audit` — Traçabilité
Enregistre automatiquement toutes les actions critiques du système.

**Entité :** `AuditLog`

**Actions tracées :**
- `CREATE` — Création d'un dossier
- `STATE_TRANSITION` — Changement d'état (PRE_OP → PER_OP etc.)
- `COMPUTE_SCORES` — Calcul de scores
- `SAVE_RESPONSES` — Sauvegarde de réponses
- `START_PEROP_SESSION` — Démarrage du bloc
- `CREATE_VITAL_MEASUREMENT` — Enregistrement d'une constante
- `CREATE_PEROP_EVENT` — Événement per-op
- `START_POSTOP_STAY` — Début séjour SSPI
- `CREATE_POSTOP_OBSERVATION` — Observation infirmière

---

### 4.9 `alert` — Alertes Cliniques *(en cours)*
Détecte les anomalies et gère le cycle de vie des alertes.

**États d'une alerte :**
- `ACTIVE` → Alerte déclenchée
- `ACKNOWLEDGED` → Prise en compte par le personnel
- `RESOLVED` → Résolue

**Niveaux de sévérité :**
- 🔴 **Critical** — Action immédiate requise
- 🟡 **Warning** — Attention nécessaire
- ℹ️ **Info** — Information

---

### 4.10 `report` — Rapports *(scaffolding prêt)*
Génère les synthèses et exports médicaux.
- Rapport PDF de synthèse anesthésique
- Export du DPI patient
- Rapport d'audit trail
- Templates personnalisables

---

### 4.11 `settings_app` — Paramètres Cliniques *(scaffolding prêt)*
Configure les seuils et protocoles.
- Seuils vitaux (FC, SpO₂, PA)
- Configuration des alertes
- Protocoles par service / établissement

---

### 4.12 `common` — Auth & Permissions
Gère l'authentification et le contrôle d'accès basé sur les rôles (RBAC).

**Système de permissions (15+ classes) :**

```python
# Rôle unique
IsDoctor()
IsIADE()
IsSSPI()
IsAdmin()
IsPatient()

# Combinés
IsDoctorOrAdmin()
IsDoctorOrIADE()
IsDoctorOrIADEOrSSPI()
IsClinicalStaff()
IsPerOpStaff()      # DOCTOR + IADE
IsPostOpStaff()     # DOCTOR + SSPI

# Niveau objet
IsOwnPatient()      # Le patient ne voit que ses propres données
```

**Chaîne de vérification :**
```
Requête → IsAuthenticated? → IsClinicalStaff? → IsDoctor/IADE/SSPI? → IsOwnPatient? → ✅
```

---

## 🖥️ 5. Frontend — Interfaces Utilisateur

### 5.1 DoctorDashboard — Tableau de Bord Médecin
**Route :** `/doctor-dashboard` (rôle DOCTOR requis)

**Fonctionnalités :**
- Liste des patients avec recherche et filtres
- KPI cards : Cas du jour, Pré-ops en attente, Alertes de risque
- Modal détail patient
- Accès rapide au DPI complet
- Navigation vers `/patient-dpi/{patientId}`

---

### 5.2 PatientDPI — Dossier Patient Complet
**Route :** `/patient-dpi/:patientId` (rôle DOCTOR requis)

**Interface à 7 onglets :**

| Onglet | Contenu |
|--------|---------|
| **Overview** | Données démographiques patient |
| **History** | Antécédents médicaux (timeline) |
| **Pre-op** | Questionnaire et réponses pré-op |
| **Per-op** | Données du bloc opératoire |
| **Post-op** | Données du séjour SSPI |
| **Scores** | Tous les scores cliniques calculés |
| **Documents** | Fichiers médicaux avec téléchargement |

---

### 5.3 IADEDashboard — Monitoring Bloc Opératoire
**Route :** `/iade-dashboard` (rôle IADE requis)

**Fonctionnalités :**
- Liste des sessions actives au bloc
- Monitoring temps réel des 6 constantes vitales
- Système de saisie d'événements (6 types)
- Timeline des événements (color-codée)
- File d'attente patients pré-op
- Gestion session (transfert, fin)

---

### 5.4 SSPIDashboard — Gestion Réveil Post-op
**Route :** `/sspi-dashboard` (rôle SSPI requis)

**Fonctionnalités :**
- File de réveil avec suivi des phases
- Calculateur de score Aldrete (0–10)
- Scoring sur 5 composantes cliniques
- Workflow de sortie avec documentation
- Tracker de progression de réveil
- Affichage des observations cliniques

---

### 5.5 AlertsPanel — Alertes en Temps Réel
**Composant réutilisable** intégrable dans n'importe quel dashboard.

**Fonctionnalités :**
- Filtrage par sévérité (Critical / Warning / Info)
- Détails dépliables
- Actions : Acquitter, Escalader, Voir Patient
- Vue compacte (5 alertes) ou complète
- Auto-dismiss

---

### 5.6 AIInsightsPanel — Recommandations IA
**Interface à 4 onglets :**

| Onglet | Contenu |
|--------|---------|
| **Overview** | Modèle IA actif, données analysées |
| **Risk Analysis** | Facteurs de risque + scores de confiance |
| **Clinical Report** | Rapport, findings, assessment |
| **Treatment Plan** | Interventions, monitoring, suivi |

---

### 5.7 VitalsChart — Graphiques des Constantes
**Types de graphiques :**
- Multi-View (toutes constantes)
- Fréquence cardiaque (area chart)
- Pression artérielle (systolique/diastolique)
- SpO₂ (tendance)

**Plages temporelles :** 1H | 4H | 24H

---

## 🔄 6. Flux Métier Complet

```
1. DOCTOR crée un dossier anesthésique (casefile)
          ↓
2. DOCTOR remplit le questionnaire pré-op + calcul des scores
          ↓
3. Transition du dossier : PRE_OP → PER_OP
          ↓
4. IADE démarre la session bloc
   ├── Enregistre les constantes vitales en continu
   └── Log les événements (médications, incidents...)
          ↓
5. IADE termine la session bloc
          ↓
6. Transition du dossier : PER_OP → POST_OP
          ↓
7. SSPI démarre le séjour en SSPI
   ├── Enregistre les observations de réveil
   └── Calcule le score Aldrete régulièrement
          ↓
8. Score Aldrete ≥ 9 → Décision de sortie / transfert
          ↓
9. SSPI ferme le séjour → Transition : POST_OP → CLOSED
          ↓
10. DOCTOR génère le rapport de synthèse (+ IA optionnel)
```

---

## 🛠️ 7. Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Backend** | Python / Django |
| **API** | Django REST Framework (DRF) |
| **Auth** | JWT (JSON Web Tokens) |
| **Base de données** | SQLite (dev) / PostgreSQL (prod) |
| **Frontend** | React + Vite |
| **Charts** | Recharts |
| **HTTP Client** | Axios (avec intercepteur JWT auto-refresh) |
| **CSS** | Vanilla CSS (modules par composant) |
| **IA** | Claude (Anthropic) / Gemini (Google) |

---

## 🚀 8. Comment Lancer le Projet

### Prérequis
- Python 3.10+ avec virtualenv
- Node.js 16+

### Backend

```powershell
# Aller à la racine du projet
cd c:\Users\GIGABYTE\Documents\2emec2s\Projetsantepublic\DAI-VF\yasmine_DAI

# Activer l'environnement virtuel
.\.venv\Scripts\Activate.ps1

# Lancer le serveur Django
cd backend
python manage.py runserver
```

→ Backend disponible sur **http://localhost:8000**
→ Admin Django : **http://localhost:8000/admin**

### Frontend

```powershell
# Dans un second terminal
cd c:\Users\GIGABYTE\Documents\2emec2s\Projetsantepublic\DAI-VF\yasmine_DAI\frontend
npm run dev
```

→ Frontend disponible sur **http://localhost:5173**

---

## 🔐 9. Authentification

L'API utilise **JWT (JSON Web Tokens)** :

```
POST /api/token/         → Obtenir access + refresh token
POST /api/token/refresh/ → Renouveler l'access token
```

Le frontend stocke les tokens dans `localStorage` et les injecte automatiquement dans chaque requête via l'intercepteur Axios.

### Comptes de test

```python
# Dans le shell Django : python manage.py shell

from django.contrib.auth.models import User
from common.models import Profile

# Créer un médecin
user = User.objects.create_user('doctor1', 'doctor@test.com', 'password123')
Profile.objects.filter(user=user).update(role='DOCTOR', is_active=True)

# Créer un IADE
user = User.objects.create_user('iade1', 'iade@test.com', 'password123')
Profile.objects.filter(user=user).update(role='IADE', is_active=True)

# Créer un SSPI
user = User.objects.create_user('sspi1', 'sspi@test.com', 'password123')
Profile.objects.filter(user=user).update(role='SSPI', is_active=True)
```

---

## 📡 10. Référence Complète des Endpoints API

### Authentification
```
POST /api/token/
POST /api/token/refresh/
```

### Patients
```
GET  /api/patients/
POST /api/patients/
GET  /api/patients/{id}/
```

### Dossier Anesthésique
```
GET  /api/cases/
POST /api/cases/
POST /api/cases/{id}/state/
```

### Pré-op
```
GET  /api/preop-questionnaires/{id}/form/
POST /api/preop-questionnaires/{id}/save-responses/
POST /api/preop-questionnaires/{id}/compute-scores/
```

### Per-op (Bloc)
```
GET  /api/cases/{id}/perop/summary/
POST /api/cases/{id}/perop/sessions/start/
POST /api/cases/{id}/perop/sessions/end/
GET  /api/cases/{id}/perop/vitals/
POST /api/cases/{id}/perop/vitals/
GET  /api/cases/{id}/perop/events/
POST /api/cases/{id}/perop/events/
```

### Post-op (SSPI)
```
GET  /api/cases/{id}/postop/summary/
POST /api/cases/{id}/postop/stay/start/
POST /api/cases/{id}/postop/stay/end/
GET  /api/cases/{id}/postop/observations/
POST /api/cases/{id}/postop/observations/
GET  /api/cases/{id}/postop/scores/aldrete/
```

### DME / DPI
```
GET    /api/dme/medical-records/
POST   /api/dme/medical-records/
GET    /api/dme/medical-records/{id}/
PATCH  /api/dme/medical-records/{id}/
DELETE /api/dme/medical-records/{id}/
GET    /api/dme/medical-records/patient/{patient_id}/
```

### Intelligence Artificielle
```
POST /api/ai/generate-report/
POST /api/ai/analyze-scores/
POST /api/ai/treatment-plan/
GET  /api/ai/health/
```

### Alertes
```
GET   /api/alerts/
PATCH /api/alerts/{id}/
```

---

## 📊 11. État d'Avancement

### ✅ Implémenté & Fonctionnel
- `patient` — Identité patient
- `casefile` — Dossier anesthésique pivot
- `preop` — Questionnaire + 10 scores cliniques
- `perop` — Session bloc + constantes + événements
- `postop` — SSPI + score Aldrete + observations
- `dme` — 6 modèles de dossier médical
- `ai_agent` — Intégration Claude / Gemini
- `audit` — Traçabilité complète
- `common` — RBAC avec 5 rôles, 15+ classes de permission
- Frontend — 7 composants React + dashboards rôle-based

### 🔧 Scaffolding prêt (à compléter)
- `alert` — Structure créée, logique à implémenter
- `report` — Structure créée, génération PDF à implémenter
- `settings_app` — Structure créée, UI à connecter

### 🔮 Prévu (évolutions futures)
- WebSockets pour les constantes en temps réel
- Intégration FHIR / HL7 / IHE (interopérabilité SIH)
- Streaming temps réel
- Module télémédecine
- Conformité RGPD / HDS (Hébergeur de Données de Santé)

---

## 🗂️ 12. Structure des Fichiers

```
zakaria_DAI/
├── backend/
│   ├── manage.py
│   ├── db.sqlite3
│   ├── dai_api/         → Configuration Django (settings, urls)
│   ├── common/          → Auth, rôles, permissions, Profile
│   ├── patient/         → Modèle Patient
│   ├── casefile/        → Dossier Anesthésique (pivot)
│   ├── preop/           → Phase pré-opératoire + scores
│   ├── perop/           → Phase per-opératoire / bloc
│   ├── postop/          → Phase post-opératoire / SSPI
│   ├── dme/             → Dossier Médical Électronique
│   ├── ai_agent/        → Module IA (Claude / Gemini)
│   ├── audit/           → Traçabilité
│   ├── alert/           → Alertes cliniques
│   ├── report/          → Rapports
│   └── settings_app/    → Configuration clinique
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              → Routes + guards de rôle
│   │   ├── context/
│   │   │   └── AuthContext.jsx  → Gestion JWT + user
│   │   ├── services/
│   │   │   └── apiClient.js     → Axios + intercepteur token
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── DoctorDashboardEnhanced.jsx
│   │   │   │   ├── IADEDashboard.jsx
│   │   │   │   └── SSPIDashboard.jsx
│   │   │   ├── Panels/
│   │   │   │   ├── AlertsPanel.jsx
│   │   │   │   └── AIInsightsPanel.jsx
│   │   │   └── Charts/
│   │   │       └── VitalsChart.jsx
│   │   └── pages/
│   │       └── PatientDPI.jsx   → DPI 7 onglets
│   ├── package.json
│   └── vite.config.js
│
├── .venv/                   → Environnement virtuel Python
├── QUICK_START.md           → Guide démarrage rapide
├── INTEGRATION_GUIDE.md     → Guide d'intégration complet
├── IMPLEMENTATION_COMPLETE.md → Ce qui a été implémenté
└── PROJECT_OVERVIEW.md      → Ce fichier
```

---

## 🔑 13. Variables d'Environnement

### Backend (`backend/.env`)
```env
# Intelligence Artificielle
CLAUDE_API_KEY=sk-ant-...        # Pour Claude (Anthropic)
GOOGLE_API_KEY=AIza...           # Pour Gemini (Google)
AI_PROVIDER=claude               # Ou "gemini"

# Base de données (production)
DB_NAME=dai_bmad
DB_USER=dai_user
DB_PASSWORD=StrongPassword123!
DB_HOST=localhost
DB_PORT=3306
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=DAI Hospital System
```

---

## 🐛 14. Dépannage Rapide

| Problème | Solution |
|---------|----------|
| `python: command not found` | Activer le venv : `.\.venv\Scripts\Activate.ps1` |
| `403 Forbidden` sur l'API | Vérifier le rôle de l'utilisateur dans la DB |
| Page blanche frontend | Vérifier que le backend tourne sur port 8000 |
| `Migration error` | `python manage.py makemigrations && python manage.py migrate` |
| IA ne répond pas | Vérifier `CLAUDE_API_KEY` ou `GOOGLE_API_KEY` |
| `ExecutionPolicy` PowerShell | `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| DPI bloqué sur "Loading..." | Tester `curl http://localhost:8000/api/patients/{id}/` |

---

*Document généré automatiquement depuis l'ensemble du projet DAI-BMAD.*
*Dernière mise à jour : Juin 2026*

---

---












# 🌍 DAI — MENA Digital Summer School 2026 · Berlin
## Project Overview — Candid Foundation Presentation

> **Prepared by:** Zakaria Ali Fekih Ahmed | Medical Informatics & Health Engineering Student, ISTMT Tunis  
> **Event:** MENA Digital Summer School 2026 | Candid Foundation | Berlin, Germany  
> **Project:** DAI — Dossier d'Anesthésie Intelligent *(Smart Anesthesia Record)*

---

## 1. Executive Summary

Every year, thousands of patients across the MENA region undergo surgery without a single line of their anesthesia data ever being digitized — recorded instead on paper forms that get lost, misread, or simply never retrieved. DAI *(Dossier d'Anesthésie Intelligent — Smart Anesthesia Record)* is a full-stack, AI-powered hospital platform that changes this reality by digitalizing the entire anesthesia care pathway — before, during, and after surgery — within a single, secure, and intelligent system. Built with Django and React, integrated with Claude (Anthropic) and Gemini (Google), and designed from the ground up for the realities of MENA healthcare, DAI is not a product in search of a problem: it is a direct clinical answer to a documented, measurable, and urgent patient safety crisis.

---

## 2. The Problem — A Silent Crisis in Surgical Care

Anesthesia is one of the highest-risk disciplines in medicine. A wrong dose, a missed allergy, an undetected cardiac condition — any one of these can be fatal. Yet across North Africa and the broader MENA region, the systems supposed to prevent these failures are themselves failing.

### The hard numbers:
- **23%** of adverse anesthesia events are directly linked to missing or inaccessible peri-operative patient information *(Source: SFAR — French Society of Anesthesia and Resuscitation)*
- The overwhelming majority of hospitals in Tunisia operate with **paper-based anesthesia records** — physical forms that are fragmented, incomplete, and impossible to query in real time
- Patient data is siloed across **disconnected departments** — the operating room, the recovery unit (SSPI), and the ward share no common system and no shared memory
- Physicians operate with **zero real-time decision support**: no automated risk scoring, no alerts, no AI assistance
- Administrative burden consumes up to **40% of productive medical time**, time that should be spent at the bedside
- There is **no traceability, no automation, and no interoperability** — making retrospective analysis, quality audits, or incident reviews nearly impossible

This is not a developing-world technology gap. It is a patient safety emergency hiding in plain sight.

---

## 3. The Solution — Three Pillars of Transformation

DAI addresses this crisis through three integrated and inseparable pillars:

### 🔁 Pillar 1 — AUTOMATION
DAI eliminates manual, error-prone data entry by automating the clinical workflow end to end. Patient data flows through the system automatically — from the pre-operative questionnaire through intra-operative monitoring to post-operative recovery scoring. Automatic calculation of 10 validated clinical risk scores, automatic event logging during surgery, and automatic generation of the complete anesthesia report mean that physicians spend their time thinking, not transcribing.

### 🧠 Pillar 2 — INTELLIGENCE
DAI embeds AI where it delivers the most clinical value: risk prediction, synthesis, and decision support. Using large language models (Claude by Anthropic, Gemini by Google), the platform analyzes each patient's full clinical profile and generates structured risk reports, critical alerts, and personalized anesthetic considerations. This intelligence is strictly **advisory** — DAI never makes a clinical decision. It informs, flags, and recommends. The physician always decides. This is not a replacement for medical judgment. It is the amplification of it.

### 🔐 Pillar 3 — SECURITY
Medical data is among the most sensitive information a human being possesses. DAI is built with this responsibility at its core. The architecture is designed for **RGPD compliance** (Europe's GDPR equivalent), with **HDS-aligned data hosting** (Hébergeur de Données de Santé — the French certified health data hosting standard), end-to-end encryption, JWT-based authentication, role-based access control, and a comprehensive audit trail that timestamps every single action performed in the system. Nothing happens in DAI without a record.

---

## 4. The Three Clinical Phases — Following the Patient

DAI follows the patient through three distinct and sequential phases of their surgical journey, creating a continuous, unbroken thread of clinical data from admission to discharge.

---

### 🟦 Phase 1 — Pre-Operative Assessment

Before a patient enters the operating room, the anesthesiologist must make one of the most consequential decisions in medicine: *is this patient safe to anesthetize today?*

DAI answers that question with data.

The patient completes a **structured digital questionnaire** covering their medical history, current medications, allergies, and functional status. The system then **automatically calculates 10 validated clinical risk scores** in parallel — each one addressing a specific dimension of surgical risk:

| Score | What it measures |
|---|---|
| **ASA** | Overall physical status classification |
| **RCRI** | Revised Cardiac Risk Index |
| **APFEL** | Post-operative nausea and vomiting risk |
| **DUKE** | Functional cardiac capacity |
| **LEE** | Revised cardiac risk for non-cardiac surgery |
| **STOP-BANG** | Obstructive sleep apnea risk |
| **GOLD** | COPD severity |
| **CHILD-PUGH** | Hepatic insufficiency severity |
| **NYHA** | Functional heart failure classification |
| **CHA₂DS₂-VASc** | Stroke risk in atrial fibrillation |
| **ARISCAT** | Post-operative pulmonary complication risk |

The AI module then synthesizes these scores into a structured risk report, highlighting critical alerts and recommending one of four clinical decisions: **authorize anesthesia / request additional examinations / seek specialist opinion / defer anesthesia**. The physician reads, confirms, and signs.

---

### 🟥 Phase 2 — Intra-Operative Monitoring (Operating Room)

Once the patient is in the operating room, DAI becomes the team's real-time command center.

The **OR monitoring dashboard** tracks six vital parameters continuously — displayed live, color-coded against clinical thresholds, with trend visualization powered by Recharts:

| Parameter | Normal Range | Critical Threshold |
|---|---|---|
| Heart Rate | 60–100 bpm | < 40 or > 130 |
| SpO₂ | ≥ 97% | < 90% |
| Systolic BP | 110–140 mmHg | < 80 mmHg |
| Temperature | 36.5–37.5°C | < 35°C |
| BIS (Anesthesia Depth) | 40–60 | < 20 or > 80 |
| Airway Pressure | 15–30 cmH₂O | > 40 cmH₂O |

Every medication administered, every clinical incident, every physician note is **automatically timestamped and logged** into the surgical journal. This creates a complete, legally defensible, and medically accurate record of everything that happened during the operation — in real time, not reconstructed from memory afterward.

---

### 🟩 Phase 3 — Post-Operative Recovery (SSPI)

The recovery room (SSPI — Salle de Soins Post-Interventionnels) is where patients wake up from anesthesia, and where some of the most critical complications of surgery can manifest. DAI's SSPI module provides the recovery team with a structured surveillance framework built around the internationally validated **Aldrete Score**.

The Aldrete Score evaluates five components of patient recovery on a 0–2 scale each, for a total out of 10:

| Component | Assessed |
|---|---|
| Consciousness | Oriented vs. arousable vs. unresponsive |
| Motor Activity | Full movement vs. partial vs. none |
| Circulation | BP within 20% of baseline vs. 20–50% vs. >50% |
| Respiration | Deep breathing vs. dyspnea vs. apnea |
| SpO₂ | ≥ 92% on room air vs. with supplemental O₂ vs. < 90% |

DAI calculates this score at every nursing observation and generates a clear clinical decision:
- **Score ≥ 9** → Discharge authorized
- **Score 7–8** → Transfer to the ward
- **Score < 7** → Patient remains in SSPI

This automated decision framework removes ambiguity, standardizes care, and protects both patient and provider. When the SSPI team closes the case, DAI automatically generates the complete anesthesia synthesis report — ready for the patient's permanent record.

---

## 5. Technical Architecture — Built for Hospitals, Designed for Scale

DAI's architecture is intentionally pragmatic: it uses proven, production-grade technologies that can be maintained, extended, and deployed in resource-constrained hospital environments.

```
┌─────────────────────────────────────────────────────────────┐
│                    DAI PLATFORM                             │
│                                                             │
│  ┌─────────────────┐        ┌──────────────────────────┐   │
│  │   FRONTEND       │        │      BACKEND             │   │
│  │  React + Vite    │◄──────►│  Python / Django         │   │
│  │  Recharts        │  REST  │  Django REST Framework   │   │
│  │  Role Dashboards │  API   │  JWT Authentication      │   │
│  └─────────────────┘        │  40+ REST Endpoints      │   │
│                              └──────────┬───────────────┘   │
│                                         │                   │
│                ┌────────────────────────┼──────────────┐   │
│                │                        │              │   │
│         ┌──────▼──────┐    ┌───────────▼──────┐       │   │
│         │  DATABASE   │    │   AI SERVICES     │       │   │
│         │  SQLite/PG  │    │  Claude (Anthropic)│      │   │
│         └─────────────┘    │  Gemini (Google)  │       │   │
│                             └──────────────────┘       │   │
└─────────────────────────────────────────────────────────────┘
```

**Backend:** Python / Django with Django REST Framework — a battle-tested stack used in production healthcare systems worldwide. Structured around 12 specialized modules: `patient`, `casefile`, `preop`, `perop`, `postop`, `dme`, `ai_agent`, `audit`, `alert`, `report`, `settings_app`, and `common`. Every module exposes a clean REST API; the entire system covers 40+ endpoints across all clinical domains.

**Authentication & Access Control:** JWT-based authentication with a sophisticated Role-Based Access Control (RBAC) system featuring 5 user roles and 15+ granular permission classes — ensuring the right person sees only the data they need.

**Frontend:** React + Vite for fast, component-driven interfaces. Real-time vital sign trends are rendered with Recharts. Each user role receives a dedicated dashboard tailored to their clinical workflow.

**AI Layer:** A provider-agnostic abstraction layer that can route requests to Claude (Anthropic) or Gemini (Google) depending on configuration. The AI module operates on structured clinical data and returns structured clinical outputs — never free-form speculation.

**Interoperability Roadmap:** HL7 v2/v3, FHIR R4, and CDA standards are on the near-term roadmap, ensuring DAI can plug into existing Hospital Information Systems (HIS) without requiring greenfield infrastructure.

---

## 6. Users & Roles — Designed Around Clinical Reality

DAI was not designed by engineers imagining what clinicians need. It was designed by someone who has worked inside hospitals, observed clinical workflows, and understands that a system unused is a system failed. Every role and every screen reflects a real person doing a real job under real pressure.

| Role | Who they are | What DAI gives them |
|---|---|---|
| **DOCTOR** *(Anesthesiologist)* | Leads anesthesia care, makes all critical decisions | Full patient dashboard, DPI/EMR, pre-op risk scoring, AI synthesis, case supervision |
| **IADE** *(Anesthesia Nurse)* | Manages the patient during surgery at the bedside | Intra-operative monitoring dashboard, real-time vitals entry, event logging, surgical journal |
| **SSPI** *(Recovery Room Team)* | Supervises patient awakening post-surgery | Recovery surveillance, Aldrete scoring, discharge workflow, observation documentation |
| **ADMIN** *(System Administrator)* | Manages the hospital's use of the platform | User management, role assignment, system configuration, protocol settings |
| **PATIENT** | The person at the center of everything | Secure, role-limited access to their own medical records and documents |

Each user sees only what they need, only when they need it. A nurse in the recovery room cannot access another patient's pre-operative assessment. An administrator cannot modify clinical data. The architecture enforces these boundaries at the API level — not just the interface level.

---

## 7. What Has Been Built — Current Status

DAI is not a concept. It is a working clinical platform.

### ✅ Fully Implemented and Functional
- **Complete pre-operative module** — digital questionnaire, automatic calculation of all 10 clinical risk scores, AI-powered risk synthesis
- **Complete intra-operative module** — OR session management, real-time vital sign tracking for 6 parameters, event logging with timestamped surgical journal
- **Complete post-operative module** — SSPI surveillance, automated Aldrete scoring, discharge workflow, clinical observations
- **Electronic Medical Record (EMR/DPI)** — 6-entity medical record model: history, diagnoses (ICD-10 coded), prescriptions, clinical documents, allergies
- **AI integration** — dual provider support (Claude + Gemini), 3 clinical AI endpoints, operational advisory reports
- **Full audit trail** — every action in the system is logged with user, timestamp, and context
- **RBAC system** — 5 roles, 15+ permission classes, object-level access control
- **7 React components** — role-specific dashboards for Doctor, IADE, SSPI; patient DPI with 7 tabs; alerts panel; AI insights panel; vital signs chart
- **Case lifecycle management** — complete state machine: `PRE_OP → PER_OP → POST_OP → CLOSED`

**Overall integration: ~60% of the full product vision**

### 🔧 In Active Development
- Alert detection engine (structure complete, logic in progress)
- PDF report generation (scaffolding ready)
- Clinical configuration module (connected to backend, UI in progress)

### 🔮 On the Roadmap
- **WebSockets** for true real-time vital sign streaming from medical devices
- **FHIR R4 / HL7** full integration for HIS interoperability
- **PDF export** of complete anesthesia records
- **HDS certification** (French certified health data hosting standard)
- **Telemedicine module** for remote pre-operative consultations

---

## 8. Vision, Roadmap & Regional Impact

The anesthesia data crisis is not unique to Tunisia. It is shared by every country in the MENA region where hospital digitalization is incomplete, where healthcare informatics expertise is scarce, and where patient safety standards are not yet enforced by digital infrastructure. DAI is built to change this — not just in one hospital, but across an entire region.

### Deployment Roadmap

```
2026 ────────────────────────────────────────────────────────▶
  │
  ├── Q1-Q2 2026 │ Complete platform integration (100%)
  │               │ WebSockets + FHIR + PDF generation
  │               │ HDS certification process initiated
  │
  ├── Q3-Q4 2026 │ Pilot deployment: 1–2 Tunisian hospitals
  │               │ Clinical validation with anesthesiology teams
  │               │ IRB ethics review for clinical data use
  │
  ├── 2027       │ Expand to 10+ Tunisian public hospitals
  │               │ SaaS model launch for private clinics
  │               │ First revenue, first hospital contracts
  │
  ├── 2028–2029  │ MENA regional expansion
  │               │ Partnerships with health ministries
  │               │ Arabic-language interface
  │               │ Localization for Moroccan, Algerian, Egyptian markets
  │
  └── 2030+      │ Reference anesthesia platform for the MENA region
                  │ Integration with national eHealth programs
                  │ Research database for anesthesia outcome studies
```

### The Impact at Scale

If DAI reduces adverse anesthesia events linked to missing information by even 10%, and if it is deployed across 50 hospitals in the MENA region, the arithmetic is sobering: thousands of complications avoided. Hundreds of lives protected. Millions of dollars in avoidable healthcare costs prevented.

But the deeper impact is structural. DAI creates, for the first time, a **longitudinal digital record of anesthesia care** in hospitals that have never had one. This data becomes the foundation for research, for training, for policy — and for the next generation of AI models trained on real clinical outcomes from real MENA patients.

The Business Model is equally pragmatic:
- **SaaS subscription** for private clinics and hospitals
- **Freemium public health tier** for national programs
- **API licensing** for HIS integration partners
- **Research data partnerships** with academic and pharmaceutical institutions (fully anonymized, RGPD compliant)

---

## 9. Closing Statement — A Personal Note

I am a third-year Medical Informatics and Health Information Engineering student at ISTMT in Tunis. I built DAI because I spent time inside Hôpital La Rabta, one of Tunisia's largest public hospitals, working on HIS interoperability — and I saw firsthand what the absence of digitalization costs. I saw nurses hunting for paper files before emergency surgeries. I saw anesthesiologists making risk assessments from memory. I saw a system doing its best with tools that were never designed for it.

I am not here to criticize those institutions. They are full of dedicated, brilliant people working under extraordinary constraints. I am here because I believe technology — built thoughtfully, deployed responsibly, and grounded in clinical reality — can give those people better tools. DAI is that belief in code.

I built this platform not as a school project. I built it as a co-founder of Healthinet, my HealthTech startup, as a future physician-engineer, and as someone who intends to spend his career at the intersection of medicine and technology in this region. The MENA Digital Summer School represents exactly the kind of international dialogue I need — to stress-test my thinking, to connect with people who have built what I am building, and to take DAI from a working prototype to a deployed clinical product.

The anesthesia record is a small file. But it contains a life. Every life deserves a system worthy of it.

---

*DAI — Dossier d'Anesthésie Intelligent*  
*MENA Digital Summer School 2026 · Berlin · Candid Foundation*  
*Presented by: Zakaria Ali Fekih Ahmed | ISTMT Tunis | Co-founder, Healthinet*  
*Contact: [zakaria.alifekih@healthinet.tn] | GitHub: zakneet/DAI-project-final*

