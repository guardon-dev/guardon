// OPA Rules Import Modal Logic

export function showOpaImportModal(onSaveCallback) {
  let modal = document.getElementById("opaImportModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "opaImportModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-content" style="background:#fff;padding:24px 20px;border-radius:8px;max-width:420px;width:100%;margin:60px auto;box-shadow:0 2px 16px #0002;">
        <h3 style="margin-top:0">Import OPA WASM Policy</h3>
        <input id="opaWasmFile" type="file" accept=".wasm" style="margin-bottom:16px;" />
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="opaWasmSave" style="background:#2563eb;color:#fff;padding:6px 16px;border:none;border-radius:4px;">Save</button>
          <button id="opaWasmClear" style="background:#e5e7eb;color:#111;padding:6px 16px;border:none;border-radius:4px;">Clear/Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Ensure newly created modal is visible on first open
    modal.style.display = "flex";
  } else {
    modal.style.display = "flex";
  }
  // Clear/Close button handler
  document.getElementById("opaWasmClear").onclick = () => {
    modal.style.display = "none";
    document.getElementById("opaWasmFile").value = "";
  };
  // Save button handler
  document.getElementById("opaWasmSave").onclick = async () => {
    const fileInput = document.getElementById("opaWasmFile");
    if (!fileInput.files || !fileInput.files[0]) {
      alert("Please select a .wasm file to import.");
      return;
    }
    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
    // Store in localStorage (or chrome.storage.local for extension)
    // For now, use localStorage for demo
    localStorage.setItem(
      "opaWasmPolicy",
      JSON.stringify({
        name: file.name,
        data: Array.from(new Uint8Array(arrayBuffer)),
      })
    );
    // Load and instantiate OPA WASM using OPA WASM JS runtime
    try {
      // Dynamically import OPA WASM JS runtime
      import("../lib/opa-wasm-bundle.js").then((mod) => {
        const opaWasm = mod.default;
        const wasmBuffer = arrayBuffer;
        opaWasm
          .loadPolicy(wasmBuffer)
          .then((instance) => {
            // You can now use instance to evaluate input, etc.
            window.opaWasmInstance = instance; // Expose for debugging/demo
            console.log("OPA WASM policy loaded:", instance);
          })
          .catch((err) => {
            console.error("Failed to instantiate OPA WASM:", err);
          });
      });
    } catch (err) {
      console.error("OPA WASM JS runtime load error:", err);
    }
    modal.style.display = "none";
    if (typeof onSaveCallback === "function") {
      onSaveCallback({ name: file.name });
    }
  };
}

export function hideOpaImportModal() {
  const modal = document.getElementById("opaImportModal");
  if (modal) modal.style.display = "none";
}
