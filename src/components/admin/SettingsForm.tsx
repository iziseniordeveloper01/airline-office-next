'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Building2,
  Globe,
  Hash,
  Phone,
  Search as SearchIcon,
  Share2,
} from 'lucide-react'
import { saveSettings } from '@/app/admin/settings/actions'
import type { SiteSettings } from '@/lib/data/getSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FieldDef {
  name: keyof SiteSettings
  label: string
  type?: string
  placeholder?: string
  help?: string
  full?: boolean
  textarea?: boolean
}

interface Section {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  fields: FieldDef[]
}

const SECTIONS: Section[] = [
  {
    id: 'general',
    title: 'General',
    icon: Building2,
    description: 'Core identity shown across the public site.',
    fields: [
      { name: 'siteTitle', label: 'Site Title', placeholder: 'Airline Office Directory' },
      { name: 'tagline', label: 'Tagline', placeholder: 'Shown in the top bar', full: true },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: Phone,
    description: 'Used for “Call Now” buttons and footer contact details.',
    fields: [
      { name: 'contactPhone', label: 'Toll-Free Phone', type: 'tel', placeholder: '+1-877-294-7147' },
      { name: 'contactEmail', label: 'Support Email', type: 'email', placeholder: 'support@example.com' },
    ],
  },
  {
    id: 'homepage',
    title: 'Homepage',
    icon: Hash,
    description: 'The three numbers shown in the homepage hero.',
    fields: [
      { name: 'statAirlines', label: 'Airlines Listed', placeholder: '500+' },
      { name: 'statOffices', label: 'Office Locations', placeholder: '2,000+' },
      { name: 'statCountries', label: 'Countries Covered', placeholder: '120+' },
    ],
  },
  {
    id: 'social',
    title: 'Social',
    icon: Share2,
    description: 'Leave blank to hide. Full URLs (https://…).',
    fields: [
      { name: 'facebook', label: 'Facebook', type: 'url', placeholder: 'https://facebook.com/…' },
      { name: 'twitter', label: 'Twitter / X', type: 'url', placeholder: 'https://x.com/…' },
      { name: 'instagram', label: 'Instagram', type: 'url', placeholder: 'https://instagram.com/…' },
      { name: 'youtube', label: 'YouTube', type: 'url', placeholder: 'https://youtube.com/…' },
      { name: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/…' },
    ],
  },
  {
    id: 'seo',
    title: 'SEO',
    icon: SearchIcon,
    description: 'Defaults and verification tokens for search engines.',
    fields: [
      { name: 'metaDescription', label: 'Default Meta Description', placeholder: 'Homepage / fallback description', full: true, textarea: true },
      { name: 'googleSiteVerification', label: 'Google Site Verification', placeholder: 'content token only' },
      { name: 'bingSiteVerification', label: 'Bing Site Verification', placeholder: 'content token only' },
    ],
  },
  {
    id: 'footer',
    title: 'Footer',
    icon: Globe,
    fields: [{ name: 'footerDisclaimer', label: 'Disclaimer', full: true, textarea: true }],
  },
]

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await saveSettings(formData)
        setDirty(false)
        toast.success('Settings saved', { description: 'Changes are live across the site.' })
        router.refresh()
      } catch (err) {
        toast.error('Could not save settings', {
          description: err instanceof Error ? err.message : 'Please check the fields and try again.',
        })
      }
    })
  }

  return (
    <form onSubmit={onSubmit} onChange={() => setDirty(true)}>
      <Tabs defaultValue="general" className="gap-6">
        <TabsList className="h-auto flex-wrap">
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
              <s.icon className="h-3.5 w-3.5" />
              {s.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-muted-foreground" />
                  {section.title}
                </CardTitle>
                {section.description && <CardDescription>{section.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.name} className={`space-y-1.5 ${field.full ? 'sm:col-span-2' : ''}`}>
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.textarea ? (
                        <Textarea
                          id={field.name}
                          name={field.name}
                          defaultValue={settings[field.name]}
                          placeholder={field.placeholder}
                          rows={3}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          name={field.name}
                          type={field.type ?? 'text'}
                          defaultValue={settings[field.name]}
                          placeholder={field.placeholder}
                        />
                      )}
                      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-between gap-3 rounded-lg border bg-background/90 px-4 py-3 shadow-sm backdrop-blur">
        <span className="text-sm text-muted-foreground">
          {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </span>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}
