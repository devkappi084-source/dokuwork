import { useState, useEffect } from 'react'
import { loadSettings, saveSettings, DEFAULTS } from '../utils/settings'
import { Check, User, FileText, Sliders } from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="#2563eb" />
        </div>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>{hint}</p>}
    </div>
  )
}

export default function Settings() {
  const [form, setForm] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(loadSettings())
  }, [])

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function submit(e) {
    e.preventDefault()
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Einstellungen</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
          Diese Daten erscheinen auf deinen Rechnungen.
        </p>
      </div>

      <form onSubmit={submit}>
        {/* Persönliche Daten */}
        <Section icon={User} title="Eigene Daten">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Vor- und Nachname">
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Max Mustermann" />
            </Field>
            <Field label="Firma / Einzelunternehmen (optional)">
              <input className="input" value={form.firma} onChange={e => set('firma', e.target.value)} placeholder="Mustermann IT e.U." />
            </Field>
            <Field label="Straße & Hausnummer">
              <input className="input" value={form.strasse} onChange={e => set('strasse', e.target.value)} placeholder="Musterstraße 1" />
            </Field>
            <Field label="PLZ & Ort">
              <input className="input" value={form.plzOrt} onChange={e => set('plzOrt', e.target.value)} placeholder="1010 Wien" />
            </Field>
            <Field label="Telefon">
              <input className="input" type="tel" value={form.telefon} onChange={e => set('telefon', e.target.value)} placeholder="+43 664 123 456 78" />
            </Field>
            <Field label="E-Mail">
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="max@mustermann.at" />
            </Field>
            <Field label="UID-Nummer" hint="z.B. ATU12345678 — leer lassen wenn nicht vorhanden">
              <input className="input" value={form.uid} onChange={e => set('uid', e.target.value)} placeholder="ATU12345678" />
            </Field>
          </div>
        </Section>

        {/* Bankverbindung */}
        <Section icon={FileText} title="Bankverbindung">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Bank">
              <input className="input" value={form.bank} onChange={e => set('bank', e.target.value)} placeholder="Raiffeisenbank" />
            </Field>
            <Field label="BIC">
              <input className="input" value={form.bic} onChange={e => set('bic', e.target.value)} placeholder="RZOOAT2L" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="IBAN">
                <input className="input" value={form.iban} onChange={e => set('iban', e.target.value)} placeholder="AT12 3456 7890 1234 5678" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Rechnungseinstellungen */}
        <Section icon={FileText} title="Rechnungseinstellungen">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Rechnungsnummer-Präfix" hint="Wird vor die Nummer gestellt, z.B. RE → RE-2026-0001">
              <input className="input" value={form.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} placeholder="RE" />
            </Field>
            <Field label="MwSt.-Satz (%)" hint="0 = Kleinunternehmerregelung">
              <input className="input" type="number" min="0" max="100" step="1" value={form.vatRate} onChange={e => set('vatRate', parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
        </Section>

        {/* Standardwerte */}
        <Section icon={Sliders} title="Standardwerte für neue Projekte">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Standard-Stundensatz (€)">
              <input className="input" type="number" min="0" step="0.01" value={form.defaultHourlyRate} onChange={e => set('defaultHourlyRate', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Standard-km-Satz (€/km)">
              <input className="input" type="number" min="0" step="0.01" value={form.defaultKmRate} onChange={e => set('defaultKmRate', parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ minWidth: 140 }}>
            {saved
              ? <><Check size={16} /> Gespeichert!</>
              : <><Check size={16} /> Einstellungen speichern</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
