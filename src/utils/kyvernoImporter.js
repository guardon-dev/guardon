// Lightweight Kyverno -> internal rules converter.
// Exposes a global `window.kyvernoImporter.convertDocs(docs)` that accepts
// an array of parsed YAML documents and returns an array of converted rule
// objects suitable for importing by the options page.

(function () {
  function isKyvernoPolicy(doc) {
    if (!doc || typeof doc !== "object") {
      return false;
    }
    const api = String(doc.apiVersion || "").toLowerCase();
    const kind = String(doc.kind || "").toLowerCase();
    return api.includes("kyverno.io") && (kind === "policy" || kind === "clusterpolicy");
  }

  // Walk a Kyverno validate.pattern object and collect leaf paths.
  // We produce dot-notation paths and convert array occurrences to `[*]`.
  function collectPaths(obj, base = "", paths = []) {
    if (obj === null || obj === undefined) {
      // treat presence of null as a leaf
      paths.push(base);
      return paths;
    }

    if (typeof obj !== "object") {
      // scalar leaf
      paths.push(base);
      return paths;
    }

    if (Array.isArray(obj)) {
      // For arrays, treat as array-of-objects or array-of-scalars. Use [*]
      const arrBase = base ? base + "[*]" : "[*]";
      if (obj.length === 0) {
        paths.push(arrBase);
      } else {
        // Recurse into first element to discover structure
        collectPaths(obj[0], arrBase, paths);
      }
      return paths;
    }

    // Object: recurse into keys
    for (const k of Object.keys(obj)) {
      // Kyverno pattern keys sometimes use parentheses or leading '=' like
      // '=(env)' or '(name)'. Normalize to safe key names that match our
      // rules engine token regex (alphanum, underscore, hyphen).
      const safeKey = String(k).replace(/[^a-zA-Z0-9_\-]/g, "");
      if (!safeKey) {
        // Fallback: if sanitizing removes everything, skip this key
        continue;
      }
      const nextBase = base ? `${base}.${safeKey}` : safeKey;
      collectPaths(obj[k], nextBase, paths);
    }
    return paths;
  }

  // Convert a Kyverno pattern object into rule descriptors. This function
  // walks the pattern and looks for array element objects that contain both
  // a `name` and a `value` entry (common for env var checks). When it finds
  // such an element and the `value` is a string starting with '!' we emit a
  // pattern-based rule that targets the element's `.value` and includes a
  // sibling condition so the rules engine can check the sibling `name`.
  function convertPatternToRules(obj, base = "") {
    const out = [];
    if (obj === null || obj === undefined) {
      return out;
    }
    if (typeof obj !== "object") {
      return out;
    }

    if (Array.isArray(obj)) {
      const arrBase = base ? `${base}[*]` : "[*]";
      if (obj.length > 0) {
        // Recurse into first element to infer the element structure
        out.push(...convertPatternToRules(obj[0], arrBase));
      }
      return out;
    }

    // If this object looks like an env entry with name & value keys, handle it.
    const keys = Object.keys(obj).map((k) => String(k).replace(/[^a-zA-Z0-9_\-]/g, ""));
    if (keys.includes("name") && keys.includes("value")) {
      const nameVal = obj["name"];
      const valueVal = obj["value"];
      if (typeof nameVal === "string" && typeof valueVal === "string") {
        // If value begins with '!' it's a negative assertion in Kyverno
        if (valueVal.startsWith("!")) {
          const forbidden = valueVal.substring(1);
          // match the .value field of this element
          const match = base ? `${base}.value` : "value";
          out.push({
            match,
            pattern: `^${escapeRegExp(forbidden)}$`,
            required: false,
            severity: "warning",
            message: `Value must not be ${forbidden} (env ${nameVal})`,
            siblingProperty: "name",
            siblingValue: nameVal,
            // Provide a suggestion to replace the forbidden value with the positive value
            fix: {
              action: "replace",
              value: forbidden,
              hint: `Replace env value for ${nameVal} to ${forbidden}`,
            },
          });
        } else {
          // Positive equality — interpret as a pattern that flags when the
          // value does NOT equal the expected value is trickier; for now we
          // produce a pattern that flags when the value equals the provided
          // literal (mirror Kyverno semantics depends on direction). Here we
          // flag exact matches (this may need refinement).
          const expected = valueVal;
          const match = base ? `${base}.value` : "value";
          out.push({
            match,
            pattern: `^${escapeRegExp(expected)}$`,
            required: false,
            severity: "warning",
            message: `Value must be ${expected} (env ${nameVal})`,
            siblingProperty: "name",
            siblingValue: nameVal,
            fix: { action: "replace", value: expected, hint: `Set env ${nameVal} to ${expected}` },
          });
        }
      }
    }

    // Recurse into object keys
    for (const k of Object.keys(obj)) {
      const safeKey = String(k).replace(/[^a-zA-Z0-9_\-]/g, "");
      if (!safeKey) {
        continue;
      }
      const nextBase = base ? `${base}.${safeKey}` : safeKey;
      out.push(...convertPatternToRules(obj[k], nextBase));
    }
    return out;
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeKinds(kinds) {
    if (!kinds) {
      return "";
    }
    if (Array.isArray(kinds)) {
      return kinds.join(",");
    }
    return String(kinds);
  }

  function convertDocs(docs) {
    const out = [];
    if (!docs || !Array.isArray(docs)) {
      return out;
    }

    for (const doc of docs) {
      if (!isKyvernoPolicy(doc)) {
        continue;
      }
      const policyName = (doc.metadata && doc.metadata.name) || "kyverno-policy";
      const specRules = (doc.spec && Array.isArray(doc.spec.rules) && doc.spec.rules) || [];
      for (let ri = 0; ri < specRules.length; ri++) {
        const r = specRules[ri];
        const ruleName = (r && r.name) || `rule-${ri}`;

        // kinds typically live under rule.match.resources.kinds but Kyverno
        // supports nested match clauses (any/all). Recursively search the
        // rule.match object for resources.kinds entries.
        function collectKinds(obj, out) {
          if (!obj || typeof obj !== "object") {
            return;
          }
          if (obj.resources && obj.resources.kinds) {
            const k = obj.resources.kinds;
            if (Array.isArray(k)) {
              out.push(...k);
            } else {
              out.push(k);
            }
          }
          for (const key of Object.keys(obj)) {
            try {
              collectKinds(obj[key], out);
            } catch (e) {
              /* ignore */
            }
          }
        }
        const kindsArr = [];
        collectKinds(r && r.match, kindsArr);
        const kinds = kindsArr.length ? kindsArr : [];

        // Kyverno validation patterns can appear under `validate.pattern` or `validate.anyPattern`
        const validate = (r && r.validate) || (r && r.validation) || null;
        const patternObj = validate && (validate.pattern || validate.anyPattern || null);

        let collected = [];
        if (patternObj) {
          collected = collectPaths(patternObj, "");
        }

        // If we collected no specific leaves, but validate contains a message
        // or other metadata, we'll skip converting but could surface as raw.
        if (collected.length === 0) {
          // Skip conversion for complex rules (leave raw import to user)
          continue;
        }

        for (let pi = 0; pi < collected.length; pi++) {
          const p = collected[pi];
          // Convert path like 'spec.template.spec.containers[*].resources' into
          // desired match format using [*] marker. Our collector already
          // produces '[*]' where arrays were detected.
          const match = p.replace(/\[\*\]/g, "[*]");
          const id = `${policyName}:${ruleName}:${pi}`;
          const message =
            (validate && validate.message) ||
            (r && r.message) ||
            `${policyName}/${ruleName} - missing ${match}`;
          out.push({
            id,
            description: `${policyName}/${ruleName}`,
            kind: normalizeKinds(kinds),
            match,
            pattern: "",
            required: true,
            severity: "warning",
            message,
            // Provide a default fix suggestion for missing resources fields
            fix:
              match && match.toLowerCase().includes("resources")
                ? {
                    action: "insert",
                    value: {
                      limits: { cpu: "250m", memory: "256Mi" },
                      requests: { cpu: "100m", memory: "128Mi" },
                    },
                    hint: "Add resource requests/limits for the container",
                  }
                : undefined,
          });
        }
        // Also convert any pattern-based rules (e.g., env name/value checks)
        if (patternObj) {
          const conv = convertPatternToRules(patternObj, "spec");
          // The convertPatternToRules returns matches rooted at the pattern
          // object's path; in Kyverno the pattern often starts under 'spec',
          // but to be conservative we graft using empty base when necessary.
          for (const c of conv) {
            const cid = `${policyName}:${ruleName}:pat:${pi}`;
            // If the converted pattern appears to be an env negative check,
            // convertPatternToRules may already include appropriate fields.
            out.push(
              Object.assign(
                { id: cid, description: `${policyName}/${ruleName}`, kind: normalizeKinds(kinds) },
                c
              )
            );
          }
        }
      }
    }

    return out;
  }

  // Expose converter
  if (typeof window !== "undefined") {
    window.kyvernoImporter = {
      convertDocs,
      _collectPaths: collectPaths, // exported for testing/debugging
      escapeRegExp,
      normalizeKinds,
    };
  }

  // Export for Node.js/CommonJS (for Jest and testability)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      convertDocs,
      _collectPaths: collectPaths,
      escapeRegExp,
      normalizeKinds,
    };
  }
})();
