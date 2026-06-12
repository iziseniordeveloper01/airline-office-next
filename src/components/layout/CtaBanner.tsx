import { PhoneCall } from 'lucide-react'

export default function CtaBanner() {
  return (
    <section className="bg-indigo-600">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-12 sm:py-20 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Need Help Finding an Airline Office?
            </h2>
            <p className="mt-2 text-indigo-100">
              Our toll-free helpline connects you to live support for booking and travel queries.
            </p>
          </div>
          <a
            href="tel:+1xxxxxxxxxx"
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-green-600 transition-colors shrink-0"
          >
            <PhoneCall className="size-4" />
            Call Now: +1-xxx-xxx-xxxx
          </a>
        </div>
      </div>
    </section>
  )
}