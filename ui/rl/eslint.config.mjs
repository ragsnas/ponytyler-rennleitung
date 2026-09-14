import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "**/*.d.ts"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      // Interface implementations (e.g. ControlValueAccessor, Validator) often require
      // parameters that a given implementation doesn't need; a leading underscore marks
      // that as intentional rather than an oversight.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ["**/*.spec.ts"],
    languageOptions: {
      globals: {
        ...globals.jasmine,
      },
    },
  },
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
