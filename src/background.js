chrome.runtime.onInstalled.addListener(() => {
  // Extension installed
});

// Provide a fetch helper so popup can request raw file contents via the
// extension service worker (bypasses page CORS limitations when host
// permissions are granted in the manifest).
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== "FETCH_RAW" || !msg.url) {
    return;
  }
  (async () => {
    try {
      const resp = await fetch(msg.url);
      if (!resp.ok) {
        sendResponse({ ok: false, status: resp.status, statusText: resp.statusText });
        return;
      }
      const text = await resp.text();
      sendResponse({ ok: true, text });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  // Indicate we'll call sendResponse asynchronously
  return true;
});
