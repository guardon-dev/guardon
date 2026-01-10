// ============ RULE IMPORT FROM URL & CLIPBOARD, KYVERNO PREVIEW ============
const importUrlInput = document.getElementById("importUrl");
const fetchUrlBtn = document.getElementById("fetchUrl");
const pasteClipboardBtn = document.getElementById("pasteClipboard");
const importTextarea = document.getElementById("importTextarea");
const importFile = document.getElementById("importFile");
const doImportBtn = document.getElementById("doImport");
const importPanelModal = document.getElementById("importPanelModal");

let ruleSearchQuery = ""; // Search query for filtering rules 

const ruleSearchInput = document.getElementById("ruleSearch");
if (ruleSearchInput){
  ruleSearchInput.addEventListener("input", e => {
    ruleSearchQuery = e.target.value.toLowerCase().trim();
    renderTable();
  });
}

if (fetchUrlBtn) {
  fetchUrlBtn.addEventListener("click", async () => {
    const url = (importUrlInput && importUrlInput.value || "").trim();
    if (!url) {
      showToast("Enter a URL to fetch", { background: "#b91c1c" });
      return;
    }
    try {
      new URL(url);
    } catch (e) {
      showToast("Invalid URL", { background: "#b91c1c" });
      return;
    }
    if (importTextarea) {
      showToast("Fetching URL...", { background: "#f59e0b", duration: 4000 });
      try {
        const resp = await fetch(url);
        if (resp.ok) {
          const text = await resp.text();
          importTextarea.value = text;
          showToast("Fetched content into import area", { background: "#059669" });
        } else {
          showToast("Failed to fetch URL: " + resp.status, { background: "#b91c1c" });
        }
      } catch (e) {
        showToast("Failed to fetch URL: " + (e && e.message ? e.message : String(e)), { background: "#b91c1c" });
      }
    }
  });
}

if (pasteClipboardBtn && importTextarea) {
  pasteClipboardBtn.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      importTextarea.value = text;
      showToast("Pasted from clipboard", { background: "#0ea5e9" });
    } catch (e) {
      showToast("Failed to read clipboard", { background: "#b91c1c" });
    }
  };
}

// Kyverno preview modal logic (wrappers for kyvernoPreview.js)
import { showKyvernoPreview as kpShow, hideKyvernoPreview as kpHide } from "./kyvernoPreview.js";
let _kyvernoPreviewState = null;
function showKyvernoPreview(converted, rawText, meta = {}) {
  _kyvernoPreviewState = { converted, rawText, meta };
  try {
    kpShow(converted, rawText, meta);
  } catch (e) {
    showToast("Failed to render Kyverno preview", { background: "#b91c1c" });
  }
}
const kyvernoCancelBtn = document.getElementById("kyvernoCancel");
const kyvernoImportRawBtn = document.getElementById("kyvernoImportRaw");
const kyvernoImportConvertedBtn = document.getElementById("kyvernoImportConverted");
const kyvernoPreviewBody = document.getElementById("kyvernoPreviewBody");
if (kyvernoCancelBtn) {kyvernoCancelBtn.addEventListener("click", () => { _kyvernoPreviewState = null; try { kpHide(); } catch {} });}
if (kyvernoImportRawBtn) {kyvernoImportRawBtn.addEventListener("click", () => {
  if (!_kyvernoPreviewState) {return;}
  saveRawKyverno(_kyvernoPreviewState.rawText, _kyvernoPreviewState.meta);
  _kyvernoPreviewState = null;
  try { kpHide(); } catch {}
});}
if (kyvernoImportConvertedBtn) {kyvernoImportConvertedBtn.addEventListener("click", () => {
  if (!_kyvernoPreviewState) {return;}
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
  _kyvernoPreviewState = null;
  try { kpHide(); } catch {}
});}


// ============ CRD SCHEMA HANDLERS ============
const crdFileEl = document.getElementById("crdFile");
const crdTextarea = document.getElementById("crdTextarea");
const crdLoadBtn = document.getElementById("crdLoad");
const crdPreviewBtn = document.getElementById("crdPreview");
const crdClearBtn = document.getElementById("crdClear");
const crdStatus = document.getElementById("crdStatus");

