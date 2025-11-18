/**
 * Simple i18n system for internationalization
 * Can be extended with a proper i18n library later
 */

type Translations = Record<string, string | Translations>;

const translations: Record<string, Translations> = {
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      update: "Update",
      search: "Search",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      close: "Close",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      email: "Email",
      password: "Password",
      loginSuccess: "Login successful",
      loginError: "Invalid credentials",
    },
  },
};

let currentLocale = "en";

export function setLocale(locale: string): void {
  currentLocale = locale;
}

export function getLocale(): string {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string>): string {
  const keys = key.split(".");
  let value: string | Translations | undefined = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // Simple parameter replacement
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey] || match;
    });
  }

  return value;
}

export function addTranslations(locale: string, newTranslations: Translations): void {
  translations[locale] = { ...translations[locale], ...newTranslations };
}
