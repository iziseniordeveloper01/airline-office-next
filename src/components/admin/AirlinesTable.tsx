'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trashAirline } from '@/app/admin/airlines/actions'
import DeleteButton from '@/components/admin/DeleteButton'
import StatusBadge from '@/components/admin/StatusBadge'

interface AirlineEntry {
  id: number
  slug: string
  name: string
  iataCode: string
  icaoCode: string
  alliance: string
  status: 'draft' | 'published' | 'scheduled'
  isFeatured: boolean
  updatedAt: string
}

export default function AirlinesTable({ airlines }: { airlines: AirlineEntry[] }) {
  const [search, setSearch] = useState('')

  const filtered = airlines.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.iataCode.toLowerCase().includes(q) ||
      a.icaoCode.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Airlines</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/airlines/trash" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Trash
          </Link>
          <Link
            href="/admin/airlines/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Airline
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, IATA, or ICAO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-gray-500">No airlines found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">IATA</th>
                <th className="border border-gray-300 px-4 py-2 text-left">ICAO</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Alliance</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Featured</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((airline) => (
                <tr key={airline.slug} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{airline.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{airline.iataCode}</td>
                  <td className="border border-gray-300 px-4 py-2">{airline.icaoCode}</td>
                  <td className="border border-gray-300 px-4 py-2">{airline.alliance || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <StatusBadge status={airline.status} />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {airline.isFeatured ? '✓' : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/airlines/${airline.slug}`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        action={trashAirline.bind(null, airline.id)}
                        confirmMessage={`Move "${airline.name}" to trash?`}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Trash
                      </DeleteButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
