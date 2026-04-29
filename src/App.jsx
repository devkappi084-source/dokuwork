import { useState } from 'react'
import './index.css'
import Layout from './components/Layout'
import Timer from './pages/Timer'
import Projects from './pages/Projects'
import Expenses from './pages/Expenses'
import Invoices from './pages/Invoices'
import Settings from './pages/Settings'

export default function App() {
  const [page, setPage] = useState('timer')

  const pages = { timer: Timer, projects: Projects, expenses: Expenses, invoices: Invoices, settings: Settings }
  const Page = pages[page] || Timer

  return (
    <Layout page={page} setPage={setPage}>
      <Page />
    </Layout>
  )
}
