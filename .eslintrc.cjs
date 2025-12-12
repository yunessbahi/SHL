module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react", "unused-imports"],
  extends: [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/no-unescaped-entities": "warn",
    "no-console": "warn",

    // ❌ turn off ESLint unused var checks
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",

    // ✔ remove unused imports automatically
    "unused-imports/no-unused-imports": "error",

    // ✔ remove unused vars left behind after cleaning imports
    "unused-imports/no-unused-vars": [
      "warn",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],

    "react/display-name": "off",
  },

  settings: {
    react: { version: "detect" },
  },
};
