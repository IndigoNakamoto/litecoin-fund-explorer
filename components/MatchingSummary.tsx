'use client'

import { useEffect, useState } from 'react'

interface ProjectBreakdown {
  projectSlug: string
  amount: number
  count: number
}

interface DonorSummary {
  donorId: string
  label: string
  totalMatched: number
  entryCount: number
  projects: ProjectBreakdown[]
}

interface MatchingData {
  summary: {
    totalMatched: number
    entryCount: number
    totalDonations: number
    processedDonations: number
    successfulDonations: number
  }
  donors: DonorSummary[]
}

export default function MatchingSummary() {
  const [data, setData] = useState<MatchingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDonor, setExpandedDonor] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/matching-summary')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 text-xs text-red-700 underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
        <h2 className="text-lg font-bold text-white">Matching Summary</h2>
        <p className="text-emerald-100 text-sm">
          {formatCurrency(data.summary.totalMatched)} total matched
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {data.summary.entryCount}
          </p>
          <p className="text-xs text-gray-500">Entries</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {data.summary.successfulDonations}
          </p>
          <p className="text-xs text-gray-500">Successful</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">
            {data.summary.processedDonations}
          </p>
          <p className="text-xs text-gray-500">Processed</p>
        </div>
      </div>

      {/* Donors */}
      <div className="divide-y divide-gray-100">
        {data.donors.map((donor) => (
          <div key={donor.donorId} className="p-3">
            <button
              onClick={() =>
                setExpandedDonor(
                  expandedDonor === donor.donorId ? null : donor.donorId
                )
              }
              className="w-full text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {donor.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {donor.entryCount} entries
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">
                    {formatCurrency(donor.totalMatched)}
                  </p>
                  <span className="text-xs text-gray-400">
                    {expandedDonor === donor.donorId ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded Project List */}
            {expandedDonor === donor.donorId && (
              <div className="mt-2 ml-2 space-y-1">
                {donor.projects.map((project) => (
                  <div
                    key={project.projectSlug}
                    className="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 rounded"
                  >
                    <span className="text-gray-700 truncate max-w-[140px]">
                      {project.projectSlug}
                    </span>
                    <span className="text-gray-900 font-medium ml-2">
                      {formatCurrency(project.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="p-2 bg-gray-50 border-t border-gray-200">
        <button
          onClick={fetchData}
          className="w-full py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  )
}










