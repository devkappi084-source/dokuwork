import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { formatMoney } from '../utils/format'
import { loadSettings } from '../utils/settings'

const COLORS = ['#2563eb','#16a34a','#dc2626','#d97706','#7c3aed','#0891b2','#be185d','#65a30d']

function ProjectForm({ initial, onSave, onCancel }) {
  const settings = loadSettings()
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [hourlyRate, setHourlyRate] = useState(initial?.hourlyRate ?? settings.defaultHourlyRate)
  const [kmRate, setKmRate] = useState(initial?.kmRate ?? settings.defaultKmRate)

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color, hourlyRate: parseFloat(hourlyRate) || 0, kmRate: parseFloat(kmRate) || 0 })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="form-label">Projektname *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Kunde ABC" autoFocus />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="form-label">Stundensatz (€)</label>
          <input className="input" type="number" step="0.01" min="0" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
        </div>
        <div>
          <label className="form-label">km-Satz (€/km)</label>
          <input className="input" type="number" step="0.01" min="0" value={kmRate} onChange={e => setKmRate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="form-label">Farbe</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)} style={{
              width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
              cursor: 'pointer', outline: color === c ? `3px solid ${c}` : 'none',
              outlineOffset: 2,
            }} />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}><X size={14} /> Abbrechen</button>
        <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Speichern</button>
      </div>
    </form>
  )
}

export default function Projects() {
  const projects = useLiveQuery(() => db.projects.orderBy('createdAt').toArray(), [])
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)

  async function saveNew(data) {
    await db.projects.add({ ...data, createdAt: Date.now() })
    setAdding(false)
  }

  async function saveEdit(id, data) {
    await db.projects.update(id, data)
    setEditId(null)
  }

  async function del(id) {
    if (!confirm('Projekt löschen? Alle zugehörigen Einträge bleiben erhalten.')) return
    await db.projects.delete(id)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Projekte</h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setAdding(true); setEditId(null) }}>
          <Plus size={15} /> Neues Projekt
        </button>
      </div>

      {adding && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Neues Projekt</h3>
          <ProjectForm onSave={saveNew} onCancel={() => setAdding(false)} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {projects?.map(p => (
          <div key={p.id} className="card" style={{ padding: 16 }}>
            {editId === p.id ? (
              <ProjectForm initial={p} onSave={d => saveEdit(p.id, d)} onCancel={() => setEditId(null)} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {formatMoney(p.hourlyRate)}/h · {p.kmRate?.toFixed(2).replace('.', ',')} €/km
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditId(p.id)}><Pencil size={14} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => del(p.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {projects?.length === 0 && !adding && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
            Noch keine Projekte angelegt.
          </div>
        )}
      </div>
    </div>
  )
}
