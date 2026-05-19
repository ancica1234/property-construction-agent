'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HardHat, Loader2, MapPin, Wrench, CheckCircle, Circle, AlertCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  complete:    { label: 'Complete',    color: 'bg-yellow-100 text-yellow-700' },
  paid:        { label: 'Paid',        color: 'bg-green-100 text-green-700' },
}

export default function ContractorPage() {
  const qc = useQueryClient()
  const [progressOpen, setProgressOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [notes, setNotes] = useState(''
  )

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['my-assignments'],
    queryFn: async () => (await api.get('/api/contractors/my-assignments')).data,
  })

  const { data: milestones = [] } = useQuery<any[]>({
    queryKey: ['milestones'],
    queryFn: async () => (await api.get('/api/milestones/?portfolio_id=1')).data,
  })

  const updateMilestone = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      api.patch(`/api/milestones/${id}`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] })
      toast.success('Progress logged')
      setProgressOpen(false)
      setNotes(''
      )
    },
    onError: () => toast.error('Failed to update'),
  })

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m: any) => m.status === 'complete' || m.status === 'paid').length
  const inProgressMilestones = milestones.filter((m: any) => m.status === 'in_progress').length
  const progressPct = totalMilestones > 0 ? (completedMilestones / totalMilestones * 100) : 0

  const allyMilestones = milestones.filter((m: any) => m.unit === 'ally')
  const aduMilestones = milestones.filter((m: any) => m.unit === 'adu')
  const mainMilestones = milestones.filter((m: any) => m.unit === 'main')
  const generalMilestones = milestones.filter((m: any) => m.unit === 'general')

  const unitProgress = (items: any[]) => {
    const done = items.filter(m => m.status === 'complete' || m.status === 'paid').length
    return items.length > 0 ? Math.round(done / items.length * 100) : 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <p className="text-muted-foreground mt-1">D & L Builders inc. — 32nd Street Triplex</p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{completedMilestones} of {totalMilestones} milestones complete</span>
            <span className="font-medium">{progressPct.toFixed(0)}%</span>
          </div>
          <Progress value={progressPct} className="h-3" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-xl font-bold text-green-600">{completedMilestones}</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-xl font-bold text-blue-600">{inProgressMilestones}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xl font-bold text-gray-600">{totalMilestones - completedMilestones - inProgressMilestones}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ally Unit', items: allyMilestones, color: 'purple' },
          { label: 'ADU', items: aduMilestones, color: 'orange' },
          { label: 'Main House', items: mainMilestones, color: 'blue' },
          { label: 'General', items: generalMilestones, color: 'gray' },
        ].map(({ label, items, color }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2">{label}</p>
              <Progress value={unitProgress(items)} className="h-2 mb-1" />
              <p className="text-xs text-muted-foreground">{unitProgress(items)}% ({items.filter(m => m.status==='complete'||m.status==='paid').length}/{items.length})</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Milestones List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Deliverable</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Unit</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m: any) => {
                  const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending
                  return (
                    <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-xs text-muted-foreground">{m.order}</td>
                      <td className="p-3 text-sm">{m.deliverable}</td>
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">{m.unit}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                      </td>
                      <td className="p-3">
                        {(m.status === 'pending' || m.status === 'in_progress') && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => { setSelectedMilestone(m); setNotes(m.notes || ''); setProgressOpen(true) }}>
                            Log Progress
                          </Button>
                        )}
                        {m.status === 'complete' && <span className="text-xs text-yellow-600">⏳ Awaiting Payment</span>}
                        {m.status === 'paid' && <span className="text-xs text-green-600">✓ Paid</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Progress Dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Progress</DialogTitle>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium">#{selectedMilestone.order} {selectedMilestone.deliverable}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{selectedMilestone.unit} unit • ${selectedMilestone.amount.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={selectedMilestone.status === 'in_progress' ? 'default' : 'outline'} size="sm"
                    onClick={() => updateMilestone.mutate({ id: selectedMilestone.id, status: 'in_progress', notes })}>
                    Mark In Progress
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={() => updateMilestone.mutate({ id: selectedMilestone.id, status: 'complete', notes })}>
                    Mark Complete
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add any notes about this milestone..." />
              </div>
              <Button className="w-full" variant="outline" onClick={() => setProgressOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
