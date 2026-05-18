'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Property, BudgetSummary, ProgressLog } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DollarSign, HardHat, Bot, Plus, Loader2, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

export default function PropertyDetailPage() {
  const { propertyId } = useParams()
  const qc = useQueryClient()
  const [chatMsg, setChatMsg] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignContractorId, setAssignContractorId] = useState(0)
  const [assignPhase, setAssignPhase] = useState('')

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: async () => (await api.get(`/api/properties/${propertyId}`)).data,
  })

  const { data: budgetSummary } = useQuery<BudgetSummary>({
    queryKey: ['budget-summary', propertyId],
    queryFn: async () => (await api.get(`/api/budget/${propertyId}/summary`)).data,
    enabled: !!propertyId,
  })

  const { data: budgetEntries = [] } = useQuery<any[]>({
    queryKey: ['budget-entries', propertyId],
    queryFn: async () => (await api.get(`/api/budget/${propertyId}/entries`)).data,
    enabled: !!propertyId,
  })

  const { data: progressLogs = [] } = useQuery<ProgressLog[]>({
    queryKey: ['progress', propertyId],
    queryFn: async () => (await api.get(`/api/progress/${propertyId}/logs`)).data,
    enabled: !!propertyId,
  })

  const { data: contractors = [] } = useQuery<any[]>({
    queryKey: ['contractors'],
    queryFn: async () => (await api.get('/api/contractors/')).data,
  })

  const updateRent = useMutation({
    mutationFn: (rents: Record<string, number>) => api.patch(`/api/properties/${propertyId}`, { projected_rents: rents }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', propertyId] })
      toast.success('Monthly rent updated')
      setRentOpen(false)
    },
    onError: () => toast.error('Failed to update rent'),
  })

  const assign = useMutation({
    mutationFn: (data: any) => api.post(`/api/contractors/properties/${propertyId}/assign`, data),
    onSuccess: () => { toast.success('Contractor assigned'); setAssignOpen(false) },
    onError: () => toast.error('Failed to assign'),
  })

  const [editEntry, setEditEntry] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [rentOpen, setRentOpen] = useState(false)
  const [rentValues, setRentValues] = useState<Record<string, string>>({})

  const addBudget = useMutation({
    mutationFn: (data: any) => api.post(`/api/budget/${propertyId}/entries`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-summary', propertyId] })
      qc.invalidateQueries({ queryKey: ['budget-entries', propertyId] })
      qc.invalidateQueries({ queryKey: ['property', propertyId] })
      toast.success('Budget entry added')
      setBudgetOpen(false)
    },
    onError: () => toast.error('Failed to add budget entry'),
  })

  const updateBudget = useMutation({
    mutationFn: (data: any) => api.put(`/api/budget/${propertyId}/entries/${editEntry?.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-summary', propertyId] })
      qc.invalidateQueries({ queryKey: ['budget-entries', propertyId] })
      qc.invalidateQueries({ queryKey: ['property', propertyId] })
      toast.success('Entry updated')
      setEditOpen(false)
      setEditEntry(null)
    },
    onError: () => toast.error('Failed to update entry'),
  })

  const deleteBudget = useMutation({
    mutationFn: (entryId: number) => api.delete(`/api/budget/${propertyId}/entries/${entryId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-summary', propertyId] })
      qc.invalidateQueries({ queryKey: ['budget-entries', propertyId] })
      qc.invalidateQueries({ queryKey: ['property', propertyId] })
      toast.success('Entry deleted')
    },
    onError: () => toast.error('Failed to delete entry'),
  })

  const handleChat = async () => {
    if (!chatMsg.trim()) return
    setChatLoading(true)
    try {
      const { data } = await api.post('/api/agent/chat', {
        message: chatMsg,
        property_id: Number(propertyId),
      })
      setChatResponse(data.response)
    } catch {
      toast.error('Agent unavailable')
    } finally {
      setChatLoading(false)
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!property) return <div className="text-center py-20 text-muted-foreground">Property not found</div>

  const budgetPct = property.total_budget > 0 ? (property.spent_so_far / property.total_budget) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{property.name}</h1>
          <p className="text-muted-foreground">{property.address}, {property.city}, {property.zip_code}</p>
        </div>
        <Badge className="capitalize text-sm">{property.status.replace(/_/g, ' ')}</Badge>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { const rents = property?.projected_rents || {}; setRentValues(Object.fromEntries(Object.entries(rents).map(([k,v]) => [k, String(v)]))); setRentOpen(true) }}><DollarSign className="h-3 w-3 mr-1" />Edit Rent</Button>
        <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>Assign Contractor</Button>
      </div>

      {/* Budget overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${property.total_budget.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Spent So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${property.spent_so_far.toLocaleString()}</div>
            <Progress value={budgetPct} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{budgetPct.toFixed(1)}% used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${budgetPct > 90 ? 'text-destructive' : ''}`}>
              ${(property.total_budget - property.spent_so_far).toLocaleString()}
            </div>
            {budgetPct > 90 && (
              <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="h-3 w-3" /> Near budget limit
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      {/* Scope of Work */}
      {property.units_config && Object.keys(property.units_config).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <HardHat className="h-4 w-4 text-primary" /> Scope of Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(property.units_config).map(([unit, cfg]: [string, any]) => (
                <div key={unit}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold capitalize text-sm">{unit.replace(/_/g, " ")}</span>
                    {cfg.config && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{cfg.config}</span>}
                    {cfg.sqft && <span className="text-xs text-muted-foreground">{cfg.sqft} sqft</span>}
                  </div>
                  {cfg.scope && Array.isArray(cfg.scope) && (
                    <ul className="grid grid-cols-2 md:grid-cols-3 gap-1">
                      {cfg.scope.map((item: string) => (
                        <li key={item} className="flex items-center gap-1.5 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="capitalize">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="budget">
        <TabsList>
          <TabsTrigger value="budget"><DollarSign className="h-4 w-4 mr-1" />Budget</TabsTrigger>
          <TabsTrigger value="progress"><HardHat className="h-4 w-4 mr-1" />Progress</TabsTrigger>
          <TabsTrigger value="agent"><Bot className="h-4 w-4 mr-1" />AI Agent</TabsTrigger>
        </TabsList>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Budget Entries</h2>
            <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
              <DialogTrigger>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer">
                  <Plus className="h-4 w-4" />Add Entry
                </span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Budget Entry</DialogTitle></DialogHeader>
                <BudgetForm onSubmit={(d) => addBudget.mutate(d)} loading={addBudget.isPending} />
              </DialogContent>
            </Dialog>
          </div>
          {budgetSummary && (() => {
            const donut = [{ name: "Spent", value: budgetSummary.spent_so_far }, { name: "Remaining", value: property.total_budget - budgetSummary.spent_so_far }]
            const compData = Object.entries(budgetSummary.by_component).map(([k,v]) => ({ name: k.replace(/_/g," "), value: Number(v) }))
            const COLORS = ["#f97316", "hsl(var(--primary))"]
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Budget Used vs Remaining</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={donut} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                            {donut.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => "$"+Number(v).toLocaleString()} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Spending by Component</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={compData} layout="vertical" margin={{ left: 8, right: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={v => "$"+Math.round(v/1000)+"k"} tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                          <Tooltip formatter={(v: any) => "$"+Number(v).toLocaleString()} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-sm">By Component</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(budgetSummary.by_component).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}</span>
                        <span className="font-medium">${(v as number).toLocaleString()}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )
          })()}

          {/* Line-by-line entries table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Expense Entries</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {budgetEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No entries yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Who</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Reason</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Component</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetEntries.map((entry: any) => {
                      const parts = (entry.description || '').split(' | ')
                      const date = parts.length >= 3 ? parts[0] : ''
                      const who = parts.length >= 3 ? parts[1] : (parts[0] || '')
                      const reason = parts.length >= 3 ? parts.slice(2).join(' | ') : (parts[1] || '')
                      return (
                        <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 group">
                          <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{date || '—'}</td>
                          <td className="px-4 py-2 font-medium">{who || '—'}</td>
                          <td className="px-4 py-2 text-muted-foreground">{reason || entry.description || '—'}</td>
                          <td className="px-4 py-2"><span className="capitalize text-xs bg-muted px-2 py-0.5 rounded">{entry.component}</span></td>
                          <td className="px-4 py-2 text-right font-medium">${entry.amount.toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditEntry(entry); setEditOpen(true) }} className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">Edit</button>
                              <button onClick={() => { if(confirm('Delete this entry?')) deleteBudget.mutate(entry.id) }} className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-destructive hover:text-white transition-colors">Del</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50">
                      <td colSpan={4} className="px-4 py-2 font-semibold">Total Spent</td>
                      <td className="px-4 py-2 text-right font-bold text-primary">
                        ${budgetEntries.reduce((s: number, e: any) => s + e.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Progress Logs</h2>
          </div>
          {progressLogs.length === 0 ? (
            <Card className="text-center py-10">
              <CardContent>
                <HardHat className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">No progress logs yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {progressLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge variant="outline" className="capitalize">{log.phase}</Badge>
                        {log.component && <Badge variant="secondary" className="ml-2 capitalize">{log.component}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{log.summary}</p>
                    {log.blockers && (
                      <div className="flex items-start gap-1 mt-2 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3 mt-0.5" />
                        <span>{log.blockers}</span>
                      </div>
                    )}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Phase complete</span><span>{log.percent_complete}%</span>
                      </div>
                      <Progress value={log.percent_complete} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Agent Tab */}
        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5 text-primary" /> Property AI Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ask about this property</Label>
                <Textarea
                  placeholder="e.g. What are my biggest risks? What is my ROI projection?"
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  rows={3}
                />
              </div>
              <Button onClick={handleChat} disabled={chatLoading || !chatMsg.trim()}>
                {chatLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ask Agent
              </Button>
              {chatResponse && (
                <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {chatResponse}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Budget Entry Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Expense Entry</DialogTitle></DialogHeader>
          {editEntry && (
            <BudgetForm
              initialValues={editEntry}
              onSubmit={(d) => updateBudget.mutate(d)}
              loading={updateBudget.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Monthly Rent Dialog */}
      <Dialog open={rentOpen} onOpenChange={setRentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Monthly Rent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Set projected monthly rent per unit</p>
            {Object.keys(rentValues).length === 0 && property?.units_config && (
              <p className="text-xs text-muted-foreground">Units: {Object.keys(property.units_config).join(', ')}</p>
            )}
            {property?.units_config && Object.keys(property.units_config).map(unit => (
              <div key={unit} className="space-y-1">
                <Label className="capitalize">{unit.replace(/_/g, ' ')} — monthly rent ($)</Label>
                <Input
                  type="number"
                  value={rentValues[unit] || ''}
                  onChange={e => setRentValues({...rentValues, [unit]: e.target.value})}
                  placeholder="e.g. 3900"
                />
              </div>
            ))}
            <Button className="w-full" disabled={updateRent.isPending} onClick={() => {
              const rents = Object.fromEntries(Object.entries(rentValues).map(([k,v]) => [k, Number(v)]))
              updateRent.mutate(rents)
            }}>
              {updateRent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Rent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Contractor Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Contractor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contractor</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={assignContractorId} onChange={e => setAssignContractorId(Number(e.target.value))}>
                <option value={0}>Select a contractor...</option>
                {contractors.map((ct: any) => <option key={ct.id} value={ct.id}>{ct.full_name} ({ct.email})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Phase</Label>
              <Input placeholder="e.g. electrical, framing, finishes" value={assignPhase} onChange={e => setAssignPhase(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!assignContractorId || !assignPhase || assign.isPending} onClick={() => assign.mutate({contractor_id: assignContractorId, phase: assignPhase})}>
              {assign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BudgetForm({ onSubmit, loading, initialValues }: { onSubmit: (d: any) => void; loading: boolean; initialValues?: any }) {
  const [form, setForm] = useState({
    component: initialValues?.component || '',
    category: initialValues?.category || 'labor',
    amount: initialValues?.amount ? String(initialValues.amount) : '',
    description: initialValues?.description || '',
  })
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Component</Label>
        <Input placeholder="adu, main, small_house" value={form.component} onChange={e => setForm({...form, component: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Input placeholder="labor, materials, permits, other" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Amount ($)</Label>
        <Input type="number" placeholder="5000" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Input placeholder="Notes..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>
      <Button className="w-full" disabled={loading || !form.component || !form.amount}
        onClick={() => onSubmit({ ...form, amount: Number(form.amount) })}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Entry
      </Button>
    </div>
  )
}
