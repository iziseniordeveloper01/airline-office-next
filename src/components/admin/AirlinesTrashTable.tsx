'use client'

import Link from 'next/link'
import { restoreAirline, deleteAirlinePermanently } from '@/app/admin/airlines/actions'
import DeleteButton from '@/components/admin/DeleteButton'

interface TrashedAirline {
  id: number
  slug: string
  name: string
  iataCode: string
  deletedAt: string
}

export default function AirlinesTrashTable({
  airlines,
  canManageTrash,
}: {
  airlines: TrashedAirline[]
  canManageTrash: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Airline Trash</h1>
        <Link href="/admin/airlines" className="text-sm text-blue-600 hover:underline">
          ← Back to Airlines
        </Link>
      </div>

      {airlines.length === 0 ? (
        <p className="text-center py-8 text-gray-500">Trash is empty</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">IATA</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Trashed</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {airlines.map((airline) => (
                <tr key={airline.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{airline.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{airline.iataCode}</td>
                  <td className="border border-gray-300 px-4 py-2">{airline.deletedAt}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {canManageTrash ? (
                      <div className="flex gap-2">
                        <DeleteButton
                          action={restoreAirline.bind(null, airline.id)}
                          confirmMessage={`Restore "${airline.name}"?`}
                          className="text-indigo-600 hover:underline disabled:opacity-50"
                        >
                          Restore
                        </DeleteButton>
                        <DeleteButton
                          action={deleteAirlinePermanently.bind(null, airline.id)}
                          confirmMessage={`Permanently delete "${airline.name}"? This cannot be undone.`}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Delete Permanently
                        </DeleteButton>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Admin only</span>
                    )}
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
