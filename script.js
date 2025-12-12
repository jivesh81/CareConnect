/* CareConnect pure JS logic
   - mirrors your React logic & sample DB
   - author: ChatGPT (converted)
*/

(() => {
  // --- DOM refs
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');

  const inputName = document.getElementById('input-name');
  const inputAge = document.getElementById('input-age');
  const btnLogin = document.getElementById('btn-login');

  const patientNameEl = document.getElementById('patient-name');
  const patientInfoEl = document.getElementById('patient-info');

  const btnLogout = document.getElementById('btn-logout');

  const btnAddReportToggle = document.getElementById('btn-add-report-toggle');
  const reportEntry = document.getElementById('report-entry');
  const btnSaveReport = document.getElementById('btn-save-report');
  const btnCancelReport = document.getElementById('btn-cancel-report');

  const reportDate = document.getElementById('report-date');
  const reportDiagnosis = document.getElementById('report-diagnosis');
  const reportPrescription = document.getElementById('report-prescription');
  const reportNotes = document.getElementById('report-notes');
  const reportsList = document.getElementById('reports-list');

  const symptomsInput = document.getElementById('input-symptoms');
  const btnSubmitSymptoms = document.getElementById('btn-submit-symptoms');

  const step1Panel = document.getElementById('step-1');
  const step2Panel = document.getElementById('step-2');
  const step3Panel = document.getElementById('step-3');

  const spinnerAnalysis = document.getElementById('analysis-spinner');
  const analysisResult = document.getElementById('analysis-result');

  const severityTitle = document.getElementById('severity-title');
  const severityUrgency = document.getElementById('severity-urgency');
  const analysisRecommendation = document.getElementById('analysis-recommendation');
  const matchedSpecialistEl = document.getElementById('matched-specialist');
  const riskFactorsEl = document.getElementById('risk-factors');

  const btnBook = document.getElementById('btn-book-appointment');
  const bookingSpinner = document.getElementById('booking-spinner');
  const bookingResult = document.getElementById('booking-result');

  const confirmCodeEl = document.getElementById('confirm-code');
  const bookDoctorEl = document.getElementById('book-doctor');
  const bookSpecialtyEl = document.getElementById('book-specialty');
  const bookDateEl = document.getElementById('book-date');
  const bookTimeEl = document.getElementById('book-time');
  const bookLocationEl = document.getElementById('book-location');

  const btnReset = document.getElementById('btn-reset');

  // --- App state (mirrors React)
  let isLoggedIn = false;
  let currentPatient = null;
  let step = 0; // 0 = login, 1 = report, 2 = analyze, 3 = connect
  let analysis = null;
  let appointment = null;

  // --- Simulated DB
  let patientDatabase = {
    'sarah johnson': {
      age: 45,
      conditions: ["Type 2 Diabetes", "Hypertension"],
      lastVisit: "Oct 15, 2024",
      reports: [
        { date: "Oct 15, 2024", diagnosis: "Type 2 Diabetes - Controlled", prescription: "Metformin 500mg, Lisinopril 10mg", notes: "Blood sugar levels stable. Continue current medication." },
        { date: "Aug 22, 2024", diagnosis: "Hypertension Follow-up", prescription: "Lisinopril 10mg", notes: "Blood pressure reading 128/82. Good progress." }
      ]
    },
    'john doe': {
      age: 32,
      conditions: ["Asthma"],
      lastVisit: "Nov 20, 2024",
      reports: [
        { date: "Nov 20, 2024", diagnosis: "Mild Asthma", prescription: "Albuterol inhaler as needed", notes: "Symptoms controlled with current treatment." }
      ]
    }
  };

  // --- Helpers
  function setLoginEnabled() {
    btnLogin.disabled = !(inputName.value.trim() && inputAge.value.trim());
  }
  inputName.addEventListener('input', setLoginEnabled);
  inputAge.addEventListener('input', setLoginEnabled);

  // render current patient to the left column
  function renderPatient() {
    if (!currentPatient) {
      patientNameEl.textContent = 'Guest';
      patientInfoEl.textContent = 'Age: — | Last Visit: —';
      reportsList.innerHTML = '';
      return;
    }
    patientNameEl.textContent = currentPatient.name;
    patientInfoEl.textContent = `Age: ${currentPatient.age} | Last Visit: ${currentPatient.lastVisit}`;
    // reports
    reportsList.innerHTML = '';
    const reports = currentPatient.reports || [];
    if (reports.length === 0) {
      reportsList.innerHTML = `<div class="report-card"><p class="muted">No medical history available. Add reports above to build history.</p></div>`;
    } else {
      reports.forEach(r => {
        const node = document.createElement('div');
        node.className = 'report-card';
        node.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start">
          <h5>${escapeHtml(r.diagnosis || 'No diagnosis')}</h5>
          <div class="date">${escapeHtml(r.date || '')}</div>
          </div>
          <p style="margin:8px 0"><strong>Prescription:</strong> ${escapeHtml(r.prescription || '—')}</p>
          <p class="muted">${escapeHtml(r.notes || '')}</p>`;
        reportsList.appendChild(node);
      });
    }
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }

  // login handler
  btnLogin.addEventListener('click', () => {
    const nameRaw = inputName.value.trim();
    const ageRaw = inputAge.value.trim();
    if (!nameRaw || !ageRaw) return;
    const normalized = nameRaw.toLowerCase().trim();
    const existing = patientDatabase[normalized];
    if (existing) {
      currentPatient = {
        name: nameRaw,
        age: existing.age,
        conditions: [...existing.conditions],
        lastVisit: existing.lastVisit,
        reports: [...existing.reports]
      };
    } else {
      currentPatient = { name: nameRaw, age: parseInt(ageRaw,10)||0, conditions: [], lastVisit: "First Visit", reports: [] };
    }
    isLoggedIn = true;
    step = 1;
    showApp();
    renderPatient();
    showStep(1);
  });

  // logout
  btnLogout.addEventListener('click', () => {
    isLoggedIn = false;
    currentPatient = null;
    inputName.value = '';
    inputAge.value = '';
    setLoginEnabled();
    hideApp();
    showStep(0);
  });

  // toggle report entry
  btnAddReportToggle.addEventListener('click', () => {
    reportEntry.classList.toggle('hidden');
  });
  btnCancelReport.addEventListener('click', () => {
    reportEntry.classList.add('hidden');
    clearReportForm();
  });

  function clearReportForm() {
    reportDate.value = '';
    reportDiagnosis.value = '';
    reportPrescription.value = '';
    reportNotes.value = '';
  }

  // save report
  btnSaveReport.addEventListener('click', () => {
    if (!currentPatient) { alert('Please login first'); return; }
    if (!reportDate.value || !reportDiagnosis.value.trim()) { alert('Date and diagnosis are required'); return; }
    const newR = {
      date: reportDate.value,
      diagnosis: reportDiagnosis.value.trim(),
      prescription: reportPrescription.value.trim(),
      notes: reportNotes.value.trim()
    };
    // update DB
    const key = currentPatient.name.toLowerCase().trim();
    const existing = patientDatabase[key] || { age: currentPatient.age, conditions: currentPatient.conditions, lastVisit: newR.date, reports: [] };
    existing.lastVisit = newR.date;
    existing.reports = [...(existing.reports||[]), newR];
    patientDatabase[key] = existing;

    // update current patient object
    currentPatient.reports = existing.reports;
    currentPatient.lastVisit = newR.date;

    renderPatient();
    clearReportForm();
    reportEntry.classList.add('hidden');
    alert('Report added successfully!');
  });

  // symptom submit
  symptomsInput.addEventListener('input', () => {
    btnSubmitSymptoms.disabled = !symptomsInput.value.trim();
  });
  btnSubmitSymptoms.addEventListener('click', () => {
    if (!currentPatient) { alert('Please login first'); return; }
    // go to analyze
    showStep(2);
    startAnalysis();
  });

  // analysis simulation
  function startAnalysis() {
    spinnerAnalysis.classList.remove('hidden');
    analysisResult.classList.add('hidden');

    // simulate 2.5s analysis
    setTimeout(() => {
      const hasDiabetes = (currentPatient.conditions || []).some(c => c.toLowerCase().includes('diabetes'));
      analysis = {
        severity: hasDiabetes ? 'Medium' : 'Low',
        urgency: hasDiabetes ? 'Moderate Priority' : 'Low Priority',
        recommendation: hasDiabetes ? 'Consultation with Endocrinologist recommended' : 'General practitioner consultation recommended',
        riskFactors: hasDiabetes ? ['Existing diabetes condition', 'Elevated blood sugar symptoms'] : ['No major risk factors identified'],
        matchedSpecialist: hasDiabetes ? 'Dr. Emily Chen - Endocrinologist' : 'Dr. Michael Smith - General Practitioner'
      };
      displayAnalysis();
    }, 2500);
  }

  function displayAnalysis() {
    spinnerAnalysis.classList.add('hidden');
    analysisResult.classList.remove('hidden');

    severityTitle.textContent = `Severity: ${analysis.severity}`;
    severityUrgency.textContent = analysis.urgency;
    analysisRecommendation.textContent = analysis.recommendation;
    matchedSpecialistEl.textContent = analysis.matchedSpecialist;
    riskFactorsEl.innerHTML = '';
    analysis.riskFactors.forEach(r => {
      const li = document.createElement('li'); li.textContent = r; riskFactorsEl.appendChild(li);
    });
  }

  // booking
  btnBook.addEventListener('click', () => {
    showStep(3);
    startBooking();
  });

  function startBooking() {
    bookingSpinner.classList.remove('hidden');
    bookingResult.classList.add('hidden');

    setTimeout(() => {
      appointment = {
        doctor: (analysis.matchedSpecialist||'Dr. Michael Smith - General Practitioner').split(' - ')[0],
        specialty: (analysis.matchedSpecialist||'Dr. Michael Smith - General Practitioner').split(' - ')[1] || '',
        date: 'December 10, 2024',
        time: '2:30 PM',
        location: 'City Medical Center - Room 304',
        confirmationCode: `CC-2024-${Math.floor(1000 + Math.random()*9000)}`
      };
      showBookingResult();
    }, 1800);
  }

  function showBookingResult() {
    bookingSpinner.classList.add('hidden');
    bookingResult.classList.remove('hidden');

    confirmCodeEl.textContent = appointment.confirmationCode;
    bookDoctorEl.textContent = appointment.doctor;
    bookSpecialtyEl.textContent = appointment.specialty;
    bookDateEl.textContent = appointment.date;
    bookTimeEl.textContent = appointment.time;
    bookLocationEl.textContent = appointment.location;
  }

  btnReset.addEventListener('click', () => {
    // reset to step 1 with same patient
    analysis = null;
    appointment = null;
    symptomsInput.value = '';
    showStep(1);
    // hide booking UI
    bookingResult.classList.add('hidden');
    analysisResult.classList.add('hidden');
    spinnerAnalysis.classList.add('hidden');
  });

  // UI show/hide helpers
  function showApp() {
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
  }
  function hideApp() {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
  }
  function showStep(n) {
    step = n;
    // step circles coloring (simple)
    const stepCircles = document.querySelectorAll('.step-circle');
    stepCircles.forEach(el => {
      const ds = Number(el.getAttribute('data-step')||0);
      if (ds <= n) { el.style.background = '#16a34a'; el.style.color = '#fff'; }
      else { el.style.background = '#e6eef4'; el.style.color = '#94a3b8'; }
    });
    // connectors
    document.getElementById('conn-1').style.background = n>=2 ? '#16a34a' : '#e6eef4';
    document.getElementById('conn-2').style.background = n>=3 ? '#16a34a' : '#e6eef4';

    step1Panel.classList.toggle('hidden', n !== 1);
    step2Panel.classList.toggle('hidden', n !== 2);
    step3Panel.classList.toggle('hidden', n !== 3);
  }

  // init: show login
  hideApp();
  renderPatient();
  showStep(0);

  // simple voice filler (non-functional placeholder) - optional
  document.getElementById('btn-voice').addEventListener('click', () => {
    alert('Voice input is a placeholder in this demo. Use the textarea to type symptoms.');
  });

  // small utility: enable/disable symptom button based on input
  btnSubmitSymptoms.disabled = true;

})();
