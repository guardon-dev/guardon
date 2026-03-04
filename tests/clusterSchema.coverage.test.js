const {
  parseSchemaText,
  validateYamlAgainstClusterSchemas,
  validateResourceAgainstClusterSchemas,
} = require("../src/utils/clusterSchema.js");

describe("clusterSchema uncovered lines", () => {
  test("tryParseYamlAll fallback to JSON and error", async () => {
    // Line 24: tryParseJson fallback
    const { ok, docs } = await parseSchemaText("{ invalid json }");
    expect(ok).toBeUndefined(); // parseSchemaText returns object with errors
    expect(Array.isArray(docs)).toBe(true);
  });

  test("validateResourceAgainstClusterSchemas returns no match", async () => {
    // Lines 335-381, 392, 405, 411, 419-421: no matching schema
    const resource = { kind: "UnknownKind", apiVersion: "v1" };
    const schemas = { SomeOtherKind: { type: "object" } };
    const result = await validateResourceAgainstClusterSchemas(resource, schemas);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("no matching schema found");
    expect(result.matchedBy).toBe("none");
  });

  test("validateYamlAgainstClusterSchemas handles parse error", async () => {
    // Line 392: parse error path
    const result = await validateYamlAgainstClusterSchemas("not: yaml: : :", {});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].ruleId).toBe("parse-error");
  });

  test("validateYamlAgainstClusterSchemas handles no docs", async () => {
    // Line 405: no docs path
    const result = await validateYamlAgainstClusterSchemas("", {});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test("validateYamlAgainstClusterSchemas handles no match warning", async () => {
    // Line 411, 419-421: no matching schema found warning
    const yaml = `apiVersion: v1\nkind: UnknownKind`;
    const result = await validateYamlAgainstClusterSchemas(yaml, {});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].ruleId).toBe("schema-validation");
    expect(result[0].severity).toBe("error");
  });
});
