export type PropertyStatus =
  | 'planning'
  | 'permits_pending'
  | 'permits_acquired'
  | 'in_construction'
  | 'finishes'
  | 'completed'

export interface Portfolio {
  id: number
  name: string
  description: string | null
  owner_id: number
  created_at: string
}

export interface Property {
  id: number
  portfolio_id: number
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  description: string | null
  status: PropertyStatus
  total_budget: number
  spent_so_far: number
  start_date: string | null
  target_end_date: string | null
  units_config: Record<string, any>
  projected_rents: Record<string, number>
  created_at: string
}

export interface BudgetEntry {
  id: number
  property_id: number
  component: string
  category: string
  amount: number
  description: string | null
  logged_by_id: number | null
  created_at: string
}

export interface BudgetSummary {
  property_id: number
  total_budget: number
  spent_so_far: number
  remaining: number
  percent_used: number
  by_component: Record<string, number>
}

export interface ProgressLog {
  id: number
  property_id: number
  contractor_id: number
  phase: string
  component: string | null
  summary: string
  blockers: string | null
  photos: string[]
  percent_complete: number
  logged_at: string
  created_at: string
}

export interface ContractorAssignment {
  id: number
  property_id: number
  contractor_id: number
  phase: string
  scope_of_work: string | null
  status: 'active' | 'completed' | 'removed'
  assigned_at: string
  completed_at: string | null
}
