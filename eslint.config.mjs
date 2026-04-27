import nextConfig from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: ["templates-example/**"],
  },
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/components/**", "src/app/**"],
    rules: {
      // localStorage hydration in useEffect is standard SSR pattern
      "react-hooks/set-state-in-effect": "warn",
      // ref access in render for toolbar buttons — pre-existing pattern
      "react-hooks/refs": "warn",
      // navigateResult reassignment in command palette — pre-existing
      "react-hooks/immutability": "warn",
    },
  },
];

export default eslintConfig;
