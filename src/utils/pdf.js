import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatHours, formatMoney } from './format'
import { loadSettings } from './settings'

export function generateInvoicePDF({ project, timeEntries, expenses, invoice }) {
  const settings = loadSettings()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = 210
  const margin = 20

  // ── Absender (oben links) ──────────────────────────────────────
  let y = 20
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)

  const senderLines = [
    settings.firma || settings.name,
    settings.firma ? settings.name : null,
    settings.strasse,
    settings.plzOrt,
    settings.telefon,
    settings.email,
    settings.uid ? `UID: ${settings.uid}` : null,
  ].filter(Boolean)

  senderLines.forEach(line => { doc.text(line, margin, y); y += 5 })

  // ── Rechnung Titel (oben rechts) ──────────────────────────────
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('RECHNUNG', w - margin, 28, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text(`Nr.: ${invoice.number}`, w - margin, 36, { align: 'right' })
  doc.text(`Datum: ${formatDate(invoice.issuedAt)}`, w - margin, 42, { align: 'right' })

  // ── Trennlinie ────────────────────────────────────────────────
  y = Math.max(y, 50) + 6
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, w - margin, y)
  y += 8

  // ── Projektinfo ───────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Projekt:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(project.name, margin + 22, y)
  doc.setFont('helvetica', 'bold')
  doc.text('Zeitraum:', margin + 90, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${formatDate(invoice.dateFrom)} – ${formatDate(invoice.dateTo)}`, margin + 114, y)
  y += 12

  // ── Zeiteinträge ──────────────────────────────────────────────
  if (timeEntries.length > 0) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Arbeitszeiten', margin, y)
    y += 3

    const timeRows = timeEntries.map(e => [
      formatDate(e.startTime),
      e.description || '–',
      formatHours(e.duration),
      formatMoney((e.duration / 3600) * (project.hourlyRate || 0)),
    ])

    const totalSeconds = timeEntries.reduce((s, e) => s + (e.duration || 0), 0)
    const totalTime = (totalSeconds / 3600) * (project.hourlyRate || 0)

    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Beschreibung', 'Zeit', 'Betrag']],
      body: timeRows,
      foot: [['', `Gesamt (${formatMoney(project.hourlyRate || 0)}/h)`, formatHours(totalSeconds), formatMoney(totalTime)]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      columnStyles: { 0: { cellWidth: 24 }, 2: { cellWidth: 22, halign: 'right' }, 3: { cellWidth: 28, halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Spesen ────────────────────────────────────────────────────
  const allExpenses = [
    ...expenses.filter(e => e.type === 'travel'),
    ...expenses.filter(e => e.type === 'hotel'),
    ...expenses.filter(e => e.type === 'other'),
  ]

  if (allExpenses.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Spesen & Kosten', margin, y)
    y += 3

    const expenseRows = allExpenses.map(e => {
      const typeLabel = { travel: 'Fahrt', hotel: 'Hotel', other: 'Sonstiges' }[e.type] || e.type
      const detail = e.type === 'travel' && e.km
        ? `${e.km} km × ${formatMoney(project.kmRate || 0.42)}/km`
        : e.description || '–'
      return [formatDate(e.date), typeLabel, detail, formatMoney(e.amount)]
    })

    const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount || 0), 0)

    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Typ', 'Details', 'Betrag']],
      body: expenseRows,
      foot: [['', '', 'Gesamt', formatMoney(totalExpenses)]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      columnStyles: { 3: { cellWidth: 28, halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // ── Gesamtbetrag ──────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20 }

  const totalSeconds = timeEntries.reduce((s, e) => s + (e.duration || 0), 0)
  const netTime = (totalSeconds / 3600) * (project.hourlyRate || 0)
  const netExp = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const net = netTime + netExp
  const vat = net * ((settings.vatRate || 0) / 100)
  const grand = net + vat

  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, w - margin, y)
  y += 8

  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.text('Nettobetrag:', w - margin - 60, y)
  doc.text(formatMoney(net), w - margin, y, { align: 'right' })
  y += 6

  if (settings.vatRate > 0) {
    doc.text(`MwSt. ${settings.vatRate}%:`, w - margin - 60, y)
    doc.text(formatMoney(vat), w - margin, y, { align: 'right' })
    y += 6
    doc.setDrawColor(229, 231, 235)
    doc.line(w - margin - 70, y, w - margin, y)
    y += 5
  } else {
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('* Gemäß § 6 Abs. 1 Z 27 UStG wird keine Umsatzsteuer berechnet.', margin, y + 8)
  }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Gesamtbetrag:', w - margin - 60, y)
  doc.text(formatMoney(grand), w - margin, y, { align: 'right' })

  // ── Bankverbindung ────────────────────────────────────────────
  if (settings.iban) {
    const pageH = 297
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    const bankLines = [
      'Bankverbindung:',
      settings.bank ? `${settings.bank}` : null,
      `IBAN: ${settings.iban}`,
      settings.bic ? `BIC: ${settings.bic}` : null,
    ].filter(Boolean)

    let by = pageH - 18 - (bankLines.length - 1) * 5
    bankLines.forEach(line => { doc.text(line, margin, by); by += 5 })
  }

  return doc
}
