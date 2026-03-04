import { jest } from "@jest/globals";

describe("kyvernoImporter", () => {
  beforeEach(() => {
    // Ensure a global window object exists so the IIFE attaches to it
    global.window = {};
    // Clear any previously cached module
    jest.resetModules();
  });

  test("convertDocs returns converted rules for a simple policy", async () => {
    const mod = await import("../src/utils/kyvernoImporter.js");
    // importer was attached to global window
    const imp = global.window.kyvernoImporter;
    expect(imp).toBeDefined();

    const docs = [
      {
        apiVersion: "kyverno.io/v1",
        kind: "Policy",
        metadata: { name: "myp" },
        spec: {
          rules: [
            {
              name: "r1",
              validate: {
                pattern: {
                  spec: {
                    containers: [{ resources: { limits: { cpu: "250m" } } }],
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const out = imp.convertDocs(docs);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    // Ensure id and match and fix for resources exist
    const first = out[0];
    expect(first.id).toContain("myp");
    expect(first.match).toContain("resources");
    expect(first.fix).toBeDefined();
    expect(first.fix.action).toBe("insert");
  });

  test("_collectPaths returns leaf paths including [*] markers", async () => {
    global.window = {};
    jest.resetModules();
    await import("../src/utils/kyvernoImporter.js");
    const imp = global.window.kyvernoImporter;
    const obj = { spec: { containers: [{ name: "a", value: "x" }] } };
    const paths = imp._collectPaths(obj, "");
    expect(Array.isArray(paths)).toBe(true);
    expect(paths.some((p) => p.includes("[*]"))).toBe(true);
  });
});
