import { NextResponse } from 'next/server'
import { query } from '@/lib/prisma'

export async function GET() {
  try {
    // Get table names using raw SQL query
    const tablesResult = await query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `)

    const tables = tablesResult.rows as Array<{ tablename: string }>

    // Get row counts for each table
    const tableInfo = await Promise.all(
      tables.map(async (table) => {
        try {
          const countResult = await query(`
            SELECT COUNT(*) as count 
            FROM "${table.tablename}"
          `)
          return {
            name: table.tablename,
            rowCount: Number(countResult.rows[0]?.count || 0),
          }
        } catch (err) {
          console.error(`Error counting rows for ${table.tablename}:`, err)
          return {
            name: table.tablename,
            rowCount: 0,
          }
        }
      })
    )

    return NextResponse.json({ tables: tableInfo })
  } catch (error: any) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}

