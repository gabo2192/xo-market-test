
import { config } from "@workspace/eslint-config/base.js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow console.log in database package for logging migrations
      "no-console": "off",
      
      // Drizzle ORM specific adjustments
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      
      // Allow crypto.randomUUID() usage
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "src/migrations/**", // Generated migration files
    ],
  },
]