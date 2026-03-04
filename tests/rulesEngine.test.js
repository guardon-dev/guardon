import { strict as assert } from "assert";
import * as fs from "fs";
import path from "path";

const modPath = "../src/utils/rulesEngine.js";
let engine;
beforeAll(async () => {
  engine = await import(modPath);
});

describe("rulesEngine utilities", () => {
  test("_get and _has basic behavior", () => {
    const obj = { a: { b: [{ c: "x" }, { c: "y" }] }, top: "ok" };
    expect(engine._get(obj, "a.b[0].c")).toBe("x");
    expect(engine._get(obj, "a.b[1].c")).toBe("y");
    expect(engine._get(obj, "top")).toBe("ok");
    expect(engine._get(obj, "missing.path")).toBeUndefined();
    expect(engine._has(obj, "a.b[0].c")).toBe(true);
    expect(engine._has(obj, "a.b[5].c")).toBe(false);
  });

  test("getParentPath", () => {
    expect(engine.getParentPath("spec.template.spec.containers[0].resources")).toBe(
      "spec.template.spec.containers[0]"
    );
    expect(engine.getParentPath("metadata.name")).toBe("metadata");
    expect(engine.getParentPath("kind")).toBe("");
  });

  test("findPathByValue finds nested and array values", () => {
    const obj = { a: { x: "hello" }, arr: [{ v: "one" }, { v: "two" }], n: 5 };
    expect(engine.findPathByValue(obj, "hello")).toBe("a.x");
    const p = engine.findPathByValue(obj, "two");
    expect(p).toBe("arr[1].v");
    expect(engine.findPathByValue(obj, 5)).toBe("n");
    expect(engine.findPathByValue(obj, "nope")).toBeNull();
  });

  test("setNested and deleteNested with arrays and objects", () => {
    const obj = {};
    engine.setNested(obj, "spec.template.containers[0].name", "app");
    expect(obj.spec.template.containers[0].name).toBe("app");
    engine.setNested(obj, "spec.template.containers[1].name", "app2");
    expect(obj.spec.template.containers[1].name).toBe("app2");
    engine.deleteNested(obj, "spec.template.containers[0].name");
    expect(obj.spec.template.containers[0].name).toBeUndefined();
    engine.deleteNested(obj, "spec.template.containers[1]");
    expect(obj.spec.template.containers.length).toBe(1);
  });

  test("applySuggestionToDoc insert/replace/remove", async () => {
    const yaml = "apiVersion: v1\nkind: Pod\nmetadata:\n  name: p\nspec:\n  replicas: 1";
    const jsyaml = await engine.resolveJsYaml();
    const docs = [];
    engine.resolveJsYaml; // ensure function exists
    const parsed = jsyaml.loadAll(yaml, (d) => docs.push(d));
    const doc = docs[0];
    const suggestion = { action: "replace", targetPath: "spec.replicas", snippetObj: 3 };
    engine.applySuggestionToDoc(doc, suggestion, jsyaml);
    expect(doc.spec.replicas).toBe(3);
    // remove
    engine.applySuggestionToDoc(doc, { action: "remove", targetPath: "spec.replicas" }, jsyaml);
    expect(doc.spec.replicas).toBeUndefined();
  });

  test("previewPatchedYaml returns patched doc and full stream", async () => {
    const yaml =
      "apiVersion: v1\nkind: Pod\nmetadata:\n  name: p\nspec:\n  replicas: 1\n---\napiVersion: v1\nkind: Pod\nmetadata:\n  name: q\nspec:\n  replicas: 2";
    const suggestion = { action: "replace", targetPath: "spec.replicas", snippetObj: 9 };
    const patchedSingle = await engine.previewPatchedYaml(yaml, 0, suggestion, {
      fullStream: false,
    });
    expect(typeof patchedSingle).toBe("string");
    expect(patchedSingle).toMatch(/replicas: 9/);
    const patchedFull = await engine.previewPatchedYaml(
      yaml,
      1,
      { action: "replace", targetPath: "spec.replicas", snippetObj: 7 },
      { fullStream: true }
    );
    expect(typeof patchedFull).toBe("string");
    expect(patchedFull).toMatch(/replicas: 7/);
  });

  test("validateYaml returns parse-error on bad YAML", async () => {
    const bad = "this: [unclosed";
    const res = await engine.validateYaml(bad, []);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].ruleId).toBe("parse-error");
  });

  test("validateYaml pattern wildcard and required/kind behavior", async () => {
    const yaml =
      "apiVersion: v1\nkind: Pod\nspec:\n  containers:\n    - name: a\n      image: bad-image\n    - name: b\n      image: good-image\n";
    const rules = [
      {
        id: "r1",
        description: "img bad",
        match: "spec.containers[*].image",
        pattern: "bad",
        severity: "warning",
        message: "bad image",
        required: false,
      },
      {
        id: "r2",
        description: "requires resources",
        match: "spec.containers[*].resources",
        required: true,
        severity: "error",
        message: "missing resources",
      },
      {
        id: "r3",
        description: "kind filter",
        match: "metadata.name",
        pattern: "p",
        kind: "Pod",
        severity: "info",
        message: "kind matched",
      },
    ];
    const res = await engine.validateYaml(yaml, rules);
    // r1 should fire once for container[0]
    expect(res.some((r) => r.ruleId === "r1")).toBe(true);
    // r2 should report missing resources per element (two containers)
    expect(res.filter((r) => r.ruleId === "r2").length).toBe(2);
    // r3 should not match because metadata.name doesn't exist
    expect(res.some((r) => r.ruleId === "r3")).toBe(false);
  });
});
