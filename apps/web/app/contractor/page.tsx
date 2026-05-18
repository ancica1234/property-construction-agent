'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { ProgressLog } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { HardHat, Loader2, AlertCircle, MapPin, Wrench, DollarSign } from 'lucide-react'

export default function ContractorPage() {
  const qc = useQueryClient()
  const [progressOpen, setProgressOpen] = useState(false)
  const [costOpen, setCostOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [pf, setPf] = useState({ phase: '', component: '', summary: '', blockers: '', percent_complete: 0 })
  const [cf, setCf] = useState({ component: '', category: 'labor', amount: '', description: '' })

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-assignments'],
    queryFn: async () => (await api.get('/api/contractors/my-assignments')).data,
  })

  const { data: recentLogs = [], } = useQuery<ProgressLog[]>({
    queryKey: ['contractor-logs', selectedAssignment?.property_id],
    queryFn: async () => {
      if (!selectedAssignment) return []
      return (await api.get(`/api/progress/${selectedAssignment.property_id}/logs`)).data
    },
    enabled: !!selectedAssignment,
  })

  const logCost = useMutation({
    mutationFn: (data: any) => api.post('/api/budget/' + selectedAssignment.property_id + '/entries', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-summary', selectedAssignment?.property_id] })
      toast.success('Cost logged')
      setCostOpen(false)
      setCf({ component: '', category: 'labor', amount: '', description: '' })
    },
    onError: () => toast.error('Failed to log cost'),
  })

  const logProgress = useMutation({
    mutationFn: (data: any) => api.post(`/api/progress/${selectedAssignment.property_id}/logs`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contractor-logs', selectedAssignment?.property_id] })
      toast.success('Progress logged successfully')
      setProgressOpen(false)
      setPf({ phase: '', component: '', summary: '', blockers: '', percent_complete: 0 })
    },
    onError: () => toast.error('Failed to log progress'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <p className="text-muted-foreground mt-1">Your active property assignments</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <HardHat className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active assignments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((a: any) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{a.property_name}</CardTitle>
                  <Badge>{a.status}</Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />{a.property_address}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Wrench className="h-3 w-3 text-primary" />
                  <span className="capitalize font-medium">{a.phase}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" onClick={() => { setSelectedAssignment(a); setPf(f=>({...f,phase:a.phase||""})); setProgressOpen(true) }}>
                    <HardHat className="h-3 w-3 mr-1" /> Log Progress
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedAssignment(a); setCf(f=>({...f,component:a.phase||""})); setCostOpen(true) }}>
                    <DollarSign className="h-3 w-3 mr-1" /> Log Cost
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Progress — {selectedAssignment?.property_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Phase</Label><Input value={pf.phase} onChange={e=>setPf({...pf,phase:e.target.value})} placeholder="electrical, framing..." /></div>
            <div className="space-y-2"><Label>Component</Label><Input value={pf.component} onChange={e=>setPf({...pf,component:e.target.value})} placeholder="adu, main, small_house" /></div>
            <div className="space-y-2"><Label>Summary</Label><Textarea value={pf.summary} onChange={e=>setPf({...pf,summary:e.target.value})} rows={3} placeholder="What was completed?" /></div>
            <div className="space-y-2"><Label>Blockers</Label><Textarea value={pf.blockers} onChange={e=>setPf({...pf,blockers:e.target.value})} rows={2} placeholder="Any issues?" /></div>
            <div className="space-y-2"><Label>Completion: {pf.percent_complete}%</Label><Input type="range" min={0} max={100} value={pf.percent_complete} onChange={e=>setPf({...pf,percent_complete:Number(e.target.value)})} /></div>
            <Button className="w-full" disabled={logProgress.isPending||!pf.phase||!pf.summary} onClick={()=>logProgress.mutate(pf)}>
              {logProgress.isPending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Submit Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={costOpen} onOpenChange={setCostOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Cost — {selectedAssignment?.property_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Component</Label><Input value={cf.component} onChange={e=>setCf({...cf,component:e.target.value})} placeholder="adu, main, small_house" /></div>
            <div className="space-y-2"><Label>Category</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={cf.category} onChange={e=>setCf({...cf,category:e.target.value})}>
                <option value="labor">Labor</option>
                <option value="materials">Materials</option>
                <option value="permits">Permits</option>
                <option value="equipment">Equipment</option>
                <option value="other">Other</option>
              </select></div>
            <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" value={cf.amount} onChange={e=>setCf({...cf,amount:e.target.value})} placeholder="1500" /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={cf.description} onChange={e=>setCf({...cf,description:e.target.value})} placeholder="Rough-in labor day 1" /></div>
            <Button className="w-full" disabled={logCost.isPending||!cf.component||!cf.amount} onClick={()=>logCost.mutate({...cf,amount:Number(cf.amount)})}>
              {logCost.isPending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Submit Cost
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
