import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatHours, formatMoney } from './format'

export function generateInvoicePDF({ project, timeEntries, expenses, invoice }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const w = 210
  const margin = 20

  // Header
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('RECHNUNG', margin, 30)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Rechnungsnr.: ${invoice.number}`, margin, 40)
  doc.text(`Datum: ${formatDate(invoice.issuedAt)}`, margin, 47)
  doc.text(`Projekt: ${project.name}`, margin, 54)
  doc.text(`Zeitraum: ${formatDate(invoice.dateFrom)} – ${formatDate(invoice.dateTo)}`, margin, 61)

  let y = 75

  // Time entries table
  if (timeEntries.length > 0) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Arbeitszeiten', margin, y)
    y += 4

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
      foot: [['', 'Gesamt', formatHours(totalSeconds), formatMoney(totalTime)]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Expenses table
  const travelExpenses = expenses.filter(e => e.type === 'travel')
  const hotelExpenses = expenses.filter(e => e.type === 'hotel')
  const otherExpenses = expenses.filter(e => e.type === 'other')

  const allExpenses = [...travelExpenses, ...hotelExpenses, ...otherExpenses]

  if (allExpenses.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Spesen & Kosten', margin, y)
    y += 4

    const expenseRows = allExpenses.map(e => {
      const typeLabel = { travel: 'Fahrt', hotel: 'Hotel', other: 'Sonstiges' }[e.type] || e.type
      const detail = e.type === 'travel' && e.km
        ? `${e.km} km × ${formatMoney(project.kmRate || 0.3)}/km`
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
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fontStyle: 'bold', fillColor: [241, 245, 249] },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Grand total
  if (y > 240) { doc.addPage(); y = 20 }

  const totalSeconds = timeEntries.reduce((s, e) => s + (e.duration || 0), 0)
  const totalTime = (totalSeconds / 3600) * (project.hourlyRate || 0)
  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const grand = totalTime + totalExp

  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, w - margin, y)
  y += 8

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Gesamtbetrag:', margin, y)
  doc.text(formatMoney(grand), w - margin, y, { align: 'right' })

  return doc
}
