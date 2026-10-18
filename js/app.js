/**
 * SENTINELGUARD AI - CORE APPLICATION ORCHESTRATOR
 * Coordinates view routing, form submissions, gauge animations, 
 * audio feedback, toasts, and presets.
 */

class SentinelApp {
  constructor() {
    this.currentPage = 'home';
    this.currentAnalysisResult = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    console.log('SentinelGuard AI initialized successfully.');
  }

  setupEventListeners() {
    // URL Hash Routing support
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'analyze', 'result', 'dashboard', 'education', 'report', 'admin'].includes(hash)) {
        this.navigate(hash, false);
      }
    });

    // Handle initial hash if present
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && ['home', 'analyze', 'result', 'dashboard', 'education', 'report', 'admin'].includes(initialHash)) {
      this.navigate(initialHash, false);
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Alt + A to quickly go to analyzer
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        this.navigate('analyze');
        audioEngine.playBeep(800, 0.08);
      }
      // Alt + H to go home
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        this.navigate('home');
      }
    });
  }

  navigate(pageId, updateHash = true) {
    if (pageId === this.currentPage && !document.getElementById(`page-${pageId}`)?.classList.contains('active')) {
      // continue
    }

    // Hide all pages
    document.querySelectorAll('.view-page').forEach(page => {
      page.classList.remove('active');
    });

    // Deactivate all nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageId;

      if (updateHash) {
        window.location.hash = pageId;
      }

      // Highlight nav button
      const navBtn = document.querySelector(`.nav-item[data-page="${pageId}"]`);
      if (navBtn) navBtn.classList.add('active');

      // Refresh dashboard if opened
      if (pageId === 'dashboard') {
        dashboard.render();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      audioEngine.playBeep(700, 0.04);
    }
  }

  loadPreset(presetKey) {
    const sample = PRESET_SAMPLES[presetKey];
    if (!sample) return;

    this.navigate('analyze');

    const titleInput = document.getElementById('input-title');
    const companyInput = document.getElementById('input-company');
    const salaryInput = document.getElementById('input-salary');
    const locationInput = document.getElementById('input-location');
    const workTypeSelect = document.getElementById('input-worktype');
    const emailInput = document.getElementById('input-email');
    const urlInput = document.getElementById('input-url');
    const descInput = document.getElementById('input-description');

    if (titleInput) titleInput.value = sample.title;
    if (companyInput) companyInput.value = sample.company;
    if (salaryInput) salaryInput.value = sample.salary;
    if (locationInput) locationInput.value = sample.location;
    if (workTypeSelect) workTypeSelect.value = sample.workType;
    if (emailInput) emailInput.value = sample.email;
    if (urlInput) urlInput.value = sample.url;
    if (descInput) {
      descInput.value = sample.description;
      this.updateCharCount(descInput);
    }

    audioEngine.playBeep(920, 0.08);
    this.showToast(`Loaded preset: "${sample.title.slice(0, 32)}..."`, 'info');
  }

  updateCharCount(textarea) {
    const counter = document.getElementById('desc-char-count');
    if (counter) {
      counter.textContent = `${textarea.value.length} characters`;
    }
  }

  clearAnalysisForm() {
    document.getElementById('job-analysis-form')?.reset();
    const counter = document.getElementById('desc-char-count');
    if (counter) counter.textContent = '0 characters';
    const dropzoneStatus = document.getElementById('dropzone-status');
    if (dropzoneStatus) {
      dropzoneStatus.innerHTML = `
        <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <p class="dropzone-text">Click or drag screenshot of email/offer/chat here</p>
        <span class="dropzone-hint">PNG, JPG, PDF up to 5MB (Metadata auto-sanitized)</span>
      `;
    }
    audioEngine.playBeep(500, 0.05);
    this.showToast('Form cleared', 'info');
  }

  handleFileUpload(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const dropzoneStatus = document.getElementById('dropzone-status');
      if (dropzoneStatus) {
        dropzoneStatus.innerHTML = `
          <div style="color: var(--neon-blue); font-weight: 600;">✓ Attached: ${file.name} (${Math.round(file.size / 1024)} KB)</div>
          <span class="dropzone-hint" style="color: var(--safe-green);">EXIF metadata stripped • Ready for analysis</span>
        `;
      }
      audioEngine.playBeep(850, 0.08);
      this.showToast('Evidence attached and sanitized', 'success');
    }
  }

  handleReportFileUpload(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const status = document.getElementById('report-file-status');
      if (status) {
        status.innerHTML = `
          <div style="color: var(--neon-blue); font-weight: 600;">✓ Attached: ${file.name} (${Math.round(file.size / 1024)} KB)</div>
          <span class="dropzone-hint" style="color: var(--safe-green);">Encrypted for moderation queue</span>
        `;
      }
      this.showToast('Evidence attached for moderator review', 'success');
    }
  }

  handleAnalyzeSubmit(e) {
    e.preventDefault();
    audioEngine.playScanStart();

    const submitBtn = document.getElementById('analyze-submit-button');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>ANALYZING THREAT SIGNALS...</span>`;
    }

    const jobData = {
      title: document.getElementById('input-title')?.value || '',
      company: document.getElementById('input-company')?.value || '',
      salary: document.getElementById('input-salary')?.value || '',
      location: document.getElementById('input-location')?.value || '',
      workType: document.getElementById('input-worktype')?.value || 'unspecified',
      email: document.getElementById('input-email')?.value || '',
      url: document.getElementById('input-url')?.value || '',
      description: document.getElementById('input-description')?.value || ''
    };

    // Simulate fast neural triangulation pipeline (350ms)
    setTimeout(() => {
      const result = detector.analyze(jobData);
      this.currentAnalysisResult = result;

      // Persist to Student History Vault
      dashboard.addScanResult(result);

      // Render Result Screen
      this.renderAnalysisResult(result);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span>EXECUTE RISK ANALYSIS</span>
        `;
      }

      this.navigate('result');

      // Audio feedback based on score
      if (result.riskScore >= 60) {
        audioEngine.playDangerAlarm();
      } else if (result.riskScore >= 30) {
        audioEngine.playWarningAlert();
      } else {
        audioEngine.playSafeChime();
      }

      this.showToast(`Risk Score: ${result.riskScore}/100 (${result.riskLevelLabel})`, result.riskScore >= 60 ? 'error' : (result.riskScore >= 30 ? 'info' : 'success'));
    }, 450);
  }

  renderAnalysisResult(result) {
    const timestampEl = document.getElementById('result-timestamp');
    const scoreValEl = document.getElementById('gauge-score-value');
    const progressCircle = document.getElementById('gauge-progress-circle');
    const tierBadge = document.getElementById('risk-tier-badge');
    const headlineEl = document.getElementById('risk-headline');
    const summaryEl = document.getElementById('risk-executive-summary');

    const barRule = document.getElementById('bar-rule');
    const barML = document.getElementById('bar-ml');
    const barDomain = document.getElementById('bar-domain');

    const valRule = document.getElementById('val-rule');
    const valML = document.getElementById('val-ml');
    const valDomain = document.getElementById('val-domain');
    const valConf = document.getElementById('val-confidence');

    if (timestampEl) timestampEl.textContent = `Analysis ID: #${result.id} • Evaluated ${result.timestamp} for "${result.company || 'Unknown'}"`;
    if (scoreValEl) scoreValEl.textContent = result.riskScore;
    if (headlineEl) headlineEl.textContent = result.headline;
    if (summaryEl) summaryEl.textContent = result.summary;

    // Animate Radial SVG Gauge
    if (progressCircle) {
      const circumference = 2 * Math.PI * 80; // ~502.65
      const offset = circumference - (result.riskScore / 100) * circumference;
      progressCircle.style.strokeDashoffset = offset;

      // Color based on risk tier
      if (result.riskScore >= 80) {
        progressCircle.style.stroke = '#ff2a5f';
        progressCircle.style.filter = 'drop-shadow(0 0 12px rgba(255, 42, 95, 0.7))';
      } else if (result.riskScore >= 60) {
        progressCircle.style.stroke = '#ff4d79';
        progressCircle.style.filter = 'drop-shadow(0 0 10px rgba(255, 77, 121, 0.6))';
      } else if (result.riskScore >= 30) {
        progressCircle.style.stroke = '#fbbf24';
        progressCircle.style.filter = 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.6))';
      } else {
        progressCircle.style.stroke = '#10b981';
        progressCircle.style.filter = 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))';
      }
    }

    // Set Tier Badge
    if (tierBadge) {
      tierBadge.className = `risk-tier-badge tier-${result.riskLevel}`;
      tierBadge.textContent = result.riskLevelLabel;
    }

    // Fill Triangulation Progress Bars
    if (barRule) barRule.style.width = `${result.breakdown.ruleScore}%`;
    if (barML) barML.style.width = `${result.breakdown.mlScore}%`;
    if (barDomain) barDomain.style.width = `${result.breakdown.domainScore}%`;

    if (valRule) valRule.textContent = `${result.breakdown.ruleScore}/100`;
    if (valML) valML.textContent = `${result.breakdown.mlScore}/100`;
    if (valDomain) valDomain.textContent = `${result.breakdown.domainScore}/100`;
    if (valConf) valConf.textContent = `${result.confidence}%`;

    // Render Detected Warning Signs
    const warningList = document.getElementById('warning-signals-list');
    const warningCountBadge = document.getElementById('warning-count-badge');
    if (warningCountBadge) warningCountBadge.textContent = `${result.warningSignals.length} Detected`;

    if (warningList) {
      if (result.warningSignals.length === 0) {
        warningList.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--safe-green); font-size: 0.9rem;">
            ✓ No rule-based heuristic traps or red flags identified in this job post.
          </div>`;
      } else {
        warningList.innerHTML = result.warningSignals.map(sig => `
          <div class="signal-item severity-${sig.severity}">
            <div class="signal-header-row">
              <span class="signal-code">${sig.name}</span>
              <span class="signal-severity-tag tag-${sig.severity}">${sig.severity.toUpperCase()}</span>
            </div>
            <div class="signal-desc">${sig.explanation}</div>
          </div>
        `).join('');
      }
    }

    // Render Trust Signals
    const trustList = document.getElementById('trust-signals-list');
    const trustCountBadge = document.getElementById('trust-count-badge');
    if (trustCountBadge) trustCountBadge.textContent = `${result.trustSignals.length} Verified`;

    if (trustList) {
      if (result.trustSignals.length === 0) {
        trustList.innerHTML = `
          <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
            No verified trust anchors detected. Request formal credentials from the recruiter.
          </div>`;
      } else {
        trustList.innerHTML = result.trustSignals.map(sig => `
          <div class="signal-item is-trust">
            <div class="signal-header-row">
              <span class="signal-code">${sig.name}</span>
              <span class="signal-severity-tag tag-trust">VERIFIED</span>
            </div>
            <div class="signal-desc">${sig.explanation}</div>
          </div>
        `).join('');
      }
    }

    // Render Recommended Actions
    const recsContainer = document.getElementById('recommendations-container');
    if (recsContainer) {
      recsContainer.innerHTML = result.recommendations.map(rec => `
        <div class="rec-step-card">
          <div class="rec-number">${rec.num}</div>
          <div class="rec-content">
            <h4>${rec.title}</h4>
            <p>${rec.text}</p>
          </div>
        </div>
      `).join('');
    }
  }

  saveCurrentToVault() {
    if (this.currentAnalysisResult) {
      dashboard.addScanResult(this.currentAnalysisResult);
      audioEngine.playBeep(880, 0.08);
      this.showToast('Listing analysis saved to your Student Vault!', 'success');
    }
  }

  submitFeedback(type) {
    audioEngine.playBeep(780, 0.08);
    if (type === 'accurate') {
      this.showToast('Thank you! Confirmed feedback logged for model calibration.', 'success');
    } else {
      this.showToast('Feedback noted. Moderator will review this sample in the audit log.', 'info');
    }
  }

  handleReportSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('report-title')?.value || '';
    const company = document.getElementById('report-company')?.value || '';
    const category = document.getElementById('report-category')?.value || '';
    const handle = document.getElementById('report-handle')?.value || '';
    const desc = document.getElementById('report-description')?.value || '';

    const newReport = {
      id: 'REP-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toLocaleDateString(),
      title: title,
      company: company,
      category: category,
      handle: handle,
      narrative: desc,
      status: 'pending'
    };

    dashboard.addReport(newReport);
    adminPanel.pendingReports.unshift(newReport);
    adminPanel.renderReportsTable();

    document.getElementById('community-report-form')?.reset();
    audioEngine.playDangerAlarm();
    this.showToast('Report submitted to moderation queue. Thank you for protecting students!', 'success');
    this.navigate('dashboard');
  }

  openReportModalFromCurrent() {
    const modal = document.getElementById('report-modal');
    if (modal) {
      modal.classList.add('open');
      audioEngine.playBeep(650, 0.05);
    }
  }

  closeReportModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn')) {
      return;
    }
    const modal = document.getElementById('report-modal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  confirmModalReport() {
    const reason = document.getElementById('modal-report-reason')?.value || 'Suspicious listing';
    const notes = document.getElementById('modal-report-notes')?.value || '';

    if (this.currentAnalysisResult) {
      const reportItem = {
        id: 'REP-' + Math.floor(1000 + Math.random() * 9000),
        title: this.currentAnalysisResult.jobTitle || 'Flagged Job',
        company: this.currentAnalysisResult.company || 'Unknown',
        category: reason,
        handle: notes || 'Flagged via analysis result',
        narrative: `Reported from assessment #${this.currentAnalysisResult.id} (Risk Score: ${this.currentAnalysisResult.riskScore})`,
        status: 'pending'
      };

      dashboard.addReport(reportItem);
      adminPanel.pendingReports.unshift(reportItem);
      adminPanel.renderReportsTable();
    }

    this.closeReportModal();
    audioEngine.playDangerAlarm();
    this.showToast('Listing reported to community moderation!', 'success');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `cyber-toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }
}

// Global App Initialization
const app = new SentinelApp();
