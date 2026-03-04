// OPA WASM Policy Table Logic

export function updateOpaWasmTable() {
  const display = document.getElementById("opaWasmDisplay");
  const tbody = document.getElementById("opaWasmTableBody");
  const countSpan = document.getElementById("opaWasmCount");
  // If the options page DOM for the OPA table is not present
  // (for example in certain tests), fail gracefully.
  if (!display || !tbody || !countSpan) {
    return;
  }

  tbody.innerHTML = "";
  let policies = [];
  // For now, only one policy is supported (from localStorage)
  const stored = localStorage.getItem("opaWasmPolicy");
  if (stored) {
    const policy = JSON.parse(stored);
    policies.push(policy);
  }
  if (policies.length > 0) {
    display.style.display = "";
    countSpan.textContent = policies.length;
    policies.forEach((p, idx) => {
      const tr = document.createElement("tr");
      const tdName = document.createElement("td");
      tdName.textContent = p.name;
      const tdActions = document.createElement("td");
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑";
      delBtn.title = "Delete";
      delBtn.onclick = () => {
        localStorage.removeItem("opaWasmPolicy");
        updateOpaWasmTable();
      };
      tdActions.appendChild(delBtn);
      tr.appendChild(tdName);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  } else {
    display.style.display = "none";
    countSpan.textContent = "0";
  }
}

export function initOpaWasmTable() {
  updateOpaWasmTable();
}
