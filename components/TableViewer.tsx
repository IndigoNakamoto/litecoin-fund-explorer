'use client'

import React, { useEffect, useState, useRef } from 'react'

interface Column {
  column_name: string
  data_type: string
  is_nullable: string
}

interface TableData {
  table: string
  data: any[]
  columns: Column[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface TableViewerProps {
  tableName: string
}

// Default columns for specific tables
const DEFAULT_COLUMNS: Record<string, string[]> = {
  donations: ['id', 'created_at', 'project_slug', 'pledgeAmount', 'asset_symbol', 'success', 'status'],
}

export default function TableViewer({ tableName }: TableViewerProps) {
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [columnSearchQuery, setColumnSearchQuery] = useState('')
  const columnSelectorRef = useRef<HTMLDivElement>(null)
  const limit = 50

  // Load column preferences from localStorage or use defaults
  useEffect(() => {
    if (tableName) {
      // Reset first
      setSelectedColumns(new Set())
      
      // For tables with defaults, check if we should use defaults or saved preferences
      if (DEFAULT_COLUMNS[tableName]) {
        const saved = localStorage.getItem(`column-selection-${tableName}`)
        if (saved) {
          try {
            const savedColumns = JSON.parse(saved)
            // Validate saved columns are still valid defaults or user customization
            setSelectedColumns(new Set(savedColumns))
          } catch (e) {
            // Invalid saved data, use defaults
            setSelectedColumns(new Set(DEFAULT_COLUMNS[tableName]))
          }
        } else {
          // No saved preferences, use table-specific defaults
          setSelectedColumns(new Set(DEFAULT_COLUMNS[tableName]))
        }
      } else {
        // No defaults for this table, load from localStorage or show all
        const saved = localStorage.getItem(`column-selection-${tableName}`)
        if (saved) {
          try {
            const savedColumns = JSON.parse(saved)
            setSelectedColumns(new Set(savedColumns))
          } catch (e) {
            // Will be handled by the next useEffect to select all
          }
        }
      }
    }
  }, [tableName])

  // Initialize selected columns when table data loads
  useEffect(() => {
    if (tableData && selectedColumns.size === 0) {
      // If no saved selection, use defaults or select all columns
      if (DEFAULT_COLUMNS[tableName]) {
        const defaults = DEFAULT_COLUMNS[tableName].filter(col => 
          tableData.columns.some(c => c.column_name === col)
        )
        setSelectedColumns(new Set(defaults))
      } else {
        const allColumns = new Set(tableData.columns.map(col => col.column_name))
        setSelectedColumns(allColumns)
      }
    } else if (tableData && selectedColumns.size > 0) {
      // Filter out columns that no longer exist in the table
      const availableColumns = new Set(tableData.columns.map(col => col.column_name))
      const filtered = new Set(
        Array.from(selectedColumns).filter(col => availableColumns.has(col))
      )
      if (filtered.size !== selectedColumns.size) {
        setSelectedColumns(filtered)
      }
    }
  }, [tableData, tableName, selectedColumns.size])

  // Save column preferences to localStorage
  useEffect(() => {
    if (tableName && selectedColumns.size > 0) {
      localStorage.setItem(
        `column-selection-${tableName}`,
        JSON.stringify(Array.from(selectedColumns))
      )
    }
  }, [tableName, selectedColumns])

  useEffect(() => {
    setPage(1)
    setColumnSearchQuery('')
    setShowColumnSelector(false)
  }, [tableName])

  useEffect(() => {
    fetchTableData()
  }, [tableName, page])

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnSelectorRef.current &&
        !columnSelectorRef.current.contains(event.target as Node)
      ) {
        setShowColumnSelector(false)
      }
    }

