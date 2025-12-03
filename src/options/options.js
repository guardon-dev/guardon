import { showKyvernoPreview as kpShow, hideKyvernoPreview as kpHide, escapeHtml as kpEscapeHtml } from './kyvernoPreview.js';
import { parseSchemaText, summarizeSchema } from '../utils/clusterSchema.js';

let rules = [];
let editingIndex = null;

const tableBody = document.getElementById("rulesBody");
const ruleEditModal = document.getElementById("ruleEditModal");
const formTitle = document.getElementById("formTitle");

const inputs = {
  id: document.getElementById("ruleId"),
  desc: document.getElementById("ruleDesc"),
  kind: document.getElementById("ruleKind"),
  match: document.getElementById("ruleMatch"),
  pattern: document.getElementById("rulePattern"),
  required: document.getElementById("ruleRequired"),
  severity: document.getElementById("ruleSeverity"),
  message: document.getElementById("ruleMessage"),
  enabled: document.getElementById("ruleEnabled"),
  fix: document.getElementById("ruleFix"),
  rationale: document.getElementById("ruleRationale"),
  references: document.getElementById("ruleReferences"),
};

// Import-from-URL elements (added feature)
const importUrlInput = document.getElementById('importUrl');
const fetchUrlBtn = document.getElementById('fetchUrl');

// Kyverno preview modal helpers moved to `kyvernoPreview.js`; expose small wrappers
const kyvernoModal = document.getElementById('kyvernoModal');
const kyvernoPreviewBody = document.getElementById('kyvernoPreviewBody');
const kyvernoMeta = document.getElementById('kyvernoMeta');
const kyvernoImportConvertedBtn = document.getElementById('kyvernoImportConverted');
const kyvernoImportRawBtn = document.getElementById('kyvernoImportRaw');
const kyvernoCancelBtn = document.getElementById('kyvernoCancel');

let _kyvernoPreviewState = null; // { converted:[], rawText, meta }

function showKyvernoPreview(converted, rawText, meta = {}) {
  _kyvernoPreviewState = { converted, rawText, meta };
  try {
    console.debug('[options] showKyvernoPreview called - converted rules:', Array.isArray(converted) ? converted.length : 'no array');
    kpShow(converted, rawText, meta);
  } catch (e) {
    console.error('[options] kpShow threw', e && e.message);
    showToast('Failed to render Kyverno preview (see console)', { background: '#b91c1c' });
  }
}
function showToast(msg, opts = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = opts.background || '#111';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.transition = 'opacity 300ms ease';
    toast.style.opacity = '0';
    setTimeout(() => (toast.style.display = 'none'), 300);
  }, opts.duration || 2500);
}

function renderTable() {
  if (!tableBody) return;
  tableBody.innerHTML = '';
  rules.forEach((r, idx) => {
    const tr = document.createElement('tr');
    const tdId = document.createElement('td'); tdId.textContent = r.id || '';
    const tdEnabled = document.createElement('td');
    const enChk = document.createElement('input');
    enChk.type = 'checkbox';
    enChk.checked = (r.enabled === undefined) ? true : !!r.enabled;
    enChk.addEventListener('change', () => {
      rules[idx].enabled = !!enChk.checked;
      saveRules();
      tr.style.opacity = enChk.checked ? '1' : '0.5';
    });
    tdEnabled.appendChild(enChk);
    tdEnabled.style.textAlign = 'center';
    const tdDesc = document.createElement('td'); tdDesc.textContent = r.description || '';
    const tdKind = document.createElement('td'); tdKind.textContent = r.kind || '';
    const tdSeverity = document.createElement('td'); tdSeverity.textContent = r.severity || '';
    const tdActions = document.createElement('td');

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit');
    editBtn.addEventListener('click', () => editRule(idx));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.innerHTML = '🗑';
    delBtn.title = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete');
    delBtn.addEventListener('click', () => deleteRule(idx));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdEnabled);
    tr.style.opacity = (r.enabled === undefined || r.enabled) ? '1' : '0.5';
    tr.appendChild(tdDesc);
    tr.appendChild(tdKind);
    tr.appendChild(tdSeverity);
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  });
}

function hideKyvernoPreview() {
  _kyvernoPreviewState = null;
  try { kpHide(); } catch (e) { /* defensive */ }
}

function escapeHtml(s) { return kpEscapeHtml(s); }

