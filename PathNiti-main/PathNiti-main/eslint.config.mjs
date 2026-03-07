import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Allow 'any' type for hackathon - Supabase type issues
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused vars for hackathon
      "@typescript-eslint/no-unused-vars": "off",
      // Allow missing alt text for images in hackathon
      "jsx-a11y/alt-text": "off",
    },
  },
];

export default eslintConfig;
