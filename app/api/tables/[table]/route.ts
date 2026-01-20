import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Sanitize table name to prevent SQL injection
    const sanitizedTable = table.replace(/[^a-zA-Z0-9_]/g, '')

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as count 
      FROM "${sanitizedTable}"
    `)
    const total = Number(countResult.rows[0]?.count || 0)

    // Get column information first to determine ordering
    const columnsResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [sanitizedTable])

    const columns = columnsResult.rows as Array<{
      column_name: string
      data_type: string
      is_nullable: string
    }>

    // Determine order column (prefer id, otherwise first column)
    const orderColumn = columns.find(col => col.column_name === 'id')?.column_name || columns[0]?.column_name || '1'

    // Get table data with pagination
    const dataResult = await query(`
      SELECT * 
      FROM "${sanitizedTable}"
      ORDER BY "${orderColumn}" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset])

    return NextResponse.json({
      table: sanitizedTable,
      data: dataResult.rows,
      columns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error fetching table data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch table data' },
      { status: 500 }
    )
  }
}

