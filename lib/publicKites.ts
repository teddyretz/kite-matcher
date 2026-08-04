import type { Kite, KiteSummary, ReviewEntry } from './types';

export function stripPrivateReviewContent(reviews: Kite['reviews'] | undefined): Kite['reviews'] {
  return (reviews || []).map((review): ReviewEntry => {
    if (review.source !== 'youtube') return review;

    const publicReview = { ...review };
    delete publicReview.full_transcript;
    return publicReview;
  });
}

export function toKiteSummary(kite: Kite): KiteSummary {
  return {
    slug: kite.slug,
    brand: kite.brand,
    model: kite.model,
    year: kite.year,
  };
}
