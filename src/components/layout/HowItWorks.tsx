import { Search, MapPin, PhoneCall } from 'lucide-react'

const steps = [
  {
    step: '01',
    title: 'Search Airline or City',
    description: 'Type the airline name or your city/country to find relevant offices instantly.',
    icon: Search,
  },
  {
    step: '02',
    title: 'View Office Details',
    description: 'Get the full address, map location, working hours, services, and contact info.',
    icon: MapPin,
  },
  {
    step: '03',
    title: 'Contact the Office',
    description: 'Call, email, or visit the office directly using the details provided.',
    icon: PhoneCall,
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl text-center mx-auto">
          <p className="text-base font-semibold text-blue-800">How It Works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Find What You Need in 3 Simple Steps
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-50 ring-4 ring-blue-100">
                <item.icon className="size-7 text-blue-800" />
              </div>
              <span className="mt-4 block text-sm font-bold text-blue-800">STEP {item.step}</span>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}