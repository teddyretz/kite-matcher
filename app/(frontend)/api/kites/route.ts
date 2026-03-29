import { NextResponse } from 'next/server'
import { getAllKites } from '@/lib/getKites'

export async function GET() {
  const kites = await getAllKites()
  return NextResponse.json(kites, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
