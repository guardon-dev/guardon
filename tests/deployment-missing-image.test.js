const { validateYamlAgainstClusterSchemas } = require("../src/utils/clusterSchema");

const deploymentYaml = `---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployments-simple-deployment-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: deployments-simple-deployment-app
  template:
    metadata:
      labels:
        app: deployments-simple-deployment-app
    spec:
      containers:
        - name: busybox
          command:
            - sleep
            - "3600"
`;

// Minimal OpenAPI-like spec that contains a Deployment schema with
// spec.template.spec.containers[*].image required.
const minimalOpenAPI = {
  components: {
    schemas: {
      Deployment: {
        type: "object",
        properties: {
          spec: {
            type: "object",
            properties: {
              template: {
                type: "object",
                properties: {
                  spec: {
                    type: "object",
                    properties: {
                      containers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            image: { type: "string" },
                            command: { type: "array" },
                          },
                          required: ["image"],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

test("Deployment missing container image should be reported", async () => {
  const clusterSchema = { openapis: [minimalOpenAPI] };
  const results = await validateYamlAgainstClusterSchemas(deploymentYaml, clusterSchema);
  // Expect at least one schema validation error pointing to containers[].image
  const hasMissingImage = results.some(
    (r) => r.path && r.path.includes("containers") && r.path.includes("image")
  );
  if (!hasMissingImage) {
    // Validator results: (output suppressed)
  }
  expect(hasMissingImage).toBe(true);
});