window.editRule = function (idx) {
  editingIndex = idx;
  const r = rules[idx];
  ruleEditModal.style.display = "flex";
  formTitle.textContent = "Edit Rule";
  inputs.id.value = r.id;
  inputs.desc.value = r.description;
  inputs.kind.value = r.kind || '';
  inputs.match.value = r.match;
  inputs.pattern.value = r.pattern || "";
  inputs.required.value = (r.required === true || r.required === 'true') ? 'true' : 'false';
  inputs.severity.value = r.severity;
  inputs.message.value = r.message;
  if (inputs.enabled) inputs.enabled.checked = (r.enabled === undefined) ? true : !!r.enabled;
  if (inputs.fix) {
    try {
      inputs.fix.value = r.fix ? JSON.stringify(r.fix, null, 2) : '';
    } catch (e) { inputs.fix.value = '' }
  }
  if (inputs.rationale) inputs.rationale.value = r.explain && r.explain.rationale ? r.explain.rationale : '';
  if (inputs.references) inputs.references.value = r.explain && Array.isArray(r.explain.refs) ? r.explain.refs.join(',') : (r.references || '');
};

window.deleteRule = function (idx) {
  showDeleteConfirmation(idx);
};

// Enhanced delete confirmation dialog
function showDeleteConfirmation(idx) {
  const rule = rules[idx];
  if (!rule) return;

  const deleteModal = document.getElementById('deleteModal');
  const deleteRuleId = document.getElementById('deleteRuleId');
  const deleteRuleDesc = document.getElementById('deleteRuleDesc');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  const cancelDeleteBtn = document.getElementById('cancelDelete');

  // Populate modal with rule details
  if (deleteRuleId) deleteRuleId.textContent = rule.id || 'Unnamed rule';
  if (deleteRuleDesc) deleteRuleDesc.textContent = rule.description || 'No description';

  // Show modal
  if (deleteModal) {
    deleteModal.style.display = 'flex';
    
    // Focus management for accessibility
    if (cancelDeleteBtn) cancelDeleteBtn.focus();
  }

  // Handle confirmation
  const handleConfirm = () => {
    rules.splice(idx, 1);
    saveRules();
    renderTable();
    hideDeleteConfirmation();
    showToast(`Rule "${rule.id}" deleted successfully`, { background: '#059669' });
  };

  // Handle cancellation
  const handleCancel = () => {
    hideDeleteConfirmation();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && e.target === confirmDeleteBtn) {
      e.preventDefault();
      handleConfirm();
    }
  };

  // Clean up previous event listeners
  if (confirmDeleteBtn) {
    confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
    const newConfirmBtn = document.getElementById('confirmDelete');
    newConfirmBtn.addEventListener('click', handleConfirm);
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.replaceWith(cancelDeleteBtn.cloneNode(true));
    const newCancelBtn = document.getElementById('cancelDelete');
    newCancelBtn.addEventListener('click', handleCancel);
  }

  // Add keyboard event listener
  document.addEventListener('keydown', handleKeyDown);

  // Store cleanup function for later use
  window._deleteConfirmationCleanup = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

function hideDeleteConfirmation() {
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.style.display = 'none';
  }
  
  // Clean up event listeners
  if (window._deleteConfirmationCleanup) {
    window._deleteConfirmationCleanup();
    delete window._deleteConfirmationCleanup;
  }
}

const addRuleBtn = document.getElementById("addRule");
if (addRuleBtn) addRuleBtn.onclick = () => {
  editingIndex = null;
  formTitle.textContent = "Add Rule";
  Object.values(inputs).forEach(i => i.value = "");
  if (inputs.required) inputs.required.value = "false";
  if (inputs.severity) inputs.severity.value = "warning";
  ruleEditModal.style.display = "flex";
  if (inputs.enabled) inputs.enabled.checked = true;
};

const cancelRuleBtn = document.getElementById("cancelRule");
if (cancelRuleBtn) cancelRuleBtn.onclick = () => {
  ruleEditModal.style.display = "none";
};

