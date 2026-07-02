import Link from 'next/link'
import { Plane, Building2, Newspaper, ArrowRight } from 'lucide-react'
import { getAirlineStatusCounts } from '@/lib/data/getAirline'
import { getOfficeStatusCounts } from '@/lib/data/getOffice'
import { getBlogStatusCounts } from '@/lib/data/getBlog'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const ENTITIES = [
  { key: 'airlines', label: 'Airlines', href: '/admin/airlines/trash', icon: Plane },
  { key: 'offices', label: 'Offices', href: '/admin/offices/trash', icon: Building2 },
  { key: 'blog', label: 'Blog Posts', href: '/admin/blog/trash', icon: Newspaper },
] as const

export default async function TrashHubPage() {
  const [airlines, offices, blog] = await Promise.all([
    getAirlineStatusCounts(),
    getOfficeStatusCounts(),
    getBlogStatusCounts(),
  ])
  const countsByKey = { airlines, offices, blog }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Soft-deleted content, grouped by type. Editors can trash; admins can restore or delete permanently.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ENTITIES.map((entity) => (
          <Link key={entity.key} href={entity.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <entity.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{entity.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-semibold">{countsByKey[entity.key].trashed}</span>
                <span className="ml-1.5 text-sm text-muted-foreground">in trash</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
