import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

/**
 * Flat ESLint config. eslint-config-next@16 ships native flat-config arrays, so
 * we spread them directly (no @eslint/eslintrc FlatCompat shim needed). Prettier
 * comes last to disable any formatting rules that would conflict with it.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },
  ...next,
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  eslintConfigPrettier,
];

export default eslintConfig;