function showCRDStatus(msg) {
  if (crdStatus) {crdStatus.textContent = msg;}
}

function refreshCRDDisplay() {
  try {
    chrome.storage.local.get("clusterSchema", (data) => {
      const cs = data && data.clusterSchema;
      const crdDisplay = document.getElementById("crdDisplay");
      if (!cs || !Array.isArray(cs.crds) || cs.crds.length === 0) {
        if (crdDisplay) {crdDisplay.style.display = "none";}
        return;
      }
      if (crdDisplay) {crdDisplay.style.display = "block";}
      const crdCount = document.getElementById("crdCount");
      if (crdCount) {crdCount.textContent = cs.crds.length;}
      const tableBody = document.getElementById("crdTableBody");
      if (tableBody) {
        tableBody.innerHTML = "";
        cs.crds.forEach((crd, idx) => {
          const tr = document.createElement("tr");
          tr.style.borderBottom = "1px solid #dcfce7";
          const name = (crd.metadata && crd.metadata.name) || "—";
          const group = (crd.spec && crd.spec.group) || "—";
          const scope = (crd.spec && crd.spec.scope) || "—";
          const plural = (crd.spec && crd.spec.names && crd.spec.names.plural) || "—";
          const singular = (crd.spec && crd.spec.names && crd.spec.names.singular) || "—";
          [name, group, scope, plural, singular].forEach((text) => {
            const td = document.createElement("td");
            td.textContent = text;
            td.style.padding = "6px";
            td.style.borderRight = "1px solid #dcfce7";
            tr.appendChild(td);
          });
          // Add delete button for each row
          const tdDelete = document.createElement("td");
          const delBtn = document.createElement("button");
          delBtn.textContent = "🗑";
          delBtn.title = "Delete";
          delBtn.style.padding = "4px 8px";
          delBtn.onclick = function() {
            chrome.storage.local.get("clusterSchema", (data) => {
              const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
              current.crds.splice(idx, 1);
              chrome.storage.local.set({ clusterSchema: current }, () => {
                showToast("CRD deleted", { background: "#b91c1c" });
                refreshCRDDisplay();
              });
            });
          };
          tdDelete.appendChild(delBtn);
          tr.appendChild(tdDelete);
          tableBody.appendChild(tr);
        });
      }
    });
  } catch (e) { console.error("refreshCRDDisplay error:", e); }
}

if (crdFileEl) {crdFileEl.addEventListener("change", (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) {return;}
  const reader = new FileReader();
  reader.onload = () => {
    if (crdTextarea) {crdTextarea.value = String(reader.result || "");}
    showToast("Loaded CRD file", { background: "#0ea5e9" });
  };
  reader.onerror = () => showToast("Failed to read file", { background: "#b91c1c" });
  reader.readAsText(f);
});}

if (crdLoadBtn) {crdLoadBtn.addEventListener("click", async () => {
  const text = crdTextarea ? crdTextarea.value : "";
  if (!text || !String(text).trim()) {
    showToast("Paste or load CRD file first", { background: "#b91c1c" });
    return;
  }
  const parsed = await parseSchemaText(text);
  if (parsed.errors && parsed.errors.length) {
    showToast("Failed to parse CRDs: " + parsed.errors.join("; "), { background: "#b91c1c" });
    return;
  }
  if (!Array.isArray(parsed.crds) || parsed.crds.length === 0) {
    showToast("No CRDs found. Is this a valid CRD YAML?", { background: "#fbbf24" });
    return;
  }
  try {
    chrome.storage.local.get("clusterSchema", (data) => {
      const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
      current.crds = parsed.crds;
      chrome.storage.local.set({ clusterSchema: current }, () => {
        showToast(`CRDs saved: ${parsed.crds.length} CRD(s)`, { background: "#059669" });
        showCRDStatus(`Loaded: ${parsed.crds.length} CRD(s)`);
        refreshCRDDisplay();
      });
    });
  } catch (e) {
    console.error("save crds failed", e);
    showToast("Failed to save CRDs", { background: "#b91c1c" });
  }
});}

