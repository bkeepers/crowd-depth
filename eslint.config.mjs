import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

export default tseslint.config(
  { ignores: ["dist", "packages/*/dist"] },
  {
    languageOptions: {
      globals: globals.node,
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
);
