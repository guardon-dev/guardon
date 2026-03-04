async function initPopup() {
  console.log("[Guardon popup] initPopup starting");
  const summary = document.getElementById("summary");
  const resultsTable = document.getElementById("resultsTable");
  const resultsBody = document.getElementById("resultsBody");
  const noYaml = document.getElementById("noYaml");
  const copyBtn = document.getElementById("copyReport");
  const statusBadge = document.getElementById("statusBadge");
  const bootStatus = document.getElementById("bootStatus");
  const suggestionModal = document.getElementById("suggestionModal");
  const suggestionPre = document.getElementById("suggestionPre");
  const suggestionHint = document.getElementById("suggestionHint");
  const copyPatchBtn = document.getElementById("copyPatchBtn");
  const downloadPatchBtn = document.getElementById("downloadPatchBtn");
  const closeSuggestionBtn = document.getElementById("closeSuggestionBtn");
  const explainModal = document.getElementById("explainModal");
  const explainTitle = document.getElementById("explainTitle");
  const explainRationale = document.getElementById("explainRationale");
  const explainRefs = document.getElementById("explainRefs");
  const closeExplainBtn = document.getElementById("closeExplainBtn");

  // Suggestion modal wiring (needs to work even when we only
  // use manual validation on non-GitHub pages).
  if (closeSuggestionBtn) {
    closeSuggestionBtn.addEventListener("click", () => {
      if (suggestionModal) {
        suggestionModal.style.display = "none";
      }
    });
  }
  if (copyPatchBtn) {
    copyPatchBtn.addEventListener("click", async () => {
      try {
        const text = suggestionPre.textContent || "";
        await navigator.clipboard.writeText(text);
        showToast("Patched YAML copied");
      } catch (e) {
        showToast("Copy failed", { background: "#b91c1c" });
      }
    });
  }
  if (downloadPatchBtn) {
    downloadPatchBtn.addEventListener("click", () => {
      try {
        const text = suggestionPre.textContent || "";
        const blob = new Blob([text], { type: "text/yaml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "patched.yaml";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast("Downloaded patched YAML");
      } catch (e) {
        showToast("Download failed", { background: "#b91c1c" });
      }
    });
  }

  // Explain modal close button wiring (also needed for manual flow).
  if (closeExplainBtn) {
    closeExplainBtn.addEventListener("click", () => {
      if (explainModal) {
        explainModal.style.display = "none";
      }
    });
  }

  // Track the YAML text currently being validated so that
  // suggestion previews work consistently for both GitHub
  // and manual-paste validation flows.
  let currentYamlText = "";

  // Dynamically import the rules engine so we can show an error in the UI
  // if it fails to load (instead of a silent module load error).
  let validateYaml = null;
  try {
    const m = await import("../utils/rulesEngine.js");
    validateYaml = m.validateYaml;
    // preview helper for suggestions
    var previewPatchedYaml = m.previewPatchedYaml;
    if (bootStatus) {
      bootStatus.textContent = "Ready";
    }
  } catch (err) {
    // Failed to load rules engine in popup
    if (bootStatus) {
      bootStatus.textContent = "Error loading validation engine — see console for details.";
    }
    // Keep running so manual paste may still work; but mark validation unavailable.
  }
  // Try to import cluster schema validator (optional)
  let validateSchemaYaml = null;
  try {
    const csMod = await import("../utils/clusterSchema.js");
    validateSchemaYaml = csMod.validateYamlAgainstClusterSchemas;
  } catch (e) {
    // clusterSchema validator not available in popup
  }
  const validateAvailable = typeof validateYaml === "function";
  const previewAvailable = typeof previewPatchedYaml === "function";

  function showValidationUnavailable(note) {
    if (bootStatus) {
      bootStatus.textContent = note || "Validation engine not available.";
    }
    const summaryEl = document.getElementById("summary");
    if (summaryEl) {
      summaryEl.textContent = "Validation unavailable — see console for details.";
    }
    const statusBadge = document.getElementById("statusBadge");
    if (statusBadge) {
      statusBadge.textContent = "ERROR";
      statusBadge.className = "status error";
      statusBadge.style.display = "inline-block";
    }
  }

  // Helpers for chrome.storage.local using Promises
  function storageGet(keys) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (items) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error("[Guardon popup] storage.get error:", chrome.runtime.lastError);
            return resolve({});
          }
          resolve(items || {});
        });
      } catch (e) {
        console.error("[Guardon popup] storage.get threw:", e);
        resolve({});
      }
    });
  }

  // Compute a human-friendly source label for each result row
  function getSourceLabel(r) {
    if (r && r.source) {
      return r.source;
    }
    const id = r && r.ruleId ? String(r.ruleId) : "";
    if (id.startsWith("schema-crd")) {
      return "CRD schema";
    }
    if (id.startsWith("schema-openapi")) {
      return "OpenAPI schema";
    }
    if (id.startsWith("schema-")) {
      return "Schema validation";
    }
    return "Guardon rules";
  }

  // Normalize message text into one or more human-readable lines.
  // If there are multiple messages (e.g. JSON array), they will be rendered
  // as separate list items in the UI for better readability.
  function normalizeMessageLines(msg) {
    if (msg === null || msg === undefined) {
      return [""];
    }

    let raw = msg;

    // If we were given a JSON string representation, try to parse it first.
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          raw = JSON.parse(trimmed);
        } catch (e) {
          // leave as original string on parse failure
        }
      }
    }

    let lines = [];

    if (Array.isArray(raw)) {
      // Multiple messages -> one line per entry
      lines = raw.map((x) => String(x));
    } else if (raw && typeof raw === "object") {
      // Best-effort: key/value pairs as individual lines
      const parts = [];
      for (const [k, v] of Object.entries(raw)) {
        parts.push(`${k}: ${v}`);
      }
      lines = parts.length ? parts : [String(raw)];
    } else {
      lines = [String(raw)];
    }

    // Strip outer quotes and noisy braces from each line
    lines = lines
      .map((line) => {
        let s = String(line).trim();
        s = s.replace(/^"([\s\S]*)"$/, "$1");
        s = s.replace(/[{}]/g, "");
        return s;
      })
      .filter((s) => s.length > 0);

    return lines.length ? lines : [""];
  }

  // Helper to render one or more message lines into a table cell.
  function setMessageCellContent(td, msg) {
    const lines = normalizeMessageLines(msg);
    if (lines.length <= 1) {
      td.textContent = lines[0] || "";
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "message-list";
    lines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    });
    td.appendChild(ul);
  }

  function storageSet(obj) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set(obj, () => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error("[Guardon popup] storage.set error:", chrome.runtime.lastError);
          }
          resolve();
        });
      } catch (e) {
        console.error("[Guardon popup] storage.set threw:", e);
        resolve();
      }
    });
  }

  // Theme toggle: read persisted preference and wire the toggle
  const themeToggle = document.getElementById("themeToggle");
  async function loadTheme() {
    try {
      const { popupTheme } = await storageGet("popupTheme");
      const theme = popupTheme || "light";
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body && document.body.classList.add("dark");
      }
      if (themeToggle) {
        themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
      }
    } catch (e) {
      // fallback: do nothing
    }
  }
  loadTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", async () => {
      const isDark = document.documentElement.classList.toggle("dark");
      if (document.body) {
        document.body.classList.toggle("dark", isDark);
      }
      try {
        await storageSet({ popupTheme: isDark ? "dark" : "light" });
      } catch (e) {
        // ignore
      }
      themeToggle.textContent = isDark ? "☀️" : "🌙";
    });
  }

  // Get the active tab using a Promise wrapper around the callback-based API
  const [tab] = await new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          console.error("[Guardon popup] chrome.tabs.query error:", chrome.runtime.lastError);
          return resolve([]);
        }
        resolve(tabs || []);
      });
    } catch (e) {
      console.error("[Guardon popup] chrome.tabs.query threw:", e);
      resolve([]);
    }
  });

  if (!tab || !tab.url) {
    console.warn("[Guardon popup] No active tab found; showing manual paste UI.");
    showManualPasteUI();
    return;
  }

  // Always show manual paste option for non-GitHub/GitLab pages
  const pageUrl = new URL(tab.url);
  const isGithub = pageUrl.host === "github.com" || pageUrl.host === "www.github.com";
  const isGitlab = pageUrl.host === "gitlab.com" || pageUrl.host === "www.gitlab.com";

  let yamlText = null;
  let fetchedFromGithub = false;
  let fetchedUrl = null;

  if (!isGithub && !isGitlab) {
    // Always show manual paste UI for non-GitHub/GitLab
    showManualPasteUI();
    return;
  }

  // Try to get YAML text/selection by messaging the content script first
  try {
    yamlText = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: "GET_YAML" }, (resp) => {
        if (chrome.runtime.lastError) {
          return resolve(null);
        }
        if (!resp) {
          return resolve(null);
        }
        if (typeof resp === "string") {
          return resolve(resp);
        }
        return resolve(resp.yamlText || null);
      });
    });
  } catch (err) {
    // sendMessage GET_YAML failed
    yamlText = null;
  }

  // If no YAML found, show manual paste UI on GitHub/GitLab
  if (!yamlText) {
    showManualPasteUI();
    return;
  }

  // Remember the YAML we successfully fetched so that
  // suggestion previews and copied snippets can use the
  // same base document.
  currentYamlText = yamlText;

  function showManualPasteUI() {
    noYaml.style.display = "block";
    statusBadge.textContent = "NO YAML";
    statusBadge.className = "status info";
    statusBadge.style.display = "inline-block";
    statusBadge.classList.add("pulse");
    const manualDiv = document.getElementById("manual");
    const manualArea = document.getElementById("manualYaml");
    if (manualDiv) {
      manualDiv.style.display = "block";
    }
    if (manualArea) {
      manualArea.style.display = "block";
    }
    const fetchedNotice = document.getElementById("fetchedNotice");
    if (fetchedNotice) {
      fetchedNotice.style.display = "none";
    }
    const validateManualBtn = document.getElementById("validateManual");
    if (validateManualBtn) {
      validateManualBtn.onclick = async () => {
        if (!validateAvailable) {
          showValidationUnavailable("Validation engine failed to load; cannot validate.");
          return;
        }
        const content = (document.getElementById("manualYaml") || { value: "" }).value;
        if (!content) {
          return;
        }
        // For manual validations, keep the pasted YAML available
        // for suggestion preview helpers.
        currentYamlText = content;
        try {
          // Run Guardon rules
          const { customRules } = await storageGet("customRules");
          const rules = customRules || [];
          let results = await validateYaml(content, rules);
          // Also run schema-based validation and merge results
          let schemaResults = [];
          let schemaDiagnostic = "";
          let schemaErrorSection = "";
          if (typeof validateSchemaYaml === "function") {
            const csData = await new Promise((resolve) =>
              chrome.storage.local.get("clusterSchema", (d) =>
                resolve(d && d.clusterSchema ? d.clusterSchema : { openapis: [], crds: [] })
              )
            );
            schemaResults = await validateSchemaYaml(content, csData);
            if (Array.isArray(schemaResults) && schemaResults.length) {
              const existingKeys = new Set(
                results.map((r) => `${r.ruleId}||${r.path}||${r.message}`)
              );
              for (const sr of schemaResults) {
                const key = `${sr.ruleId}||${sr.path}||${sr.message}`;
                if (!existingKeys.has(key)) {
                  results.push(sr);
                  existingKeys.add(key);
                }
              }
            }
            const hasSchemas = !!(
              csData &&
              ((Array.isArray(csData.openapis) && csData.openapis.length > 0) ||
                (Array.isArray(csData.crds) && csData.crds.length > 0) ||
                csData.openapi)
            );
            if (schemaResults.length === 0) {
              if (hasSchemas) {
                schemaDiagnostic = "Schema-based validation: no issues found for this resource.";
              } else {
                schemaDiagnostic = "No schema present for this resource.";
              }
            } else {
              const errorCount = schemaResults.filter((r) => r.severity === "error").length;
              schemaDiagnostic = `Schema-based validation: ${schemaResults.length} issue(s), ${errorCount} error(s).`;
              schemaDiagnostic +=
                "\n" +
                schemaResults
                  .slice(0, 3)
                  .map((r) => `${r.path}: ${r.message}`)
                  .join("\n");
              schemaErrorSection = schemaResults
                .filter((r) => r.severity === "error")
                .map((r) => `<li><b>${r.path}</b>: ${r.message}</li>`)
                .join("");
            }
          } else {
            schemaDiagnostic = "Schema validator not available.";
          }
          // Show diagnostic in UI
          let diagEl = document.getElementById("schemaDiagnostic");
          if (!diagEl) {
            diagEl = document.createElement("div");
            diagEl.id = "schemaDiagnostic";
            diagEl.style.cssText = "margin:8px 0;padding:8px;font-size:12px;white-space:pre-wrap;";
            summary.parentNode.insertBefore(diagEl, summary.nextSibling);
          }
          diagEl.textContent = schemaDiagnostic;
          let errEl = document.getElementById("schemaErrorSection");
          if (!errEl) {
            errEl = document.createElement("ul");
            errEl.id = "schemaErrorSection";
            errEl.style.cssText = "margin:8px 0;padding:8px;font-size:13px;";
            diagEl.parentNode.insertBefore(errEl, diagEl.nextSibling);
          }
          errEl.innerHTML = schemaErrorSection;
          // Hide the schema error section entirely when there are no
          // schema errors so we don't show an empty red box.
          if (!schemaErrorSection) {
            errEl.style.display = "none";
          } else {
            errEl.style.display = "block";
          }

          // --- OPA WASM evaluation for manual YAML ---
          let opaResults = [];
          try {
            const stored = localStorage.getItem("opaWasmPolicy");
            if (stored) {
              const policy = JSON.parse(stored);
              const wasmBuffer = new Uint8Array(policy.data).buffer;
              const mod = await import("../lib/opa-wasm-bundle.js");
              const opaWasm = mod.default;
              const opaWasmInstance = await opaWasm.loadPolicy(wasmBuffer);

              let inputObj = null;
              try {
                inputObj = globalThis.jsyaml
                  ? globalThis.jsyaml.load(content)
                  : JSON.parse(content);
              } catch (e) {
                inputObj = null;
              }

              if (inputObj) {
                const opaResult = await opaWasmInstance.evaluate(inputObj);
                if (Array.isArray(opaResult) && opaResult.length) {
                  const mapped = opaResult
                    .map((r, idx) => {
                      const base = r && r.result ? r.result : r;

                      // Skip entries that clearly indicate no violation (empty array/object)
                      if (!base) {
                        return null;
                      }
                      if (Array.isArray(base) && base.length === 0) {
                        return null;
                      }
                      if (
                        !Array.isArray(base) &&
                        typeof base === "object" &&
                        Object.keys(base).length === 0
                      ) {
                        return null;
                      }

                      const ruleId = base && base.id ? `OPA:${base.id}` : `OPA:${idx + 1}`;
                      const message = base && base.reason ? base.reason : JSON.stringify(base);
                      const sev =
                        base && typeof base.severity === "string"
                          ? String(base.severity).toLowerCase()
                          : "error";
                      return {
                        severity: sev,
                        ruleId,
                        message,
                        source: "OPA WASM",
                      };
                    })
                    .filter(Boolean);

                  if (mapped.length) {
                    opaResults = mapped;
                  }
                }
              }
            }
          } catch (e) {
            console.error("[OPA WASM] Manual evaluation error:", e);
            opaResults = [
              {
                severity: "error",
                ruleId: "OPA",
                message: "OPA WASM evaluation failed: " + (e && e.message),
                source: "OPA WASM",
              },
            ];
          }

          const allResults = [...results, ...opaResults];
          renderResults(allResults);
        } catch (err) {
          // Manual validation failed
          showValidationUnavailable("Validation failed — see console for details.");
        }
      };
    }
  }
  // ...existing code for GitHub/GitLab YAML extraction and validation...

  // If we fetched the YAML from GitHub, show a notice and hide manual controls
  if (fetchedFromGithub) {
    const fetchedNotice = document.getElementById("fetchedNotice");
    if (fetchedNotice) {
      fetchedNotice.textContent = `Validated file fetched from GitHub: ${fetchedUrl}`;
      fetchedNotice.style.display = "block";
    }
    // hide the manual block entirely when we fetched the YAML
    const manualDiv = document.getElementById("manual");
    if (manualDiv) {
      manualDiv.style.display = "none";
      const manualArea = document.getElementById("manualYaml");
      if (manualArea) {
        manualArea.style.display = "none";
      }
    }
  }

  const { customRules } = await storageGet("customRules");
  const rules = customRules || [];

  if (!rules.length) {
    summary.textContent = "No Guardon rules configured. Add them in Options.";
    statusBadge.textContent = "NO RULES";
    statusBadge.className = "status info";
    statusBadge.style.display = "inline-block";
    return;
  }

  if (!validateAvailable) {
    showValidationUnavailable("Validation engine failed to load; cannot validate YAML.");
    return;
  }
  // --- OPA WASM JS runtime ---
  let opaWasmInstance = null;
  let opaWasmLoaded = false;
  let opaWasmError = null;
  let opaWasmPolicyMeta = null;
  try {
    console.log("[OPA WASM] Attempting to load policy from localStorage...");
    const stored = localStorage.getItem("opaWasmPolicy");
    if (stored) {
      console.log("[OPA WASM] Policy found in localStorage.");
      const policy = JSON.parse(stored);
      opaWasmPolicyMeta = policy;
      const wasmBuffer = new Uint8Array(policy.data).buffer;
      console.log("[OPA WASM] Importing OPA WASM JS bundle...");
      const mod = await import("../lib/opa-wasm-bundle.js");
      const opaWasm = mod.default;
      console.log("[OPA WASM] Loading policy into OPA WASM runtime...");
      opaWasmInstance = await opaWasm.loadPolicy(wasmBuffer);
      opaWasmLoaded = true;
    } else {
      console.log("[OPA WASM] No policy found in localStorage. Skipping OPA WASM evaluation.");
    }
  } catch (err) {
    console.error("[OPA WASM] Error loading policy:", err);
    opaWasmError = err;
    opaWasmLoaded = false;
  }

  let results = [];
  let opaResults = [];
  try {
    // Run Guardon rules
    results = await validateYaml(yamlText, rules);

    // Also run schema-based validation (CRD/OpenAPI) if available and merge results
    let schemaResults = [];
    let schemaDiagnostic = "";
    let schemaErrorSection = "";
    try {
      if (typeof validateSchemaYaml === "function") {
        const csData = await new Promise((resolve) =>
          chrome.storage.local.get("clusterSchema", (d) =>
            resolve(d && d.clusterSchema ? d.clusterSchema : { openapis: [], crds: [] })
          )
        );
        schemaResults = await validateSchemaYaml(yamlText, csData);
        if (Array.isArray(schemaResults) && schemaResults.length) {
          // Merge schemaResults; avoid duplicating identical messages
          const existingKeys = new Set(results.map((r) => `${r.ruleId}||${r.path}||${r.message}`));
          for (const sr of schemaResults) {
            const key = `${sr.ruleId}||${sr.path}||${sr.message}`;
            if (!existingKeys.has(key)) {
              results.push(sr);
              existingKeys.add(key);
            }
          }
        }
        // Diagnostic: show what schema was matched and summary of results
        const hasSchemas = !!(
          csData &&
          ((Array.isArray(csData.openapis) && csData.openapis.length > 0) ||
            (Array.isArray(csData.crds) && csData.crds.length > 0) ||
            csData.openapi)
        );
        if (schemaResults.length === 0) {
          if (hasSchemas) {
            schemaDiagnostic = "Schema-based validation: no issues found for this resource.";
          } else {
            schemaDiagnostic = "No schema present for this resource.";
          }
        } else {
          const errorCount = schemaResults.filter((r) => r.severity === "error").length;
          schemaDiagnostic = `Schema-based validation: ${schemaResults.length} issue(s), ${errorCount} error(s).`;
          // Show all schema errors in a dedicated section
          schemaErrorSection = schemaResults
            .filter((r) => r.severity === "error")
            .map((r) => `<li><b>${r.path}</b>: ${r.message}</li>`)
            .join("");
        }
      } else {
        schemaDiagnostic = "Schema validator not available.";
      }
    } catch (e) {
      schemaDiagnostic = "Schema validation error: " + (e && e.message);
      // Schema validation in popup failed
    }
    // Show diagnostic in UI
    let diagEl = document.getElementById("schemaDiagnostic");
    if (!diagEl) {
      diagEl = document.createElement("div");
      diagEl.id = "schemaDiagnostic";
      diagEl.style.cssText = "margin:8px 0;padding:8px;font-size:12px;white-space:pre-wrap;";
      summary.parentNode.insertBefore(diagEl, summary.nextSibling);
    }
    diagEl.textContent = schemaDiagnostic;
    // Show schema errors in a visible section if any
    let errEl = document.getElementById("schemaErrorSection");
    if (!errEl) {
      errEl = document.createElement("ul");
      errEl.id = "schemaErrorSection";
      errEl.style.cssText = "margin:8px 0;padding:8px;font-size:13px;";
      diagEl.parentNode.insertBefore(errEl, diagEl.nextSibling);
    }
    errEl.innerHTML = schemaErrorSection;
    // Hide the schema error section box entirely when there are no
    // schema errors so the UI doesn't show an empty panel.
    if (!schemaErrorSection) {
      errEl.style.display = "none";
    } else {
      errEl.style.display = "block";
    }
  } catch (err) {
    // Validation engine threw an error
    showValidationUnavailable("Validation failed — see console for details.");
    return;
  }

  // --- OPA WASM evaluation ---
  if (opaWasmLoaded && opaWasmInstance) {
    try {
      console.log("[OPA WASM] Evaluation code path reached. Preparing input...");
      // OPA expects input as JSON; try to parse YAML as JSON
      let inputObj = null;
      try {
        inputObj = globalThis.jsyaml ? globalThis.jsyaml.load(yamlText) : JSON.parse(yamlText);
      } catch (e) {
        inputObj = null;
      }
      if (inputObj) {
        const opaResult = await opaWasmInstance.evaluate(inputObj);
        console.log("[OPA WASM] Evaluation result:", opaResult);
        if (Array.isArray(opaResult) && opaResult.length) {
          const mapped = opaResult
            .map((r, idx) => {
              const base = r && r.result ? r.result : r;

              // Skip entries that clearly indicate no violation (empty array/object)
              if (!base) {
                return null;
              }
              if (Array.isArray(base) && base.length === 0) {
                return null;
              }
              if (
                !Array.isArray(base) &&
                typeof base === "object" &&
                Object.keys(base).length === 0
              ) {
                return null;
              }

              const ruleId = base && base.id ? `OPA:${base.id}` : `OPA:${idx + 1}`;
              const message = base && base.reason ? base.reason : JSON.stringify(base);
              const sev =
                base && typeof base.severity === "string"
                  ? String(base.severity).toLowerCase()
                  : "error";
              return {
                severity: sev,
                ruleId,
                message,
                source: "OPA WASM",
              };
            })
            .filter(Boolean);

          if (mapped.length) {
            opaResults = mapped;
          }
        }
      }
    } catch (e) {
      console.error("[OPA WASM] Error during evaluation:", e);
      opaResults = [
        {
          severity: "error",
          ruleId: "OPA",
          message: "OPA WASM evaluation failed: " + (e && e.message),
          source: "OPA WASM",
        },
      ];
    }
  } else if (opaWasmError) {
    opaResults = [
      {
        severity: "error",
        ruleId: "OPA",
        message: "OPA WASM policy load error: " + (opaWasmError && opaWasmError.message),
        source: "OPA WASM",
      },
    ];
  } else {
    // OPA WASM not loaded, so evaluation is skipped
  }

  // Merge Guardon and OPA results for display and reuse downstream
  const allResults = [...results, ...opaResults];
  results = allResults;
  renderResults(results);

  // If parser produced a parse-error result, show the sanitized YAML text
  // that was passed to the parser so users can inspect what we validated.
  if (results && results.some((r) => r.ruleId === "parse-error")) {
    // [popup] parse-error — sanitized YAML used for validation
    // Create a details block to show the sanitized YAML (if not present)
    let dbg = document.getElementById("debugYamlDetails");
    if (!dbg) {
      dbg = document.createElement("details");
      dbg.id = "debugYamlDetails";
      dbg.style.cssText =
        "margin-top:8px;padding:8px;border:1px solid #eee;background:#fff;max-height:240px;overflow:auto;font-family:monospace;";
      const summ = document.createElement("summary");
      summ.textContent = "Sanitized YAML used for validation (click to expand)";
      dbg.appendChild(summ);
      const pre = document.createElement("pre");
      pre.id = "debugYamlPre";
      pre.style.cssText = "white-space:pre-wrap;word-break:break-word;margin:8px 0;font-size:12px;";
      dbg.appendChild(pre);
      // add a small copy button
      const copyBtnDbg = document.createElement("button");
      copyBtnDbg.textContent = "Copy sanitized YAML";
      copyBtnDbg.style.cssText = "margin-top:6px;padding:6px 8px;";
      copyBtnDbg.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(
            document.getElementById("debugYamlPre").textContent || ""
          );
          showToast("Sanitized YAML copied");
        } catch (e) {
          showToast("Copy failed", { background: "#b91c1c" });
        }
      });
      dbg.appendChild(copyBtnDbg);
      const container = document.getElementById("summary") || document.body;
      container.parentNode.insertBefore(dbg, container.nextSibling);
    }
    const preEl = document.getElementById("debugYamlPre");
    if (preEl) {
      preEl.textContent = yamlText || "";
    }
  }
  if (results.length === 0) {
    summary.innerHTML = "✅ No violations found — your YAML meets Guardon checks!";
    statusBadge.textContent = "CLEAN";
    statusBadge.className = "status clean";
    statusBadge.style.display = "inline-block";
    // Hide manual input when we have a validated YAML (no need to prompt paste)
    const manualDiv = document.getElementById("manual");
    if (manualDiv) {
      manualDiv.style.display = "none";
    }
    return;
  }

  // Count by severity
  const errorCount = results.filter((r) => r.severity === "error").length;
  const warningCount = results.filter((r) => r.severity === "warning").length;
  const infoCount = results.filter((r) => r.severity === "info").length;

  let badgeClass = "warning";
  let badgeText = "WARNINGS";
  if (errorCount > 0) {
    badgeClass = "error";
    badgeText = "ERRORS";
  }

  statusBadge.textContent = badgeText;
  statusBadge.className = `status ${badgeClass}`;
  statusBadge.style.display = "inline-block";

  resultsTable.style.display = "table";
  copyBtn.style.display = "inline-block";

  summary.innerHTML = `
    Found <b>${results.length}</b> violation(s):
    ${errorCount ? "❌ " + errorCount + " error(s)" : ""}
    ${warningCount ? " ⚠️ " + warningCount + " warning(s)" : ""}
    ${infoCount ? " ℹ️ " + infoCount + " info(s)" : ""}
  `;

  resultsBody.innerHTML = "";
  results.forEach((r) => {
    const tr = document.createElement("tr");
    const icon = r.severity === "error" ? "❌" : r.severity === "warning" ? "⚠️" : "ℹ️";
    const tdSeverity = document.createElement("td");
    tdSeverity.className = r.severity;
    tdSeverity.innerHTML = `<span class="severity-icon">${icon}</span>${r.severity.toUpperCase()}`;

    const tdRule = document.createElement("td");
    tdRule.textContent = r.ruleId;
    const tdSource = document.createElement("td");
    tdSource.textContent = getSourceLabel(r);
    const tdMessage = document.createElement("td");
    setMessageCellContent(tdMessage, r.message);
    const tdActions = document.createElement("td");
    tdActions.className = "actions-cell";

    if (r.suggestion) {
      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.className = "action-btn icon-btn preview";
      previewBtn.title = "Preview patch";
      previewBtn.setAttribute("aria-label", "Preview patch");
      previewBtn.innerHTML = "🔧";
      previewBtn.addEventListener("click", async () => {
        if (!previewAvailable) {
          alert("Patch preview not available");
          return;
        }
        try {
          const patched = await previewPatchedYaml(currentYamlText, r.docIndex, r.suggestion, {
            fullStream: true,
          });
          suggestionHint.textContent = r.suggestion.hint || r.message || "Suggested fix";
          suggestionPre.textContent = patched || "Failed to generate preview";
          suggestionModal.style.display = "flex";
        } catch (e) {
          // Preview generation failed
          alert("Failed to generate patch preview");
        }
      });
      tdActions.appendChild(previewBtn);

      const copySnippetBtn = document.createElement("button");
      copySnippetBtn.type = "button";
      copySnippetBtn.className = "action-btn icon-btn copy";
      copySnippetBtn.title = "Copy snippet";
      copySnippetBtn.setAttribute("aria-label", "Copy snippet");
      copySnippetBtn.innerHTML = "📋";
      copySnippetBtn.addEventListener("click", async () => {
        try {
          const j = globalThis.jsyaml;
          let snippetYaml = "";
          if (r.suggestion.snippetYaml) {
            snippetYaml = r.suggestion.snippetYaml;
          } else if (r.suggestion.snippetObj && j) {
            snippetYaml = j.dump(r.suggestion.snippetObj, { noRefs: true });
          } else {
            snippetYaml = String(r.suggestion.snippetObj || r.suggestion.hint || "");
          }
          await navigator.clipboard.writeText(snippetYaml);
          showToast("Snippet copied to clipboard");
        } catch (e) {
          showToast("Failed to copy snippet", { background: "#b91c1c" });
        }
      });
      tdActions.appendChild(copySnippetBtn);
    }

    // Try to find the original rule metadata so we can show an explanation modal
    try {
      const matched = (rules || []).find((rr) => String(rr.id) === String(r.ruleId));
      if (
        matched &&
        matched.explain &&
        (matched.explain.rationale ||
          (Array.isArray(matched.explain.refs) && matched.explain.refs.length))
      ) {
        const explainBtn = document.createElement("button");
        explainBtn.type = "button";
        explainBtn.className = "action-btn icon-btn explain";
        explainBtn.title = "Explain policy (rationale & references)";
        explainBtn.setAttribute("aria-label", "Explain policy");
        explainBtn.innerHTML = "ℹ️";
        explainBtn.addEventListener("click", () => {
          explainTitle.textContent = matched.description
            ? `${matched.id} — ${matched.description}`
            : matched.id;
          explainRationale.textContent = matched.explain.rationale || "";
          // render refs as clickable links
          explainRefs.innerHTML = "";
          if (Array.isArray(matched.explain.refs) && matched.explain.refs.length) {
            const ul = document.createElement("ul");
            matched.explain.refs.forEach((u) => {
              try {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = u;
                a.textContent = u;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                li.appendChild(a);
                ul.appendChild(li);
              } catch (e) {}
            });
            explainRefs.appendChild(ul);
          }
          if (explainModal) {
            explainModal.style.display = "flex";
          }
        });
        tdActions.appendChild(explainBtn);
      }
    } catch (e) {
      /* Explain button wiring failed */
    }

    tr.appendChild(tdSeverity);
    tr.appendChild(tdRule);
    tr.appendChild(tdSource);
    tr.appendChild(tdMessage);
    tr.appendChild(tdActions);
    resultsBody.appendChild(tr);
  });

  // Copy Report Button
  copyBtn.onclick = async () => {
    const report = {
      timestamp: new Date().toISOString(),
      total: results.length,
      errors: errorCount,
      warnings: warningCount,
      infos: infoCount,
      results,
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    copyBtn.textContent = "✅ Copied!";
    setTimeout(() => (copyBtn.textContent = "📋 Copy Report"), 1500);
  };
  // renderResults helper used by manual validation
  function renderResults(results) {
    if (!results || results.length === 0) {
      summary.innerHTML = "✅ No violations found — your YAML meets Guardon checks!";
      statusBadge.textContent = "CLEAN";
      statusBadge.className = "status clean";
      statusBadge.style.display = "inline-block";
      resultsTable.style.display = "none";
      copyBtn.style.display = "none";
      return;
    }
    const errorCount = results.filter((r) => r.severity === "error").length;
    const warningCount = results.filter((r) => r.severity === "warning").length;
    const infoCount = results.filter((r) => r.severity === "info").length;
    let badgeClass = "warning";
    let badgeText = "WARNINGS";
    if (errorCount > 0) {
      badgeClass = "error";
      badgeText = "ERRORS";
    }
    statusBadge.textContent = badgeText;
    statusBadge.className = `status ${badgeClass}`;
    statusBadge.style.display = "inline-block";
    resultsTable.style.display = "table";
    copyBtn.style.display = "inline-block";
    summary.innerHTML = `Found <b>${results.length}</b> violation(s): ${errorCount ? "❌ " + errorCount + " error(s)" : ""} ${warningCount ? " ⚠️ " + warningCount + " warning(s)" : ""} ${infoCount ? " ℹ️ " + infoCount + " info(s)" : ""}`;
    resultsBody.innerHTML = "";
    results.forEach((r) => {
      const tr = document.createElement("tr");
      const icon = r.severity === "error" ? "❌" : r.severity === "warning" ? "⚠️" : "ℹ️";
      const tdSeverity = document.createElement("td");
      tdSeverity.className = r.severity;
      tdSeverity.innerHTML = `<span class="severity-icon">${icon}</span>${r.severity.toUpperCase()}`;

      const tdRule = document.createElement("td");
      tdRule.textContent = r.ruleId;
      const tdSource = document.createElement("td");
      tdSource.textContent = getSourceLabel(r);
      const tdMessage = document.createElement("td");
      setMessageCellContent(tdMessage, r.message);
      const tdActions = document.createElement("td");
      tdActions.className = "actions-cell";

      if (r.suggestion) {
        const previewBtn = document.createElement("button");
        previewBtn.type = "button";
        previewBtn.className = "action-btn icon-btn preview";
        previewBtn.title = "Preview patch";
        previewBtn.setAttribute("aria-label", "Preview patch");
        previewBtn.innerHTML = "🔧";
        previewBtn.addEventListener("click", async () => {
          if (!previewAvailable) {
            alert("Patch preview not available");
            return;
          }
          try {
            const patched = await previewPatchedYaml(currentYamlText, r.docIndex, r.suggestion, {
              fullStream: true,
            });
            suggestionHint.textContent = r.suggestion.hint || r.message || "Suggested fix";
            suggestionPre.textContent = patched || "Failed to generate preview";
            suggestionModal.style.display = "flex";
          } catch (e) {
            // Preview generation failed
            alert("Failed to generate patch preview");
          }
        });
        tdActions.appendChild(previewBtn);

        const copySnippetBtn = document.createElement("button");
        copySnippetBtn.type = "button";
        copySnippetBtn.className = "action-btn icon-btn copy";
        copySnippetBtn.title = "Copy snippet";
        copySnippetBtn.setAttribute("aria-label", "Copy snippet");
        copySnippetBtn.innerHTML = "📋";
        copySnippetBtn.addEventListener("click", async () => {
          try {
            const j = globalThis.jsyaml;
            let snippetYaml = "";
            if (r.suggestion.snippetYaml) {
              snippetYaml = r.suggestion.snippetYaml;
            } else if (r.suggestion.snippetObj && j) {
              snippetYaml = j.dump(r.suggestion.snippetObj, { noRefs: true });
            } else {
              snippetYaml = String(r.suggestion.snippetObj || r.suggestion.hint || "");
            }
            await navigator.clipboard.writeText(snippetYaml);
            showToast("Snippet copied to clipboard");
          } catch (e) {
            showToast("Failed to copy snippet", { background: "#b91c1c" });
          }
        });
        tdActions.appendChild(copySnippetBtn);
      }

      // Explain button (if rule metadata includes explain)
      try {
        const matched = (rules || []).find((rr) => String(rr.id) === String(r.ruleId));
        if (
          matched &&
          matched.explain &&
          (matched.explain.rationale ||
            (Array.isArray(matched.explain.refs) && matched.explain.refs.length))
        ) {
          const explainBtn = document.createElement("button");
          explainBtn.type = "button";
          explainBtn.className = "action-btn icon-btn explain";
          explainBtn.title = "Explain policy (rationale & references)";
          explainBtn.setAttribute("aria-label", "Explain policy");
          explainBtn.innerHTML = "ℹ️";
          explainBtn.addEventListener("click", () => {
            explainTitle.textContent = matched.description
              ? `${matched.id} — ${matched.description}`
              : matched.id;
            explainRationale.textContent = matched.explain.rationale || "";
            explainRefs.innerHTML = "";
            if (Array.isArray(matched.explain.refs) && matched.explain.refs.length) {
              const ul = document.createElement("ul");
              matched.explain.refs.forEach((u) => {
                try {
                  const li = document.createElement("li");
                  const a = document.createElement("a");
                  a.href = u;
                  a.textContent = u;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  li.appendChild(a);
                  ul.appendChild(li);
                } catch (e) {}
              });
              explainRefs.appendChild(ul);
            }
            if (explainModal) {
              explainModal.style.display = "flex";
            }
          });
          tdActions.appendChild(explainBtn);
        }
      } catch (e) {
        /* Explain button wiring failed */
      }

      tr.appendChild(tdSeverity);
      tr.appendChild(tdRule);
      tr.appendChild(tdSource);
      tr.appendChild(tdMessage);
      tr.appendChild(tdActions);
      resultsBody.appendChild(tr);
    });
  }
  console.log("[Guardon popup] initPopup finished wiring UI");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPopup);
} else {
  initPopup();
}
