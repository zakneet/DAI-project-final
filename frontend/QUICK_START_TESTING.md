# 🚀 Quick Start Testing Guide - 5 Minute Verification

## Step 1: Start Backend (Terminal 1)

```bash
cd backend
python manage.py runserver
```

**Expected Output**:
```
Starting development server at http://127.0.0.1:8000/
```

✅ Backend is ready.

---

## Step 2: Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

✅ Frontend is ready.

---

## Step 3: Open Browser

Navigate to: **http://localhost:5173**

**You should see**: 
- Landing page with "DAI" logo
- Two buttons: "Se connecter" (Login) and "S'inscrire" (Signup)

✅ Frontend loads.

---

## Step 4: Login with Test Account

**Click**: "Se connecter" button

**Fill in**:
- Email: `test@doctor.com`
- Password: `TestPassword123!`
- Role: Select "Médecin" (Doctor) button

**Click**: "Se connecter"

**Expected**: Redirects to `/doctor-dashboard`

✅ Authentication works.

---

## Step 5: Verify Patient Data (THE CRITICAL TEST)

### 5a. Check KPI Cards
Look at the four colored boxes at the top:
```
👥 [?]              📋 [?]              ⚠️ [?]              📊 [?%]
Total Patients      Active Cases        Alerts Pending      Avg Risk Score
```

**Expected**:
- ❌ NOT: 0, 0, 0, 0%
- ✅ YES: Real numbers like 45, 12, 3, 67%

**If shows zeros**: 
→ Check backend is running
→ Check database has patient data

### 5b. Check Patient List
Below the KPI cards, there should be a "Patients" section with a search box.

**Expected**:
- ❌ NOT: (empty list)
- ✅ YES: List of patient names
  - John Smith - DOB: 1985-03-15
  - Jane Doe - DOB: 1990-07-22
  - (and more...)

**If empty**:
→ Open browser DevTools (F12)
→ Go to Network tab
→ Refresh page
→ Look for `/api/patients/` request
→ Check if it returns 200 with data

### 5c. Click a Patient Name
Click on "John Smith" (or first patient in list)

**Expected**:
- Patient card highlights
- Right panel shows "Overview" tab
- Shows patient details (DOB, Gender, etc.)
- There's a button "📋 View Full DPI"

### 5d. Click "View Full DPI" Button
**Click the blue button**: "📋 View Full DPI"

**Expected**:
- URL changes to: `http://localhost:5173/patient-dpi/1` (or patient ID)
- Page title: "📋 Patient DPI (Dossier Patient Intelligent)"
- Seven tabs visible: Overview, Medical History, Diagnoses, Medications, Allergies, Documents, Scores
- Overview tab shows patient demographics

✅ Everything works!

---

## Step 6: Browser DevTools Check (F12)

### 6a. Network Tab
1. Press F12 → Network tab
2. Refresh page (F5)
3. Filter for: `XHR` (API calls)

**Expected to see**:
```
✅ GET /api/patients/           200
✅ GET /api/cases/              200
✅ GET /api/clinical-scores/    200
❌ (should NOT see 404s or 401s)
```

### 6b. Console Tab
1. Press F12 → Console tab
2. Look for any red errors

**Expected**:
- ❌ NOT: Import errors like "Cannot find module"
- ❌ NOT: "client is undefined"
- ✅ YES: Clean console (maybe some warnings, but no errors)

---

## Step 7: Run Integration Tests (5-minute advanced check)

### In Browser Console (F12 → Console):

```javascript
// Copy this entire code and paste it
async function quickTest() {
  try {
    // Test 1: Patients
    const patients = await fetch('http://localhost:8000/api/patients/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    }).then(r => r.json());
    
    console.log('✅ Patients loaded:', patients.results?.length || patients.length);
    
    // Test 2: Cases
    const cases = await fetch('http://localhost:8000/api/cases/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    }).then(r => r.json());
    
    console.log('✅ Cases loaded:', cases.results?.length || cases.length);
    
    // Test 3: Alerts
    const alerts = await fetch('http://localhost:8000/api/alerts/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    }).then(r => r.json());
    
    console.log('✅ Alerts loaded:', alerts.results?.length || alerts.length);
    
    console.log('\n🎉 All API calls successful!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickTest();
```

