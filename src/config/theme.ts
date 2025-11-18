export const THEME_CONFIG = {
  defaultTheme: "light" as "light" | "dark",
  storageKey: "erp-theme",
} as const;

export type Theme = "light" | "dark";
