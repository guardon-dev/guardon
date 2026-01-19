// Utilities for parsing and validating cluster schemas (OpenAPI spec + CRDs)
// Designed to be simple and dependency-light; uses `jsyaml` available in the browser

function tryParseJson(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function tryParseYamlAll(text) {
  try {
    const docs = [];
    // Browser UMD bundle path
    if (globalThis && globalThis.jsyaml && typeof globalThis.jsyaml.loadAll === "function") {
      globalThis.jsyaml.loadAll(text, (d) => docs.push(d));
      return { ok: true, docs };
    }

    // Try dynamic ESM import (works in Node ESM/Jest) or require if available
    let jsyaml = null;
    try {
      if (typeof require === "function") {
        jsyaml = require("js-yaml");
      } else {
        const mod = await import("js-yaml");
        jsyaml = mod.default || mod;
      }
    } catch (e) {
      jsyaml = null;
    }

    if (jsyaml && typeof jsyaml.loadAll === "function") {
      jsyaml.loadAll(text, (d) => docs.push(d));
      if (docs.length === 0) {
        try {
          const single = jsyaml.load(text);
          if (single !== undefined && single !== null) {docs.push(single);}
        } catch (e) { /* ignore */ }
      }
      return { ok: true, docs };
    }

    // Fallback: try JSON
    const j = tryParseJson(text);
    if (j.ok) {docs.push(j.value);}
    return { ok: true, docs };
  } catch (e) {
    return { ok: false, error: e };
  }
}

function detectDocType(obj) {
  if (!obj || typeof obj !== "object") {return null;}
  const kindRaw = obj.kind || "";
  const kind = String(kindRaw).toLowerCase();
  const apiVersion = (obj.apiVersion || "").toString().toLowerCase();
  // debug removed
  // Consider a document OpenAPI only if it explicitly contains an 'openapi'
  // or 'swagger' string field, or structural keys like 'paths'/'components'.
  const hasOpenApiField = (typeof obj.openapi === "string" && String(obj.openapi).trim()) || (typeof obj.swagger === "string" && String(obj.swagger).trim());
  if (hasOpenApiField) {return "openapi";}
  if (obj && typeof obj === "object" && (obj.paths || obj.components || obj.definitions)) {return "openapi";}
  // Robust CRD detection: match kind or apiVersion
  if (kind && kind.includes("customresourcedefinition")) {return "crd";}
  if (apiVersion && apiVersion.includes("apiextensions.k8s.io")) {return "crd";}
  return null;
}

async function parseSchemaText(text) {
  const out = { openapi: null, crds: [], docs: [], errors: [] };
  if (!text || !String(text).trim()) {
    out.errors.push("empty");
    return out;
  }

  // Try JSON first
  const asJson = tryParseJson(text);
  if (asJson.ok) {
    out.docs = [asJson.value];
  } else {
    const asYaml = await tryParseYamlAll(text);
    if (!asYaml.ok) {
      out.errors.push(asJson.error && asJson.error.message ? asJson.error.message : "parse error");
      return out;
    }
    out.docs = (asYaml.docs || []).filter(d => d !== null && d !== undefined);
  }

  // Classify docs
  // docs counted for diagnostics (no-op)
  out.docs.forEach(d => {
    const t = detectDocType(d);
    // Prefer CRD detection first to avoid accidental openapi assignment
    if (t === "crd") {
      out.crds.push(d);
    }
    else if (t === "openapi") {
      out.openapi = d;
    }
    else {
      // Heuristics: OpenAPI v3 has 'components' or 'paths'
      if (d && typeof d === "object" && (d.paths || d.components || d.definitions)) {
        out.openapi = out.openapi || d;
      }
    }
  });

  // Fallback: if we didn't detect CRDs but the raw text contains indicative
  // markers, perform a simple JSON-string search per doc to capture edge cases
  if (out.crds.length === 0 && Array.isArray(out.docs)) {
    for (const d of out.docs) {
      try {
        const s = JSON.stringify(d || {}).toLowerCase();
        if (s.includes("\"kind\":\"customresourcedefinition\"") || s.includes("apiextensions.k8s.io")) {
          out.crds.push(d);
        }
      } catch (e) { /* ignore stringify failures */ }
    }
  }

  return out;
}

function summarizeSchema(parsed) {
  if (!parsed) {return { msg: "no schema" };}
  const openapi = parsed.openapi ? (parsed.openapi.openapi || parsed.openapi.swagger || "unknown") : null;
  return {
    hasOpenAPI: !!parsed.openapi,
    openapiVersion: openapi || null,
    crdCount: Array.isArray(parsed.crds) ? parsed.crds.length : 0,
  };
}

// --- Validation helpers ---
function _splitApiVersion(apiVersion) {
  const s = (apiVersion || "").toString();
  if (!s) {return { group: "", version: "" };}
  const parts = s.split("/");
  if (parts.length === 1) {return { group: "", version: parts[0] };}
  return { group: parts.slice(0, -1).join("/"), version: parts[parts.length - 1] };
}

function _matchCRDForResource(resource, crds) {
  if (!resource || !crds || !Array.isArray(crds)) {return null;}
  const { group: resGroup, version: resVersion } = _splitApiVersion(resource.apiVersion || "");
  const resKind = (resource.kind || "").toString();
  for (const crd of crds) {
    try {
      const crdGroup = (crd.spec && crd.spec.group) ? String(crd.spec.group) : "";
      const crdKind = (crd.spec && crd.spec.names && crd.spec.names.kind) ? String(crd.spec.names.kind) : "";
      if (!crdKind) {continue;}
      if (crdKind !== resKind) {continue;}
      const versions = crd.spec && Array.isArray(crd.spec.versions) ? crd.spec.versions : (crd.spec && crd.spec.version ? [{ name: crd.spec.version, schema: crd.spec.validation && crd.spec.validation.openAPIV3Schema ? { openAPIV3Schema: crd.spec.validation.openAPIV3Schema } : null }] : []);
      for (const v of versions) {
        const name = (v && v.name) ? String(v.name) : "";
        // API-version match: group must match and version name must match resource version
        if (String(crdGroup) === String(resGroup) && name && name === resVersion) {
          // try to get the schema object (openAPIV3Schema)
          const schema = (v && v.schema && v.schema.openAPIV3Schema) ? v.schema.openAPIV3Schema : (v && v.schema && v.schema.openAPIV3Schema === undefined && v.schema ? v.schema : (crd.spec && crd.spec.validation && crd.spec.validation.openAPIV3Schema ? crd.spec.validation.openAPIV3Schema : null));
          return { crd, schema };
        }
      }
    } catch (e) { /* ignore malformed CRD */ }
  }
  return null;
}

function _typeMatches(expected, val) {
  if (expected === "integer") {return Number.isInteger(val);}
  if (expected === "number") {return typeof val === "number";}
  if (expected === "string") {return typeof val === "string";}
  if (expected === "boolean") {return typeof val === "boolean";}
  if (expected === "object") {return val !== null && typeof val === "object" && !Array.isArray(val);}
  if (expected === "array") {return Array.isArray(val);}
  // fallback: accept anything
  return true;
}

function validateAgainstOpenAPIV3Schema(schema, obj, path = "", opts) {
  const errors = [];
  if (!schema || typeof schema !== "object") {return errors;}
  const resolveRef = opts && typeof opts.resolveRef === "function" ? opts.resolveRef : (x) => x;
  const t = schema.type || (schema.properties ? "object" : null);

  if (t === "object" && schema.properties) {
    const req = Array.isArray(schema.required) ? schema.required : [];
    // Check required fields at this level
    for (const r of req) {
      if (!(obj && Object.prototype.hasOwnProperty.call(obj, r))) {
        errors.push({ path: path ? path + "." + r : r, msg: `Missing required field: ${path ? path + "." + r : r}` });
        // [schema-validator] missing required field
      }
    }
    // For each property, resolve any local $ref, validate type and recurse
    for (const [k, rawPropSchema] of Object.entries(schema.properties)) {
      const propSchema = resolveRef(rawPropSchema);
      const childPath = path ? path + "." + k : k;
      const val = obj ? obj[k] : undefined;
      const expected = propSchema && propSchema.type ? propSchema.type : null;
      if (val !== undefined) {
        if (expected && !_typeMatches(expected, val)) {
          const actualType = Array.isArray(val) ? "array" : typeof val;
          errors.push({ path: childPath, msg: `Type mismatch for ${childPath}: expected ${expected}, got ${actualType} (${JSON.stringify(val)})` });
          // [schema-validator] type mismatch
        }
        // arrays: validate items and required fields in items
        if (expected === "array") {
          // Check minItems
          if (propSchema.minItems !== undefined && Array.isArray(val) && val.length < propSchema.minItems) {
            errors.push({ path: childPath, msg: `minItems: expected at least ${propSchema.minItems}` });
            // [schema-validator] minItems failed
          }
          if (Array.isArray(val) && propSchema.items) {
            const itemSchemaResolved = resolveRef(propSchema.items);
            val.forEach((el, idx) => {
              // Validate type
              if (itemSchemaResolved.type && !_typeMatches(itemSchemaResolved.type, el)) {
                errors.push({ path: `${childPath}[${idx}]`, msg: `type mismatch: expected ${itemSchemaResolved.type}` });
                // [schema-validator] array item type mismatch
              }
              // Validate required fields in array items
              if (itemSchemaResolved.properties || itemSchemaResolved.required) {
                // If el is undefined/null, report all required fields as missing
                if (el === undefined || el === null) {
                  const reqArr = Array.isArray(itemSchemaResolved.required) ? itemSchemaResolved.required : [];
                  for (const r of reqArr) {
                    errors.push({ path: `${childPath}[${idx}].${r}`, msg: `Missing required field: ${childPath}[${idx}].${r}` });
                    // [schema-validator] missing required field in array item
                  }
                } else {
                  errors.push(...validateAgainstOpenAPIV3Schema(itemSchemaResolved, el, `${childPath}[${idx}]`, opts));
                }
              }
            });
            // If array is present but empty, and items have required fields, report missing for index 0
            if (val.length === 0 && Array.isArray(itemSchemaResolved.required)) {
              for (const r of itemSchemaResolved.required) {
                errors.push({ path: `${childPath}[0].${r}`, msg: `Missing required field: ${childPath}[0].${r} (array empty)` });
                // [schema-validator] array empty, missing required field
              }
            }
          }
          // If array is missing but required, report missing array and required fields
          if (!Array.isArray(val) && req.includes(k)) {
            errors.push({ path: childPath, msg: `Missing required array: ${childPath}` });
            // [schema-validator] array missing
            if (propSchema.items && Array.isArray(propSchema.items.required)) {
              for (const r of propSchema.items.required) {
                errors.push({ path: `${childPath}[0].${r}`, msg: `Missing required field: ${childPath}[0].${r} (array missing)` });
                // [schema-validator] array missing, missing required field
              }
            }
          }
        }
        // nested objects: recurse if nested schema provided
        if (expected === "object" && propSchema && propSchema.properties && typeof val === "object") {
          errors.push(...validateAgainstOpenAPIV3Schema(propSchema, val, childPath, opts));
        }
      } else {
        // If property is required and missing, already reported above
        // If property is an array and required, report missing array
        if (expected === "array" && req.includes(k)) {
          errors.push({ path: childPath, msg: `Missing required array: ${childPath}` });
          // [schema-validator] array missing (else)
        }
      }
    }
  }
  return errors;
}

async function validateResourceAgainstClusterSchemas(resourceInput, clusterSchema) {
  // resourceInput can be object or YAML/JSON text
  let resource = null;
  if (!resourceInput) {return { ok: false, errors: ["empty resource"] };}
  if (typeof resourceInput === "string") {
    const j = tryParseJson(resourceInput);
    if (j.ok) {resource = j.value;}
    else {
      const y = await tryParseYamlAll(resourceInput);
      if (!y.ok) {return { ok: false, errors: ["parse error"] };}
      resource = (y.docs && y.docs.length > 0) ? y.docs[0] : null;
    }
  } else if (typeof resourceInput === "object") {
    resource = resourceInput;
  }
  if (!resource) {return { ok: false, errors: ["could not parse resource"] };}

  // Try CRD match first
  const crds = clusterSchema && clusterSchema.crds ? clusterSchema.crds : [];
  const match = _matchCRDForResource(resource, crds);
  if (match && match.schema) {
    const errs = validateAgainstOpenAPIV3Schema(match.schema, resource);
    return { ok: errs.length === 0, errors: errs, matchedBy: "crd" };
  }

  // Try OpenAPI components.schemas (best-effort)
  const openapis = clusterSchema && Array.isArray(clusterSchema.openapis) ? clusterSchema.openapis.map(o => o.spec || o) : (clusterSchema && clusterSchema.openapi ? [clusterSchema.openapi] : []);
  for (const spec of openapis) {
    try {
      const comps = spec && (spec.components || spec.definitions);
      if (!comps) {continue;}

      // For OpenAPI v3, schemas usually live under components.schemas.
      // For Kubernetes swagger (OpenAPI v2), object models are often
      // directly under `definitions`. Handle both:
      let schemas = {};
      if (comps.schemas || comps.definitions) {
        schemas = comps.schemas || comps.definitions;
      } else {
        // If comps *is* the map (as with swagger `definitions`), use it
        // directly as the schema dictionary.
        schemas = comps;
      }
      const kind = resource.kind;
      if (kind && schemas) {
        // Helper: resolve local $ref to actual schema object when possible
        const resolveRef = (sch) => {
          if (!sch || typeof sch !== "object") {return sch;}
          if (!sch.$ref || typeof sch.$ref !== "string") {return sch;}
          const ref = sch.$ref;
          // local component refs like '#/components/schemas/io.k8s...'
          const compPrefix = "#/components/schemas/";
          const defPrefix = "#/definitions/";
          if (ref.startsWith(compPrefix) && spec.components && spec.components.schemas) {
            const refName = ref.substring(compPrefix.length);
            return spec.components.schemas[refName] || sch;
          }
          if (ref.startsWith(defPrefix) && spec.definitions) {
            const refName = ref.substring(defPrefix.length);
            return spec.definitions[refName] || sch;
          }
          // not a resolvable local ref
          return sch;
        };

        // Direct match by schema key (rare for k8s OpenAPI but keep for completeness)
        if (schemas[kind]) {
          const target = resolveRef(schemas[kind]);
          const errs = validateAgainstOpenAPIV3Schema(target, resource, "", { resolveRef });
          return { ok: errs.length === 0, errors: errs, matchedBy: "openapi" };
        }

        // Heuristics: try matching by schema name suffix, title, x-kubernetes-group-version-kind
        const { group: resGroup, version: resVersion } = _splitApiVersion(resource.apiVersion || "");
        for (const [name, schRaw] of Object.entries(schemas)) {
          try {
            let sch = schRaw;
            // resolve $ref if present
            sch = resolveRef(sch);

            // 1) schema name equals kind or endsWith '.Kind'
            if (String(name) === String(kind) || String(name).endsWith("." + String(kind))) {
              const errs = validateAgainstOpenAPIV3Schema(sch, resource, "", { resolveRef });
              return { ok: errs.length === 0, errors: errs, matchedBy: "openapi" };
            }
            // 1b) schema name ends with apiVersion.Kind (for k8s OpenAPI)
            if (String(name).endsWith("." + String(resource.apiVersion) + "." + String(kind))) {
              const errs = validateAgainstOpenAPIV3Schema(sch, resource, "", { resolveRef });
              return { ok: errs.length === 0, errors: errs, matchedBy: "openapi" };
            }

            // 2) schema title matches kind
            if (sch && sch.title && String(sch.title) === String(kind)) {
              const errs = validateAgainstOpenAPIV3Schema(sch, resource, "", { resolveRef });
              return { ok: errs.length === 0, errors: errs, matchedBy: "openapi" };
            }

            // 3) x-kubernetes-group-version-kind extension (array/object)
            const xgvk = sch && (sch["x-kubernetes-group-version-kind"] || sch["x-kubernetes-group-version-kind"]);
            if (xgvk) {
              const items = Array.isArray(xgvk) ? xgvk : [xgvk];
              for (const gvk of items) {
                if (!gvk) {continue;}
                const gkind = String(gvk.kind || "");
                const ggroup = String(gvk.group || "");
                const gver = String(gvk.version || "");
                if (!gkind) {continue;}
                if (gkind === String(kind) && ( !ggroup || ggroup === String(resGroup) ) && ( !gver || gver === String(resVersion) )) {
                  const errs = validateAgainstOpenAPIV3Schema(sch, resource, "", { resolveRef });
                  return { ok: errs.length === 0, errors: errs, matchedBy: "openapi" };
                }
              }
            }
          } catch (e) { /* ignore malformed schema entries */ }
        }
      }
    } catch (e) { /* ignore malformed spec */ }
  }

  return { ok: false, errors: ["no matching schema found"], matchedBy: "none" };
}

// Validate YAML text (possibly multi-doc) against stored cluster schemas and
// return results in the same shape as `rulesEngine.validateYaml` so the UI
// can reuse the same rendering logic. Each validation error becomes an
// issue object: { ruleId, severity, message, path, docIndex }.
async function validateYamlAgainstClusterSchemas(yamlText, clusterSchema) {
  // Parse all docs using tryParseYamlAll to remain environment-agnostic
  const parsed = await tryParseYamlAll(yamlText === null ? "" : String(yamlText));
  if (!parsed.ok) {
    return [{ ruleId: "parse-error", severity: "error", message: "Invalid YAML: parse failed" }];
  }
  const docs = parsed.docs || [];
  if (!docs || docs.length === 0) {return [];}

  const results = [];
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    // Skip empty/null docs
    if (doc === null || doc === undefined) {continue;}

    // Only attempt schema validation for docs that look like Kubernetes
    // resources (have both apiVersion and kind). This avoids schema
    // noise on arbitrary YAML files such as values files or configs.
    if (!doc || typeof doc !== "object" || !doc.apiVersion || !doc.kind) {
      continue;
    }

    const res = await validateResourceAgainstClusterSchemas(doc, clusterSchema || {});
    if (res && res.ok) {
      // No issues for this doc
      continue;
    }
    if (res && res.errors && Array.isArray(res.errors) && res.errors.length > 0) {
      for (const e of res.errors) {
        // If error is a simple string, convert to message
        if (typeof e === "string") {
          results.push({ ruleId: "schema-validation", severity: "error", message: e, path: "", docIndex: i });
        } else if (e && typeof e === "object") {
          const path = e.path || "";
          const msg = e.msg || e.message || "schema validation error";
          const ruleId = res.matchedBy === "crd" ? "schema-crd" : (res.matchedBy === "openapi" ? "schema-openapi" : "schema-validation");
          results.push({ ruleId, severity: "error", message: msg, path, docIndex: i });
        }
      }
    }
  }

  return results;
}

// Export validation functions as well
try {
  exports.validateResourceAgainstClusterSchemas = validateResourceAgainstClusterSchemas;
  exports.validateAgainstOpenAPIV3Schema = validateAgainstOpenAPIV3Schema;
  exports.parseSchemaText = parseSchemaText;
  exports.summarizeSchema = summarizeSchema;
  exports.validateYamlAgainstClusterSchemas = validateYamlAgainstClusterSchemas;
} catch (e) {}

// Provide both ESM and CommonJS compatibility
if (typeof module !== "undefined" && module && module.exports) {module.exports = { parseSchemaText, summarizeSchema, validateResourceAgainstClusterSchemas, validateAgainstOpenAPIV3Schema, validateYamlAgainstClusterSchemas };}
export { parseSchemaText, summarizeSchema, validateResourceAgainstClusterSchemas, validateAgainstOpenAPIV3Schema, validateYamlAgainstClusterSchemas };