**Expected Output**:
```
✅ Patients loaded: 45
✅ Cases loaded: 12
✅ Alerts loaded: 3

🎉 All API calls successful!
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Can login with test@doctor.com
- [ ] KPI cards show real numbers (NOT zeros)
- [ ] Patient list NOT empty
- [ ] Can click patient name
- [ ] Patient details display
- [ ] "View Full DPI" button exists
- [ ] Can click "View Full DPI"
- [ ] `/patient-dpi/1` page loads
- [ ] DPI tabs are clickable
- [ ] Patient info displays in Overview tab
- [ ] Network requests return 200 (no errors)
- [ ] Browser console has no red errors
- [ ] Integration tests show real data

---

## 🚨 Troubleshooting Quick Fixes

### Problem: Blank Page

**Solution 1**: Check console (F12 → Console)
```javascript
// If error about client/import, try:
window.location.reload();  // Force refresh
// Then clear cache: Ctrl+Shift+Del → Clear browsing data
```

**Solution 2**: Backend not running?
```bash
# Check backend is on port 8000
curl http://localhost:8000/api/health/
# Should return JSON, not "Connection refused"
```

### Problem: Patient List Empty

**Solution**: Check API response
```javascript
// In console:
const token = localStorage.getItem('access_token');
const r = await fetch('http://localhost:8000/api/patients/', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await r.json();
console.log(data);  // Check structure
```

### Problem: "View Full DPI" doesn't work

**Solution**: Check URL after click
```javascript
// In console:
window.location.pathname  // Should be /patient-dpi/1
```

### Problem: Cannot login

**Solution**: 
1. Check test user exists in database:
   ```bash
   python manage.py shell
   >>> from django.contrib.auth.models import User
   >>> User.objects.filter(email='test@doctor.com').exists()
   True  # Should return True
   ```

2. Try creating test user:
   ```bash
   python manage.py createsuperuser
   # Username: test
   # Email: test@doctor.com
   # Password: TestPassword123!
   ```

---

## 📊 What You'll See

### Before Fixes (Was This):
```
KPI Cards:     [0]  [0]  [0]  [0%]
Patient List:  (empty)
Patient Info:  (blank)
```

### After Fixes (Now This):
```
KPI Cards:     [45]  [12]  [3]  [67%]
Patient List:  
  ✓ John Smith - DOB: 1985-03-15
  ✓ Jane Doe - DOB: 1990-07-22
  ✓ Bob Johnson - DOB: 1978-11-08
  (42 more...)
Patient Info:  
  Name: John Smith
  DOB: March 15, 1985
  Gender: Male
  Status: Pre-Op
  [View Full DPI] button
```

---

## 🎯 Final Verification

**The frontend is working when**:
1. ✅ You see real patient names (not empty list)
2. ✅ KPI cards show real numbers (not zeros)
3. ✅ Network requests show 200 responses
4. ✅ Browser console has no red errors
5. ✅ "View Full DPI" navigates to patient page

**If all 5 are true → Frontend is successfully connected to backend!**

---

## 📝 Next Steps After Verification

1. **Create IADE Test User** (to test intraoperative dashboard)
2. **Create SSPI Test User** (to test post-op dashboard)
3. **Test role-based access** (login as IADE, should see IADE dashboard)
4. **Test data refresh** (add new patient to database, should appear in real-time)
5. **Test on mobile** (check responsive design)

---

**Estimated Time**: 5 minutes
**Complexity**: Very simple
**Expected Result**: ✅ Frontend fully connected to backend with real patient data displayed

🎉 **You're ready to verify the integration!**
