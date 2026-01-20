import { NextResponse } from 'next/server'
import { query } from '@/lib/prisma'

interface DonorSummary {
  donorId: string
  label: string
  totalMatched: number
  entryCount: number
  projects: {
    projectSlug: string
    amount: number
    count: number
  }[]
}

export async function GET() {
  try {
    // Get total stats
    const totalStats = await query(`
      SELECT 
        COUNT(*) as entry_count,
        COALESCE(SUM("matchedAmount"), 0) as total_matched
      FROM "MatchingDonationLog"
    `)

    // Get donation stats
    const donationStats = await query(`
      SELECT 
        COUNT(*) as total_donations,
        COUNT(*) FILTER (WHERE processed = true) as processed_donations,
        COUNT(*) FILTER (WHERE success = true) as successful_donations
      FROM donations
    `)

    // Get by donor with totals
    const byDonor = await query(`
      SELECT 
        "donorId",
        COUNT(*) as entry_count,
        SUM("matchedAmount") as total_matched
      FROM "MatchingDonationLog"
      GROUP BY "donorId"
      ORDER BY total_matched DESC
    `)

    // Get by donor and project
    const byDonorProject = await query(`
      SELECT 
        "donorId",
        "projectSlug",
        COUNT(*) as entry_count,
        SUM("matchedAmount") as amount
      FROM "MatchingDonationLog"
      GROUP BY "donorId", "projectSlug"
      ORDER BY "donorId", amount DESC
    `)

    // Known donor labels
    const donorLabels: Record<string, string> = {
      '670718cdf8133590e50b7770': 'Donor 1 (LF only)',
      '670aea9001de0ce1382d49eb': 'Donor 2 ($50k cap)',
    }

    // Build donor summaries
    const donors: DonorSummary[] = byDonor.rows.map((donor: any) => {
      const projects = byDonorProject.rows
        .filter((p: any) => p.donorId === donor.donorId)
        .map((p: any) => ({
          projectSlug: p.projectSlug,
          amount: Number(p.amount),
          count: Number(p.entry_count),
        }))

      return {
        donorId: donor.donorId,
        label: donorLabels[donor.donorId] || `Donor ${donor.donorId.slice(0, 8)}...`,
        totalMatched: Number(donor.total_matched),
        entryCount: Number(donor.entry_count),
        projects,
      }
    })

    return NextResponse.json({
      summary: {
        totalMatched: Number(totalStats.rows[0]?.total_matched || 0),
        entryCount: Number(totalStats.rows[0]?.entry_count || 0),
        totalDonations: Number(donationStats.rows[0]?.total_donations || 0),
        processedDonations: Number(donationStats.rows[0]?.processed_donations || 0),
        successfulDonations: Number(donationStats.rows[0]?.successful_donations || 0),
      },
      donors,
    })
  } catch (error: any) {
    console.error('Error fetching matching summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matching summary' },
      { status: 500 }
    )
  }
}










