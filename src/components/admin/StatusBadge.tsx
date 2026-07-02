type Status = 'draft' | 'published' | 'scheduled'

const STYLES: Record<Status, string> = {
  draft: 'bg-amber-50 text-amber-600',
  published: 'bg-green-50 text-green-700',
  scheduled: 'bg-blue-50 text-blue-600',
}

const LABELS: Record<Status, string> = {
  draft: 'Draft',
  published: 'Live',
  scheduled: 'Scheduled',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
