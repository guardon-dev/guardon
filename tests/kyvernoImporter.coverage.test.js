const { _collectPaths, convertDocs } = require("../src/utils/kyvernoImporter.js");

describe("kyvernoImporter uncovered lines", () => {
  test("escapeRegExp escapes special characters", () => {
    // Line 132
    const fn = require("../src/utils/kyvernoImporter.js");
    expect(fn.escapeRegExp("a.b*c?^$|[](){}\\")).toBe(
      "a\\.b\\*c\\?\\^\\$\\|\\[\\]\\(\\)\\{\\}\\\\"
    );
  });

  test("normalizeKinds handles arrays and falsy", () => {
    // Lines 138
    const fn = require("../src/utils/kyvernoImporter.js");
    expect(fn.normalizeKinds(["Pod", "Deployment"]).includes(",")).toBe(true);
    expect(fn.normalizeKinds(null)).toBe("");
    expect(fn.normalizeKinds("Pod")).toBe("Pod");
  });

  test("convertDocs skips non-Kyverno docs and complex rules", () => {
    // Lines 158-164, 184
    const docs = [
      { kind: "ConfigMap" },
      {
        apiVersion: "kyverno.io/v1",
        kind: "Policy",
        metadata: { name: "p" },
        spec: {
          rules: [
            { match: { resources: { kinds: ["Pod"] } }, validate: { pattern: { foo: "bar" } } },
          ],
        },
      },
      {
        apiVersion: "kyverno.io/v1",
        kind: "Policy",
        metadata: { name: "p2" },
        spec: {
          rules: [{ match: { resources: { kinds: ["Pod"] } }, validate: { message: "skip" } }],
        },
      },
    ];
    const out = convertDocs(docs);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  test("convertDocs handles pattern conversion and id creation", () => {
    // Lines 219-222
    const docs = [
      {
        apiVersion: "kyverno.io/v1",
        kind: "Policy",
        metadata: { name: "p" },
        spec: {
          rules: [
            { match: { resources: { kinds: ["Pod"] } }, validate: { pattern: { foo: "bar" } } },
          ],
        },
      },
    ];
    const out = convertDocs(docs);
    expect(out[0].id).toBe("p:rule-0:0");
    expect(out[0].description).toContain("p/");
    expect(out[0].kind).toBe("Pod");
  });
});
