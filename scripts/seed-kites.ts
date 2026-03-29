import { config as dotenv } from 'dotenv'
import { resolve } from 'path'
dotenv({ path: resolve(process.cwd(), '.env.local') })

import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'fs'
import path from 'path'

interface KiteJson {
  id: string
  slug: string
  brand: string
  model: string
  year: number
  image: string
  style_spectrum: number
  shape_spectrum: number
  wave_spectrum: number
  style_tags: string[]
  skill_level: string[]
  discontinued?: boolean
  snow_kite?: boolean
  teds_pick?: boolean
  aspect_ratio: string
  strut_count: number
  bar_type: string
  aluula: boolean
  brainchild: boolean
  turning_speed: string
  low_end_power: number
  depower_range: number
  relaunch: string
  wind_range_low: number
  wind_range_high: number
  sizes: number[]
  price_new: number
  price_new_aluula?: number
  summary: string
  best_for: string
  reviews: unknown[]
  structured_review?: {
    rating: number
    summary: string
    pros: string[]
    cons: string[]
    best_for: string
    not_for: string
    rec_blurb: string
    sources: string[]
  }
  buy_links: {
    new: { retailer: string; url: string; price: number }[]
    used: { source: string; url: string }[]
  }
}

async function seed() {
  const payload = await getPayload({ config })

  const dataPath = path.resolve(__dirname, '../data/kites.json')
  const raw = fs.readFileSync(dataPath, 'utf-8')
  const kites: KiteJson[] = JSON.parse(raw)

  console.log(`Found ${kites.length} kites to seed.`)

  // Clear existing kites
  const existing = await payload.find({ collection: 'kites', limit: 0, pagination: false })
  if (existing.docs.length > 0) {
    console.log(`Deleting ${existing.docs.length} existing kites...`)
    for (const doc of existing.docs) {
      await payload.delete({ collection: 'kites', id: doc.id })
    }
  }

  let created = 0
  let failed = 0

  for (const kite of kites) {
    try {
      await payload.create({
        collection: 'kites',
        data: {
          kiteId: kite.id,
          slug: kite.slug,
          brand: kite.brand,
          model: kite.model,
          year: kite.year,
          image: kite.image,
          style_spectrum: kite.style_spectrum,
          shape_spectrum: kite.shape_spectrum,
          wave_spectrum: kite.wave_spectrum,
          style_tags: kite.style_tags,
          skill_level: kite.skill_level,
          discontinued: kite.discontinued ?? false,
          snow_kite: kite.snow_kite ?? false,
          teds_pick: kite.teds_pick ?? false,
          aspect_ratio: kite.aspect_ratio,
          strut_count: kite.strut_count,
          bar_type: kite.bar_type,
          aluula: kite.aluula,
          brainchild: kite.brainchild,
          turning_speed: kite.turning_speed,
          low_end_power: kite.low_end_power,
          depower_range: kite.depower_range,
          relaunch: kite.relaunch,
          wind_range_low: kite.wind_range_low,
          wind_range_high: kite.wind_range_high,
          sizes: kite.sizes,
          price_new: kite.price_new,
          price_new_aluula: kite.price_new_aluula,
          summary: kite.summary,
          best_for: kite.best_for,
          reviews: kite.reviews,
          structured_review: kite.structured_review
            ? {
                rating: kite.structured_review.rating,
                summary: kite.structured_review.summary,
                pros: kite.structured_review.pros,
                cons: kite.structured_review.cons,
                best_for: kite.structured_review.best_for,
                not_for: kite.structured_review.not_for,
                rec_blurb: kite.structured_review.rec_blurb,
                sources: kite.structured_review.sources,
              }
            : undefined,
          buy_links: {
            new: kite.buy_links.new.map(l => ({
              retailer: l.retailer,
              url: l.url,
              price: l.price,
            })),
            used: kite.buy_links.used.map(l => ({
              source: l.source,
              url: l.url,
            })),
          },
        } as Record<string, unknown>,
      })
      created++
      process.stdout.write(`\r  Seeded ${created}/${kites.length}`)
    } catch (err) {
      failed++
      console.error(`\nFailed to seed ${kite.slug}:`, err)
    }
  }

  console.log(`\n\nDone! Created: ${created}, Failed: ${failed}`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
