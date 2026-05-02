import logoSvg from "./assets/logo.svg?raw";

export const BRAND = {
  company: "Helius",
  homepage: "https://www.helius.dev",
  logoSvg,
  // Mandatory non-affiliation disclaimer (rendered in footer of every app).
  attribution: "An independent tool by Ryan Lacerda · Not affiliated with Helius.",
} as const;
