import { guardonRules } from "./rules.js";

// Use the bundled UMD `jsyaml` when running in the browser (popup loads
// `src/lib/js-yaml.min.js` which exposes `globalThis.jsyaml`). If not
// available, throw a clear error so callers know to include the library or
// install the `js-yaml` package in a Node environment.
const jsyaml = typeof globalThis !== "undefined" && globalThis.jsyaml ? globalThis.jsyaml : null;

export function validateYaml(content) {
  if (!jsyaml) {
    // In a Node/dev environment callers should import 'js-yaml' instead.
    throw new Error(
      "js-yaml runtime not found. In the browser include 'src/lib/js-yaml.min.js' or install 'js-yaml' for Node."
    );
  }

  try {
    const doc = jsyaml.load(content);
    const results = guardonRules.map((rule) => ({
      rule: rule.description,
      violated: rule.validate(doc),
    }));
    return results.filter((r) => r.violated);
  } catch {
    return [{ error: "Invalid YAML format" }];
  }
}
