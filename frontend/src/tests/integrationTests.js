import { api } from '../api/client';

/**
 * Quick Integration Test Script
 * Run these tests to verify frontend-backend integration
 * 
 * Usage:
 * 1. Navigate to any page
 * 2. Open browser console (F12)
 * 3. Copy-paste each test and run
 * 4. Check output
 */

// ==========================================
// TEST 1: API Client Health Check
// ==========================================
export const testAPIHealth = async () => {
  console.log('🏥 TEST 1: API Health Check');
  try {
    const response = await api.health?.() || api.client.get('/health/');
    console.log('✅ Backend is online:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
};

// ==========================================
// TEST 2: Patient Data Loading
// ==========================================
export const testPatientData = async () => {
  console.log('👥 TEST 2: Patient Data Loading');
  try {
    const response = await api.getPatients();
    const patients = response.data.results || response.data;
    console.log(`✅ Found ${patients.length} patients`);
    console.log('Sample patient:', patients[0]);
    return patients.length > 0;
  } catch (error) {
    console.error('❌ Failed to load patients:', error.message);
    return false;
  }
};

// ==========================================
// TEST 3: Specific Patient Details
// ==========================================
export const testPatientDetails = async (patientId = 1) => {
  console.log(`👤 TEST 3: Patient #${patientId} Details`);
  try {
    const response = await api.getPatient(patientId);
    console.log('✅ Patient details loaded:', {
      id: response.data.id,
      name: `${response.data.first_name} ${response.data.last_name}`,
      dob: response.data.birth_date,
      gender: response.data.gender
    });
    return true;
  } catch (error) {
    console.error(`❌ Failed to load patient #${patientId}:`, error.message);
    return false;
  }
};

// ==========================================
// TEST 4: Case Data Loading
// ==========================================
export const testCaseData = async () => {
  console.log('📋 TEST 4: Case Data Loading');
  try {
    const response = await api.getCases();
    const cases = response.data.results || response.data;
    console.log(`✅ Found ${cases.length} cases`);
    if (cases.length > 0) {
      console.log('Sample case:', cases[0]);
    }
    return cases.length >= 0;
  } catch (error) {
    console.error('❌ Failed to load cases:', error.message);
    return false;
  }
};

// ==========================================
// TEST 5: PerOp Sessions (IADE Dashboard)
// ==========================================
export const testPerOpSessions = async () => {
  console.log('🏥 TEST 5: PerOp Sessions (IADE Data)');
  try {
    const response = await api.getPerOpSessions();
    const sessions = response.data.results || response.data;
    console.log(`✅ Found ${sessions.length} sessions`);
    if (sessions.length > 0) {
      console.log('Sample session:', sessions[0]);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to load PerOp sessions:', error.message);
    return false;
  }
};

// ==========================================
// TEST 6: Alerts
// ==========================================
export const testAlerts = async () => {
  console.log('🚨 TEST 6: Alerts');
  try {
    const response = await api.getAlerts();
    const alerts = response.data.results || response.data;
    console.log(`✅ Found ${alerts.length} alerts`);
    if (alerts.length > 0) {
      console.log('Sample alert:', alerts[0]);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to load alerts:', error.message);
    return false;
  }
};

// ==========================================
// TEST 7: DME/DPI Records
// ==========================================
export const testDMERecords = async (patientId = 1) => {
  console.log(`📊 TEST 7: DME/DPI Records for Patient #${patientId}`);
  try {
    const response = await api.getDMEPatient(patientId);
    console.log('✅ DME/DPI records loaded:', {
      hasData: !!response.data,
      fields: Object.keys(response.data || {}).slice(0, 5)
    });
    return !!response.data;
  } catch (error) {
    console.error(`❌ Failed to load DME for patient #${patientId}:`, error.message);
    return false;
  }
};

// ==========================================
// COMPREHENSIVE TEST SUITE
// ==========================================
export const runAllTests = async () => {
  console.log('🧪 RUNNING COMPREHENSIVE INTEGRATION TEST SUITE\n');
  
  const results = {
    health: await testAPIHealth(),
    patients: await testPatientData(),
    patientDetails: await testPatientDetails(1),
    cases: await testCaseData(),
    perOpSessions: await testPerOpSessions(),
    alerts: await testAlerts(),
    dmeRecords: await testDMERecords(1)
  };

  // Summary
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log('\n📊 TEST SUMMARY');
  console.log('═════════════════════════');
  console.log(`Passed: ${passed}/${total}`);
  console.log('═════════════════════════\n');
  
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED - Backend integration successful!');
  } else {
    console.log('⚠️  Some tests failed - Check errors above');
  }
  
  return results;
};

// ==========================================
// USAGE INSTRUCTIONS
// ==========================================
/*
To use these tests:

1. In browser console, paste this entire file or import it:
   
   import * as tests from './integrationTests';
   
2. Then run individual tests:
   
   tests.testAPIHealth();
   tests.testPatientData();
   tests.testPerOpSessions();
   
3. Or run all at once:
   
   tests.runAllTests();

Expected output for successful tests:
✅ Backend is online
✅ Found N patients
✅ Patient details loaded
✅ Found N cases
✅ Found N sessions
✅ Found N alerts
✅ DME/DPI records loaded
*/
