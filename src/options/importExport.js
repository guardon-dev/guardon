// Modularized import/export logic for rules
import { showToast, applyNormalizedRules } from "./utils.js";

export function exportRules(rules) {
  try {
    const dataStr = JSON.stringify(rules, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guardon-rules.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    showToast("Exported rules as JSON", { background: "#059669" });
  } catch (e) {
    showToast("Failed to export rules", { background: "#b91c1c" });
  }
}

export async function importRules({ importFile, importTextarea, importUrlInput, rules, saveRules, renderTable, importPanelModal }) {
  let importText = "";
  let fileName = "";
  // 1. Try file input
  if (importFile && importFile.files && importFile.files[0]) {
    const file = importFile.files[0];
    fileName = file.name || "";
    try {
      importText = await file.text();
    } catch (e) {
      showToast("Failed to read file", { background: "#b91c1c" });
      return;
    }
  } else if (importTextarea && importTextarea.value.trim()) {
    importText = importTextarea.value.trim();
  } else if (importUrlInput && importUrlInput.value.trim()) {
    try {
      const resp = await fetch(importUrlInput.value.trim());
      if (!resp.ok) {throw new Error("HTTP " + resp.status);}
      importText = await resp.text();
      fileName = importUrlInput.value.trim();
    } catch (e) {
      showToast("Failed to fetch URL", { background: "#b91c1c" });
      return;
    }
  } else {
    showToast("No import source provided", { background: "#b91c1c" });
    return;
  }

  // Try JSON first
  let data = null;
  let kyvernoDocs = null;
  let kyvernoConverted = null;
  let triedYaml = false;
  try {
    data = JSON.parse(importText);
  } catch (e) {
    // Try YAML if JSON fails
    triedYaml = true;
    try {
      if (window.jsyaml && window.jsyaml.loadAll) {
        kyvernoDocs = window.jsyaml.loadAll(importText);
      } else if (window.jsyaml && window.jsyaml.load) {
        kyvernoDocs = [window.jsyaml.load(importText)];
      } else {
        showToast("YAML parser not loaded", { background: "#b91c1c" });
        return;
      }
    } catch (yamlErr) {
      kyvernoDocs = null;
    }
    // Check for Kyverno docs
    if (kyvernoDocs && window.kyvernoImporter && window.kyvernoImporter.convertDocs) {
      kyvernoConverted = window.kyvernoImporter.convertDocs(kyvernoDocs);
      if (kyvernoConverted && kyvernoConverted.length > 0) {
        // This logic expects a showKyvernoPreview function in the caller's scope
        if (typeof window.showKyvernoPreview === "function") {
          window.showKyvernoPreview(kyvernoConverted, importText, { source: "import", count: kyvernoConverted.length });
        }
        return;
      }
    }
  }

  // If not Kyverno, not valid JSON, and looks like Rego, treat as Rego (Kubernetes filter)
  const isRego = fileName.endsWith(".rego") || importText.trim().startsWith("package ") || importText.includes("policy.rego") || importText.includes("deny") || importText.includes("allow");
  if (triedYaml && !kyvernoConverted && isRego) {
    // Kubernetes-related Rego detection (standard patterns)
    // Only allow import if at least one Kubernetes-specific pattern is found
    const k8sPatterns = [
      /input\.(request|kubernetes|review)/i,
      /apiVersion\s*[:=]/i,
      /kind\s*[:=]/i,
      /metadata\s*[:=]/i,
      /spec\s*[:=]/i,
      /pod(s)?/i,
      /deployment(s)?/i,
      /service(s)?/i,
      /namespace(s)?/i,
      /configmap(s)?/i,
      /secret(s)?/i,
      /ingress(es)?/i
    ];
    const isK8sRego = k8sPatterns.some(re => re.test(importText));
    if (!isK8sRego) {
      showToast("Only Kubernetes-related Rego policies can be imported. This file does not appear to reference Kubernetes resources.", { background: "#b91c1c" });
      return;
    }
    // Treat as plain text, wrap as a rule object
    const regoRule = {
      id: `rego-${Date.now()}`,
      description: fileName || "Rego Policy",
      kind: "rego",
      match: "*",
      pattern: "",
      required: true,
      severity: "warning",
      message: "Imported OPA/Rego policy",
      rego: importText
    };
    const importedCount = applyNormalizedRules([regoRule], rules, saveRules, renderTable);
    if (importedCount > 0 && importPanelModal) {
      importPanelModal.style.display = "none";
      if (importFile) {importFile.value = "";}
      if (importTextarea) {importTextarea.value = "";}
      if (importUrlInput) {importUrlInput.value = "";}
    }
    showToast("Imported Rego policy", { background: "#059669" });
    return;
  }

  // Accept either an array of rules or { customRules: [...] }
  let rulesArr = Array.isArray(data) ? data : (Array.isArray(data.customRules) ? data.customRules : null);
  if (!rulesArr) {
    showToast("JSON must be an array or { customRules: [...] }", { background: "#b91c1c" });
    return;
  }
  const importedCount = applyNormalizedRules(rulesArr, rules, saveRules, renderTable);
  if (importedCount > 0 && importPanelModal) {
    importPanelModal.style.display = "none";
    if (importFile) {importFile.value = "";}
    if (importTextarea) {importTextarea.value = "";}
    if (importUrlInput) {importUrlInput.value = "";}
  }
}
