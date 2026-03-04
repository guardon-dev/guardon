// Runtime-resolving rules engine. This module avoids top-level ESM imports
// so it can be dynamically imported and run in multiple environments
// (extension content script, popup module, Node tests).

async function resolveJsYaml() {
  if (typeof globalThis !== "undefined" && globalThis.jsyaml) {
    return globalThis.jsyaml;
  }

  // In extension/content-script environments prefer a UMD bundle injected
  // by the manifest (content_scripts). If it's not present, don't attempt to
  // import chrome-extension:// URLs via import() (browsers block access to
  // chrome:// or chrome-extension:// from page scripts). Instead, fall back
  // to importing the npm package (Node/dev environments).
  try {
    const mod = await import("js-yaml");
    return mod.default || mod;
  } catch (e) {
    throw new Error(
      "js-yaml runtime not found. Ensure the UMD bundle is injected (manifest content_scripts) or install the 'js-yaml' package for Node. (" +
        (e && e.message) +
        ")"
    );
  }
}

function _get(obj, path) {
  try {
    if (!path) {
      return obj;
    }
    const parts = path.split(".");
    let cur = obj;
    for (let part of parts) {
      // support simple array index like items[0]
      const m = part.match(/([a-zA-Z0-9_\-]+)(?:\[(\d+)\])?/);
      if (!m) {
        return undefined;
      }
      const key = m[1];
      const idx = m[2] !== undefined ? parseInt(m[2], 10) : null;
      if (cur === null || typeof cur !== "object" || !(key in cur)) {
        return undefined;
      }
      cur = cur[key];
      if (idx !== null) {
        if (!Array.isArray(cur)) {
          return undefined;
        }
        cur = cur[idx];
      }
    }
    return cur;
  } catch (e) {
    // Defensive: never throw from path resolution — return undefined so
    // callers (validation rules) treat missing paths as absent instead of
    // crashing when intermediate segments are not objects/arrays.
    // [rulesEngine] _get defensive fallback for path
    return undefined;
  }
}

function _has(obj, path) {
  try {
    return _get(obj, path) !== undefined;
  } catch (e) {
    return false;
  }
}

// Return the immediate parent path for a dot-notated path string.
// Examples:
//  - 'spec.template.spec.containers[0].resources' -> 'spec.template.spec.containers[0]'
//  - 'metadata.name' -> 'metadata'
//  - 'kind' -> '' (no parent)
function getParentPath(path) {
  if (!path) {
    return "";
  }
  const parts = path.split(".");
  if (parts.length <= 1) {
    return "";
  }
  return parts.slice(0, -1).join(".");
}

