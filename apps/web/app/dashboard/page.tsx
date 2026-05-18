'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import { Property, Portfolio } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Building2, DollarSign, HardHat, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const statusColors: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
  planning: 'secondary',
  permits_pending: 'outline',
  permits_acquired: 'outline',
  in_construction: 'default',
  finishes: 'default',
  completed: 'secondary',
}

const statusLabels: Record<string, string> = {
  planning: 'Planning',
  permits_pending: 'Permits Pending',
  permits_acquired: 'Permits Acquired',
  in_construction: 'In Construction',
  finishes: 'Finishes',
  completed: 'Completed',
}

export default function DashboardPage() {
  const router = useRouter()
  const user = getStoredUser()

  const { data: portfolios = [] } = useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: async () => (await api.get('/api/portfolios/')).data,
  })

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => (await api.get('/api/properties/')).data,
  })

  const totalBudget = properties.reduce((s, p) => s + p.total_budget, 0)
  const totalSpent = properties.reduce((s, p) => s + p.spent_so_far, 0)
  const activeProjects = properties.filter(p => p.status === 'in_construction' || p.status === 'finishes').length

  const barData = properties.map(p => ({
    name: p.name.split('—')[0].trim().split(' ').slice(0,2).join(' '),
    Budget: p.total_budget,
    Spent: p.spent_so_far,
    Remaining: p.total_budget - p.spent_so_far,
  }))

  const donutData = [
    { name: 'Spent', value: totalSpent },
    { name: 'Remaining', value: totalBudget - totalSpent },
  ]
  const COLORS = ['#f97316', 'hsl(var(--primary))']

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s your portfolio overview</p>
        </div>
        <Button onClick={() => router.push('/portfolio')}>
          <Plus className="h-4 w-4 mr-2" /> New Property
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-muted-foreground">{portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">across all properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">in construction or finishes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Budget vs Spent by Property</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => "$"+Math.round(v/1000)+"k"} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => "$"+Number(v).toLocaleString()} />
                <Bar dataKey="Budget" fill="hsl(var(--muted))" radius={[4,4,0,0]} />
                <Bar dataKey="Spent" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Portfolio Budget Allocation</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {donutData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => "$"+Number(v).toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-sm text-muted-foreground">{"$"}{totalSpent.toLocaleString()} spent of {"$"}{totalBudget.toLocaleString()} total</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Your Properties</h2>
        {properties.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No properties yet. Create a portfolio and add your first property.</p>
              <Button onClick={() => router.push('/portfolio')}>Get Started</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.address}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Budget used</span>
                      <span className="font-medium">
                        ${p.spent_so_far.toLocaleString()} / ${p.total_budget.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={p.total_budget > 0 ? (p.spent_so_far / p.total_budget) * 100 : 0} className="h-2" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/portfolio/${p.portfolio_id}/properties/${p.id}`)}
                  >
                    View Details <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
