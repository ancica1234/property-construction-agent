'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Clock, Loader2, AlertCircle, Circle, Wrench, Copy, ClipboardCheck } from 'lucide-react'
import { useState } from 'react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:     { label: 'Pending',     color: 'bg-gray-100 text-gray-600',     icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700',     icon: Wrench },
  complete:    { label: 'Complete',    color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  paid:        { label: 'Paid',        color: 'bg-green-100 text-green-700',   icon: CheckCircle },
}

const UNIT_COLORS: Record<string, string> = {
  ally:    'bg-purple-100 text-purple-700',
  adu:     'bg-orange-100 text-orange-700',
  main:    'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-600',
}

export default function ContractorSchedulePage() {
  const qc = useQueryClient()

  const { data: milestones = [], isLoading } = useQuery<any[]>({
    queryKey: ['milestones'],
    queryFn: async () => (await api.get('/api/milestones/?portfolio_id=1')).data,
  })

  const { data: summary } = useQuery<any>({
    queryKey: ['milestone-summary'],
    queryFn: async () => (await api.get('/api/milestones/summary?portfolio_id=1')).data,
  })

  const markComplete = useMutation({
    mutationFn: ({ id }: { id: number }) => api.patch(`/api/milestones/${id}`, { status: 'complete' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones'] })
      qc.invalidateQueries({ queryKey: ['milestone-summary'] })
      toast.success('Marked as complete — awaiting payment')
    },
    onError: () => toast.error('Failed to update'),
  })

  const [copied, setCopied] = useState(false)

  const copyInvoice = () => {
    const completed = milestones.filter((m: any) => m.status === 'complete')
    if (completed.length === 0) {
      toast.error('No completed milestones to invoice')
      return
    }
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const invoiceNum = `INV-${String(Date.now()).slice(-4)}`
    const lines = completed.map((m: any) => `  #${String(m.order).padEnd(3)} ${m.deliverable.substring(0, 55).padEnd(55)} $${m.amount.toLocaleString()}`).join('\n')
    const total = completed.reduce((s: number, m: any) => s + m.amount, 0)
    const text = `INVOICE — D & L Builders inc.\nDate: ${date}\nInvoice #: ${invoiceNum}\n\nProperty: 32nd Street Triplex — 4575/4577/4773 32nd St, San Diego CA\n\nCompleted Milestones:\n${lines}\n\n${'─'.repeat(70)}\nTOTAL DUE: $${total.toLocaleString()}\n\nPlease remit payment to:\nD & L Builders inc.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`Invoice copied! ${completed.length} milestones — $${total.toLocaleString()}`)
    setTimeout(() => setCopied(false), 3000)
  }

  const paidPct = summary ? (summary.total_paid / summary.total_contract * 100) : 0
  const completePct = summary ? ((summary.total_paid + summary.total_complete_unpaid) / summary.total_contract * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Payment Schedule</h1>
          <p className="text-muted-foreground mt-1">D & L Builders inc. — Contract $193,840</p>
        </div>
        <Button onClick={copyInvoice} variant={copied ? 'default' : 'outline'} className="gap-2">
          {copied ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy Invoice'}
        </Button>
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
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="text-2xl font-bold text-green-600">${summary.total_paid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Invoiced (Awaiting)</p>
              <p className="text-2xl font-bold text-yellow-600">${summary.total_complete_unpaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Still to Earn</p>
              <p className="text-2xl font-bold text-blue-600">${summary.total_pending.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      {summary && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Contract Progress</span>
              <span>{completePct.toFixed(1)}% complete — {paidPct.toFixed(1)}% paid</span>
            </div>
            <Progress value={completePct} className="h-3" />
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span>✅ Paid: {summary.count.paid}</span>
              <span>🟡 Awaiting Payment: {summary.count.complete}</span>
              <span>🔵 In Progress: {summary.count.in_progress}</span>
              <span>⚪ Pending: {summary.count.pending}</span>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {milestones.map((m: any) => {
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
                          {m.status === 'in_progress' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              disabled={markComplete.isPending}
                              onClick={() => markComplete.mutate({ id: m.id })}>
                              Mark Complete
                            </Button>
                          )}
                          {m.status === 'complete' && <span className="text-xs text-yellow-600 font-medium">⏳ Awaiting Payment</span>}
                          {m.status === 'paid' && <span className="text-xs text-green-600 font-medium">✓ Paid</span>}
                          {m.status === 'pending' && <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/50">
                    <td colSpan={3} className="p-3 text-sm font-bold">Total ({milestones.length} milestones)</td>
                    <td className="p-3 text-right text-sm font-bold">${milestones.reduce((s: number, m: any) => s + m.amount, 0).toLocaleString()}</td>
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
