import Link from 'next/link'
import { PlaneTakeoff, Mail, Phone, MapPin } from 'lucide-react'
import { telHref } from '@/lib/utils'
import type { SiteSettings } from '@/lib/data/getSettings'

const footerLinks = {
  airlines: [
    { name: 'Qatar Airways', href: '/qatar-airways' },
    { name: 'Emirates', href: '/emirates' },
    { name: 'British Airways', href: '/british-airways' },
    { name: 'Lufthansa', href: '/lufthansa' },
    { name: 'All Airlines', href: '/airlines' },
  ],
  explore: [
    { name: 'Headquarters', href: '/headquarters' },
    { name: 'Blogs', href: '/blog' },
  ],
}

const SOCIALS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'linkedin', label: 'LinkedIn' },
] as const

export default function Footer({ settings }: { settings: SiteSettings }) {
  const tel = telHref(settings.contactPhone)
  const socials = SOCIALS.filter((s) => settings[s.key])

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex items-center justify-center size-9 rounded-lg bg-indigo-600">
                <PlaneTakeoff className="size-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">
                Airline<span className="text-indigo-400">Office</span>Directory
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              Your trusted directory for airline office addresses, contact numbers, working
              hours, and headquarters information worldwide.
            </p>
          </div>

          {/* Airlines */}
          <div>
            <h3 className="text-sm font-semibold text-white">Top Airlines</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.airlines.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact bar */}
        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          {settings.contactPhone && (
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Phone className="size-4 text-green-400 shrink-0" />
              <a href={tel} className="hover:text-white transition-colors">{settings.contactPhone} (Toll-Free)</a>
            </div>
          )}
          {settings.contactEmail && (
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Mail className="size-4 text-green-400 shrink-0" />
              <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">
                {settings.contactEmail}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <MapPin className="size-4 text-green-400 shrink-0" />
            <span>Available Worldwide — 24/7 Support</span>
          </div>
        </div>

        {/* Social row */}
        {socials.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={settings[s.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div className="mt-8 border-t border-white/10 pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {settings.siteTitle}. All rights reserved.
          </p>
          {settings.footerDisclaimer && (
            <p className="text-xs text-slate-500">{settings.footerDisclaimer}</p>
          )}
        </div>
      </div>
    </footer>
  )
}