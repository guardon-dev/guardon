// Ensure OpenAPI and CRD tables are visible on page load if data exists
// document.addEventListener("DOMContentLoaded", () => {
//   refreshOpenAPIDisplay();
//   refreshCRDDisplay();
// });
// OpenAPI and CRD modal open/close logic
const openAPIImportBtn = document.getElementById("openAPIImport");
const openAPIPanelModal = document.getElementById("openAPIPanelModal");
const closeOpenAPIModalBtn = document.getElementById("closeOpenAPIModal");
if (openAPIImportBtn && openAPIPanelModal) {
  openAPIImportBtn.onclick = () => {
    openAPIPanelModal.style.display = "flex";
  };
}
if (closeOpenAPIModalBtn && openAPIPanelModal) {
  closeOpenAPIModalBtn.onclick = () => {
    openAPIPanelModal.style.display = "none";
  };
}
// const openAPIDisplay = document.getElementById("openAPIDisplay");
// After OpenAPI schema is loaded, close modal and show table in main window
// Removed duplicate openAPILoadBtn declaration and handler to fix SyntaxError

const crdImportBtn = document.getElementById("crdImport");
const crdPanelModal = document.getElementById("crdPanelModal");
const closeCRDModalBtn = document.getElementById("closeCRDModal");
if (crdImportBtn && crdPanelModal) {
  crdImportBtn.onclick = () => {
    crdPanelModal.style.display = "flex";
  };
}
if (closeCRDModalBtn && crdPanelModal) {
  closeCRDModalBtn.onclick = () => {
    crdPanelModal.style.display = "none";
  };
}
const closeRuleModalBtn = document.getElementById("closeRuleModal");
if (closeRuleModalBtn) {closeRuleModalBtn.onclick = () => {
  if (ruleEditModal) {ruleEditModal.style.display = "none";}
};}
import { showKyvernoPreview as kpShow, hideKyvernoPreview as kpHide } from "./kyvernoPreview.js";
import { parseSchemaText } from "../utils/clusterSchema.js";

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
// const importUrlInput = document.getElementById("importUrl");
// const fetchUrlBtn = document.getElementById("fetchUrl");

// Kyverno preview modal elements (define safely for lint)
const kyvernoCancelBtn = document.getElementById("kyvernoCancel");
const kyvernoImportRawBtn = document.getElementById("kyvernoImportRaw");
const kyvernoImportConvertedBtn = document.getElementById("kyvernoImportConverted");
const kyvernoPreviewBody = document.getElementById("kyvernoPreviewBody");

// Kyverno preview modal helpers moved to `kyvernoPreview.js`; expose small wrappers
// const kyvernoModal = document.getElementById("kyvernoModal");
// const kyvernoPreviewBody = document.getElementById("kyvernoPreviewBody");
// const kyvernoMeta = document.getElementById("kyvernoMeta");
// const kyvernoImportConvertedBtn = document.getElementById("kyvernoImportConverted");
// const kyvernoImportRawBtn = document.getElementById("kyvernoImportRaw");
// const kyvernoCancelBtn = document.getElementById("kyvernoCancel");
// const openAPIPreviewBtn = document.getElementById("openAPIPreviewBtn");

let _kyvernoPreviewState = null; // { converted:[], rawText, meta }

// function showKyvernoPreview(converted, rawText, meta = {}) {
//   _kyvernoPreviewState = { converted, rawText, meta };
//   try {
//     kpShow(converted, rawText, meta);
//   } catch (e) {
//     showToast("Failed to render Kyverno preview", { background: "#b91c1c" });
//   }
// }
function showToast(msg, opts = {}) {
  const toast = document.getElementById("toast");
  if (!toast) {return;}
  toast.textContent = msg;
  toast.style.background = opts.background || "#111";
  toast.style.display = "block";
  toast.style.opacity = "1";
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.style.transition = "opacity 300ms ease";
    toast.style.opacity = "0";
    setTimeout(() => (toast.style.display = "none"), 300);
  }, opts.duration || 2500);
}
function updateRuleCounter() {
  const el = document.getElementById("ruleCounterText");
  if (!el) return;

  const total = rules.length;
  const enabled = rules.filter(r => r.enabled !== false).length;
  const disabled = total - enabled;

  if (total === 0) {
    el.textContent = "No rules configured";
  } else {
    el.textContent = `Total: ${total} · Enabled: ${enabled} · Disabled: ${disabled}`;
  }
}

