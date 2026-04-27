export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type BarType = 'high-y' | 'low-v' | 'both';
export type TurningSpeed = 'slow' | 'medium' | 'medium-fast' | 'fast' | 'very-fast';
export type RelaunchDifficulty = 'easy' | 'medium' | 'hard';

export interface ReviewSource {
  source: string;
  url: string;
  score: number | null;
  summary: string;
  video_id?: string | null;
  jason_montreal?: boolean;
}

export interface StructuredReview {
  rating: number;
  summary: string;
  pros: string[];
  cons: string[];
  best_for: string;
  not_for: string;
  rec_blurb: string;
  sources: string[];
}

export type ReviewEntry =
  | {
      source: 'youtube';
      reviewer: string;
      channel: string;
      channel_url: string;
      video_id: string;
      video_title: string;
      video_url: string;
      excerpt: string;
      verdict: string;
      summary?: string;
      full_transcript?: string;
    }
  | {
      source: 'aggregate_placeholder';
      data: {
        aggregate_score: number;
        review_count: number;
        sources: ReviewSource[];
      };
    };

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
  style_spectrum: number;
  shape_spectrum: number;
  wave_spectrum: number;
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
  low_end_power: number;
  depower_range: number;
  relaunch: RelaunchDifficulty;
  wind_range_low: number;
  wind_range_high: number;
  sizes: number[];
  price_new: number;
  price_new_aluula?: number;

  // Content
  summary: string;
  best_for: string;

  // Reviews — now an array of mixed entry types
  reviews: ReviewEntry[];

  // Structured review derived from YouTube transcripts (25 kites have this)
  structured_review?: StructuredReview;

  // Shopping
  buy_links: {
    new: BuyLink[];
    used: { source: string; url: string }[];
  };
}
