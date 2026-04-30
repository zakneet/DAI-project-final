# 🚀 QUICK START & COMMON OPERATIONS

## 📋 PRE-FLIGHT CHECKLIST

```bash
# 1. Make sure backend is running
python manage.py runserver

# 2. Check database connection
python manage.py dbshell
mysql> SELECT * FROM common_profile LIMIT 1;

# 3. Verify all apps are installed
python manage.py check

# Expected: System check identified no issues (0 silenced).
```

---

## 🔧 SETUP (First Time Only)

### 1. Apply Migrations
```bash
cd backend

# Create migrations for updated models
python manage.py makemigrations common

# Apply all migrations
python manage.py migrate

# Verify
python manage.py migrate --plan | head -20
```

### 2. Create Admin User
```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@hospital.org
# Password: (choose secure password)
```

### 3. Create Test Users
```bash
python manage.py shell
```

**Paste this:**
```python
from django.contrib.auth.models import User
from common.models import Profile

# DOCTOR
user = User.objects.create_user('doctor1', 'doctor@test.com', 'password123')
Profile.objects.filter(user=user).update(role='DOCTOR', is_active=True)

# IADE
user = User.objects.create_user('iade1', 'iade@test.com', 'password123')
Profile.objects.filter(user=user).update(role='IADE', is_active=True)

# SSPI
user = User.objects.create_user('sspi1', 'sspi@test.com', 'password123')
Profile.objects.filter(user=user).update(role='SSPI', is_active=True)

# ADMIN
user = User.objects.create_user('admin1', 'admin@test.com', 'password123')
Profile.objects.filter(user=user).update(role='ADMIN', is_active=True)

print("✅ All test users created!")
```

---

## 🧪 TESTING ENDPOINTS

### Get Authentication Token
```bash
# Login as doctor
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -d "username=doctor1&password=password123" | jq -r '.access')

echo "Token: $TOKEN"
```

### Test DME Module
```bash
# List medical records
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/dme/medical-records/

# Create medical record
curl -X POST http://localhost:8000/api/dme/medical-records/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "blood_group": "O+",
    "weight": 75,
    "height": 180,
    "patient": "patient-uuid-here"
  }'
```

### Test AI Module
```bash
# Check AI health
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/ai/health/

# Generate AI report (requires CLAUDE_API_KEY set)
curl -X POST http://localhost:8000/api/ai/generate-report/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "patient-uuid",
    "case_id": "case-uuid"
  }'
```

---

## 🔐 PERMISSION TESTING

### Test Role-Based Access

```bash
# As IADE, try accessing POST-OP (should fail if you use IsPostOpStaff)
IADE_TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -d "username=iade1&password=password123" | jq -r '.access')

# This should return 403 Forbidden if SSPI/DOCTOR only
curl -H "Authorization: Bearer $IADE_TOKEN" \
  http://localhost:8000/api/postop/observations/
```

### Verify Permission Classes

**Current implementation:**
```python
# DPI endpoints (DME)
permission_classes = [IsAuthenticated, IsDoctorOrIADEOrSSPI]

# Pre-op endpoints
permission_classes = [IsAuthenticated, IsDoctor]

# Per-op endpoints
permission_classes = [IsAuthenticated, IsPerOpStaff]  # DOCTOR | IADE

# Post-op endpoints
permission_classes = [IsAuthenticated, IsPostOpStaff]  # DOCTOR | SSPI
```

---

## 🤖 AI CONFIGURATION

### Using Claude (Recommended)
```bash
# Set environment variable
export CLAUDE_API_KEY="sk-ant-abc123..."

# Or in Django settings.py
CLAUDE_API_KEY = "sk-ant-abc123..."
AI_PROVIDER = "claude"
```

### Using Gemini
```bash
# Set environment variable
export GOOGLE_API_KEY="AIza..."

# Or in Django settings.py
GOOGLE_API_KEY = "AIza..."
AI_PROVIDER = "gemini"
```

### Test AI Service
```bash
python manage.py shell

# Test Claude
from ai_agent.service import AIService
provider = AIService.get_provider()
print(f"Active provider: {provider}")

# Generate test report
result = AIService.generate_report(
    case_id="test-case",
    patient_id="test-patient"
)
print(result)
```

---

## 📊 DATABASE OPERATIONS