function renderTable() {
  if (!tableBody) {return;}
  tableBody.innerHTML = "";
  rules.forEach((r, idx) => {
    const tr = document.createElement("tr");
    const tdId = document.createElement("td"); tdId.textContent = r.id || "";
    const tdEnabled = document.createElement("td");
    const enChk = document.createElement("input");
    enChk.type = "checkbox";
    enChk.checked = (r.enabled === undefined) ? true : !!r.enabled;
    enChk.addEventListener("change", () => {
      rules[idx].enabled = !!enChk.checked;
      saveRules();
      tr.style.opacity = enChk.checked ? "1" : "0.5";
      updateRuleCounter();
    });
    tdEnabled.appendChild(enChk);
    tdEnabled.style.textAlign = "center";
    const tdDesc = document.createElement("td"); tdDesc.textContent = r.description || "";
    const tdKind = document.createElement("td"); tdKind.textContent = r.kind || "";
    const tdSeverity = document.createElement("td"); tdSeverity.textContent = r.severity || "";
    const tdActions = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit";
    editBtn.setAttribute("aria-label", "Edit");
    editBtn.addEventListener("click", () => editRule(idx));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.innerHTML = "🗑";
    delBtn.title = "Delete";
    delBtn.setAttribute("aria-label", "Delete");
    delBtn.addEventListener("click", () => deleteRule(idx));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(delBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdEnabled);
    tr.style.opacity = (r.enabled === undefined || r.enabled) ? "1" : "0.5";
    tr.appendChild(tdDesc);
    tr.appendChild(tdKind);
    tr.appendChild(tdSeverity);
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  });
  updateRuleCounter();

}

function hideKyvernoPreview() {
  _kyvernoPreviewState = null;
  try { kpHide(); } catch { /* defensive */ }
}

// Commented out unused function to resolve no-unused-vars
// function escapeHtml(s) { return kpEscapeHtml(s); }

window.editRule = function (idx) {
  editingIndex = idx;
  const r = rules[idx];
  ruleEditModal.style.display = "flex";
  formTitle.textContent = "Edit Rule";
  inputs.id.value = r.id;
  inputs.desc.value = r.description;
  inputs.kind.value = r.kind || "";
  inputs.match.value = r.match;
  inputs.pattern.value = r.pattern || "";
  inputs.required.value = (r.required === true || r.required === "true") ? "true" : "false";
  inputs.severity.value = r.severity;
  inputs.message.value = r.message;
  if (inputs.enabled) {inputs.enabled.checked = (r.enabled === undefined) ? true : !!r.enabled;}
  if (inputs.fix) {
    try {
      inputs.fix.value = r.fix ? JSON.stringify(r.fix, null, 2) : "";
    } catch { inputs.fix.value = ""; }
  }
  if (inputs.rationale) {inputs.rationale.value = r.explain && r.explain.rationale ? r.explain.rationale : "";}
  if (inputs.references) {inputs.references.value = r.explain && Array.isArray(r.explain.refs) ? r.explain.refs.join(",") : (r.references || "");}
};

window.deleteRule = function (idx) {
  showDeleteConfirmation(idx);
};

// Enhanced delete confirmation dialog
function showDeleteConfirmation(idx) {
  const rule = rules[idx];
  if (!rule) {return;}

  const deleteModal = document.getElementById("deleteModal");
  const deleteRuleId = document.getElementById("deleteRuleId");
  const deleteRuleDesc = document.getElementById("deleteRuleDesc");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  const cancelDeleteBtn = document.getElementById("cancelDelete");

  // Populate modal with rule details
  if (deleteRuleId) {deleteRuleId.textContent = rule.id || "Unnamed rule";}
  if (deleteRuleDesc) {deleteRuleDesc.textContent = rule.description || "No description";}

  // Show modal
  if (deleteModal) {
    deleteModal.style.display = "flex";
    
    // Focus management for accessibility
    if (cancelDeleteBtn) {cancelDeleteBtn.focus();}
  }

  // Handle confirmation
  const handleConfirm = () => {
    rules.splice(idx, 1);
    saveRules();
    renderTable();
    hideDeleteConfirmation();
    showToast(`Rule "${rule.id}" deleted successfully`, { background: "#059669" });
  };

  // Handle cancellation
  const handleCancel = () => {
    hideDeleteConfirmation();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && e.target === confirmDeleteBtn) {
      e.preventDefault();
      handleConfirm();
    }
  };

  // Clean up previous event listeners
  if (confirmDeleteBtn) {
    confirmDeleteBtn.replaceWith(confirmDeleteBtn.cloneNode(true));
    const newConfirmBtn = document.getElementById("confirmDelete");
    newConfirmBtn.addEventListener("click", handleConfirm);
  }

  if (cancelDeleteBtn) {
    cancelDeleteBtn.replaceWith(cancelDeleteBtn.cloneNode(true));
    const newCancelBtn = document.getElementById("cancelDelete");
    newCancelBtn.addEventListener("click", handleCancel);
  }

  // Add keyboard event listener
  document.addEventListener("keydown", handleKeyDown);

  // Store cleanup function for later use
  window._deleteConfirmationCleanup = () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}