const saveRuleBtn = document.getElementById("saveRule");
if (saveRuleBtn) saveRuleBtn.onclick = () => {
  console.debug('[options] saveRule clicked');
  const newRule = {
    id: (inputs.id && inputs.id.value ? inputs.id.value.trim() : ''),
    description: (inputs.desc && inputs.desc.value ? inputs.desc.value.trim() : ''),
    kind: (inputs.kind && inputs.kind.value ? inputs.kind.value.trim() : ''),
    match: (inputs.match && inputs.match.value ? inputs.match.value.trim() : ''),
    pattern: (inputs.pattern && inputs.pattern.value ? inputs.pattern.value.trim() : ''),
    required: (inputs.required && inputs.required.value) ? inputs.required.value === "true" : false,
    enabled: inputs.enabled ? !!inputs.enabled.checked : true,
    severity: (inputs.severity && inputs.severity.value) ? inputs.severity.value : 'warning',
    message: (inputs.message && inputs.message.value ? inputs.message.value.trim() : ''),
    // parse fix JSON if provided; keep as object
    fix: (function(){
      if (!inputs.fix) return undefined;
      const v = (inputs.fix.value || '').trim();
      if (!v) return undefined;
      try { return JSON.parse(v); } catch (e) { showToast('Fix JSON invalid: ' + (e && e.message), { background: '#b91c1c' }); return undefined; }
    })(),
    // explain metadata: rationale + refs (array)
    explain: (function(){
      if (!inputs || !inputs.rationale) return undefined;
      const rationale = (inputs.rationale.value || '').trim();
      const refsRaw = (inputs.references && inputs.references.value) ? String(inputs.references.value || '') : '';
      const refs = refsRaw.split(',').map(s=>s.trim()).filter(Boolean);
      if (!rationale && refs.length === 0) return undefined;
      return { rationale: rationale || '', refs };
    })(),
  };

  // Basic validation
  const missing = [];
  if (!newRule.id) missing.push('id');
  if (!newRule.description) missing.push('description');
  if (!newRule.match) missing.push('match');
  if (!newRule.pattern) missing.push('pattern');
  if (typeof newRule.required !== 'boolean') missing.push('required');
  if (!newRule.severity) missing.push('severity');
  if (!newRule.message) missing.push('message');

  if (missing.length) {
    showToast('Missing required fields: ' + missing.join(', '), { background: '#b91c1c' });
    return;
  }

  // Validate severity
  const allowedSeverities = ['info', 'warning', 'error'];
  if (!allowedSeverities.includes(newRule.severity)) {
    showToast('Severity must be one of: info, warning, error', { background: '#b91c1c' });
    return;
  }

  // Prevent duplicate IDs (unless editing the same index)
  const duplicateIdx = rules.findIndex((r, i) => r.id === newRule.id && i !== editingIndex);
  if (duplicateIdx !== -1) {
    // If we're editing an existing rule, allow update in place. If creating
    // a new rule (editingIndex is null) but the ID already exists, override
    // the existing rule to preserve user intent (import-like behavior).
    if (editingIndex === null) {
      rules[duplicateIdx] = newRule;
      saveRules();
      renderTable();
      showToast(`Replaced existing rule with id "${newRule.id}"`, { background: '#059669' });
      if (form) form.style.display = 'none';
      return;
    } else {
      // editingIndex is same as found index case will be skipped by findIndex
      showToast(`Rule ID "${newRule.id}" already exists. Choose a unique ID.`, { background: '#b91c1c' });
      return;
    }
  }

  if (editingIndex !== null) rules[editingIndex] = newRule;
  else rules.push(newRule);

  saveRules();
  ruleEditModal.style.display = 'none';
  renderTable();
  showToast(editingIndex !== null ? 'Rule updated' : 'Rule added', { background: '#059669' });
};

const importRulesBtn = document.getElementById("importRules");
if (importRulesBtn) importRulesBtn.onclick = async () => {
  // Show the import panel modal where users can upload a JSON file or paste JSON
  const modal = document.getElementById('importPanelModal');
  if (modal) modal.style.display = 'block';
};

function saveRules() {
  chrome.storage.local.set({ customRules: rules });
}

// Save original Kyverno policy text into storage for auditability.
function saveRawKyverno(rawText, meta = {}) {
  try {
    const entry = {
      id: meta.id || `kyverno-${Date.now()}`,
      url: meta.url || null,
      savedAt: new Date().toISOString(),
      text: rawText,
    };
    chrome.storage.local.get('rawKyvernoPolicies', (data) => {
      const arr = Array.isArray(data.rawKyvernoPolicies) ? data.rawKyvernoPolicies : [];
      arr.push(entry);
      chrome.storage.local.set({ rawKyvernoPolicies: arr }, () => {
        showToast('Stored original Kyverno policy for audit', { background: '#0ea5e9' });
      });
    });
  } catch (e) {
    console.debug('Failed to save raw Kyverno', e && e.message);
  }
}

// Wire Kyverno preview action buttons (wrappers are implemented in kyvernoPreview.js)

// Apply an array of converted rule-like objects (from kyvernoImporter) into
// the current `rules` collection. This mirrors the import logic used for
// JSON imports: normalize fields, avoid duplicates (replace by id), persist
// and refresh the table.
function applyNormalizedRules(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const normalized = items.map(r => ({
    id: String(r.id || (r.description ? r.description.replace(/\s+/g,'-').toLowerCase() : `rule-${Date.now()}`)).trim(),
    description: r.description || r.desc || '',
    kind: r.kind || '',
    match: r.match || '',
    pattern: r.pattern || '',
    required: (r.required === true || r.required === 'true'),
    severity: r.severity || 'warning',
    message: r.message || '',
    fix: r.fix !== undefined ? r.fix : undefined,
    explain: r.explain || undefined,
  }));

  let added = 0, replaced = 0;
  for (const nr of normalized) {
    if (!nr.id) continue;
    const idx = rules.findIndex(r => r.id === nr.id);
    if (idx !== -1) {
      rules[idx] = nr;
      replaced++;
    } else {
      rules.push(nr);
      added++;
    }
  }

  if (added || replaced) {
    try { saveRules(); } catch (e) { console.debug('saveRules failed', e && e.message); }
    try { renderTable(); } catch (e) { console.debug('renderTable failed', e && e.message); }
    showToast(`Imported ${added} new, replaced ${replaced} existing rule(s)`, { background: '#059669' });
  }
  return added + replaced;
}

