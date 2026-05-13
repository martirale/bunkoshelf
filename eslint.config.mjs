import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: ["dist/**", "runtime/**", "logs/**", "tmp/**"],
  },
  {
    rules: {
      "react-hooks/error-boundaries": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/globals": "off",
    },
  },
];

export default config;
