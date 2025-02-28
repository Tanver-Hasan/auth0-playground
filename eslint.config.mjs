import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  { 
    files: ["**/*.js"], 
    languageOptions: { 
      sourceType: "commonjs",
      globals: { 
        ...globals.node,  
        ...globals.browser 
      }
    }
  },
  pluginJs.configs.recommended,
];

/** @type {import("eslint").ESLint.Options} */
export const options = {
  formatter: "pretty" 
};