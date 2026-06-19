/**
 * Genoid Tech — Admin Panel JS
 * Handles login, certificate CRUD, uploads, pagination
 */

const API = '';
let adminToken = localStorage.getItem('genoidAdminToken') || null;

// ─── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    showDashboard();
    loadCertificates();
    loadCurrentSettings();
  }

  // Press Enter on password field to login
  document.getElementById('admin-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminLogin();
  });
});

// ─── Login ────────────────────────────────────────────────
async function adminLogin() {
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;
  const errEl   = document.getElementById('login-error');
  const btnText = document.getElementById('login-btn-text');
  const loader  = document.getElementById('login-loader');

  if (!username || !password) {
    showAlert(errEl, 'error', 'Please enter username and password.');
    return;
  }

  btnText.classList.add('hidden');
  loader.classList.remove('hidden');
  errEl.classList.add('hidden');

  try {
    const res  = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('genoidAdminToken', adminToken);
      showDashboard();
      loadCertificates();
      loadCurrentSettings();
    } else {
      showAlert(errEl, 'error', data.message || 'Invalid credentials.');
    }
  } catch (err) {
    showAlert(errEl, 'error', 'Server error. Please try again.');
  } finally {
    btnText.classList.remove('hidden');
    loader.classList.add('hidden');
  }
}

function adminLogout() {
  adminToken = null;
  localStorage.removeItem('genoidAdminToken');
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-dashboard').classList.remove('hidden');
}

// ─── Auth Fetch Helper ────────────────────────────────────
async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });

  // Token expired
  if (res.status === 401 || res.status === 403) {
    adminLogout();
    throw new Error('Session expired. Please log in again.');
  }
  return res;
}

// ─── Tab Navigation ───────────────────────────────────────
function showTab(tabId, linkEl) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(tabId).classList.remove('hidden');
  if (linkEl) linkEl.classList.add('active');
  return false;
}

// ─── Load Certificates ────────────────────────────────────
let currentPage = 1;
let searchTimeout = null;

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage = 1;
    loadCertificates();
  }, 350);
}

