import Link from 'next/link'
import { PlaneTakeoff, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  airlines: [
    { name: 'Qatar Airways', href: '/qatar-airways' },
    { name: 'Emirates', href: '/emirates' },
    { name: 'British Airways', href: '/british-airways' },
    { name: 'Lufthansa', href: '/lufthansa' },
    { name: 'All Airlines', href: '/airlines' },
  ],
  resources: [
    { name: 'Headquarters', href: '/headquarters' },
    { name: 'Flight Status', href: '/flight-status' },
    { name: 'Baggage Rules', href: '/baggage-rules' },
    { name: 'Online Check-in', href: '/online-checkin' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex items-center justify-center size-9 rounded-lg bg-indigo-600">
                <PlaneTakeoff className="size-5 text-white" />
              </span>
              <span className="text-lg font-bold text-white">
                Airline<span className="text-green-400">Office</span>Directory
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              Your trusted directory for airline office addresses, contact numbers, working
              hours, and headquarters information worldwide.
            </p>
            
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
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

          {/* Resources + Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
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
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Phone className="size-4 text-green-400 shrink-0" />
            <a href="tel:+18772947147" className="hover:text-white transition-colors">+1-877-294-7147 (Toll-Free)</a>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Mail className="size-4 text-green-400 shrink-0" />
            <a href="mailto:support@airlineofficedirectory.com" className="hover:text-white transition-colors">
              support@airlineofficedirectory.com
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <MapPin className="size-4 text-green-400 shrink-0" />
            <span>Available Worldwide — 24/7 Support</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-white/10 pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} AirlineOfficeDirectory. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Disclaimer: This is an independent directory and is not affiliated with any airline.
          </p>
        </div>
      </div>
    </footer>
  )
}