// Utility functions extracted from options.js

export function showToast(msg, opts = {}) {
  const toast = document.getElementById("toast");
  if (!toast) {
    return;
  }
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

export function saveRawKyverno(rawText, meta = {}) {
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

export function applyNormalizedRules(items, rules, saveRules, renderTable) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  const normalized = items.map((r) => ({
    id: String(
      r.id ||
        (r.description ? r.description.replace(/\s+/g, "-").toLowerCase() : `rule-${Date.now()}`)
    ).trim(),
    description: r.description || r.desc || "",
    kind: r.kind || "",
    match: r.match || "",
    pattern: r.pattern || "",
    required: r.required === true || r.required === "true",
    severity: r.severity || "warning",
    message: r.message || "",
    fix: r.fix !== undefined ? r.fix : undefined,
    explain: r.explain || undefined,
  }));

  let added = 0,
    replaced = 0;
  for (const nr of normalized) {
    if (!nr.id) {
      continue;
    }
    const idx = rules.findIndex((r) => r.id === nr.id);
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
    try {
      saveRules();
    } catch {
      /* saveRules failed */
    }
    try {
      renderTable();
    } catch {
      /* renderTable failed */
    }
    showToast(`Imported ${added} new, replaced ${replaced} existing rule(s)`, {
      background: "#059669",
    });
  }
  return added + replaced;
}
