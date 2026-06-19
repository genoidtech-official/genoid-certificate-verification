/**
 * Genoid Tech — Certificate Verification JS
 * Handles API call, result rendering, and form reset
 */

const API_BASE = ''; // Same-origin — empty string means relative URL

// ─── Verify Certificate ────────────────────────────────────
async function verifyCertificate() {
  const input = document.getElementById('certId');
  const certId = input.value.trim();

  // Client-side validation
  if (!certId) {
    flashInput(input, 'Please enter a Certificate ID.');
    return;
  }
  if (certId.length > 100) {
    flashInput(input, 'Certificate ID is too long.');
    return;
  }

  setLoading(true);
  hideResults();

  try {
    const response = await fetch(`${API_BASE}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateId: certId }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showSuccess(data);
    } else {
      showError(data.message || 'Certificate not found. Please try again.');
    }

  } catch (err) {
    console.error('[Verify Error]', err);
    showError('Unable to connect to the server. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
}

// ─── Show Success Result ────────────────────────────────────
function showSuccess(data) {
  const { certificate: cert, org, verifiedAt } = data;

  // Build info items
  const infoItems = [];

  // Certificate ID — always first, full-width
  infoItems.push({ label: 'Certificate ID', value: cert.certificateId, id: true });

  // Candidate
  infoItems.push({ label: 'Candidate Name', value: cert.candidateName });

  // Program fields — only show non-empty ones
  if (cert.courseName)     infoItems.push({ label: 'Course',         value: cert.courseName });
  if (cert.internshipName) infoItems.push({ label: 'Internship',     value: cert.internshipName });
  if (cert.workshopName)   infoItems.push({ label: 'Workshop',       value: cert.workshopName });
  if (cert.eventName)      infoItems.push({ label: 'Event',          value: cert.eventName });
  if (cert.duration)       infoItems.push({ label: 'Duration',       value: cert.duration });

  infoItems.push({ label: 'Date of Issue', value: formatDate(cert.dateOfIssue) });
  infoItems.push({ label: 'Issued By',     value: cert.issuedBy || 'Genoid Tech' });

  // Render grid
  const grid = document.getElementById('cert-info-grid');
  grid.innerHTML = infoItems.map(item => `
    <div class="cert-info-item ${item.id ? 'id-item' : ''}">
      <div class="info-label">${item.label}</div>
      <div class="info-value">${escapeHtml(item.value || '—')}</div>
    </div>
  `).join('');

  // Signatory info
  const sigName  = document.getElementById('sig-name');
  const sigDesig = document.getElementById('sig-desig');
  sigName.textContent  = cert.signatoryName  || 'Authorized Signatory';
  sigDesig.textContent = cert.signatoryDesig || 'Genoid Tech';

  // Logo
  if (org.logo) {
    const resultLogo = document.getElementById('result-logo');
    resultLogo.src = org.logo;
    resultLogo.classList.remove('hidden');
    document.getElementById('result-logo-placeholder').classList.add('hidden');
  }

  // Signature
  if (org.signature) {
    const resultSig = document.getElementById('result-signature');
    resultSig.src = org.signature;
    resultSig.classList.remove('hidden');
    document.getElementById('sig-placeholder').classList.add('hidden');
  }

  // Timestamp
  document.getElementById('verified-at').textContent = `Verified on: ${formatDateTime(verifiedAt)}`;

  // Show section
  document.getElementById('success-result').classList.remove('hidden');
  document.getElementById('result-section').classList.remove('hidden');

  // Scroll to result
  document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Show Error Result ──────────────────────────────────────
function showError(message) {
  document.getElementById('error-message').textContent = message;
  document.getElementById('error-result').classList.remove('hidden');
  document.getElementById('result-section').classList.remove('hidden');

  document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Reset Form ─────────────────────────────────────────────
function resetForm() {
  document.getElementById('certId').value = '';
  hideResults();
  document.getElementById('verify-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('certId').focus();
}

// ─── Helpers ────────────────────────────────────────────────
function hideResults() {
  document.getElementById('result-section').classList.add('hidden');
  document.getElementById('success-result').classList.add('hidden');
  document.getElementById('error-result').classList.add('hidden');
  // Reset logo/signature to placeholders
  document.getElementById('result-logo').classList.add('hidden');
  document.getElementById('result-logo-placeholder').classList.remove('hidden');
  document.getElementById('result-signature').classList.add('hidden');
  document.getElementById('sig-placeholder').classList.remove('hidden');
}

function setLoading(loading) {
  const btn     = document.getElementById('verifyBtn');
  const btnText = btn.querySelector('.btn-text');
  const loader  = btn.querySelector('.btn-loader');

  btn.disabled = loading;
  if (loading) {
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    loader.classList.add('hidden');
  }
}

function flashInput(input, msg) {
  input.style.borderColor = '#dc2626';
  input.style.boxShadow = '0 0 0 4px rgba(220,38,38,0.12)';
  input.placeholder = msg;
  input.focus();
  setTimeout(() => {
    input.style.borderColor = '';
    input.style.boxShadow = '';
    input.placeholder = 'e.g. GT2026AI001 or AI-WORKSHOP-001';
  }, 2500);
}

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── Load org logo into navbar ──────────────────────────────
async function loadOrgLogo() {
  try {
    // We fetch settings via a lightweight ping; logo URL is served statically
    // Try fetching logo from known path — if it errors, keep placeholder
    const logoEl  = document.getElementById('hero-logo');
    const navLogo = document.getElementById('nav-logo');
    const placeholder = document.getElementById('logo-placeholder');

    // Attempt to load logo; if 404, hide silently
    const testImg = new Image();
    testImg.onload = () => {
      logoEl.src = testImg.src;
      logoEl.classList.remove('hidden');
      placeholder.classList.add('hidden');
      navLogo.src = testImg.src;
      navLogo.classList.remove('hidden');
    };
    // We don't know the filename; admin must be logged in to get settings
    // Logo is auto-shown after upload via admin panel caching or refreshing page
  } catch (e) { /* Keep placeholder */ }
}

// ─── Allow pressing Enter to verify ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('certId');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyCertificate();
    });
    input.focus();
  }
});
