// Kyverno preview helpers extracted for testability and smaller options module
export function escapeHtml(s) {
  if (s === null) {
    return "";
  }
  return String(s).replace(
    /[&<>\"'`]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" })[c]
  );
}

export function showKyvernoPreview(converted, rawText, meta = {}, dom) {
  // dom param is optional for testability; defaults to global document lookups
  // Avoid defaulting to an empty object (truthy) which would prevent
  // falling back to the real `document` when caller omits the dom arg.
  const _dom = dom || document;
  const kyvernoModal = _dom.getElementById("kyvernoModal");
  const kyvernoPreviewBody = _dom.getElementById("kyvernoPreviewBody");
  const kyvernoMeta = _dom.getElementById("kyvernoMeta");
  if (!kyvernoModal || !kyvernoPreviewBody || !kyvernoMeta) {
    return;
  }
  kyvernoPreviewBody.innerHTML = "";
  kyvernoMeta.textContent = `Policy source: ${meta.url || "fetched content"} — converted ${converted.length} rule(s)`;
  converted.forEach((r, idx) => {
    const tr = _dom.createElement("tr");
    const chkTd = _dom.createElement("td");
    chkTd.style.padding = "6px";
    chkTd.style.borderBottom = "1px solid #eee";
    const chk = _dom.createElement("input");
    chk.type = "checkbox";
    chk.className = "kyvernoRowCheckbox";
    chk.value = String(idx);
    chk.checked = true;
    chkTd.appendChild(chk);

    const idTd = _dom.createElement("td");
    idTd.style.padding = "6px";
    idTd.style.borderBottom = "1px solid #eee";
    idTd.textContent = escapeHtml(r.id);
    const descTd = _dom.createElement("td");
    descTd.style.padding = "6px";
    descTd.style.borderBottom = "1px solid #eee";
    descTd.textContent = escapeHtml(r.description);
    const kindTd = _dom.createElement("td");
    kindTd.style.padding = "6px";
    kindTd.style.borderBottom = "1px solid #eee";
    kindTd.textContent = escapeHtml(r.kind);
    const matchTd = _dom.createElement("td");
    matchTd.style.padding = "6px";
    matchTd.style.borderBottom = "1px solid #eee";
    matchTd.textContent = escapeHtml(r.match);
    const msgTd = _dom.createElement("td");
    msgTd.style.padding = "6px";
    msgTd.style.borderBottom = "1px solid #eee";
    msgTd.textContent = escapeHtml(r.message);

    tr.appendChild(chkTd);
    tr.appendChild(idTd);
    tr.appendChild(descTd);
    tr.appendChild(kindTd);
    tr.appendChild(matchTd);
    tr.appendChild(msgTd);
    kyvernoPreviewBody.appendChild(tr);
  });

  const selectAll = document.getElementById("kyvernoSelectAll");
  if (selectAll) {
    selectAll.checked = true;
    selectAll.onclick = () => {
      const checked = !!selectAll.checked;
      const boxes = kyvernoPreviewBody.querySelectorAll("input.kyvernoRowCheckbox");
      boxes.forEach((b) => (b.checked = checked));
    };
  }
  kyvernoModal.style.display = "flex";
}

export function hideKyvernoPreview(dom) {
  const _dom = dom || document;
  const kyvernoModal = _dom.getElementById("kyvernoModal");
  if (!kyvernoModal) {
    return;
  }
  kyvernoModal.style.display = "none";
}