function hideDeleteConfirmation() {
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) {
    deleteModal.style.display = "none";
  }
  
  // Clean up event listeners
  if (window._deleteConfirmationCleanup) {
    window._deleteConfirmationCleanup();
    delete window._deleteConfirmationCleanup;
  }
}

const addRuleBtn = document.getElementById("addRule");
if (addRuleBtn) {addRuleBtn.onclick = () => {
  editingIndex = null;
  formTitle.textContent = "Add Rule";
  Object.values(inputs).forEach(i => i.value = "");
  if (inputs.required) {inputs.required.value = "false";}
  if (inputs.severity) {inputs.severity.value = "warning";}
  ruleEditModal.style.display = "flex";
  if (inputs.enabled) {inputs.enabled.checked = true;}
};}

const cancelRuleBtn = document.getElementById("cancelRule");
if (cancelRuleBtn) {cancelRuleBtn.onclick = () => {
  ruleEditModal.style.display = "none";
};}

const saveRuleBtn = document.getElementById("saveRule");
if (saveRuleBtn) {saveRuleBtn.onclick = () => {
  // saveRule clicked
  const newRule = {
    id: (inputs.id && inputs.id.value ? inputs.id.value.trim() : ""),
    description: (inputs.desc && inputs.desc.value ? inputs.desc.value.trim() : ""),
    kind: (inputs.kind && inputs.kind.value ? inputs.kind.value.trim() : ""),
    match: (inputs.match && inputs.match.value ? inputs.match.value.trim() : ""),
    pattern: (inputs.pattern && inputs.pattern.value ? inputs.pattern.value.trim() : ""),
    required: (inputs.required && inputs.required.value) ? inputs.required.value === "true" : false,
    enabled: inputs.enabled ? !!inputs.enabled.checked : true,
    severity: (inputs.severity && inputs.severity.value) ? inputs.severity.value : "warning",
    message: (inputs.message && inputs.message.value ? inputs.message.value.trim() : ""),
    // parse fix JSON if provided; keep as object
    fix: (function(){
      if (!inputs.fix) {return undefined;}
      const v = (inputs.fix.value || "").trim();
      if (!v) {return undefined;}
      try { return JSON.parse(v); } catch (e) { showToast("Fix JSON invalid: " + (e && e.message), { background: "#b91c1c" }); return undefined; }
    })(),
    // explain metadata: rationale + refs (array)
    explain: (function(){
      if (!inputs || !inputs.rationale) {return undefined;}
      const rationale = (inputs.rationale.value || "").trim();
      const refsRaw = (inputs.references && inputs.references.value) ? String(inputs.references.value || "") : "";
      const refs = refsRaw.split(",").map(s=>s.trim()).filter(Boolean);
      if (!rationale && refs.length === 0) {return undefined;}
      return { rationale: rationale || "", refs };
    })(),
  };

  // Basic validation
  const missing = [];
  if (!newRule.id) {missing.push("id");}
  if (!newRule.description) {missing.push("description");}
  if (!newRule.match) {missing.push("match");}
  if (!newRule.pattern) {missing.push("pattern");}
  if (typeof newRule.required !== "boolean") {missing.push("required");}
  if (!newRule.severity) {missing.push("severity");}
  if (!newRule.message) {missing.push("message");}

  if (missing.length) {
    showToast("Missing required fields: " + missing.join(", "), { background: "#b91c1c" });
    return;
  }

  // Validate severity
  const allowedSeverities = ["info", "warning", "error"];
  if (!allowedSeverities.includes(newRule.severity)) {
    showToast("Severity must be one of: info, warning, error", { background: "#b91c1c" });
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
      showToast(`Replaced existing rule with id "${newRule.id}"`, { background: "#059669" });
      if (form) {form.style.display = "none";}
      return;
    } else {
      // editingIndex is same as found index case will be skipped by findIndex
      showToast(`Rule ID "${newRule.id}" already exists. Choose a unique ID.`, { background: "#b91c1c" });
      return;
    }
  }

  if (editingIndex !== null) {rules[editingIndex] = newRule;}
  else {rules.push(newRule);}

  saveRules();
  ruleEditModal.style.display = "none";
  renderTable();
  showToast(editingIndex !== null ? "Rule updated" : "Rule added", { background: "#059669" });
};}

