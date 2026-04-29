const KEY = 'dokuwork_settings'

export const DEFAULTS = {
  // Eigene Daten
  name: '',
  firma: '',
  strasse: '',
  plzOrt: '',
  telefon: '',
  email: '',
  uid: '',
  iban: '',
  bic: '',
  bank: '',
  // Rechnungseinstellungen
  invoicePrefix: 'RE',
  vatRate: 0,
  // Standardwerte für neue Projekte
  defaultHourlyRate: 80,
  defaultKmRate: 0.42,
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
