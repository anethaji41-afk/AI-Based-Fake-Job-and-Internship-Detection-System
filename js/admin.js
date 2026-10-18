/**
 * SENTINELGUARD AI - ADMINISTRATOR OPS & THREAT INTEL CONTROLLER
 * Handles report moderation, dynamic threshold adjustments, 
 * simulated ML retraining, and domain blacklists.
 */

class AdminController {
  constructor() {
    this.pendingReports = [
      {
        id: 'REP-1049',
        title: 'Telegram Video Rating Clerk',
        company: 'Daily Tasks Global',
        category: 'Telegram Task Scam',
        handle: 'Telegram: @task_pay_india',
        narrative: 'Demanded ₹3,000 security deposit after 2 tasks to unlock daily payment withdrawal.'
      },
      {
        id: 'REP-1050',
        title: 'Data Entry Backoffice Fresher',
        company: 'TechServe Logistics',
        category: 'Upfront Registration Fee',
        handle: 'UPI: payment_clear@ybl',
        narrative: 'Required ₹1,999 registration fee for software license before sending job agreement.'
      },
      {
        id: 'REP-1051',
        title: 'Google Campus Recruiter',
        company: 'Google LLC (Spoofed)',
        category: 'Brand Impersonation',
        handle: 'careers-google-verify.top',
        narrative: 'Sent fake offer letter from @gmail address directing to phishing portal to enter bank login.'
      }
    ];

    this.init();
  }

  init() {
    this.renderReportsTable();
  }

  renderReportsTable() {
    const tbody = document.getElementById('admin-reports-table-body');
    const badge = document.getElementById('admin-pending-count');
    if (badge) badge.textContent = `${this.pendingReports.length} Pending`;

    if (!tbody) return;

    if (this.pendingReports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--safe-green);">
            ✓ All student scam reports have been reviewed and moderated!
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = this.pendingReports.map(rep => `
      <tr id="row-${rep.id}">
        <td><code>${rep.id}</code></td>
        <td><strong>${this.escape(rep.title)}</strong><br><span style="font-size: 0.8rem; color: var(--text-muted);">${this.escape(rep.company)}</span></td>
        <td><span class="tag-crimson">${this.escape(rep.category)}</span></td>
        <td><code>${this.escape(rep.handle)}</code></td>
        <td><span style="font-size: 0.85rem; color: var(--text-sub);">${this.escape(rep.narrative)}</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="action-icon-btn" style="color: var(--safe-green); border-color: rgba(16,185,129,0.3);" onclick="adminPanel.moderateReport('${rep.id}', 'approve')">Confirm Fraud</button>
            <button class="action-icon-btn" style="color: var(--text-muted);" onclick="adminPanel.moderateReport('${rep.id}', 'dismiss')">Dismiss</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  moderateReport(id, action) {
    this.pendingReports = this.pendingReports.filter(r => r.id !== id);
    this.renderReportsTable();

    if (action === 'approve') {
      audioEngine.playDangerAlarm();
      app.showToast(`Report ${id} confirmed. Domain added to threat intelligence!`, 'success');
    } else {
      audioEngine.playBeep(400, 0.08);
      app.showToast(`Report ${id} dismissed as inconclusive`, 'info');
    }
  }

  updateThreshold(val) {
    const display = document.getElementById('threshold-val');
    if (display) {
      display.textContent = `${val} Risk Score`;
    }
  }

  simulateRetrain() {
    audioEngine.playScanStart();
    app.showToast('Initiating ML Model Retraining Pipeline...', 'info');

    setTimeout(() => {
      audioEngine.playTone(660, 0.15);
      app.showToast('Extracting 1,240 verified student threat reports...', 'info');
    }, 700);

    setTimeout(() => {
      audioEngine.playTone(880, 0.2);
      app.showToast('Fitting Scikit-Learn TF-IDF & Logistic Regression hyper-parameters...', 'info');
    }, 1500);

    setTimeout(() => {
      audioEngine.playSafeChime();
      app.showToast('Model v2.5 published! Recall: 96.1%, Precision: 92.4%, F1: 0.94', 'success');

      // Update status chip
      const statusChip = document.querySelector('.system-status-chip .status-name');
      if (statusChip) statusChip.textContent = 'ML v2.5 Active';
    }, 2400);
  }

  escape(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

const adminPanel = new AdminController();
