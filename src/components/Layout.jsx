import { Clock, FolderOpen, Receipt, CreditCard } from 'lucide-react'

const NAV = [
  { key: 'timer',    label: 'Zeiterfassung', icon: Clock },
  { key: 'projects', label: 'Projekte',      icon: FolderOpen },
  { key: 'expenses', label: 'Spesen',        icon: CreditCard },
  { key: 'invoices', label: 'Rechnungen',    icon: Receipt },
]

export default function Layout({ page, setPage, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      {/* Top bar */}
      <header style={{
        background: '#1e293b', color: '#fff', padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 16, height: 56, flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', marginRight: 8 }}>
          DokuWork
        </span>
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setPage(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 500, transition: 'background 0.15s',
                background: page === key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: page === key ? '#fff' : 'rgba(255,255,255,0.65)',
              }}
            >
              <Icon size={15} />
              <span style={{ display: 'none' }} className="nav-label">{label}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 900, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  )
}
