'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import api from '@/lib/api'
import { Property } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface ExpenseRow {
  date: string
  who: string
  property: string
  reason: string
  amount: number
  matched_property_id: number | null
  matched_property_name: string | null
  error: string | null
}

const PROPERTY_MAP: Record<string, number> = {
  'big house': 1, 'main house': 1, 'main': 1, '4577': 1, 'big': 1,
  'small house': 2, 'small': 2, 'alley': 2, 'alley unit': 2, '4575': 2,
  'adu': 3, 'garage': 3, '4773': 3, 'conversion': 3,
}

function matchProperty(raw: string, properties: Property[]): {id:number|null, name:string|null} {
  const lower = raw.toLowerCase().trim()
  if (!lower || lower === 'all') return { id: null, name: null }
  for (const [key, id] of Object.entries(PROPERTY_MAP)) {
    if (lower.includes(key)) {
      const prop = properties.find(p => p.id === id)
      return { id, name: prop?.name || null }
    }
  }
  return { id: null, name: null }
}

function getComponent(propRaw: string): string {
  const lower = propRaw.toLowerCase().trim()
  if (lower.includes('big') || lower.includes('main')) return 'main'
  if (lower.includes('alley') || lower.includes('small')) return 'small_house'
  if (lower.includes('adu') || lower.includes('garage')) return 'adu'
  if (lower === 'all') return 'all'
  return lower.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function getCategory(reason: string, who: string): string {
  const r = (reason + ' ' + who).toLowerCase()
  if (r.includes('permit') || r.includes('city') || r.includes('inspector')) return 'permits'
  if (r.includes('electric') || r.includes('sdg')) return 'electrical'
  if (r.includes('plumb')) return 'plumbing'
  if (r.includes('lawyer') || r.includes('legal') || r.includes('attorney')) return 'legal'
  if (r.includes('material') || r.includes('lumber') || r.includes('sand') || r.includes('supply')) return 'materials'
  if (r.includes('deposit') || r.includes('tax') || r.includes('travel')) return 'other'
  return 'labor'
}

function parseRows(json: any[], properties: Property[]): ExpenseRow[] {
  return json
    .filter(row => {
      const keys = Object.keys(row)
      const amtKey = keys.find(k => k.toLowerCase().includes('amount'))
      const amt = amtKey ? Number(row[amtKey]) : 0
      return amt > 0
    })
    .map(row => {
      const keys = Object.keys(row)
      const getVal = (hints: string[]) => {
        const k = keys.find(k => hints.some(h => k.toLowerCase().includes(h)))
        return k ? String(row[k] ?? '').trim() : ''
      }
      const date = getVal(['date'])
      const who = getVal(['contractor', 'who', 'vendor', 'name', 'paid to', 'payee'])
      const propRaw = getVal(['property', 'prop'])
      const reason = getVal(['reason', 'description', 'desc', 'note', 'memo'])
      const category = getVal(['category', 'cat', 'type'])
      const source = getVal(['source', 'payment', 'bank', 'account', 'paid from'])
      const amtKey = keys.find(k => k.toLowerCase().includes('amount') || k.toLowerCase() === 'amt')
      const amount = amtKey ? Number(row[amtKey]) : 0
      const { id, name } = matchProperty(propRaw, properties)
      const component = getComponent(propRaw)
      let error: string | null = null
      if (!propRaw) error = 'Missing property'
      else if (!id) error = 'Not recognized: ' + propRaw
      else if (!amount || amount <= 0) error = 'Invalid amount'
      const desc = [date, who, reason, source].filter(Boolean).join(' | ')
      const displayReason = reason || category || ''
      return { date, who, property: propRaw, reason: displayReason + (source ? ' ('+source+')' : ''), amount, matched_property_id: id, matched_property_name: name, error }
    })
}

export default function UploadPage() {
  const [rows, setRows] = useState<ExpenseRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [pdfLib, setPdfLib] = useState<any>(null)

  useEffect(() => {
    import('pdfjs-dist').then(pdfjsLib => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      setPdfLib(pdfjsLib)
    })
  }, [])

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => (await api.get('/api/properties/')).data,
  })

  const parseExcel = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false, dateNF: 'mm/dd/yyyy' })
      let headerIdx = 0
      for (let i = 0; i < Math.min(10, raw.length); i++) {
        const r = raw[i].join(' ').toLowerCase()
        if (r.includes('amount') || r.includes('date') || r.includes('who')) { headerIdx = i; break }
      }
      const headers: string[] = raw[headerIdx].map((h: any) => String(h).trim())
      const json = raw.slice(headerIdx + 1).map((row: any[]) => {
        const obj: any = {}
        headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
        return obj
      })
      console.log('Headers:', headers, 'Row0:', json[0])
      setRows(parseRows(json, properties))
    }
    reader.readAsArrayBuffer(file)
  }

  const parsePdf = async (file: File) => {
    if (!pdfLib) { toast.error('PDF library not ready'); return }
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise
    const allRows: any[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const items = content.items.map((item: any) => item.str)
      const text = items.join(' ')
      const lines = text.split(String.fromCharCode(10))
      for (const line of lines) {
        const amtMatch = line.match(/[\d,]+\.?\d*/)
        if (!amtMatch) continue
        const amt = parseFloat(amtMatch[0].replace(/,/g, ''))
        if (amt <= 0 || amt > 1000000) continue
        const propMatch = line.match(/big house|main house|small house|alley|adu|garage/i)
        const prop = propMatch ? propMatch[0] : ''
        const desc = line.replace(amtMatch[0], '').replace(prop, '').trim()
        allRows.push({ Amount: amt, property: prop, Reason: desc })
      }
    }
    setRows(parseRows(allRows, properties))
  }

  const handleFile = (file: File) => {
    setFileName(file.name)
    setRows([])
    setImported(0)
    if (file.name.endsWith('.pdf')) parsePdf(file)
    else parseExcel(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [properties, pdfLib])

  const handleImport = async () => {
    const valid = rows.filter(r => !r.error)
    if (!valid.length) return
    setImporting(true)
    let count = 0
    for (const row of valid) {
      try {
        const component = row.property.toLowerCase().trim()
          const comp = component.includes('big') || component.includes('main') ? 'main'
            : component.includes('alley') || component.includes('small') ? 'small_house'
            : component.includes('adu') || component.includes('garage') ? 'adu'
            : component.replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
          // Use category from spreadsheet directly if it matches known values
          const knownCats = ['labor','materials','permits','electrical','plumbing','structural','legal','other','equipment']
          const rawCat = row.reason.toLowerCase().replace(/[^a-z]/g,'').trim()
          const directCat = knownCats.find(c => rawCat === c || rawCat.startsWith(c))
          const r = (row.reason + ' ' + row.who).toLowerCase()
          const cat = directCat || (r.includes('permit') || r.includes('city') || r.includes('inspector') ? 'permits'
            : r.includes('electric') || r.includes('sdg') ? 'electrical'
            : r.includes('plumb') ? 'plumbing'
            : r.includes('lawyer') || r.includes('legal') ? 'legal'
            : r.includes('material') || r.includes('lumber') || r.includes('sand') ? 'materials'
            : r.includes('deposit') || r.includes('tax') || r.includes('travel') ? 'other'
            : 'labor')
          await api.post('/api/budget/' + row.matched_property_id + '/entries', {
            component: comp,
            category: cat,
            amount: row.amount,
            description: [row.date, row.who, row.reason].filter(Boolean).join(' | '),
          })
        count++
      } catch {}
    }
    setImported(count)
    setImporting(false)
    toast.success(count + ' expenses imported')
    setRows([])
    setFileName('')
  }

  const validRows = rows.filter(r => !r.error)
  const errorRows = rows.filter(r => r.error)
  const totalAmount = validRows.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Expenses</h1>
        <p className="text-muted-foreground mt-1">Upload Excel, CSV or PDF expense files</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" />Expected Columns</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead><tr className="border-b">
                <th className="text-left py-1 pr-4 text-muted-foreground font-medium">Date</th>
                <th className="text-left py-1 pr-4 text-muted-foreground font-medium">Contractor</th>
                <th className="text-left py-1 pr-4 text-muted-foreground font-medium">Property</th>
                <th className="text-left py-1 pr-4 text-muted-foreground font-medium">Category</th>
                <th className="text-left py-1 pr-4 text-muted-foreground font-medium">Amount</th>
                <th className="text-left py-1 text-muted-foreground font-medium">Source</th>
              </tr></thead>
              <tbody>
                <tr className="border-b"><td className="py-1 pr-4">4/6</td><td className="pr-4">D&L Builders</td><td className="pr-4">adu</td><td className="pr-4">labor</td><td className="pr-4">5000</td><td>savings</td></tr>
                <tr className="border-b"><td className="py-1 pr-4">4/11</td><td className="pr-4">Oscar</td><td className="pr-4">big house</td><td className="pr-4">plumbing</td><td className="pr-4">3361.5</td><td>Chase cc</td></tr>
                <tr><td className="py-1 pr-4">5/5</td><td className="pr-4">Rhona</td><td className="pr-4">big house</td><td className="pr-4">legal</td><td className="pr-4">3500</td><td>Wells Fargo</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Property keywords: <span className="font-mono bg-muted px-1 rounded">big house / main</span> → Main House, <span className="font-mono bg-muted px-1 rounded">alley / small</span> → Small House, <span className="font-mono bg-muted px-1 rounded">adu / garage</span> → ADU</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div
            className={"border-2 border-dashed rounded-lg p-10 text-center transition-colors " + (dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50')}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">{fileName || 'Drop your file here'}</p>
            <p className="text-xs text-muted-foreground mb-4">.xlsx, .xls, .csv, .pdf supported</p>
            <label className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer">
              <Upload className="h-4 w-4" />Browse File
              <input type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
            </label>
          </div>
        </CardContent>
      </Card>
      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Preview — {fileName}</h2>
              <Badge variant="default">{validRows.length} valid</Badge>
              {errorRows.length > 0 && <Badge variant="destructive">{errorRows.length} skipped</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Total: ${totalAmount.toLocaleString()}</span>
              <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Import {validRows.length} Expenses
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium w-6"></th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Who</th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Property (raw)</th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Matched To</th>
                  <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Reason</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Amount</th>
                </tr></thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={"border-b last:border-0 " + (row.error ? 'opacity-50' : '')}>
                      <td className="py-2 pr-3">
                        {row.error ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{row.date}</td>
                      <td className="py-2 pr-3 font-medium">{row.who}</td>
                      <td className="py-2 pr-3">{row.property}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{row.error || row.matched_property_name}</td>
                      <td className="py-2 pr-3">{row.reason}</td>
                      <td className="py-2 font-medium">{row.amount > 0 ? '$'+row.amount.toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
      {imported > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-800">{imported} expenses imported successfully</p>
              <p className="text-sm text-green-600">Budget totals updated across all properties</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
