'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { PlaneTakeoff } from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Airlines', href: '/airlines' },
  { name: 'Headquarters', href: '/headquarters' },
  { name: 'Blogs', href: '/blogs' },
  { name: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      {/* Top bar */}
      <div className="hidden md:block bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
          <p>Find Airline Offices, Headquarters & Contact Details Worldwide</p>
          <a href="tel:+18772947147" className="flex items-center gap-1.5 font-semibold text-green-400 hover:text-green-300 transition-colors">
            <PhoneIcon className="size-3.5" />
            +1-877-294-7147 (Toll-Free)
          </a>
        </div>
      </div>

      <nav aria-label="Global" className="max-w-7xl mx-auto flex items-center justify-between p-4 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="flex items-center justify-center size-9 rounded-lg bg-indigo-600">
              <PlaneTakeoff className="size-5 text-white" />
            </span>
            <span className="text-lg font-bold text-gray-900">
              Airline<span className="text-indigo-600">Office</span>Directory
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex lg:gap-x-10">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
              {item.name}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <a
            href="tel:+18772947147"
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-green-600 transition-colors"
          >
            <PhoneIcon className="size-4" />
            Call Now
          </a>
        </div>
      </nav>

      {/* Mobile menu */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="flex items-center justify-center size-9 rounded-lg bg-indigo-600">
                <PlaneTakeoff className="size-5 text-white" />
              </span>
              <span className="text-lg font-bold text-gray-900">
                Airline<span className="text-indigo-600">Office</span>Directory
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <a
                  href="tel:+18772947147"
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-green-500 px-4 py-3 text-sm font-bold text-white"
                >
                  <PhoneIcon className="size-4" />
                  Call Now: +1-877-294-7147
                </a>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  )
}