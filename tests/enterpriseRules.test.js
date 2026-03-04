import { validateYaml } from "../src/utils/rulesEngine.js";
import * as fs from "fs";
import * as path from "path";

describe("Enterprise Rules Validation", () => {
  let enterpriseRules;

  beforeAll(() => {
    const rulesPath = path.join(__dirname, "..", "src", "rules", "enterpriseRules.json");
    enterpriseRules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
  });

  test("should load all 27 enterprise rules correctly", () => {
    expect(enterpriseRules).toHaveLength(27);
    expect(enterpriseRules.every((rule) => rule.id && rule.description && rule.severity)).toBe(
      true
    );
  });

  test("should detect security violations in insecure deployment", async () => {
    const yamlContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: insecure-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx:latest
        securityContext:
          runAsUser: 0
    `;

    const results = await validateYaml(yamlContent, enterpriseRules);

    // Verify multiple violations are detected
    expect(results.length).toBeGreaterThan(5);

    // Verify specific critical violations
    const violations = results.map((r) => r.ruleId);
    expect(violations).toContain("no-latest-tag");
    expect(violations).toContain("require-liveness-probe");
    expect(violations).toContain("require-readiness-probe");
    expect(violations).toContain("require-cpu-requests");
  });

  test("should detect latest tag usage", async () => {
    const yamlContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: latest-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx:latest
    `;

    const results = await validateYaml(yamlContent, enterpriseRules);
    const latestViolations = results.filter((r) => r.ruleId === "no-latest-tag");
    expect(latestViolations.length).toBeGreaterThan(0);
    expect(latestViolations[0].message).toContain("debugging impossible");
  });

  test("should detect missing resource requests", async () => {
    const yamlContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: no-resources-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx:1.21
    `;

    const results = await validateYaml(yamlContent, enterpriseRules);
    const resourceViolations = results.filter(
      (r) => r.ruleId === "require-cpu-requests" || r.ruleId === "require-memory-requests"
    );
    expect(resourceViolations.length).toBeGreaterThan(0);
  });

  test("should detect missing health probes", async () => {
    const yamlContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: no-probes-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: nginx:1.21
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
    `;

    const results = await validateYaml(yamlContent, enterpriseRules);
    const probeViolations = results.filter(
      (r) => r.ruleId === "require-liveness-probe" || r.ruleId === "require-readiness-probe"
    );
    expect(probeViolations.length).toBeGreaterThan(0);
    expect(probeViolations.some((v) => v.message.includes("#1 cause"))).toBe(true);
  });

  test("should detect LoadBalancer service cost warning", async () => {
    const yamlContent = `
apiVersion: v1
kind: Service
metadata:
  name: expensive-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    `;

    const results = await validateYaml(yamlContent, enterpriseRules);
    const lbViolations = results.filter((r) => r.ruleId === "limit-loadbalancer-services");
    expect(lbViolations.length).toBeGreaterThan(0);
    expect(lbViolations[0].message).toContain("$15-30/month");
  });

  test("should detect wildcard ingress violation", async () => {
    const yamlContent = `
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: wildcard-ingress
spec:
  rules:
  - host: "*.example.com"
    http:
      paths:
      - path: /
        backend:
          service:
            name: app
            port:
              number: 80
    `;

    const results = await validateYaml(yamlContent, enterpriseRules);
    const wildcardViolations = results.filter((r) => r.ruleId === "no-wildcard-ingress");
    expect(wildcardViolations.length).toBeGreaterThan(0);
  });

  test("should validate rule structure and required fields", () => {
    enterpriseRules.forEach((rule) => {
      expect(rule.id).toBeDefined();
      expect(rule.description).toBeDefined();
      expect(rule.severity).toMatch(/^(info|warning|error)$/);
      expect(rule.message).toBeDefined();
      expect(rule.required).toBeDefined();
      expect(typeof rule.required).toBe("boolean");

      if (rule.kind) {
        expect(typeof rule.kind).toBe("string");
        // Verify it's comma-separated format
        expect(rule.kind).toMatch(/^[A-Za-z]+(,[A-Za-z]+)*$/);
      }

      if (rule.fix) {
        expect(rule.fix.action).toMatch(/^(insert|replace|remove)$/);
      }
    });
  });
});
