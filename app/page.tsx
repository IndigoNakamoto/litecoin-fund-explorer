'use client'

import { useEffect, useState } from 'react'
import TableList from '@/components/TableList'
import TableViewer from '@/components/TableViewer'
import MatchingSummary from '@/components/MatchingSummary'

interface Table {
  name: string
  rowCount: number
}

export default function Home() {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tables')
      if (!response.ok) {
        throw new Error('Failed to fetch tables')
      }
      const data = await response.json()
      setTables(data.tables || [])
      if (data.tables && data.tables.length > 0 && !selectedTable) {
        // Default to 'donations' table if it exists, otherwise first table
        const donationsTable = data.tables.find((t: { name: string }) => t.name === 'donations')
        setSelectedTable(donationsTable ? 'donations' : data.tables[0].name)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tables')
      console.error('Error fetching tables:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading database tables...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Connection Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            Make sure your DATABASE_URL is set in .env.local
          </p>
          <button
            onClick={fetchTables}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Database Explorer</h1>
          <p className="text-sm text-gray-500 mt-1">
            {tables.length} {tables.length === 1 ? 'table' : 'tables'}
          </p>
        </div>
        
        {/* Matching Summary */}
        <div className="p-3 border-b border-gray-200">
          <MatchingSummary />
        </div>
        
        {/* Table List */}
        <div className="flex-1 overflow-y-auto">
          <TableList
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedTable ? (
          <TableViewer tableName={selectedTable} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a table to view its data</p>
          </div>
        )}
      </div>
    </div>
  )
}
