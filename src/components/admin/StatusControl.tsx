'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type ContentStatus = 'draft' | 'published' | 'scheduled'

interface Props {
  status: ContentStatus
  scheduledAt: string | null // UTC ISO string, or null
  onChange: (status: ContentStatus, scheduledAt: string | null) => void
}

const OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Publish' },
  { value: 'scheduled', label: 'Schedule' },
]

function toTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Picking a date or typing a time both happen against the browser's local
// clock (Date getters/setters are local-time by spec) — only the final
// .toISOString() call, made here before onChange ever fires, crosses into
// UTC. The server only ever receives that ISO string — see src/lib/datetime.ts
// for the same contract on the (now-removed) datetime-local input this replaces.
export default function StatusControl({ status, scheduledAt, onChange }: Props) {
  const current = scheduledAt ? new Date(scheduledAt) : undefined
  const [time, setTime] = useState(current ? toTimeString(current) : '09:00')

  const combine = (date: Date | undefined, timeStr: string): string | null => {
    if (!date) return null
    const [hours, minutes] = timeStr.split(':').map(Number)
    const combined = new Date(date)
    combined.setHours(hours || 0, minutes || 0, 0, 0)
    return combined.toISOString()
  }

  return (
    <div className="space-y-3">
      {/* Radix RadioGroup is presentation-only here — these explicit hidden
          inputs (not a `name` on the RadioGroup itself) are what saveOffice's
          FormData read actually sees, mirroring the old datetime-local input's
          hidden-field pattern. */}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="scheduledAt" value={scheduledAt ?? ''} />
      <RadioGroup
        value={status}
        onValueChange={(value) => onChange(value as ContentStatus, value === 'scheduled' ? scheduledAt : null)}
        className="flex gap-4"
      >
        {OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={`status-${opt.value}`} />
            <Label htmlFor={`status-${opt.value}`} className="font-normal">{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>

      {status === 'scheduled' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn('w-44 justify-start text-left font-normal', !current && 'text-muted-foreground')}
              >
                <CalendarIcon className="h-4 w-4" />
                {current ? current.toLocaleDateString() : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={current} onSelect={(date) => onChange('scheduled', combine(date, time))} autoFocus />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value)
              onChange('scheduled', combine(current, e.target.value))
            }}
            className="w-28"
          />
          <p className="text-xs text-muted-foreground">Local time — stored in UTC.</p>
        </div>
      )}
    </div>
  )
}