export async function validateYaml(yamlText, rules) {
  const jsyaml = await resolveJsYaml();
  // Defensive: ensure yamlText is a string. js-yaml calls `input.split(...)`
  // internally and will throw if passed `undefined`.
  if (yamlText === null) {
    yamlText = "";
  }
  if (typeof yamlText !== "string") {
    yamlText = String(yamlText);
  }

  let docs = [];
  try {
    // Parse all documents in the YAML stream. loadAll pushes each document
    // into the provided array via a callback.
    jsyaml.loadAll(yamlText, (d) => docs.push(d));
  } catch (err) {
    // Include mark (line/column) when available so callers can highlight the error
    const parseErr = {
      ruleId: "parse-error",
      severity: "error",
      message: "Invalid YAML: " + (err && err.message ? err.message : String(err)),
    };
    if (
      err &&
      err.mark &&
      (typeof err.mark.line === "number" || typeof err.mark.column === "number")
    ) {
      parseErr.mark = { line: err.mark.line, column: err.mark.column };
    }
    return [parseErr];
  }

  if (!docs || docs.length === 0) {
    return [];
  }

  const results = [];

  // Validate each document separately so multi-doc YAML is supported.
  for (let docIndex = 0; docIndex < docs.length; docIndex++) {
    const doc = docs[docIndex];
    for (const rule of rules) {
      // Skip disabled rules (temporary disable feature)
      if (rule && rule.enabled === false) {
        continue;
      }
      // Guard each rule evaluation so a missing intermediate path or
      // unexpected structure doesn't throw and break validation for the
      // entire document. If a rule cannot be evaluated we treat it as
      // not-present (for required checks) or not-matching (for patterns).
      try {
        const matchPath = (rule.match || "").replace(/\[\*\]/g, "");
        const value = _get(doc, matchPath);

        // Kind filtering: if rule defines a comma-separated `kind` field,
        // only apply the rule when the YAML document's `kind` matches one
        // of the values (case-insensitive). If the document has no `kind`,
        // the rule is skipped.
        if (rule.kind) {
          const allowed = String(rule.kind)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => s.toLowerCase());
          if (allowed.length > 0) {
            const docKind = _get(doc, "kind");
            if (docKind === null) {
              // No kind on this document -> skip rule
              continue;
            }
            const docKindNorm = String(docKind).toLowerCase();
            if (!allowed.includes(docKindNorm)) {
              // kind doesn't match -> skip this rule
              continue;
            }
          }
        }

        // Pattern-based validation
        if (rule.pattern) {
          try {
            // If the rule.match contains a wildcard ([*]) perform per-element checks
            const rawMatchForPattern = rule.match || "";
            const starIdxPat = rawMatchForPattern.indexOf("[*]");
            if (starIdxPat !== -1) {
              const basePath = rawMatchForPattern.substring(0, starIdxPat);
              const remainder = rawMatchForPattern.substring(starIdxPat + 3); // e.g. '.value'
              const parentVal = _get(doc, basePath);
              if (Array.isArray(parentVal)) {
                for (let i = 0; i < parentVal.length; i++) {
                  const elemPath = `${basePath}[${i}]${remainder}`;
                  const elemVal = _get(doc, elemPath);
                  if (typeof elemVal !== "string") {
                    continue;
                  }

                  // If rule specifies a siblingProperty condition, evaluate it
                  if (rule.siblingProperty && rule.siblingValue !== undefined) {
                    const lastDot = elemPath.lastIndexOf(".");
                    const siblingPath =
                      lastDot !== -1
                        ? `${elemPath.substring(0, lastDot + 1)}${rule.siblingProperty}`
                        : `${rule.siblingProperty}`;
                    const sibVal = _get(doc, siblingPath);
                    if (sibVal === null || String(sibVal) !== String(rule.siblingValue)) {
                      continue;
                    }
                  }

                  let re;
                  try {
                    re = new RegExp(rule.pattern);
                  } catch (e) {
                    // [rulesEngine] invalid RegExp in rule
                    continue;
                  }
                  if (re.test(elemVal)) {
                    const res = {
                      ruleId: rule.id,
                      severity: rule.severity,
                      message: rule.message || rule.description,
                      path: elemPath,
                      docIndex,
                    };
                    // If the rule provides a fix hint, attach a suggestion object
                    if (rule && rule.fix) {
                      try {
                        const suggested = {};
                        suggested.action = rule.fix.action || "insert";
                        suggested.targetPath = elemPath;
                        // prefer structured value; fallback to raw fix.value
                        if (rule.fix.value !== undefined) {
                          suggested.snippetObj = rule.fix.value;
                        }
                        suggested.hint = rule.fix.hint || "";
                        res.suggestion = suggested;
                      } catch (e) {}
                    }
                    results.push(res);
                  }
                }
              } else if (parentVal !== null && typeof parentVal === "object") {
                // Parent exists as non-array -> treat as single element
                const elemPath = `${basePath}${remainder}`;
                const elemVal = _get(doc, elemPath);
                if (typeof elemVal === "string") {
                  if (rule.siblingProperty && rule.siblingValue !== undefined) {
                    const lastDot = elemPath.lastIndexOf(".");
                    const siblingPath =
                      lastDot !== -1
                        ? `${elemPath.substring(0, lastDot + 1)}${rule.siblingProperty}`
                        : `${rule.siblingProperty}`;
                    const sibVal = _get(doc, siblingPath);
                    if (sibVal === null || String(sibVal) !== String(rule.siblingValue)) {
                      // skip
                    } else {
                      let re2;
                      try {
                        re2 = new RegExp(rule.pattern);
                      } catch (e) {
                        continue;
                      }
                      if (re2.test(elemVal)) {
                        results.push({
                          ruleId: rule.id,
                          severity: rule.severity,
                          message: rule.message || rule.description,
                          path: elemPath,
                          docIndex,
                        });
                      }
                    }
                  } else {
                    let re2;
                    try {
                      re2 = new RegExp(rule.pattern);
                    } catch (e) {
                      continue;
                    }
                    if (re2.test(elemVal)) {
                      results.push({
                        ruleId: rule.id,
                        severity: rule.severity,
                        message: rule.message || rule.description,
                        path: elemPath,
                        docIndex,
                      });
                    }
                  }
                }
              }
            } else {
              // No wildcard: original behavior
              const matchPath = (rule.match || "").replace(/\[\*\]/g, "");
              const valueForPattern = _get(doc, matchPath);
              if (typeof valueForPattern === "string") {
                // siblingProperty handling for non-wildcard: compute sibling path
                if (rule.siblingProperty && rule.siblingValue !== undefined) {
                  const lastDot = matchPath.lastIndexOf(".");
                  const siblingPath =
                    lastDot !== -1
                      ? `${matchPath.substring(0, lastDot + 1)}${rule.siblingProperty}`
                      : `${rule.siblingProperty}`;
                  const sibVal = _get(doc, siblingPath);
                  if (sibVal === null || String(sibVal) !== String(rule.siblingValue)) {
                    // skip
                  } else {
                    let re3;
                    try {
                      re3 = new RegExp(rule.pattern);
                    } catch (e) {
                      re3 = null;
                    }
                    if (re3 && re3.test(valueForPattern)) {
                      const res = {
                        ruleId: rule.id,
                        severity: rule.severity,
                        message: rule.message || rule.description,
                        path: rule.match,
                        docIndex,
                      };
                      if (rule && rule.fix) {
                        try {
                          const suggested = {
                            action: rule.fix.action || "replace",
                            targetPath: matchPath,
                            hint: rule.fix.hint || "",
                          };
                          if (rule.fix.value !== undefined) {
                            suggested.snippetObj = rule.fix.value;
                          }
                          res.suggestion = suggested;
                        } catch (e) {}
                      }
                      results.push(res);
                    }
                  }
                } else {
                  let re3;
                  try {
                    re3 = new RegExp(rule.pattern);
                  } catch (e) {
                    re3 = null;
                  }
                  if (re3 && re3.test(valueForPattern)) {
                    const res = {
                      ruleId: rule.id,
                      severity: rule.severity,
                      message: rule.message || rule.description,
                      path: rule.match,
                      docIndex,
                    };
                    if (rule && rule.fix) {
                      try {
                        const suggested = {
                          action: rule.fix.action || "replace",
                          targetPath: matchPath,
                          hint: rule.fix.hint || "",
                        };
                        if (rule.fix.value !== undefined) {
                          suggested.snippetObj = rule.fix.value;
                        }
                        res.suggestion = suggested;
                      } catch (e) {}
                    }
                    results.push(res);
                  }
                }
              }
            }
          } catch (e) {
            // [rulesEngine] pattern evaluation error for rule
          }
        }

        // Required field validation — treat missing intermediate elements as
        // the field being absent (do not throw). Special handling for rules
        // that include an array wildcard ([*]): only report a missing child
        // when the wildcard parent exists in the document (e.g. if
        // spec.containers[*].resources is required, do NOT report if
        // spec.containers is absent).
        if (rule.required) {
          const rawMatch = rule.match || "";
          // Handle wildcard path like 'spec.containers[*].resources'
          const starIdx = rawMatch.indexOf("[*]");
          if (starIdx !== -1) {
            const basePath = rawMatch.substring(0, starIdx); // e.g. 'spec.containers'
            const parentVal = _get(doc, basePath);
            // If parent (the array) is missing, skip reporting.
            if (parentVal === undefined || parentVal === null) {
              // [rulesEngine] skipping required check for wildcard parent is missing
            }
            if (Array.isArray(parentVal)) {
              // Per-element reporting: for each element that does NOT have the
              // required child path, emit a missing-field result with the
              // specific element path (e.g. 'spec.containers[0].resources').
              const remainder = rawMatch.substring(starIdx + 3); // e.g. '.resources'
              for (let i = 0; i < parentVal.length; i++) {
                const elemPath = `${basePath}[${i}]${remainder}`;
                if (!_has(doc, elemPath)) {
                  const res = {
                    ruleId: rule.id,
                    severity: rule.severity,
                    message: rule.message || `Missing required field: ${rule.match}`,
                    path: elemPath,
                    docIndex,
                  };
                  if (rule && rule.fix) {
                    try {
                      const suggested = {
                        action: rule.fix.action || "insert",
                        targetPath: elemPath,
                        hint: rule.fix.hint || "",
                      };
                      if (rule.fix.value !== undefined) {
                        suggested.snippetObj = rule.fix.value;
                      }
                      res.suggestion = suggested;
                    } catch (e) {}
                  }
                  results.push(res);
                }
              }
            } else {
              // Parent exists but is not an array. Treat it as a single
              // element: check the child path relative to the parent and
              // report if missing.
              const remainder = rawMatch.substring(starIdx + 3); // e.g. '.resources'
              const elemPath = `${basePath}${remainder}`;
              if (!_has(doc, elemPath)) {
                const res = {
                  ruleId: rule.id,
                  severity: rule.severity,
                  message: rule.message || `Missing required field: ${rule.match}`,
                  path: elemPath,
                  docIndex,
                };
                if (rule && rule.fix) {
                  try {
                    const suggested = {
                      action: rule.fix.action || "insert",
                      targetPath: elemPath,
                      hint: rule.fix.hint || "",
                    };
                    if (rule.fix.value !== undefined) {
                      suggested.snippetObj = rule.fix.value;
                    }
                    res.suggestion = suggested;
                  } catch (e) {}
                }
                results.push(res);
              }
            }
          } else {
            // No wildcard: apply previous immediate-parent skipping behavior
            const parentPath = getParentPath(matchPath);
            // If there's an explicit parent path and the parent is missing,
            // skip reporting the missing child to avoid noisy errors.
            if (parentPath && !_has(doc, parentPath)) {
              // [rulesEngine] skipping required check for parent is missing
            } else if (!_has(doc, matchPath)) {
              const res = {
                ruleId: rule.id,
                severity: rule.severity,
                message: rule.message || `Missing required field: ${rule.match}`,
                path: rule.match,
                docIndex,
              };
              if (rule && rule.fix) {
                try {
                  const suggested = {
                    action: rule.fix.action || "insert",
                    targetPath: matchPath,
                    hint: rule.fix.hint || "",
                  };
                  if (rule.fix.value !== undefined) {
                    suggested.snippetObj = rule.fix.value;
                  }
                  res.suggestion = suggested;
                } catch (e) {}
              }
              results.push(res);
            }
          }
        }
      } catch (e) {
        // Defensive: log and skip the rule rather than throwing up to callers.
        // [rulesEngine] skipped rule due to error
      }
    }
  }

  return results;
}

