'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Building2, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const riskColors: Record<string, string> = {
  low: 'text-green-600',
  on_track: 'text-green-600',
  medium: 'text-yellow-600',
  warning: 'text-yellow-600',
  high: 'text-red-600',
  over_budget: 'text-red-600',
}

const riskBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'default',
  on_track: 'default',
  medium: 'outline',
  warning: 'outline',
  high: 'destructive',
  over_budget: 'destructive',
}

const riskIcon = (risk: string) => {
  if (risk === 'low' || risk === 'on_track') return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (risk === 'medium' || risk === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  return <AlertTriangle className="h-4 w-4 text-red-500" />
}

export default function AgentsPage() {
  const { data: roi, isLoading: roiLoading } = useQuery<any>({
    queryKey: ['portfolio-roi'],
    queryFn: async () => (await api.get('/api/agent/roi')).data,
  })

  const { data: scope, isLoading: scopeLoading } = useQuery<any>({
    queryKey: ['portfolio-scope-creep'],
    queryFn: async () => (await api.get('/api/agent/scope-creep')).data,
  })

  const isLoading = roiLoading || scopeLoading

  const barData = roi?.properties?.map((p: any) => ({
    name: p.property_name.split('\u2014')[0].trim().split(' ').slice(0, 2).join(' '),
    ROI: p.returns.roi_on_budget_pct,
    'Cap Rate': p.returns.cap_rate_pct,
  })) || []

  const spendData = roi?.properties?.map((p: any) => ({
    name: p.property_name.split('\u2014')[0].trim().split(' ').slice(0, 2).join(' '),
    Spent: p.financials.total_invested,
    Remaining: p.financials.remaining_budget,
  })) || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Portfolio Intelligence</h1>
        <p className="text-muted-foreground mt-1">ROI analysis and scope creep monitoring across all properties</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          {/* Portfolio Summary Cards */}
          {roi?.portfolio_summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Cashflow</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${roi.portfolio_summary.monthly_cashflow.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">after 35% expenses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio ROI</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{roi.portfolio_summary.portfolio_roi_pct}%</div>
                  <p className="text-xs text-muted-foreground">on total budget</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Payback Period</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{roi.portfolio_summary.payback_years}y</div>
                  <p className="text-xs text-muted-foreground">{roi.portfolio_summary.payback_months} months</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Scope Flags</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={"text-2xl font-bold " + (scope?.portfolio_summary?.total_flags > 0 ? 'text-red-600' : 'text-green-600')}>
                    {scope?.portfolio_summary?.total_flags || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">{scope?.portfolio_summary?.high_risk_count || 0} high risk</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Expenses Breakdown */}
          {roi?.portfolio_summary?.monthly_expenses_breakdown && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" />Monthly Operating Expenses</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(roi.portfolio_summary.monthly_expenses_breakdown)
                    .filter(([k]) => k !== 'total')
                    .map(([key, val]: [string, any]) => (
                      <div key={key} className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                        <p className="font-semibold text-sm">${Number(val).toLocaleString()}/mo</p>
                      </div>
                    ))}
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                    <p className="font-bold text-sm text-primary">${roi.portfolio_summary.monthly_expenses_breakdown.total.toLocaleString()}/mo</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm border-t pt-3">
                  <div className="flex gap-6">
                    <span>Gross rent: <strong>${roi.portfolio_summary.total_monthly_rent.toLocaleString()}/mo</strong></span>
                    <span>Expenses: <strong className="text-red-500">-${roi.portfolio_summary.monthly_expenses_breakdown.total.toLocaleString()}/mo</strong></span>
                  </div>
                  <span className="font-bold text-green-600 text-base">Net: ${roi.portfolio_summary.monthly_cashflow.toLocaleString()}/mo</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">ROI & Cap Rate by Property</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => v + '%'} />
                    <Bar dataKey="ROI" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    <Bar dataKey="Cap Rate" fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Budget Spent vs Remaining</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={spendData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => '$'+Math.round(v/1000)+'k'} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => '$'+Number(v).toLocaleString()} />
                    <Bar dataKey="Spent" fill="#f97316" radius={[4,4,0,0]} stackId="a" />
                    <Bar dataKey="Remaining" fill="hsl(var(--primary))" radius={[4,4,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Per Property ROI */}
          <div>
            <h2 className="text-xl font-semibold mb-4">ROI by Property</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roi?.properties?.map((p: any) => (
                <Card key={p.property_id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{p.property_name.split('\u2014')[0].trim()}</CardTitle>
                      <Badge variant={riskBadge[p.health.status]}>{p.health.status.replace('_',' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.address}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><p className="text-muted-foreground text-xs">Monthly Rent</p><p className="font-semibold">${p.rental_income.monthly_gross.toLocaleString()}</p></div>
                      <div><p className="text-muted-foreground text-xs">Monthly Net</p><p className="font-semibold text-green-600">${p.rental_income.monthly_cashflow.toLocaleString()}</p></div>
                      <div><p className="text-muted-foreground text-xs">ROI</p><p className="font-semibold">{p.returns.roi_on_budget_pct}%</p></div>
                      <div><p className="text-muted-foreground text-xs">Payback</p><p className="font-semibold">{p.returns.payback_years}y</p></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget used</span><span>{p.financials.budget_used_pct}%</span>
                      </div>
                      <Progress value={p.financials.budget_used_pct} className="h-1.5" />
                    </div>
                    <div className="text-xs text-muted-foreground">{p.health.note}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Scope Creep */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Scope Creep Analysis</h2>
            <div className="space-y-4">
              {scope?.properties?.map((p: any) => (
                <Card key={p.property_id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {riskIcon(p.overall_risk)}
                        <CardTitle className="text-sm">{p.property_name}</CardTitle>
                      </div>
                      <Badge variant={riskBadge[p.overall_risk]}>{p.overall_risk.replace('_',' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.summary}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(p.by_category).map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground capitalize w-20 shrink-0">{cat}</span>
                          <div className="flex-1">
                            <Progress value={(amt / p.financials.total_spent) * 100} className="h-1.5" />
                          </div>
                          <span className="text-xs font-medium w-20 text-right">${Number(amt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    {p.flags.total_flags > 0 && (
                      <div className="mt-3 space-y-1">
                        {p.flags.high_risk_components.map((f: any) => (
                          <div key={f.component} className="flex items-center gap-2 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{f.component}: {f.risk_reasons.join(', ')}</span>
                          </div>
                        ))}
                        {p.flags.medium_risk_components.map((f: any) => (
                          <div key={f.component} className="flex items-center gap-2 text-xs text-yellow-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{f.component}: {f.risk_reasons.join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