if (crdPreviewBtn) {crdPreviewBtn.addEventListener("click", async () => {
  const text = crdTextarea ? crdTextarea.value : "";
  if (!text || !String(text).trim()) {
    showToast("Paste or load CRD file first", { background: "#b91c1c" });
    return;
  }
  const parsed = await parseSchemaText(text);
  if (parsed.errors && parsed.errors.length) {
    showToast("Failed to parse: " + parsed.errors.join("; "), { background: "#b91c1c" });
    return;
  }
  const count = Array.isArray(parsed.crds) ? parsed.crds.length : 0;
  if (count === 0) {
    showToast("No CRDs found in document", { background: "#fbbf24" });
    return;
  }
  showToast(`Found ${count} CRD(s)`, { background: "#0ea5e9", duration: 4000 });
});}

if (crdClearBtn) {crdClearBtn.addEventListener("click", () => {
  if (crdTextarea) {crdTextarea.value = "";}
  showCRDStatus("");
  showToast("Cleared input fields", { background: "#6b7280" });
});}

// Load stored schema on startup to reflect status
try {
  chrome.storage.local.get("clusterSchema", (data) => {
    const cs = data && data.clusterSchema;
    if (!cs) {return;}
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
// Show loaded OpenAPI schemas in the options page (v0.4 logic)

document.addEventListener("DOMContentLoaded", () => {
  // All OpenAPI modal event listeners and DOM queries must be inside this block
  refreshOpenAPIDisplay();
  // refreshCRDDisplay(); // Uncomment if you want to show CRDs as well

  const openAPIFile = document.getElementById("openAPIFile");
  const openAPITextarea = document.getElementById("openAPITextarea");
  const openAPICluster = document.getElementById("openAPICluster");
  const openAPIVersion = document.getElementById("openAPIVersion");
  const openAPILoadBtn = document.getElementById("openAPILoad");
  const openAPIClearBtn = document.getElementById("openAPIClear");
  const openAPIPreviewBtn = document.getElementById("openAPIPreview");
  const openAPIStatus = document.getElementById("openAPIStatus");
  let lastOpenAPIFileName = null;

  if (openAPIFile) {openAPIFile.addEventListener("change", (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) {return;}
    const reader = new FileReader();
    reader.onload = () => {
      if (!openAPITextarea) {
        console.error("openAPITextarea not found in DOM.");
        showToast("Error: OpenAPI textarea missing", { background: "#b91c1c" });
        return;
      }
      openAPITextarea.value = String(reader.result || "");
      showToast("Loaded OpenAPI file", { background: "#0ea5e9" });
      lastOpenAPIFileName = f.name || null;
    };
    reader.onerror = () => showToast("Failed to read file", { background: "#b91c1c" });
    reader.readAsText(f);
  });}

  // ...move all other OpenAPI modal event listeners here as needed...
});
// Ensure OpenAPI and CRD tables are visible on page load if data exists
// document.addEventListener("DOMContentLoaded", () => {
//   refreshOpenAPIDisplay();
//   refreshCRDDisplay();
// });
// OpenAPI and CRD modal open/close logic
const openAPIImportBtn = document.getElementById("openAPIImport");
const openAPIPanelModal = document.getElementById("openAPIPanelModal");
const closeOpenAPIModalBtn = document.getElementById("closeOpenAPIModal");

const openAPIFile = document.getElementById("openAPIFile");
const openAPITextarea = document.getElementById("openAPITextarea");
const openAPICluster = document.getElementById("openAPICluster");
const openAPIVersion = document.getElementById("openAPIVersion");
const openAPILoadBtn = document.getElementById("openAPILoad");
const openAPIClearBtn = document.getElementById("openAPIClear");
const openAPIPreviewBtn = document.getElementById("openAPIPreview");
const openAPIStatus = document.getElementById("openAPIStatus");
let lastOpenAPIFileName = null;

function showOpenAPIStatus(msg) {
  if (openAPIStatus) {openAPIStatus.textContent = msg;}
}

function refreshOpenAPIDisplay() {
  try {
    console.debug("[refreshOpenAPIDisplay] called");
    chrome.storage.local.get("clusterSchema", (data) => {
      const cs = data && data.clusterSchema;
      const openAPIDisplay = document.getElementById("openAPIDisplay");
      if (!cs || !Array.isArray(cs.openapis) || cs.openapis.length === 0) {
        console.debug("[refreshOpenAPIDisplay] hiding - no openapis", cs);
        if (openAPIDisplay) {openAPIDisplay.style.display = "none";}
        return;
      }
      console.debug("[refreshOpenAPIDisplay] showing openapis:", cs.openapis.length, cs.openapis);
      if (openAPIDisplay) {openAPIDisplay.style.display = "block";}
      const openAPICount = document.getElementById("openAPICount");
      if (openAPICount) {openAPICount.textContent = cs.openapis.length;}
      const tableBody = document.getElementById("openAPITableBody");
      if (tableBody) {
        tableBody.innerHTML = "";
        cs.openapis.forEach((rec, idx) => {
          const tr = document.createElement("tr");
          tr.style.borderBottom = "1px solid #bfdbfe";
          const oas = rec && rec.spec ? rec.spec : rec;
          const meta = rec && rec.meta ? rec.meta : {};
          const title = (oas && oas.info && oas.info.title) || "OpenAPI Spec";
          const cluster = meta.cluster || "(none)";
          const versionMeta = meta.version || "(none)";
          const apiVersion = (oas && oas.info && oas.info.version) || "(unknown)";
          const openapiVersion = (oas && (oas.openapi || oas.swagger)) || "(unknown)";
          const paths = (oas && oas.paths && Object.keys(oas.paths).length) || 0;
          const components = (oas && oas.components && Object.keys(oas.components).length) || 0;
          const source = meta.source || "(unknown)";
          const loadedAt = meta.loadedAt ? new Date(meta.loadedAt).toLocaleString() : "(unknown)";
          [title, cluster, versionMeta, apiVersion, openapiVersion, paths.toString(), components.toString(), source, loadedAt].forEach((text, idx2) => {
            const td = document.createElement("td");
            td.textContent = text;
            td.style.padding = "6px";
            td.style.borderRight = idx2 < 8 ? "1px solid #bfdbfe" : "none";
            tr.appendChild(td);
          });
          // Add delete button for each row
          const tdDelete = document.createElement("td");
          const delBtn = document.createElement("button");
          delBtn.textContent = "🗑";
          delBtn.title = "Delete";
          delBtn.style.padding = "4px 8px";
          delBtn.onclick = function() {
            chrome.storage.local.get("clusterSchema", (data) => {
              const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
              current.openapis.splice(idx, 1);
              chrome.storage.local.set({ clusterSchema: current }, () => {
                showToast("OpenAPI schema deleted", { background: "#b91c1c" });
                refreshOpenAPIDisplay();
              });
            });
          };
          tdDelete.appendChild(delBtn);
          tr.appendChild(tdDelete);
          tableBody.appendChild(tr);
        });
      }
    });
  } catch (e) { console.error("refreshOpenAPIDisplay error:", e); }
}

if (openAPIFile) {openAPIFile.addEventListener("change", (ev) => {
  const f = ev.target.files && ev.target.files[0];
  if (!f) {return;}
  const reader = new FileReader();
  reader.onload = () => {
    if (!openAPITextarea) {
      console.error("openAPITextarea not found in DOM.");
      showToast("Error: OpenAPI textarea missing", { background: "#b91c1c" });
      return;
    }
    openAPITextarea.value = String(reader.result || "");
    showToast("Loaded OpenAPI file", { background: "#0ea5e9" });
    lastOpenAPIFileName = f.name || null;
  };
  reader.onerror = () => showToast("Failed to read file", { background: "#b91c1c" });
  reader.readAsText(f);
});}

if (openAPIImportBtn && openAPIPanelModal) {
  openAPIImportBtn.onclick = () => {
    openAPIPanelModal.style.display = "flex";
  };
}
if (closeOpenAPIModalBtn && openAPIPanelModal) {
  closeOpenAPIModalBtn.onclick = () => {
    openAPIPanelModal.style.display = "none";
    if (openAPIFile) {openAPIFile.value = "";}
    if (openAPITextarea) {openAPITextarea.value = "";}
    if (openAPICluster) {openAPICluster.value = "";}
    if (openAPIVersion) {openAPIVersion.value = "";}
    if (openAPIStatus) {openAPIStatus.textContent = "";}
  };
}

if (openAPIClearBtn) {
  openAPIClearBtn.onclick = () => {
    if (openAPIFile) {openAPIFile.value = "";}
    if (openAPITextarea) {openAPITextarea.value = "";}
    if (openAPICluster) {openAPICluster.value = "";}
    if (openAPIVersion) {openAPIVersion.value = "";}
    if (openAPIStatus) {openAPIStatus.textContent = "";}
  };
}

if (openAPILoadBtn) {openAPILoadBtn.addEventListener("click", async () => {
  openAPILoadBtn.disabled = true;
  try {
    const text = openAPITextarea ? openAPITextarea.value : "";
    if (!text || !String(text).trim()) {
      showToast("Paste or load an OpenAPI file first", { background: "#b91c1c" });
      openAPILoadBtn.disabled = false;
      return;
    }

    const cluster = openAPICluster?.value?.trim() || "";
    const version = openAPIVersion?.value?.trim() || "";
    if (!cluster || !version) {
      showToast("Cluster and Version are required", { background: "#b91c1c" });
      openAPILoadBtn.disabled = false;
      return;
    }

    const parsed = await parseSchemaText(text);
    if (parsed.errors && parsed.errors.length) {
      showToast("Failed to parse OpenAPI: " + parsed.errors.join("; "), { background: "#b91c1c" });
      openAPILoadBtn.disabled = false;
      return;
    }

    // Extract all OpenAPI schemas from the parsed documents
    const openapis = [];
    if (parsed.openapi) {openapis.push(parsed.openapi);}
    parsed.docs.forEach((doc) => {
      if (doc && typeof doc === "object" && (doc.openapi || doc.swagger || doc.paths)) {
        openapis.push(doc);
      }
    });

    if (openapis.length === 0) {
      showToast("No OpenAPI specification found. Is this a valid OpenAPI document?", { background: "#fbbf24" });
      openAPILoadBtn.disabled = false;
      return;
    }

    chrome.storage.local.get("clusterSchema", (data) => {
      const current = data && data.clusterSchema ? { ...data.clusterSchema } : { openapis: [], crds: [] };
      // Wrap new OpenAPI specs with metadata and normalize existing entries
      const newWrapped = openapis.map((oas) => ({
        spec: oas,
        meta: {
          cluster,
          version,
          source: lastOpenAPIFileName || "manual",
          loadedAt: Date.now(),
        }
      }));
      // Remove any previous openapis for this cluster/version
      const filtered = (current.openapis || []).filter((rec) => {
        const m = rec && rec.meta;
        return !(m && m.cluster === cluster && m.version === version);
      });
      current.openapis = [...filtered, ...newWrapped];
      chrome.storage.local.set({ clusterSchema: current }, () => {
        showToast("OpenAPI schema(s) loaded", { background: "#0ea5e9" });
        if (openAPIPanelModal) {openAPIPanelModal.style.display = "none";}
        refreshOpenAPIDisplay();
        // v0.4: always show table after import
        const openAPIDisplay = document.getElementById("openAPIDisplay");
        if (openAPIDisplay) {openAPIDisplay.style.display = "block";}
        openAPILoadBtn.disabled = false;
        if (openAPIFile) {openAPIFile.value = "";}
        if (openAPITextarea) {openAPITextarea.value = "";}
        if (openAPICluster) {openAPICluster.value = "";}
        if (openAPIVersion) {openAPIVersion.value = "";}
        if (openAPIStatus) {openAPIStatus.textContent = "";}
        lastOpenAPIFileName = null;
      });
    });
  } catch (e) {
    showToast("Unexpected error: " + (e && e.message), { background: "#b91c1c" });
    openAPILoadBtn.disabled = false;
  }
});}

if (openAPIPreviewBtn) {
  openAPIPreviewBtn.onclick = async () => {
    let schemaText = "";
    if (openAPIFile && openAPIFile.files && openAPIFile.files[0]) {
      try {
        schemaText = await openAPIFile.files[0].text();
      } catch (e) {
        if (openAPIStatus) {openAPIStatus.textContent = "Failed to read file.";}
        return;
      }
    } else if (openAPITextarea && openAPITextarea.value.trim()) {
      schemaText = openAPITextarea.value.trim();
    } else {
      if (openAPIStatus) {openAPIStatus.textContent = "No schema source provided.";}
      return;
    }
    let parsed;
    try {
      parsed = await parseSchemaText(schemaText);
    } catch (e) {
      if (openAPIStatus) {openAPIStatus.textContent = "Invalid OpenAPI JSON/YAML.";}
      return;
    }
    if (openAPIStatus) {openAPIStatus.textContent = "Schema parsed successfully. (Preview only)";}
    // Optionally, show a summary or structure here
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

// Kyverno preview modal helpers moved to `kyvernoPreview.js`; expose small wrappers
// const kyvernoModal = document.getElementById("kyvernoModal");
// const kyvernoPreviewBody = document.getElementById("kyvernoPreviewBody");
// const kyvernoMeta = document.getElementById("kyvernoMeta");
// const kyvernoImportConvertedBtn = document.getElementById("kyvernoImportConverted");
// const kyvernoImportRawBtn = document.getElementById("kyvernoImportRaw");
// const kyvernoCancelBtn = document.getElementById("kyvernoCancel");
// const openAPIPreviewBtn = document.getElementById("openAPIPreviewBtn");


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
  if (!el) {return;}

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

  //Here goes the search filter logic
  const filteredRules = rules.filter(r => {
    if (!ruleSearchQuery) {return true;};
    return [r.id, r.description, r.match]
      .some(v => String(v || "").toLowerCase().includes(ruleSearchQuery));
  });
  //if no matching rules found
  if (filteredRules.length === 0 && ruleSearchQuery) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "No matching rules";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tableBody.appendChild(tr);
    updateRuleCounter();
    return;
  }
  filteredRules.forEach((r, idx) => {
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
const cancelImportBtn = document.getElementById("cancelImport");

if (importRulesBtn && importPanelModal) {
  importRulesBtn.onclick = () => {
    importPanelModal.style.display = "block";
  };
}

if (cancelImportBtn && importPanelModal) {
  cancelImportBtn.onclick = () => {
    importPanelModal.style.display = "none";
    if (importFile) {importFile.value = "";}
    if (importTextarea) {importTextarea.value = "";}
    if (importUrlInput) {importUrlInput.value = "";}
  };
}

if (pasteClipboardBtn && importTextarea) {
  pasteClipboardBtn.onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      importTextarea.value = text;
    } catch (e) {
      showToast("Failed to read clipboard", { background: "#b91c1c" });
    }
  };
}

if (doImportBtn) {
  doImportBtn.onclick = async () => {
    let jsonText = "";
    // 1. Try file input
    if (importFile && importFile.files && importFile.files[0]) {
      const file = importFile.files[0];
      try {
        jsonText = await file.text();
      } catch (e) {
        showToast("Failed to read file", { background: "#b91c1c" });
        return;
      }
    } else if (importTextarea && importTextarea.value.trim()) {
      // 2. Try textarea
      jsonText = importTextarea.value.trim();
    } else if (importUrlInput && importUrlInput.value.trim()) {
      // 3. Try URL input
      try {
        const resp = await fetch(importUrlInput.value.trim());
        if (!resp.ok) {throw new Error("HTTP " + resp.status);}
        jsonText = await resp.text();
      } catch (e) {
        showToast("Failed to fetch URL", { background: "#b91c1c" });
        return;
      }
    } else {
      showToast("No import source provided", { background: "#b91c1c" });
      return;
    }

    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      showToast("Invalid JSON: " + (e && e.message), { background: "#b91c1c" });
      return;
    }

    // Accept either an array of rules or { customRules: [...] }
    let rulesArr = Array.isArray(data) ? data : (Array.isArray(data.customRules) ? data.customRules : null);
    if (!rulesArr) {
      showToast("JSON must be an array or { customRules: [...] }", { background: "#b91c1c" });
      return;
    }
    const importedCount = applyNormalizedRules(rulesArr);
    if (importedCount > 0 && importPanelModal) {
      importPanelModal.style.display = "none";
      if (importFile) {importFile.value = "";}
      if (importTextarea) {importTextarea.value = "";}
      if (importUrlInput) {importUrlInput.value = "";}
    }
  };
}

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