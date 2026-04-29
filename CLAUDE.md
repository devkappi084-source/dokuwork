# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (defaults to :5173, increments if busy)
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint check
```

No test suite is set up yet.

## Architecture

**DokuWork** is a single-page PWA for time tracking and invoice generation. All data lives in IndexedDB via Dexie — no backend. The architecture is designed so a REST/sync backend can be added later without restructuring the data layer.

### Data layer — `src/db.js`

Single Dexie database `DokuWork` with four tables:

| Table | Key fields |
|---|---|
| `projects` | `hourlyRate`, `kmRate`, `color` |
| `timeEntries` | `projectId`, `startTime`, `endTime`, `duration` (seconds) |
| `expenses` | `projectId`, `type` (`travel`/`hotel`/`other`), `km`, `amount` |
| `invoices` | `projectId`, `dateFrom`, `dateTo`, `number`, `issuedAt` |

All pages use `useLiveQuery` from `dexie-react-hooks` directly — there is no global state or context. Queries are co-located in the page component that needs them.

**Schema changes require a version bump** in `db.js` (`db.version(2).stores(...)`).

### PDF generation — `src/utils/pdf.js`

`generateInvoicePDF({ project, timeEntries, expenses, invoice })` returns a `jsPDF` doc. The caller decides whether to `doc.save()` or open in a new tab. The Invoices page re-fetches entries from IndexedDB at PDF-download time (not stored as blobs), so re-downloading a past invoice reflects the current data for that period.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed). Utility classes are used sparingly — most UI is inline styles. Shared primitives (`.btn`, `.card`, `.input`, `.form-label`, `.badge`) are defined in `src/index.css`.

### Adding a new page

1. Create `src/pages/MyPage.jsx`
2. Add an entry to the `NAV` array in `src/components/Layout.jsx`
3. Add the import and key to the `pages` map in `src/App.jsx`

### Planned but not yet implemented

- **PWA manifest / Service Worker** — `vite-plugin-pwa` is installed but not configured in `vite.config.js`
- **Server sync** — IndexedDB is the only store; a future sync layer would map the same four tables to API endpoints
- **Invoice template editor** — layout is currently hardcoded in `src/utils/pdf.js`
