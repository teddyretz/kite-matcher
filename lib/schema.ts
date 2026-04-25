import { z } from 'zod';

const SkillLevel = z.enum(['beginner', 'intermediate', 'advanced']);
const BarType = z.enum(['high-y', 'low-v', 'both']);
const TurningSpeed = z.enum(['slow', 'medium', 'medium-fast', 'fast', 'very-fast']);
const Relaunch = z.enum(['easy', 'medium', 'hard']);
const AspectRatio = z.enum(['low', 'medium', 'medium-high', 'high', 'very-high']);

const ReviewSource = z.object({
  source: z.string(),
  url: z.string(),
  score: z.number().nullable(),
  summary: z.string(),
  video_id: z.string().nullable().optional(),
  jason_montreal: z.boolean().optional(),
});

const YouTubeReview = z.object({
  source: z.literal('youtube'),
  reviewer: z.string(),
  channel: z.string(),
  channel_url: z.string(),
  video_id: z.string(),
  video_title: z.string(),
  video_url: z.string(),
  excerpt: z.string(),
  verdict: z.string(),
  full_transcript: z.string().optional(),
});

const AggregatePlaceholder = z.object({
  source: z.literal('aggregate_placeholder'),
  data: z.object({
    aggregate_score: z.number(),
    review_count: z.number(),
    sources: z.array(ReviewSource),
  }),
});

const ReviewEntry = z.discriminatedUnion('source', [YouTubeReview, AggregatePlaceholder]);

const StructuredReview = z.object({
  rating: z.number().min(0).max(5),
  summary: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  best_for: z.string(),
  not_for: z.string(),
  rec_blurb: z.string(),
  sources: z.array(z.string()),
});

const BuyLink = z.object({
  retailer: z.string(),
  url: z.string(),
  price: z.number(),
});

const UsedLink = z.object({
  source: z.string(),
  url: z.string(),
});

export const KiteSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, digits, hyphens'),
  brand: z.string(),
  model: z.string(),
  year: z.number().int(),
  image: z.string(),

  style_spectrum: z.number().min(0).max(100),
  shape_spectrum: z.number().min(0).max(100),
  wave_spectrum: z.number().min(0).max(100),
  style_tags: z.array(z.string()),
  skill_level: z.array(SkillLevel),

  discontinued: z.boolean().optional(),
  snow_kite: z.boolean().optional(),
  teds_pick: z.boolean().optional(),

  aspect_ratio: AspectRatio,
  strut_count: z.number().int().min(0),
  bar_type: BarType,
  aluula: z.boolean(),
  brainchild: z.boolean(),
  turning_speed: TurningSpeed,
  low_end_power: z.number().min(0).max(10),
  depower_range: z.number().min(0).max(10),
  relaunch: Relaunch,
  wind_range_low: z.number(),
  wind_range_high: z.number(),
  sizes: z.array(z.number()),
  price_new: z.number(),
  price_new_aluula: z.number().optional(),

  summary: z.string(),
  best_for: z.string(),

  reviews: z.array(ReviewEntry),
  structured_review: StructuredReview.nullable().optional(),

  buy_links: z.object({
    new: z.array(BuyLink),
    used: z.array(UsedLink),
  }),
});

export type ValidatedKite = z.infer<typeof KiteSchema>;