if (kyvernoCancelBtn) kyvernoCancelBtn.addEventListener('click', hideKyvernoPreview);
if (kyvernoImportRawBtn) kyvernoImportRawBtn.addEventListener('click', () => {
  if (!_kyvernoPreviewState) return;
  saveRawKyverno(_kyvernoPreviewState.rawText, _kyvernoPreviewState.meta);
  hideKyvernoPreview();
});
if (kyvernoImportConvertedBtn) kyvernoImportConvertedBtn.addEventListener('click', () => {
  if (!_kyvernoPreviewState) return;
  // Collect selected checkboxes from the preview table. Each checkbox value
  // is the index into the converted array that was rendered earlier.
  const boxes = kyvernoPreviewBody.querySelectorAll('input.kyvernoRowCheckbox');
  const selected = [];
  boxes.forEach(b => {
    try {
      if (b.checked) {
        const idx = Number(b.value);
        const item = _kyvernoPreviewState.converted[idx];
        if (item) selected.push(item);
      }
    } catch (e) {}
  });

  if (!selected.length) {
    showToast('No converted rules selected to import.', { background: '#b91c1c' });
    return;
  }

  applyNormalizedRules(selected);
  // Also store raw policy for auditability
  saveRawKyverno(_kyvernoPreviewState.rawText, _kyvernoPreviewState.meta);
  hideKyvernoPreview();
});

// Fetch JSON from a URL and populate the import textarea. Tries a direct
// fetch first; if that fails (CORS/etc.) falls back to asking the
// background service worker to fetch the URL (requires host_permissions).
if (fetchUrlBtn) {
  fetchUrlBtn.addEventListener('click', async () => {
    const url = (importUrlInput && importUrlInput.value || '').trim();
    if (!url) {
      showToast('Enter a URL to fetch', { background: '#b91c1c' });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      showToast('Invalid URL', { background: '#b91c1c' });
      return;
    }

    const ta = document.getElementById('importTextarea');
    showToast('Fetching URL...', { background: '#f59e0b', duration: 4000 });

    // Try direct fetch first
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const text = await resp.text();
        // Try to auto-detect Kyverno policies in YAML
        let isKyverno = false;
        try {
          const docs = [];
          if (globalThis && globalThis.jsyaml && typeof globalThis.jsyaml.loadAll === 'function') {
            globalThis.jsyaml.loadAll(text, (d) => docs.push(d));
          }
          if (Array.isArray(docs) && docs.some(d => d && d.apiVersion && String(d.apiVersion).toLowerCase().includes('kyverno.io') && (String(d.kind || '').toLowerCase() === 'policy' || String(d.kind || '').toLowerCase() === 'clusterpolicy'))) {
            isKyverno = true;
            const converted = (window.kyvernoImporter && window.kyvernoImporter.convertDocs) ? window.kyvernoImporter.convertDocs(docs) : [];
            if (converted && converted.length > 0) {
              // Show preview modal instead of simple confirm()
              showKyvernoPreview(converted, text, { url });
              return;
            } else if (isKyverno) {
              console.debug('[options] Kyverno policy detected but convertDocs returned 0 rules');
              showToast('Kyverno policy detected but no convertible rules were produced — check console for details', { background: '#f59e0b' });
            }
          }
        } catch (e) {
          console.debug('Kyverno detection failed', e && e.message);
        }

        if (ta) ta.value = text;
        showToast('Fetched content into import area' + (isKyverno ? ' (Kyverno detected — conversion available)' : ''), { background: '#059669' });
        return;
      }
      // fallthrough to background fetch if not ok
      console.debug('Direct fetch returned status', resp.status, resp.statusText);
    } catch (e) {
      console.debug('Direct fetch failed (likely CORS):', e && e.message);
    }

    // Fallback: ask background service worker to fetch (requires host_permissions)
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FETCH_RAW', url }, (resp) => resolve(resp));
      });
      if (!response) throw new Error('No response from background fetch');
      if (!response.ok) {
        throw new Error(response.error || `status ${response.status} ${response.statusText || ''}`);
      }
      const fetchedText = response.text || '';
      // Try Kyverno detection on background-fetched content as well
      try {
        const docs = [];
        if (globalThis && globalThis.jsyaml && typeof globalThis.jsyaml.loadAll === 'function') {
          globalThis.jsyaml.loadAll(fetchedText, (d) => docs.push(d));
        }
        const isKyvernoBg = Array.isArray(docs) && docs.some(d => d && d.apiVersion && String(d.apiVersion).toLowerCase().includes('kyverno.io') && (String(d.kind || '').toLowerCase() === 'policy' || String(d.kind || '').toLowerCase() === 'clusterpolicy'));
        if (isKyvernoBg) {
          const converted = (window.kyvernoImporter && window.kyvernoImporter.convertDocs) ? window.kyvernoImporter.convertDocs(docs) : [];
          if (converted && converted.length > 0) {
            showKyvernoPreview(converted, fetchedText, { url });
            return;
          } else if (isKyvernoBg) {
            console.debug('[options] Kyverno policy detected (background fetch) but convertDocs returned 0 rules');
            showToast('Kyverno policy detected but conversion returned 0 rules (background fetch). See console for details', { background: '#f59e0b' });
          }
        }
      } catch (e) {
        console.debug('Kyverno detection failed for background fetch', e && e.message);
      }

      if (ta) ta.value = fetchedText;
      showToast('Fetched content via background helper', { background: '#059669' });
    } catch (e) {
      showToast('Failed to fetch URL: ' + (e && e.message ? e.message : String(e)), { background: '#b91c1c' });
    }
  });
}

