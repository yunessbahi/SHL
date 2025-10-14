module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
    },
    plugins: ["@typescript-eslint", "react"], // <-- remove "react-hooks" from here
    extends: [
        "next/core-web-vitals",
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended" // <-- keep in extends only
    ],
    rules: {
    "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "react/no-unescaped-entities": "warn",
        "no-console": "warn",
},
    settings: {
        react: { version: "detect" }
    }
};