// Attempt to find a path string (dot/array notation) in `obj` whose leaf
// value equals or contains `target`. Returns the first matching path or null.
function findPathByValue(obj, target) {
  if (target === null) {
    return null;
  }
  const visited = new WeakSet();

  function helper(cur, path) {
    if (cur && typeof cur === "object") {
      if (visited.has(cur)) {
        return null;
      }
      visited.add(cur);
      if (Array.isArray(cur)) {
        for (let i = 0; i < cur.length; i++) {
          const p = helper(cur[i], `${path}[${i}]`);
          if (p) {
            return p;
          }
        }
      } else {
        for (const k of Object.keys(cur)) {
          const p = helper(cur[k], path ? `${path}.${k}` : k);
          if (p) {
            return p;
          }
        }
      }
      return null;
    }

    // Leaf node: compare
    try {
      if (typeof target === "string" && typeof cur === "string") {
        if (cur.includes(target) || cur === target) {
          return path;
        }
      } else {
        // loose equality check for numbers/booleans
        if (cur === target) {
          return path;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  return helper(obj, "") || null;
}

// Helpers to apply suggestion objects to a document object
function setNested(obj, path, value) {
  if (!path) {
    return;
  }
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const m = part.match(/([a-zA-Z0-9_\-]+)(?:\[(\d+)\])?/);
    if (!m) {
      throw new Error("Invalid path part: " + part);
    }
    const key = m[1];
    const idx = m[2] !== undefined ? parseInt(m[2], 10) : null;
    const isLast = i === parts.length - 1;
    if (isLast) {
      if (idx === null) {
        cur[key] = value;
      } else {
        cur[key] = cur[key] || [];
        cur[key][idx] = value;
      }
      return;
    }
    // ensure intermediate
    if (!(key in cur) || cur[key] === null) {
      cur[key] = idx === null ? {} : [];
    }
    cur = cur[key];
    if (idx !== null) {
      cur[idx] = cur[idx] || {};
      cur = cur[idx];
    }
  }
}

function deleteNested(obj, path) {
  if (!path) {
    return;
  }
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const m = part.match(/([a-zA-Z0-9_\-]+)(?:\[(\d+)\])?/);
    if (!m) {
      return;
    }
    const key = m[1];
    const idx = m[2] !== undefined ? parseInt(m[2], 10) : null;
    const isLast = i === parts.length - 1;
    if (isLast) {
      if (idx === null) {
        delete cur[key];
      } else if (Array.isArray(cur[key])) {
        cur[key].splice(idx, 1);
      }
      return;
    }
    if (!(key in cur)) {
      return;
    }
    cur = cur[key];
    if (idx !== null) {
      if (!Array.isArray(cur)) {
        return;
      }
      cur = cur[idx];
    }
    if (cur === null) {
      return;
    }
  }
}

function applySuggestionToDoc(doc, suggestion, jsyaml) {
  if (!suggestion) {
    return;
  }
  const action = suggestion.action || "insert";
  const target = suggestion.targetPath;
  let snippet = suggestion.snippetObj;
  if (snippet === undefined && suggestion.snippetYaml && jsyaml) {
    try {
      snippet = jsyaml.load(suggestion.snippetYaml);
    } catch (e) {
      snippet = undefined;
    }
  }
  if (action === "insert" || action === "replace" || action === "patch") {
    // For insert/replace, set the nested value
    setNested(doc, target, snippet === undefined ? suggestion.snippetYaml || {} : snippet);
  } else if (action === "remove") {
    deleteNested(doc, target);
  }
}

export async function previewPatchedYaml(
  yamlText,
  docIndex,
  suggestion,
  opts = { fullStream: false }
) {
  const jsyaml = await resolveJsYaml();
  const docs = [];
  try {
    jsyaml.loadAll(yamlText, (d) => docs.push(d));
  } catch (e) {
    throw new Error("Failed to parse YAML for preview: " + (e && e.message));
  }
  if (!docs[docIndex]) {
    return null;
  }
  const doc = docs[docIndex];
  applySuggestionToDoc(doc, suggestion, jsyaml);
  // Return the patched document YAML snippet (single-doc) or full multi-doc stream
  try {
    if (opts && opts.fullStream) {
      // replace the doc at docIndex in docs and dump all with '---' separators
      docs[docIndex] = doc;
      const parts = docs.map((d) => jsyaml.dump(d, { noRefs: true, sortKeys: false }));
      return parts.join("\n---\n");
    }
    return jsyaml.dump(doc, { noRefs: true, sortKeys: false });
  } catch (e) {
    return null;
  }
}

// Re-export helper utilities for tests and consumers that import this module dynamically
export {
  resolveJsYaml,
  _get,
  _has,
  getParentPath,
  findPathByValue,
  setNested,
  deleteNested,
  applySuggestionToDoc,
  // validateYaml and previewPatchedYaml are already exported where they are defined
};