// Handle file selection: read file into textarea for preview/import
const importFileEl = document.getElementById('importFile');
if (importFileEl) importFileEl.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    const ta = document.getElementById('importTextarea');
    if (ta) ta.value = String(reader.result || '');
  };
  reader.onerror = () => showToast('Failed to read file', { background: '#b91c1c' });
  reader.readAsText(f);
});

// Parse and import the JSON from textarea (or file-loaded content)
const doImportBtn = document.getElementById('doImport');
if (doImportBtn) doImportBtn.onclick = () => {
  const ta = document.getElementById('importTextarea');
  const text = ta ? ta.value.trim() : '';
  if (!text) {
    showToast('Nothing to import. Paste JSON or choose a file.', { background: '#b91c1c' });
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    showToast('Invalid JSON: ' + (e && e.message ? e.message : 'parse error'), { background: '#b91c1c' });
    return;
  }

  // Accept either an array of rules or an object { customRules: [...] }
  let imported = null;
  if (Array.isArray(parsed)) imported = parsed;
  else if (parsed && Array.isArray(parsed.customRules)) imported = parsed.customRules;
  else {
    showToast('JSON must be an array of rules or an object with a `customRules` array.', { background: '#b91c1c' });
    return;
  }

  // Basic validation: ensure each rule contains all mandatory fields
  for (let i = 0; i < imported.length; i++) {
    const r = imported[i];
    if (!r || typeof r !== 'object') {
      showToast(`Imported item at index ${i} is not a valid object.`, { background: '#b91c1c' });
      return;
    }
    const missing = [];
    if (!(typeof r.id === 'string' && r.id.trim())) missing.push('id');
    if (!(typeof r.description === 'string' && r.description.trim())) missing.push('description');
    if (!(typeof r.kind === 'string' && r.kind.trim())) missing.push('kind');
    if (!(typeof r.match === 'string' && r.match.trim())) missing.push('match');
    if (!(typeof r.pattern === 'string' && r.pattern.trim())) missing.push('pattern');
    if (!((r.required === true || r.required === false) || (r.required === 'true' || r.required === 'false'))) missing.push('required');
    if (!(typeof r.severity === 'string' && ['info','warning','error'].includes(r.severity))) missing.push('severity');
    if (!(typeof r.message === 'string' && r.message.trim())) missing.push('message');

    if (missing.length) {
      const idDisplay = r.id ? ` (id: ${String(r.id)})` : '';
      showToast(`Imported rule at index ${i}${idDisplay} is missing fields: ${missing.join(', ')}`, { background: '#b91c1c' });
      return;
    }
  }

  // Add imported rules to existing rules (append). Skip any imported rule
  // whose id already exists to avoid overwriting or creating duplicates.
  const normalized = imported.map(r => ({
    id: String(r.id).trim(),
    description: r.description || r.desc || '',
    kind: r.kind || '',
    match: r.match || '',
    pattern: r.pattern || '',
    required: r.required === true || r.required === 'true',
    severity: r.severity || 'warning',
    message: r.message || '',
    fix: r.fix !== undefined ? r.fix : undefined,
  }));

  let added = 0;
  let replaced = 0;
  for (const nr of normalized) {
    const idx = rules.findIndex(r => r.id === nr.id);
    if (idx !== -1) {
      // Overwrite existing rule with same id
      rules[idx] = nr;
      replaced++;
    } else {
      rules.push(nr);
      added++;
    }
  }

  if (added === 0 && replaced === 0) {
    showToast('No rules imported.', { background: '#b91c1c' });
  } else {
    saveRules();
    renderTable();
    showToast(`Imported ${added} new, replaced ${replaced} existing rule(s)` + (replaced === 0 ? '' : ''), { background: '#059669' });
  }
  // Hide and clear modal
  const modal = document.getElementById('importPanelModal');
  if (modal) modal.style.display = 'none';
  if (ta) ta.value = '';
  const file = document.getElementById('importFile'); if (file) file.value = null;
};

