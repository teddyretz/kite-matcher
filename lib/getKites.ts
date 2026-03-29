import { getPayloadClient } from './payload'
import type { Kite } from './types'

function mapPayloadDocToKite(doc: Record<string, unknown>): Kite {
  return {
    id: (doc.kiteId as string) || (doc.id as string),
    slug: doc.slug as string,
    brand: doc.brand as string,
    model: doc.model as string,
    year: doc.year as number,
    image: doc.image as string,
    style_spectrum: doc.style_spectrum as number,
    shape_spectrum: doc.shape_spectrum as number,
    wave_spectrum: doc.wave_spectrum as number,
    style_tags: (doc.style_tags as string[]) || [],
    skill_level: (doc.skill_level as Kite['skill_level']) || [],
    discontinued: (doc.discontinued as boolean) || false,
    snow_kite: (doc.snow_kite as boolean) || false,
    teds_pick: (doc.teds_pick as boolean) || false,
    aspect_ratio: doc.aspect_ratio as Kite['aspect_ratio'],
    strut_count: doc.strut_count as number,
    bar_type: doc.bar_type as Kite['bar_type'],
    aluula: (doc.aluula as boolean) || false,
    brainchild: (doc.brainchild as boolean) || false,
    turning_speed: doc.turning_speed as Kite['turning_speed'],
    low_end_power: doc.low_end_power as number,
    depower_range: doc.depower_range as number,
    relaunch: doc.relaunch as Kite['relaunch'],
    wind_range_low: doc.wind_range_low as number,
    wind_range_high: doc.wind_range_high as number,
    sizes: (doc.sizes as number[]) || [],
    price_new: doc.price_new as number,
    price_new_aluula: doc.price_new_aluula as number | undefined,
    summary: doc.summary as string,
    best_for: doc.best_for as string,
    reviews: (doc.reviews as Kite['reviews']) || [],
    structured_review: doc.structured_review as Kite['structured_review'] | undefined,
    buy_links: (doc.buy_links as Kite['buy_links']) || { new: [], used: [] },
  }
}

export async function getAllKites(): Promise<Kite[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'kites',
    limit: 0,
    pagination: false,
  })
  return result.docs.map((doc) => mapPayloadDocToKite(doc as unknown as Record<string, unknown>))
}

export async function getKiteBySlug(slug: string): Promise<Kite | null> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'kites',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })
  if (result.docs.length === 0) return null
  return mapPayloadDocToKite(result.docs[0] as unknown as Record<string, unknown>)
}

export async function getActiveKites(): Promise<Kite[]> {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'kites',
    where: {
      discontinued: { not_equals: true },
    },
    limit: 0,
    pagination: false,
  })
  return result.docs.map((doc) => mapPayloadDocToKite(doc as unknown as Record<string, unknown>))
}
