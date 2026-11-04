(() => {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const title = k => ({dot:'DOT',non_dot:'Non-DOT',hair:'Hair',oral:'Oral',other:'Other'})[k] || String(k || 'Account').replaceAll('_', ' ').toUpperCase();
  const numberBlock = (k, v) => `<div class="lab-number"><span>${esc(title(k))}</span><strong>${esc(v)}</strong></div>`;
  function getNumbers(row) {
    const numbers = row.account_numbers || row.config?.account_numbers || {};
    const type = row.config?.account_type;
    // New rows represent one account number each; legacy rows may contain four types.
    if (type) return [[type, row.account_code || numbers[type]]].filter(([,v]) => v);
    const found = Object.entries(numbers).filter(([,v]) => v);
    return found.length ? found : (row.account_code ? [['dot', row.account_code]] : []);
  }
  window.CtpaLabAccounts = {
    render(data) {
      const rows = data.accounts || [];
      const code = data.company_code || rows[0]?.company_code || '';
      const numberCount = rows.reduce((n, r) => n + getNumbers(r).length, 0);
      const summary = `<div class="lab-account-summary">
        <div class="metric"><small>Assigned Laboratories</small><strong>${rows.length}</strong><span>Configured by screenings4u</span></div>
        <div class="metric"><small>Account Numbers</small><strong>${numberCount}</strong><span>Across all testing categories</span></div>
        <div class="metric"><small>Active Assignments</small><strong>${rows.filter(r=>r.status==='active').length}</strong><span>Managed by screenings4u</span></div>
      </div>`;
      const cards = rows.map(r => `<section class="lab-account-card section">
        <div class="lab-account-card-head"><div><h3>${esc(r.lab_name || 'Laboratory')}</h3>
          <p>${r.is_primary ? 'Primary lab account' : 'Assigned lab account'}</p></div>
          <span class="badge ${r.status === 'active' ? 'good' : 'warn'}">${esc(r.status || 'inactive')}</span></div>
        <div class="lab-number-grid">${getNumbers(r).map(([k,v]) => numberBlock(k,v)).join('')}</div>
        ${r.notes ? `<div class="lab-account-note"><strong>Notes:</strong> ${esc(r.notes)}</div>` : ''}
      </section>`).join('');
      return (code ? `<div class="lab-account-identity"><span>C/TPA Account</span><strong>${esc(code)}</strong></div>` : '') + summary +
        (rows.length ? cards : `<div class="panel"><div class="empty"><strong>No lab account numbers have been assigned to this C/TPA.</strong><br>Contact screenings4u for account provisioning.</div></div>`);
    },
  };
})();
