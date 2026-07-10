'use client'

import { useState } from 'react'
import type { BlogFAQ } from '@/types'
import { jsonLd as toJsonLd } from '@/lib/utils'

interface Props {
  faqs: BlogFAQ[]
}

function FAQItem({ faq, index }: { faq: BlogFAQ; index: number }) {
  const [open, setOpen] = useState(index === 0) // pehla item open rahega

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-gray-900 pr-4 leading-6">
          {faq.question}
        </span>
        {/* Arrow icon */}
        <svg
          className={`w-5 h-5 text-blue-700 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Answer — smooth expand/collapse */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-5 pb-4 pt-1 text-gray-600 leading-7 text-sm border-t border-gray-100">
          {faq.answer}
        </div>
      </div>
    </div>
  )
}

export default function BlogFAQ({ faqs }: Props) {
  if (!faqs || faqs.length === 0) return null

  // FAQ JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <section className="mt-12">
      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />

      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Frequently Asked Questions
      </h2>

      <div>
        {faqs.map((faq, i) => (
          <FAQItem key={i} faq={faq} index={i} />
        ))}
      </div>
    </section>
  )
}