import { NextResponse } from 'next/server'
import { getAllKites } from '@/lib/getKites'
import { toKiteSummary } from '@/lib/publicKites'

export async function GET() {
  const kites = await getAllKites()
  return NextResponse.json(kites.map(toKiteSummary), {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
