import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // eslint-plugin-react bundled in eslint-config-next@16 requires an explicit
    // react version when running under ESLint 10, because context.getFilename()
    // (used for auto-detection) was removed in the ESLint 10 flat-config API.
    settings: {
      react: { version: "19.2" },
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
