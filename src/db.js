import Dexie from 'dexie'

export const db = new Dexie('DokuWork')

db.version(1).stores({
  projects:    '++id, name, color, hourlyRate, kmRate, createdAt',
  timeEntries: '++id, projectId, description, startTime, endTime, duration, createdAt',
  expenses:    '++id, projectId, type, description, amount, km, date, createdAt',
  invoices:    '++id, projectId, number, dateFrom, dateTo, issuedAt',
})