// Paste from clipboard into the import textarea
const pasteClipboardBtn = document.getElementById('pasteClipboard');
if (pasteClipboardBtn) pasteClipboardBtn.onclick = async () => {
  const ta = document.getElementById('importTextarea');
  try {
    const text = await navigator.clipboard.readText();
    if (ta) ta.value = text || '';
    showToast('Pasted from clipboard', { background: '#0ea5e9' });
  } catch (e) {
    console.debug('pasteClipboard failed', e && e.message);
    showToast('Failed to read clipboard: ' + (e && e.message ? e.message : String(e)), { background: '#b91c1c' });
  }
};

// Cancel import panel modal and clear inputs
const cancelImportBtn = document.getElementById('cancelImport');
if (cancelImportBtn) cancelImportBtn.onclick = () => {
  const modal = document.getElementById('importPanelModal');
  if (modal) modal.style.display = 'none';
  const ta = document.getElementById('importTextarea'); if (ta) ta.value = '';
  const file = document.getElementById('importFile'); if (file) file.value = null;
  if (importUrlInput) importUrlInput.value = '';
  showToast('Import cancelled', { background: '#6b7280', duration: 1200 });
};

const exportRulesBtn = document.getElementById("exportRules");
if (exportRulesBtn) exportRulesBtn.onclick = async () => {
  const payload = JSON.stringify({ customRules: rules }, null, 2);

  // 1) Trigger download
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
  a.download = 'guardon-rules.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Exported rules as file', { background: '#0ea5e9' });
  } catch (e) {
    showToast('Failed to create download', { background: '#b91c1c' });
  }

  // 2) Also try to copy to clipboard for convenience
  try {
    await navigator.clipboard.writeText(payload);
    showToast('Also copied JSON to clipboard', { background: '#0ea5e9' });
  } catch (e) {
    // clipboard may be unavailable in some contexts; ignore silently
  }
};

// ============ OPENAPI SCHEMA HANDLERS ============
const openAPIFileEl = document.getElementById('openAPIFile');
const openAPITextarea = document.getElementById('openAPITextarea');
const openAPILoadBtn = document.getElementById('openAPILoad');
const openAPIPreviewBtn = document.getElementById('openAPIPreview');
const openAPIClearBtn = document.getElementById('openAPIClear');
const openAPIStatus = document.getElementById('openAPIStatus');
let lastOpenAPIFileName = null;

function showOpenAPIStatus(msg) {
  if (openAPIStatus) openAPIStatus.textContent = msg;
}

function refreshOpenAPIDisplay() {
  try {
    chrome.storage.local.get('clusterSchema', (data) => {
      const cs = data && data.clusterSchema;
      const openAPIDisplay = document.getElementById('openAPIDisplay');
      
      if (!cs || !Array.isArray(cs.openapis) || cs.openapis.length === 0) {
        console.debug('[refreshOpenAPIDisplay] hiding - no openapis');
        if (openAPIDisplay) openAPIDisplay.style.display = 'none';
        return;
      }
      
      console.debug('[refreshOpenAPIDisplay] showing openapis:', cs.openapis.length);
      if (openAPIDisplay) openAPIDisplay.style.display = 'block';
      
      document.getElementById('openAPICount').textContent = cs.openapis.length;
      
      const tableBody = document.getElementById('openAPITableBody');
      if (tableBody) {
        tableBody.innerHTML = '';
        cs.openapis.forEach((rec) => {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #bfdbfe';
          
          const oas = rec && rec.spec ? rec.spec : rec;
          const meta = rec && rec.meta ? rec.meta : {};
          const title = (oas && oas.info && oas.info.title) || 'OpenAPI Spec';
          const apiVersion = (oas && oas.info && oas.info.version) || '(unknown)';
          const version = (oas && (oas.openapi || oas.swagger)) || '(unknown)';
          const paths = (oas && oas.paths && Object.keys(oas.paths).length) || 0;
          const components = (oas && oas.components && Object.keys(oas.components).length) || 0;
          const source = meta.source || '(unknown)';
          const loadedAt = meta.loadedAt ? new Date(meta.loadedAt).toLocaleString() : '(unknown)';
          
          [title, apiVersion, version, paths.toString(), components.toString(), source, loadedAt].forEach((text, idx) => {
            const td = document.createElement('td');
            td.textContent = text;
            td.style.padding = '6px';
            // avoid right border on last column
            td.style.borderRight = idx < 6 ? '1px solid #bfdbfe' : 'none';
            tr.appendChild(td);
          });
          
          tableBody.appendChild(tr);
        });
      }
    });
  } catch (e) { console.error('refreshOpenAPIDisplay error:', e); }
}

if (openAPIFileEl) openAPIFileEl.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (openAPITextarea) openAPITextarea.value = String(reader.result || '');
    showToast('Loaded OpenAPI file', { background: '#0ea5e9' });
    // remember filename to attribute source on save
    lastOpenAPIFileName = f.name || null;
  };
  reader.onerror = () => showToast('Failed to read file', { background: '#b91c1c' });
  reader.readAsText(f);
});

