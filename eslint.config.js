// ESLint v9+ flat config for Guardon project
import prettierConfig from "eslint-config-prettier";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        chrome: "readonly",
        fetch: "readonly",
        URL: "readonly",
        FileReader: "readonly",
        Blob: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        alert: "readonly",
        location: "readonly",
        self: "readonly",
        localStorage: "readonly",
        atob: "readonly",
        btoa: "readonly",
        Response: "readonly",
        WebAssembly: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",

        // Node / bundler globals used in utils
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
        exports: "writable",
        define: "readonly",
        process: "readonly",
        Buffer: "readonly",
        YAML_SILENCE_DEPRECATION_WARNINGS: "readonly",
        YAML_SILENCE_WARNINGS: "readonly",

        // Test globals (Jest)
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        global: "readonly",

        // Project-specific helpers exposed as globals in HTML pages
        form: "readonly",
        showToast: "readonly",
        editRule: "readonly",
        deleteRule: "readonly",
        openAPIPreviewBtn: "readonly",
        pi: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Code-quality rules (enforced by ESLint)
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "warn",
      eqeqeq: "warn",
      curly: "warn",
    },
  },
  // Disable all ESLint formatting rules that Prettier will handle
  prettierConfig,
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "guardon-v0.4/**",
      "src/lib/**",
    ],
  },
];