const importRulesBtn = document.getElementById("importRules");
if (importRulesBtn) {importRulesBtn.onclick = async () => {
  // Show the import panel modal where users can upload a JSON file or paste JSON
  const modal = document.getElementById("importPanelModal");
  if (modal) {modal.style.display = "block";}
};}

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
    chrome.storage.local.get("rawKyvernoPolicies", (data) => {
      const arr = Array.isArray(data.rawKyvernoPolicies) ? data.rawKyvernoPolicies : [];
      arr.push(entry);
      chrome.storage.local.set({ rawKyvernoPolicies: arr }, () => {
        showToast("Stored original Kyverno policy for audit", { background: "#0ea5e9" });
      });
    });
  } catch {
    // Failed to save raw Kyverno
  }
}

// Wire Kyverno preview action buttons (wrappers are implemented in kyvernoPreview.js)

// Apply an array of converted rule-like objects (from kyvernoImporter) into
// the current `rules` collection. This mirrors the import logic used for
// JSON imports: normalize fields, avoid duplicates (replace by id), persist
// and refresh the table.
function applyNormalizedRules(items) {
  if (!Array.isArray(items) || items.length === 0) {return 0;}
  const normalized = items.map(r => ({
    id: String(r.id || (r.description ? r.description.replace(/\s+/g,"-").toLowerCase() : `rule-${Date.now()}`)).trim(),
    description: r.description || r.desc || "",
    kind: r.kind || "",
    match: r.match || "",
    pattern: r.pattern || "",
    required: (r.required === true || r.required === "true"),
    severity: r.severity || "warning",
    message: r.message || "",
    fix: r.fix !== undefined ? r.fix : undefined,
    explain: r.explain || undefined,
  }));

  let added = 0, replaced = 0;
  for (const nr of normalized) {
    if (!nr.id) {continue;}
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

  if (added || replaced) {
    try { saveRules(); } catch { /* saveRules failed */ }
    try { renderTable(); } catch { /* renderTable failed */ }
    showToast(`Imported ${added} new, replaced ${replaced} existing rule(s)`, { background: "#059669" });
  }
  return added + replaced;
}

if (kyvernoCancelBtn) {kyvernoCancelBtn.addEventListener("click", hideKyvernoPreview);}
if (kyvernoImportRawBtn) {kyvernoImportRawBtn.addEventListener("click", () => {
  if (!_kyvernoPreviewState) {return;}
  saveRawKyverno(_kyvernoPreviewState.rawText, _kyvernoPreviewState.meta);
  hideKyvernoPreview();
});}
if (kyvernoImportConvertedBtn) {kyvernoImportConvertedBtn.addEventListener("click", () => {
  if (!_kyvernoPreviewState) {return;}
  // Collect selected checkboxes from the preview table. Each checkbox value
  // is the index into the converted array that was rendered earlier.
  const boxes = kyvernoPreviewBody ? kyvernoPreviewBody.querySelectorAll("input.kyvernoRowCheckbox") : [];
  const selected = [];
  boxes.forEach(b => {
    try {
      if (b.checked) {
        const idx = Number(b.value);
        const item = _kyvernoPreviewState.converted[idx];
        if (item) {selected.push(item);}
      }
    } catch {}
  });
  if (!selected.length) {
    showToast("No converted rules selected to import.", { background: "#b91c1c" });
    return;
  }
  applyNormalizedRules(selected);
  hideKyvernoPreview();
});}