if (openAPILoadBtn) openAPILoadBtn.addEventListener('click', async () => {
  const text = openAPITextarea ? openAPITextarea.value : '';
  if (!text || !String(text).trim()) {
    showToast('Paste or load an OpenAPI file first', { background: '#b91c1c' });
    return;
  }

  const parsed = await parseSchemaText(text);
  if (parsed.errors && parsed.errors.length) {
    showToast('Failed to parse OpenAPI: ' + parsed.errors.join('; '), { background: '#b91c1c' });
    return;
  }

  // Extract all OpenAPI schemas from the parsed documents
  const openapis = [];
  if (parsed.openapi) openapis.push(parsed.openapi);
  parsed.docs.forEach((doc) => {
    if (doc && typeof doc === 'object' && (doc.openapi || doc.swagger || doc.paths)) {
      openapis.push(doc);
    }
  });

  if (openapis.length === 0) {
    showToast('No OpenAPI specification found. Is this a valid OpenAPI document?', { background: '#ea580c' });
    return;
  }

  try {
    chrome.storage.local.get('clusterSchema', (data) => {
      const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
      // Wrap new OpenAPI specs with metadata and normalize existing entries
      const newWrapped = openapis.map((oas) => ({ spec: oas, meta: { loadedAt: new Date().toISOString(), source: lastOpenAPIFileName || 'paste' } }));
      let existing = [];
      if (Array.isArray(current.openapis)) {
        existing = current.openapis.map((e) => (e && e.spec ? e : { spec: e, meta: { loadedAt: null, source: 'existing' } }));
      }
      current.openapis = existing.concat(newWrapped);
      // clear remembered filename after storing
      lastOpenAPIFileName = null;

      chrome.storage.local.set({ clusterSchema: current }, () => {
        showToast(`OpenAPI saved: ${newWrapped.length} schema(s) added`, { background: '#059669' });
        showOpenAPIStatus(`Loaded: ${current.openapis.length} total OpenAPI schema(s)`);
        refreshOpenAPIDisplay();
      });
    });
  } catch (e) {
    console.error('save openapi failed', e);
    showToast('Failed to save OpenAPI', { background: '#b91c1c' });
  }
});

if (openAPIPreviewBtn) openAPIPreviewBtn.addEventListener('click', async () => {
  const text = openAPITextarea ? openAPITextarea.value : '';
  if (!text || !String(text).trim()) {
    showToast('Paste or load an OpenAPI file first', { background: '#b91c1c' });
    return;
  }
  const parsed = await parseSchemaText(text);
  if (parsed.errors && parsed.errors.length) {
    showToast('Failed to parse: ' + parsed.errors.join('; '), { background: '#b91c1c' });
    return;
  }
  
  const openapis = [];
  if (parsed.openapi) openapis.push(parsed.openapi);
  parsed.docs.forEach((doc) => {
    if (doc && typeof doc === 'object' && (doc.openapi || doc.swagger || doc.paths)) {
      openapis.push(doc);
    }
  });
  
  if (openapis.length === 0) {
    showToast('No OpenAPI found in document', { background: '#ea580c' });
    return;
  }
  
  showToast(`Found ${openapis.length} OpenAPI schema(s)`, { background: '#0ea5e9', duration: 4000 });
});

if (openAPIClearBtn) openAPIClearBtn.addEventListener('click', () => {
  try {
    chrome.storage.local.get('clusterSchema', (data) => {
      const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
      current.openapis = [];
      chrome.storage.local.set({ clusterSchema: current }, () => {
        showToast('OpenAPI schemas cleared', { background: '#6b7280' });
        showOpenAPIStatus('');
        const openAPIDisplay = document.getElementById('openAPIDisplay');
        if (openAPIDisplay) openAPIDisplay.style.display = 'none';
      });
    });
  } catch (e) {
    showToast('Failed to clear OpenAPI', { background: '#b91c1c' });
  }
});

// ============ CRD SCHEMA HANDLERS ============
const crdFileEl = document.getElementById('crdFile');
const crdTextarea = document.getElementById('crdTextarea');
const crdLoadBtn = document.getElementById('crdLoad');
const crdPreviewBtn = document.getElementById('crdPreview');
const crdClearBtn = document.getElementById('crdClear');
const crdStatus = document.getElementById('crdStatus');

function showCRDStatus(msg) {
  if (crdStatus) crdStatus.textContent = msg;
}

