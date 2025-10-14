// eslint.config.mts
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,jsx,ts,tsx,mts,cts}"],
        languageOptions: {
            parser: "@typescript-eslint/parser",
            parserOptions: {
                ecmaVersion: 2024,
                sourceType: "module",
                ecmaFeatures: { jsx: true },
            },
            globals: { window: "readonly", document: "readonly", navigator: "readonly" },
        },
        extends: [
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:react/recommended",
            "plugin:react-hooks/recommended",
            "next/core-web-vitals",
        ],
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn"],
            "react/react-in-jsx-scope": "off",
            "no-console": "warn",
        },
    },
]);
