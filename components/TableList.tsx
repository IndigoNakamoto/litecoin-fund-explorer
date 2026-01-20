'use client'

interface Table {
  name: string
  rowCount: number
}

interface TableListProps {
  tables: Table[]
  selectedTable: string | null
  onSelectTable: (tableName: string) => void
}

export default function TableList({ tables, selectedTable, onSelectTable }: TableListProps) {
  return (
    <nav className="p-2">
      {tables.map((table) => (
        <button
          key={table.name}
          onClick={() => onSelectTable(table.name)}
          className={`w-full text-left px-3 py-2 rounded-md mb-1 transition-colors ${
            selectedTable === table.name
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">{table.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                selectedTable === table.name
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {table.rowCount.toLocaleString()}
            </span>
          </div>
        </button>
      ))}
    </nav>
  )
}










