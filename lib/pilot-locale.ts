export type PilotLocale = "en" | "id"

export const PILOT_LOCALE_STORAGE_KEY = "makan-pilot-locale-v1"

export function normalizePilotLocale(value: string | null | undefined): PilotLocale {
  return value?.trim().toLowerCase().startsWith("id") ? "id" : "en"
}
