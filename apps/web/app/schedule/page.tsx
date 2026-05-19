'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock, DollarSign, Loader2, AlertCircle, Circle, Wrench } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600',       icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700',       icon: Wrench },
  complete:    { label: 'Complete',    color: 'bg-yellow-100 text-yellow-700',   icon: AlertCircle },
  paid:        { label: 'Paid',        color: 'bg-green-100 text-green-700',     icon: CheckCircle },
}

const UNIT_COLORS: Record<string, string> = {
  ally:    'bg-purple-100 text-purple-700',
  adu:     'bg-orange-100 text-orange-700',
  main:    'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
}

export default function SchedulePage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: milestones = [], isLoading } = useQuery<any[]>({
    queryKey: ['milestones'],
    queryFn: async () => (await api.get('/api/milestones/?portfolio_id=1')).data,
  })

  const { data: summary } = useQuery<any>({
    queryKey: ['milestone-summary'],
    queryFn: async () => (await api.get('/api/milestones/summary?portfolio_id=1')).data,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/milestones/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] })
      qc.invalidateQueries({ queryKey: ['milestone-summary'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const nextStatus = (current: string) => {
    const flow: Record<string, string> = {
      pending: 'in_progress',
      in_progress: 'complete',
      complete: 'paid',
      paid: 'paid',
    }
    return flow[current] || 'pending'
  }

  const filtered = filter === 'all' ? milestones : milestones.filter(m => m.unit === filter || m.status === filter)
  const paidPct = summary ? (summary.total_paid / summary.total_contract * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Schedule</h1>
        <p className="text-muted-foreground mt-1">D & L Builders inc. — Contract $193,840</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Contract</p>
              <p className="text-2xl font-bold">${summary.total_contract.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${summary.total_paid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Complete (Unpaid)</p>
              <p className="text-2xl font-bold text-yellow-600">${summary.total_complete_unpaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Remaining Balance</p>
              <p className="text-2xl font-bold text-red-500">${summary.remaining_balance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {summary && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Payment Progress</span>
              <span>{paidPct.toFixed(1)}% paid</span>
            </div>
            <Progress value={paidPct} className="h-3" />
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>✅ Paid: {summary.count.paid}</span>
              <span>🟡 Complete: {summary.count.complete}</span>
              <span>🔵 In Progress: {summary.count.in_progress}</span>
              <span>⚪ Pending: {summary.count.pending}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'ally', 'adu', 'main', 'general', 'in_progress', 'complete', 'paid'].map(f => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="capitalize">
            {f.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Milestones Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-8">#</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Deliverable</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Unit</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m: any) => {
                    const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending
                    const Icon = sc.icon
                    return (
                      <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground">{m.order}</td>
                        <td className="p-3 text-sm">{m.deliverable}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${UNIT_COLORS[m.unit] || UNIT_COLORS.general}`}>
                            {m.unit}
                          </span>
                        </td>
                        <td className="p-3 text-right text-sm font-medium">${m.amount.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                            <Icon className="h-3 w-3" />{sc.label}
                          </span>
                        </td>
                        <td className="p-3">
                          {m.status !== 'paid' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: m.id, status: nextStatus(m.status) })}>
                              {m.status === 'pending' && 'Start'}
                              {m.status === 'in_progress' && 'Mark Complete'}
                              {m.status === 'complete' && 'Mark Paid'}
                            </Button>
                          )}
                          {m.status === 'paid' && <span className="text-xs text-green-600 font-medium">✓ Paid</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50">
                    <td colSpan={3} className="p-3 text-sm font-bold">Total ({filtered.length} items)</td>
                    <td className="p-3 text-right text-sm font-bold">${filtered.reduce((s: number, m: any) => s + m.amount, 0).toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
