// Content script no longer performs inline validation or injects banners on page load.
// Validation is performed explicitly by the extension popup which messages this
// content script to request YAML text or the user's selection. This keeps the
// page DOM untouched unless the user explicitly validates using the extension.

// helper to detect YAML/selection/text on the page (sanitizes common injected elements)
function getPageYamlText() {
  // Prefer user selection if present
  const selection =
    (window.getSelection && window.getSelection().toString && window.getSelection().toString()) ||
    "";
  if (selection && /apiVersion:|kind:|metadata:/i.test(selection)) {
    return selection;
  }

  // GitHub code view: extract all lines from .blob-code-inner and .js-file-line
  let codeLines = [];
  const blobLines = document.querySelectorAll(".blob-code-inner, .js-file-line");
  if (blobLines && blobLines.length) {
    codeLines = Array.from(blobLines).map((b) => b.textContent || "");
  }

  let yamlText = "";
  if (codeLines.length) {
    // Only extract YAML block from code lines
    let start = codeLines.findIndex((l) => /apiVersion:/.test(l));
    let end = codeLines.length - 1;
    // Find end: next apiVersion: or first blank line after start
    for (let i = start + 1; i < codeLines.length; i++) {
      if (/^apiVersion:/.test(codeLines[i]) || codeLines[i].trim() === "") {
        end = i - 1;
        break;
      }
    }
    if (start !== -1 && end >= start) {
      let lines = codeLines.slice(start, end + 1);
      // Remove trailing blank lines and spaces after last YAML line
      while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
        lines.pop();
      }
      yamlText = lines.join("\n");
    }
  } else {
    // Fallback: try pre/code/raw view
    const selectors = [
      ".highlight pre",
      "pre",
      "code",
      ".markdown-body pre",
      ".file .line",
      ".blob-code",
    ];
    let blocks = [];
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found && found.length) {
        blocks = Array.from(found);
        break;
      }
    }
    if (blocks.length) {
      let lines = Array.from(blocks).map((b) => b.textContent || "");
      let start = lines.findIndex((l) => /apiVersion:/.test(l));
      let end = lines.length - 1;
      for (let i = start + 1; i < lines.length; i++) {
        if (/^apiVersion:/.test(lines[i]) || lines[i].trim() === "") {
          end = i - 1;
          break;
        }
      }
      if (start !== -1 && end >= start) {
        lines = lines.slice(start, end + 1);
        while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
          lines.pop();
        }
        yamlText = lines.join("\n");
      }
    } else {
      // Fallback: use body for raw views
      const urlHint = /\.ya?ml($|\?|#)|\/raw\/|\/blob\//i.test(location.href);
      if (urlHint && document.body) {
        let lines = (document.body.innerText || "").split("\n");
        let start = lines.findIndex((l) => /apiVersion:/.test(l));
        let end = lines.length - 1;
        for (let i = start + 1; i < lines.length; i++) {
          if (/^apiVersion:/.test(lines[i]) || lines[i].trim() === "") {
            end = i - 1;
            break;
          }
        }
        if (start !== -1 && end >= start) {
          lines = lines.slice(start, end + 1);
          while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
            lines.pop();
          }
          yamlText = lines.join("\n");
        }
      }
    }
  }

  if (!yamlText || !/apiVersion:|kind:|metadata:/i.test(yamlText)) {
    return null;
  }
  return yamlText;
}

// Message handler: respond to GET_YAML and GET_SELECTION only. Do not modify the page.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) {
    return;
  }
  if (msg.type === "GET_YAML") {
    try {
      const yaml = getPageYamlText();
      sendResponse({ yamlText: yaml });
    } catch {
      sendResponse({ yamlText: null });
    }
    return true; // indicate async (though we call sendResponse synchronously)
  }
  if (msg.type === "GET_SELECTION") {
    try {
      const sel =
        (window.getSelection &&
          window.getSelection().toString &&
          window.getSelection().toString()) ||
        "";
      sendResponse({ selection: sel });
    } catch {
      sendResponse({ selection: "" });
    }
    return true;
  }
});
