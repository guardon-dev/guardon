// Rule management functions extracted from options.js

export function updateRuleCounter(rules) {
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

export function showDeleteConfirmation(idx, rules, saveRules, renderTable, showToast) {
  const rule = rules[idx];
  if (!rule) {return;}
  const deleteModal = document.getElementById("deleteModal");
  const deleteRuleId = document.getElementById("deleteRuleId");
  const deleteRuleDesc = document.getElementById("deleteRuleDesc");
  const confirmDeleteBtn = document.getElementById("confirmDelete");
  const cancelDeleteBtn = document.getElementById("cancelDelete");
  if (deleteRuleId) {deleteRuleId.textContent = rule.id || "Unnamed rule";}
  if (deleteRuleDesc) {deleteRuleDesc.textContent = rule.description || "No description";}
  if (deleteModal) {
    deleteModal.style.display = "flex";
    if (cancelDeleteBtn) {cancelDeleteBtn.focus();}
  }
  const handleConfirm = () => {
    rules.splice(idx, 1);
    saveRules();
    renderTable();
    hideDeleteConfirmation();
    showToast(`Rule "${rule.id}" deleted successfully`, { background: "#059669" });
  };
  const handleCancel = () => { hideDeleteConfirmation(); };
  const handleKeyDown = (e) => {
    if (e.key === "Escape") { e.preventDefault(); handleCancel(); }
    else if (e.key === "Enter" && e.target === confirmDeleteBtn) { e.preventDefault(); handleConfirm(); }
  };
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
  document.addEventListener("keydown", handleKeyDown);
  window._deleteConfirmationCleanup = () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}

export function hideDeleteConfirmation() {
  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) { deleteModal.style.display = "none"; }
  if (window._deleteConfirmationCleanup) {
    window._deleteConfirmationCleanup();
    delete window._deleteConfirmationCleanup;
  }
}
