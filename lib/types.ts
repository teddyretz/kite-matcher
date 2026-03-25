export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type BarType = 'high-y' | 'low-v' | 'both';
export type TurningSpeed = 'slow' | 'medium' | 'fast' | 'very-fast';
export type RelaunchDifficulty = 'easy' | 'medium' | 'hard';

export interface ReviewSource {
  source: string;
  url: string;
  score: number | null;
  summary: string;
  video_id?: string | null;
  jason_montreal?: boolean;
}

export interface BuyLink {
  retailer: string;
  url: string;
  price: number;
}

export interface Kite {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  image: string;

  // Style matching
  style_spectrum: number;       // 0-20=foil, 21-40=surf, 41-60=freestyle, 61-80=freeride, 81-100=big air
  shape_spectrum: number;       // 0=low aspect C, 100=high aspect bow/LEI
  wave_spectrum: number;        // 0-100, how capable in waves
  style_tags: string[];
  skill_level: SkillLevel[];
  discontinued?: boolean;
  snow_kite?: boolean;
  teds_pick?: boolean;

  // Specs
  aspect_ratio: 'low' | 'medium' | 'medium-high' | 'high' | 'very-high';
  strut_count: number;
  bar_type: BarType;
  aluula: boolean;
  brainchild: boolean;
  turning_speed: TurningSpeed;
  low_end_power: number;        // 1-10
  depower_range: number;        // 1-10
  relaunch: RelaunchDifficulty;
  wind_range_low: number;       // knots
  wind_range_high: number;      // knots
  sizes: number[];
  price_new: number;
  price_new_aluula?: number;

  // Content
  summary: string;
  best_for: string;

  // Reviews
  reviews: {
    aggregate_score: number;
    review_count: number;
    sources: ReviewSource[];
  };

  // Shopping
  buy_links: {
    new: BuyLink[];
    used: { source: string; url: string }[];
  };
}