### Backup Database
```bash
# MySQL backup
mysqldump -u dai_user -p dai_bmad > backup_$(date +%Y%m%d).sql

# Password: StrongPassword123!
```

### Restore Database
```bash
mysql -u dai_user -p dai_bmad < backup_20240101.sql
```

### Check Tables
```bash
python manage.py dbshell

# MySQL shell
mysql> SHOW TABLES;
mysql> DESC dme_medicalrecord;
mysql> SELECT COUNT(*) FROM dme_medicalrecord;
```

---

## 🐛 DEBUGGING

### Enable Debug Logging
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

### Check Permission Errors
```bash
# Enable verbose logging
curl -v -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/dme/medical-records/

# Returns detailed error messages
```

### Test Permission Directly
```python
from django.contrib.auth.models import User
from common.permissions import IsDoctorOrIADE

user = User.objects.get(username='doctor1')
permission = IsDoctorOrIADE()

# Check permission
has_perm = permission.has_permission(request, view)
print(f"Has permission: {has_perm}")
```

---

## 📈 PRODUCTION DEPLOYMENT

### Pre-deployment Checklist
- [ ] Run all tests: `python manage.py test`
- [ ] Check migrations: `python manage.py migrate --plan`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Check security: `python manage.py check --deploy`
- [ ] Set DEBUG=False in settings.py
- [ ] Set SECRET_KEY from environment
- [ ] Configure ALLOWED_HOSTS

### Deploy Commands
```bash
# 1. Pull latest code
git pull

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
python manage.py migrate

# 4. Restart service
systemctl restart gunicorn  # or your WSGI server
```

---

## 📝 COMMON TASKS

### Add New Role
```python
# common/models.py
class Role(models.TextChoices):
    RESIDENT = "RESIDENT", "Resident"  # Add this

# common/permissions.py
class IsResident(BasePermission):
    def has_permission(self, request, view):
        return request.user.profile.role == Role.RESIDENT
```

### Add New Permission Class
```python
# common/permissions.py
class IsDoctorOrResident(BasePermission):
    def has_permission(self, request, view):
        return request.user.profile.role in [Role.DOCTOR, Role.RESIDENT]
```

### Add New Endpoint
```python
# dme/views.py
from rest_framework.decorators import action
from rest_framework.response import Response

class MedicalRecordViewSet(viewsets.ModelViewSet):
    @action(detail=True, methods=['post'])
    def custom_action(self, request, pk=None):
        record = self.get_object()
        # Your logic here
        return Response({'status': 'success'})
```

### Add New Model
```python
# dme/models.py
class NewModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Your fields here

# Then:
python manage.py makemigrations dme
python manage.py migrate
```

---

## 🚨 TROUBLESHOOTING

### Issue: Migration Errors
```bash
# Reset migrations (⚠️ ONLY in development!)
python manage.py migrate --zero common

# Recreate migrations
python manage.py makemigrations common
python manage.py migrate
```

### Issue: Permission Denied (403)
```python
# Check user's role
user = User.objects.get(username='doctor1')
print(user.profile.role)  # Should be 'DOCTOR'

# Check permission class
from common.permissions import IsDoctorOrIADE
perm = IsDoctorOrIADE()
# Add print statements in has_permission()
```

### Issue: AI Endpoint Not Working
```bash
# Check API key is set
echo $CLAUDE_API_KEY

# Check provider is available
python manage.py shell
>>> from ai_agent.service import AIService
>>> print(AIService.get_provider())

# Check network connectivity
curl https://api.anthropic.com/v1/health
```

### Issue: Database Connection Failed
```bash
# Test MySQL connection
mysql -h localhost -u dai_user -p -e "USE dai_bmad; SELECT 1;"

# Verify credentials in settings.py
# Check port 3306 is open: nc -zv localhost 3306
```

---

## 📞 GETTING HELP

**Documentation:**
- `INTEGRATION_GUIDE.md` — Full setup guide
- `IMPLEMENTATION_COMPLETE.md` — What was created
- Code comments — Inline documentation

**Error Messages:**
- Check `django.log` or console output
- Use `--verbose` flag: `python manage.py migrate --verbose`
- Enable DEBUG=True temporarily to see full tracebacks

**Testing:**
- Write unit tests in `module/tests.py`
- Run: `python manage.py test dme`