function refreshCRDDisplay() {
  try {
    chrome.storage.local.get('clusterSchema', (data) => {
      const cs = data && data.clusterSchema;
      const crdDisplay = document.getElementById('crdDisplay');
      
      if (!cs || !Array.isArray(cs.crds) || cs.crds.length === 0) {
        console.debug('[refreshCRDDisplay] hiding - no crds');
        if (crdDisplay) crdDisplay.style.display = 'none';
        return;
      }
      
      console.debug('[refreshCRDDisplay] showing crds:', cs.crds.length);
      if (crdDisplay) crdDisplay.style.display = 'block';
      
      document.getElementById('crdCount').textContent = cs.crds.length;
      
      const tableBody = document.getElementById('crdTableBody');
      if (tableBody) {
        tableBody.innerHTML = '';
        cs.crds.forEach((crd) => {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #dcfce7';
          
          const name = (crd.metadata && crd.metadata.name) || '—';
          const group = (crd.spec && crd.spec.group) || '—';
          const scope = (crd.spec && crd.spec.scope) || '—';
          const plural = (crd.spec && crd.spec.names && crd.spec.names.plural) || '—';
          const singular = (crd.spec && crd.spec.names && crd.spec.names.singular) || '—';
          
          [name, group, scope, plural, singular].forEach((text) => {
            const td = document.createElement('td');
            td.textContent = text;
            td.style.padding = '6px';
            td.style.borderRight = '1px solid #dcfce7';
            tr.appendChild(td);
          });
          
          tableBody.appendChild(tr);
        });
      }
    });
  } catch (e) { console.error('refreshCRDDisplay error:', e); }
}

if (crdFileEl) crdFileEl.addEventListener('change', (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (crdTextarea) crdTextarea.value = String(reader.result || '');
    showToast('Loaded CRD file', { background: '#0ea5e9' });
  };
  reader.onerror = () => showToast('Failed to read file', { background: '#b91c1c' });
  reader.readAsText(f);
});

if (crdLoadBtn) crdLoadBtn.addEventListener('click', async () => {
  const text = crdTextarea ? crdTextarea.value : '';
  if (!text || !String(text).trim()) {
    showToast('Paste or load CRD file first', { background: '#b91c1c' });
    return;
  }

  const parsed = await parseSchemaText(text);
  if (parsed.errors && parsed.errors.length) {
    showToast('Failed to parse CRDs: ' + parsed.errors.join('; '), { background: '#b91c1c' });
    return;
  }

  if (!Array.isArray(parsed.crds) || parsed.crds.length === 0) {
    showToast('No CRDs found. Is this a valid CRD YAML?', { background: '#ea580c' });
    return;
  }

  try {
    chrome.storage.local.get('clusterSchema', (data) => {
      const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
      current.crds = parsed.crds;
      
      chrome.storage.local.set({ clusterSchema: current }, () => {
        showToast(`CRDs saved: ${parsed.crds.length} CRD(s)`, { background: '#059669' });
        showCRDStatus(`Loaded: ${parsed.crds.length} CRD(s)`);
        refreshCRDDisplay();
      });
    });
  } catch (e) {
    console.error('save crds failed', e);
    showToast('Failed to save CRDs', { background: '#b91c1c' });
  }
});

if (crdPreviewBtn) crdPreviewBtn.addEventListener('click', async () => {
  const text = crdTextarea ? crdTextarea.value : '';
  if (!text || !String(text).trim()) {
    showToast('Paste or load CRD file first', { background: '#b91c1c' });
    return;
  }
  const parsed = await parseSchemaText(text);
  if (parsed.errors && parsed.errors.length) {
    showToast('Failed to parse: ' + parsed.errors.join('; '), { background: '#b91c1c' });
    return;
  }
  const count = Array.isArray(parsed.crds) ? parsed.crds.length : 0;
  if (count === 0) {
    showToast('No CRDs found in document', { background: '#ea580c' });
    return;
  }
  showToast(`Found ${count} CRD(s)`, { background: '#0ea5e9', duration: 4000 });
});

if (crdClearBtn) crdClearBtn.addEventListener('click', () => {
  try {
    chrome.storage.local.get('clusterSchema', (data) => {
      const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
      current.crds = [];
      chrome.storage.local.set({ clusterSchema: current }, () => {
        showToast('CRDs cleared', { background: '#6b7280' });
        showCRDStatus('');
        const crdDisplay = document.getElementById('crdDisplay');
        if (crdDisplay) crdDisplay.style.display = 'none';
      });
    });
  } catch (e) {
    showToast('Failed to clear CRDs', { background: '#b91c1c' });
  }
});

// Load stored schema on startup to reflect status
try {
  chrome.storage.local.get('clusterSchema', (data) => {
    const cs = data && data.clusterSchema;
    if (!cs) return;
    
    if (Array.isArray(cs.openapis) && cs.openapis.length > 0) {
      showOpenAPIStatus(`Loaded: ${cs.openapis.length} OpenAPI schema(s)`);
      refreshOpenAPIDisplay();
    }
    
    if (Array.isArray(cs.crds) && cs.crds.length > 0) {
      showCRDStatus(`Loaded: ${cs.crds.length} CRD(s)`);
      refreshCRDDisplay();
    }
  });
} catch (e) { /* ignore */ }

// Resource validation is performed by the extension runtime (popup/content script).
