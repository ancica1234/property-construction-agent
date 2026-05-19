'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout, getStoredUser } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import type { User as UserType } from '@/lib/auth'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center px-6 gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-5 w-5 text-primary" />
          <span>PCA</span>
        </Link>

        <nav className="flex items-center gap-4 ml-4 flex-1">
          {user?.role !== 'contractor' && (<>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Portfolio</Link>
            <Link href="/portfolio/upload" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Import Expenses</Link>
            <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Intelligence</Link>
            <Link href="/schedule" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Payment Schedule</Link>
          </>)}
          {user?.role === 'contractor' && (
            <Link href="/contractor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Jobs</Link>
          )}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          {user && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.full_name}</span>
              <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
