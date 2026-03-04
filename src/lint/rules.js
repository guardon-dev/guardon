export const guardonRules = [
  {
    id: "no-privileged",
    description: "Containers must not run as privileged",
    validate: (yaml) => {
      return yaml.spec?.containers?.some((c) => c.securityContext?.privileged === true);
    },
  },
  {
    id: "no-latest-tag",
    description: "Avoid using 'latest' tag for images",
    validate: (yaml) => {
      return yaml.spec?.containers?.some((c) => c.image?.endsWith(":latest"));
    },
  },
  {
    id: "require-resources",
    description: "Each container must declare resource requests and limits",
    validate: (yaml) => {
      return yaml.spec?.containers?.some((c) => {
        const r = c.resources || {};
        const hasRequests = r.requests && Object.keys(r.requests).length > 0;
        const hasLimits = r.limits && Object.keys(r.limits).length > 0;
        return !(hasRequests && hasLimits);
      });
    },
  },
];
