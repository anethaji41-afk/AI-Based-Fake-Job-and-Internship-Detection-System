/**
 * SENTINELGUARD AI - STUDENT VAULT & DASHBOARD CONTROLLER
 * Manages scan history, local storage persistence, filtering, and export.
 */

class DashboardController {
  constructor() {
    this.storageKey = 'sentinel_scan_vault';
    this.reportsKey = 'sentinel_reports_vault';
    this.history = [];
    this.reports = [];
    this.init();
  }

  init() {
    this.loadData();
    this.render();
  }

  loadData() {
    try {
      const savedHistory = localStorage.getItem(this.storageKey);
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
      } else {
        // Seed with sample initial scans for demo experience
        this.history = [
          {
            id: 'SG-91823',
            timestamp: new Date(Date.now() - 3600000 * 2).toLocaleDateString(),
            jobTitle: 'Telegram Video Review Assistant',
            company: 'Apex Media Online',
            riskScore: 88,
            riskLevel: 'veryhigh',
            riskLevelLabel: 'CRITICAL FRAUD RISK',
            topWarning: 'Redirects to Telegram & upfront deposit demand'
          },
          {
            id: 'SG-74102',
            timestamp: new Date(Date.now() - 86400000).toLocaleDateString(),
            jobTitle: 'Associate Software Engineer - Frontend',
            company: 'Datadog Technologies Inc.',
            riskScore: 12,
            riskLevel: 'low',
            riskLevelLabel: 'LOW RISK',
            topWarning: 'None (Verified corporate domain)'
          },
          {
            id: 'SG-65019',
            timestamp: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
            jobTitle: 'Remote Data Entry & Back Office Assistant',
            company: 'Global Business Process Pvt Ltd',
            riskScore: 92,
            riskLevel: 'veryhigh',
            riskLevelLabel: 'CRITICAL FRAUD RISK',
            topWarning: 'Mandatory ₹2,499 software license deposit'
          }
        ];
        this.saveData();
      }

      const savedReports = localStorage.getItem(this.reportsKey);
      this.reports = savedReports ? JSON.parse(savedReports) : [];
    } catch (e) {
      console.error('Failed to load dashboard storage:', e);
      this.history = [];
    }
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
      localStorage.setItem(this.reportsKey, JSON.stringify(this.reports));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  addScanResult(result) {
    const topWarning = result.warningSignals && result.warningSignals.length > 0 
      ? result.warningSignals[0].name 
      : 'None (Legitimate indicators)';

    const record = {
      id: result.id,
      timestamp: new Date().toLocaleDateString(),
      jobTitle: result.jobTitle || 'Unspecified Role',
      company: result.company || 'Unknown Organization',
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      riskLevelLabel: result.riskLevelLabel,
      topWarning: topWarning,
      fullResult: result
    };

    this.history.unshift(record);
    if (this.history.length > 100) this.history.pop();
    this.saveData();
    this.render();
  }

  addReport(reportData) {
    this.reports.unshift(reportData);
    this.saveData();
    this.render();
  }

  render() {
    this.updateStats();
    this.filterHistory();
  }

  updateStats() {
    const totalScans = this.history.length;
    const highRisk = this.history.filter(h => h.riskScore >= 60).length;
    const legitJobs = this.history.filter(h => h.riskScore < 30).length;
    const reportsCount = this.reports.length;

    const elTotal = document.getElementById('dash-total-scans');
    const elHigh = document.getElementById('dash-high-risk');
    const elLegit = document.getElementById('dash-legit-jobs');
    const elReports = document.getElementById('dash-reports-submitted');

    if (elTotal) elTotal.textContent = totalScans;
    if (elHigh) elHigh.textContent = highRisk;
    if (elLegit) elLegit.textContent = legitJobs;
    if (elReports) elReports.textContent = reportsCount;
  }

  filterHistory() {
    const searchVal = (document.getElementById('dash-search-input')?.value || '').toLowerCase();
    const riskFilter = document.getElementById('dash-risk-filter')?.value || 'all';
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    const filtered = this.history.filter(item => {
      const matchSearch = item.jobTitle.toLowerCase().includes(searchVal) ||
                          item.company.toLowerCase().includes(searchVal);

      let matchRisk = true;
      if (riskFilter === 'high') matchRisk = item.riskScore >= 60;
      else if (riskFilter === 'medium') matchRisk = item.riskScore >= 30 && item.riskScore < 60;
      else if (riskFilter === 'low') matchRisk = item.riskScore < 30;

      return matchSearch && matchRisk;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            No matching job scans found in vault. Run an analysis to populate records.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      let pillClass = 'tier-low';
      if (item.riskScore >= 80) pillClass = 'tier-veryhigh';
      else if (item.riskScore >= 60) pillClass = 'tier-high';
      else if (item.riskScore >= 30) pillClass = 'tier-medium';

      return `
        <tr>
          <td><span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${item.timestamp}</span></td>
          <td><strong style="color: #fff;">${this.escapeHtml(item.jobTitle)}</strong></td>
          <td>${this.escapeHtml(item.company)}</td>
          <td><strong style="font-size: 1.1rem; color: ${item.riskScore >= 60 ? '#ff2a5f' : (item.riskScore >= 30 ? '#fbbf24' : '#10b981')}">${item.riskScore} / 100</strong></td>
          <td><span class="risk-pill ${pillClass}">${item.riskLevelLabel}</span></td>
          <td><span style="font-size: 0.85rem; color: var(--text-sub);">${this.escapeHtml(item.topWarning)}</span></td>
          <td>
            <button class="action-icon-btn" onclick="dashboard.viewItemDetails('${item.id}')">View</button>
            <button class="action-icon-btn" style="color: #ff4d79;" onclick="dashboard.deleteItem('${item.id}')">✕</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  viewItemDetails(id) {
    const item = this.history.find(h => h.id === id);
    if (!item) return;

    if (item.fullResult) {
      app.renderAnalysisResult(item.fullResult);
      app.navigate('result');
      audioEngine.playBeep(880, 0.08);
    } else {
      app.showToast(`Showing summary for ${item.jobTitle}`, 'info');
    }
  }

  deleteItem(id) {
    this.history = this.history.filter(h => h.id !== id);
    this.saveData();
    this.render();
    audioEngine.playBeep(440, 0.05);
    app.showToast('Record deleted from vault', 'info');
  }

  clearAllHistory() {
    if (confirm('Are you sure you want to clear your local verification history?')) {
      this.history = [];
      this.saveData();
      this.render();
      audioEngine.playBeep(350, 0.1);
      app.showToast('Verification vault cleared', 'info');
    }
  }

  exportHistory(format) {
    if (this.history.length === 0) {
      app.showToast('No scan records to export', 'error');
      return;
    }

    if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.history, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sentinel_guard_history_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      app.showToast('Exported scan history as JSON', 'success');
    } else if (format === 'csv') {
      const headers = ['ID', 'Date', 'Job Title', 'Company', 'Risk Score', 'Risk Level', 'Top Warning'];
      const rows = this.history.map(h => [
        `"${h.id}"`,
        `"${h.timestamp}"`,
        `"${(h.jobTitle || '').replace(/"/g, '""')}"`,
        `"${(h.company || '').replace(/"/g, '""')}"`,
        h.riskScore,
        `"${h.riskLevelLabel}"`,
        `"${(h.topWarning || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodeURI(csvContent));
      downloadAnchor.setAttribute("download", `sentinel_guard_history_${Date.now()}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      app.showToast('Exported scan history as CSV', 'success');
    }
    audioEngine.playSafeChime();
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

const dashboard = new DashboardController();
