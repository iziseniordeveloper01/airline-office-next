import { Search, Clock, ShieldCheck, Globe2 } from 'lucide-react'

const features = [
  {
    name: 'Verified Information',
    description:
      'Every airline office address, phone number and working hour is manually verified to keep data accurate and up to date.',
    icon: ShieldCheck,
  },
  {
    name: 'Global Coverage',
    description:
      'From major international hubs to regional offices, we cover airline locations across 120+ countries.',
    icon: Globe2,
  },
  {
    name: 'Easy Search',
    description:
      'Quickly find the airline you need by name or IATA code, then browse its offices worldwide — no clutter, no ads.',
    icon: Search,
  },
  {
    name: 'Always Updated',
    description:
      'Office hours, contact numbers and addresses are reviewed regularly so you never reach an outdated location.',
    icon: Clock,
  },
]

export default function WhyChooseUs() {
  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-base font-semibold text-blue-800">Why Choose Us</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your Trusted Source for Airline Office Information
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.name} className="flex flex-col gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-800">
                <feature.icon className="size-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}