    if (showColumnSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnSelector])

  const fetchTableData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/tables/${tableName}?page=${page}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch table data')
      }
      const data = await response.json()
      setTableData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load table data')
      console.error('Error fetching table data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (value: string | Date): string => {
    try {
      let date: Date
      
      if (value instanceof Date) {
        date = value
      } else {
        const str = String(value)
        date = new Date(str)
        if (isNaN(date.getTime())) {
          return str
        }
      }
      
      // The pg driver incorrectly converts "timestamp without time zone" by adding local offset
      // The API returns timestamps that are 8 hours ahead of the actual stored value
      // Subtract 16 hours: 8 to undo pg's conversion + 8 to convert UTC to PST for display
      const correctedDate = new Date(date.getTime() - (16 * 60 * 60 * 1000))
      
      const year = correctedDate.getUTCFullYear()
      const month = correctedDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
      const day = correctedDate.getUTCDate()
      const hours = correctedDate.getUTCHours()
      const minutes = correctedDate.getUTCMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      
      return `${month} ${day}, ${year}, ${displayHours}:${minutes} ${ampm} PST`
    } catch {
      return String(value)
    }
  }

  const formatValue = (value: any, columnName?: string, dataType?: string): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>
    }
    
    // Format timestamps in PST
    if (dataType && (dataType.includes('timestamp') || dataType.includes('time'))) {
      return <span className="font-mono text-xs">{formatTimestamp(value)}</span>
    }
    
    if (typeof value === 'object') {
      return (
        <pre className="text-xs max-w-md overflow-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }
    if (typeof value === 'boolean') {
      return <span className="font-mono">{value.toString()}</span>
    }
    const stringValue = String(value)
    if (stringValue.length > 100) {
      return (
        <span className="max-w-xs truncate block" title={stringValue}>
          {stringValue.substring(0, 100)}...
        </span>
      )
    }
    return stringValue
  }

  const toggleColumn = (columnName: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnName)) {
        next.delete(columnName)
      } else {
        next.add(columnName)
      }
      return next
    })
  }

  const selectAllColumns = () => {
    if (tableData) {
      setSelectedColumns(new Set(tableData.columns.map(col => col.column_name)))
    }
  }

  const deselectAllColumns = () => {
    setSelectedColumns(new Set())
  }

  const resetToDefaults = () => {
    if (DEFAULT_COLUMNS[tableName] && tableData) {
      const defaults = DEFAULT_COLUMNS[tableName].filter(col => 
        tableData.columns.some(c => c.column_name === col)
      )
      setSelectedColumns(new Set(defaults))
      localStorage.removeItem(`column-selection-${tableName}`)
    }
  }

  const hasDefaults = !!DEFAULT_COLUMNS[tableName]

  const visibleColumns = tableData?.columns.filter(col => 
    selectedColumns.has(col.column_name)
  ) || []

  const filteredColumnsForSelector = tableData?.columns.filter(col => {
    if (!columnSearchQuery) return true
    const query = columnSearchQuery.toLowerCase()
    return (
      col.column_name.toLowerCase().includes(query) ||
      col.data_type.toLowerCase().includes(query)
    )
  }) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading table data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchTableData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{tableData.table}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {tableData.pagination.total.toLocaleString()} rows • Page {tableData.pagination.page} of{' '}
              {tableData.pagination.totalPages} • {visibleColumns.length} of {tableData.columns.length} columns
            </p>
          </div>
          <div className="relative" ref={columnSelectorRef}>
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Columns
            </button>
            {showColumnSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Select Columns</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={selectAllColumns}
                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
                      >
                        All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={deselectAllColumns}
                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
                      >
                        None
                      </button>
                      {hasDefaults && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={resetToDefaults}
                            className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
                          >
                            Default
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search columns..."
                    value={columnSearchQuery}
                    onChange={(e) => setColumnSearchQuery(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowColumnSelector(false)
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="p-2">
                  {filteredColumnsForSelector.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No columns match "{columnSearchQuery}"
                    </div>
                  ) : (
                    filteredColumnsForSelector.map((column) => {
                      const isSelected = selectedColumns.has(column.column_name)
                      return (
                        <label
                          key={column.column_name}
                          className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleColumn(column.column_name)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate">
                              {column.column_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {column.data_type}
                              {column.is_nullable === 'YES' && ' • nullable'}
                            </div>
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {visibleColumns.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No columns selected</p>
            <button
              onClick={selectAllColumns}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select all columns
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.column_name}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div>
                        <div>{column.column_name}</div>
                        <div className="text-xs text-gray-400 font-normal">
                          {column.data_type}
                          {column.is_nullable === 'YES' && ' • nullable'}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {visibleColumns.map((column) => (
                      <td
                        key={column.column_name}
                        className="px-6 py-4 text-sm text-gray-900"
                      >
                        <div className="max-w-xs">
                          {formatValue(row[column.column_name], column.column_name, column.data_type)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {((page - 1) * limit) + 1} to{' '}
          {Math.min(page * limit, tableData.pagination.total)} of{' '}
          {tableData.pagination.total.toLocaleString()} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(tableData.pagination.totalPages, p + 1))}
            disabled={page >= tableData.pagination.totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