async function loadCertificates() {
  const search = document.getElementById('cert-search')?.value.trim() || '';
  const tbody  = document.getElementById('cert-table-body');
  tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Loading…</td></tr>';

  try {
    const res  = await authFetch(`${API}/api/admin/certificates?page=${currentPage}&limit=15&search=${encodeURIComponent(search)}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    renderTable(data.certificates);
    renderPagination(data.pagination);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderTable(certs) {
  const tbody = document.getElementById('cert-table-body');

  if (!certs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No certificates found.</td></tr>';
    return;
  }

  tbody.innerHTML = certs.map(c => `
    <tr>
      <td class="cert-id-cell">${escapeHtml(c.certificateId)}</td>
      <td>${escapeHtml(c.candidateName)}</td>
      <td style="font-size:0.82rem;color:var(--gray-500)">${escapeHtml(getProgramName(c))}</td>
      <td>${formatDateShort(c.dateOfIssue)}</td>
      <td><span class="status-badge ${c.isActive ? 'status-active' : 'status-inactive'}">${c.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-icon btn-edit" onclick="editCertificate('${escapeHtml(c._id)}', '${escapeJs(JSON.stringify(c))}')" title="Edit">✏️</button>
          <button class="btn-icon btn-del"  onclick="openDeleteModal('${escapeHtml(c._id)}', '${escapeHtml(c.certificateId)}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getProgramName(c) {
  return c.internshipName || c.courseName || c.workshopName || c.eventName || '—';
}

function renderPagination(p) {
  const wrap = document.getElementById('pagination-wrap');
  if (!p || p.pages <= 1) { wrap.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= p.pages; i++) {
    html += `<button class="page-btn ${i === p.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  wrap.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  loadCertificates();
}

// ─── Add / Edit Certificate Form ──────────────────────────
let editingCertDbId = null;

function editCertificate(dbId, certJsonStr) {
  const cert = JSON.parse(certJsonStr);
  editingCertDbId = dbId;

  document.getElementById('edit-cert-db-id').value = dbId;
  document.getElementById('add-form-title').textContent = 'Edit Certificate';
  document.getElementById('f-certificateId').value = cert.certificateId || '';
  document.getElementById('f-certificateId').disabled = true; // ID not editable
  document.getElementById('f-candidateName').value  = cert.candidateName  || '';
  document.getElementById('f-dateOfIssue').value    = cert.dateOfIssue ? cert.dateOfIssue.substring(0, 10) : '';
  document.getElementById('f-courseName').value     = cert.courseName     || '';
  document.getElementById('f-internshipName').value = cert.internshipName || '';
  document.getElementById('f-workshopName').value   = cert.workshopName   || '';
  document.getElementById('f-eventName').value      = cert.eventName      || '';
  document.getElementById('f-duration').value       = cert.duration       || '';
  document.getElementById('f-issuedBy').value       = cert.issuedBy       || 'Genoid Tech';
  document.getElementById('f-signatoryName').value  = cert.signatoryName  || '';
  document.getElementById('f-signatoryDesig').value = cert.signatoryDesig || '';

  showTab('tab-add', document.querySelector('.sidebar-link[onclick*="tab-add"]'));
}

function cancelEditForm() {
  clearAddForm();
  showTab('tab-certificates', document.querySelector('.sidebar-link[onclick*="tab-certificates"]'));
  loadCertificates();
}

function clearAddForm() {
  editingCertDbId = null;
  document.getElementById('add-form-title').textContent = 'Add Certificate';
  document.getElementById('f-certificateId').disabled = false;
  document.getElementById('f-certificateId').value = '';
  ['candidateName','dateOfIssue','courseName','internshipName','workshopName',
   'eventName','duration','signatoryName','signatoryDesig'].forEach(id => {
    document.getElementById(`f-${id}`).value = '';
  });
  document.getElementById('f-issuedBy').value = 'Genoid Tech';
  document.getElementById('add-alert').innerHTML = '';
}

async function saveCertificate() {
  const alertEl = document.getElementById('add-alert');
  const saveText = document.getElementById('save-btn-text');
  const saveLoader = document.getElementById('save-loader');

  const body = {
    certificateId:  document.getElementById('f-certificateId').value.trim(),
    candidateName:  document.getElementById('f-candidateName').value.trim(),
    dateOfIssue:    document.getElementById('f-dateOfIssue').value,
    courseName:     document.getElementById('f-courseName').value.trim(),
    internshipName: document.getElementById('f-internshipName').value.trim(),
    workshopName:   document.getElementById('f-workshopName').value.trim(),
    eventName:      document.getElementById('f-eventName').value.trim(),
    duration:       document.getElementById('f-duration').value.trim(),
    issuedBy:       document.getElementById('f-issuedBy').value.trim() || 'Genoid Tech',
    signatoryName:  document.getElementById('f-signatoryName').value.trim(),
    signatoryDesig: document.getElementById('f-signatoryDesig').value.trim(),
  };

  // Validate required fields
  if (!editingCertDbId && !body.certificateId) {
    showAlert(alertEl, 'error', 'Certificate ID is required.'); return;
  }
  if (!body.candidateName) {
    showAlert(alertEl, 'error', 'Candidate Name is required.'); return;
  }
  if (!body.dateOfIssue) {
    showAlert(alertEl, 'error', 'Date of Issue is required.'); return;
  }

  saveText.classList.add('hidden');
  saveLoader.classList.remove('hidden');

  try {
    let res;
    if (editingCertDbId) {
      res = await authFetch(`${API}/api/admin/certificates/${editingCertDbId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } else {
      res = await authFetch(`${API}/api/admin/certificates`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();

    if (data.success) {
      showAlert(alertEl, 'success', data.message || 'Certificate saved.');
      if (!editingCertDbId) {
        setTimeout(() => { clearAddForm(); }, 1500);
      }
    } else {
      showAlert(alertEl, 'error', data.message || 'Save failed.');
    }
  } catch (err) {
    showAlert(alertEl, 'error', err.message || 'Server error.');
  } finally {
    saveText.classList.remove('hidden');
    saveLoader.classList.add('hidden');
  }
}

// ─── Delete ───────────────────────────────────────────────
let deleteTargetId = null;

function openDeleteModal(dbId, certId) {
  deleteTargetId = dbId;
  document.getElementById('delete-cert-id-label').textContent = certId;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const alertArea = document.getElementById('alert-area');

  try {
    const res  = await authFetch(`${API}/api/admin/certificates/${deleteTargetId}`, { method: 'DELETE' });
    const data = await res.json();

    closeDeleteModal();

    if (data.success) {
      showAlert(alertArea, 'success', 'Certificate deleted successfully.');
      loadCertificates();
    } else {
      showAlert(alertArea, 'error', data.message || 'Delete failed.');
    }
  } catch (err) {
    closeDeleteModal();
    showAlert(alertArea, 'error', err.message || 'Server error.');
  }
}

// Close modal on overlay click
document.getElementById('delete-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('delete-modal')) closeDeleteModal();
});

// ─── File Uploads ─────────────────────────────────────────
function previewFile(type) {
  const fileInput  = document.getElementById(`${type === 'logo' ? 'logo' : 'sig'}-file`);
  const previewEl  = document.getElementById(`current-${type === 'logo' ? 'logo' : 'sig'}`);
  const placeholder = document.getElementById(`${type === 'logo' ? 'logo' : 'sig'}-placeholder-box`);
  const nameEl     = document.getElementById(`${type === 'logo' ? 'logo' : 'sig'}-preview-name`);

  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    previewEl.src = e.target.result;
    previewEl.classList.remove('hidden');
    placeholder.classList.add('hidden');
    nameEl.textContent = `Selected: ${file.name}`;
    nameEl.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

async function uploadFile(type) {
  const isLogo     = type === 'logo';
  const fileInput  = document.getElementById(`${isLogo ? 'logo' : 'sig'}-file`);
  const alertEl    = document.getElementById('settings-alert');
  const file       = fileInput.files[0];

  if (!file) {
    showAlert(alertEl, 'error', `Please choose a ${isLogo ? 'logo' : 'signature'} file first.`); return;
  }

  const formData = new FormData();
  formData.append(isLogo ? 'logo' : 'signature', file);

  try {
    const res = await fetch(`${API}/api/admin/upload/${isLogo ? 'logo' : 'signature'}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData,
    });

    if (res.status === 401 || res.status === 403) { adminLogout(); return; }

    const data = await res.json();
    if (data.success) {
      showAlert(alertEl, 'success', data.message);
      fileInput.value = '';
      document.getElementById(`${isLogo ? 'logo' : 'sig'}-preview-name`).classList.add('hidden');
    } else {
      showAlert(alertEl, 'error', data.message || 'Upload failed.');
    }
  } catch (err) {
    showAlert(alertEl, 'error', 'Upload error: ' + err.message);
  }
}

// ─── Load current settings (show existing logo/sig) ───────
async function loadCurrentSettings() {
  try {
    const res  = await authFetch(`${API}/api/admin/settings`);
    const data = await res.json();
    if (!data.success) return;

    const { settings } = data;

    if (settings.logo) {
      const el = document.getElementById('current-logo');
      el.src = `/uploads/logos/${settings.logo}`;
      el.classList.remove('hidden');
      document.getElementById('logo-placeholder-box').classList.add('hidden');
    }

    if (settings.signature) {
      const el = document.getElementById('current-sig');
      el.src = `/uploads/signatures/${settings.signature}`;
      el.classList.remove('hidden');
      document.getElementById('sig-placeholder-box').classList.add('hidden');
    }
  } catch (e) { /* silently fail */ }
}

// ─── Helpers ──────────────────────────────────────────────
function showAlert(el, type, msg) {
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (type === 'success') {
    setTimeout(() => { el.classList.add('hidden'); }, 4000);
  }
}

function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

function escapeJs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
