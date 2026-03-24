'use client';

import { useState, useEffect } from 'react';
import { supabase, supabaseConfigured, UserReview } from '@/lib/supabase';

interface UserReviewsProps {
  kiteSlug: string;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`w-8 h-8 ${star <= value ? 'text-sand' : 'text-gray-300'}`}
        >
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function UserReviews({ kiteSlug }: UserReviewsProps) {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [ridingStyle, setRidingStyle] = useState('');
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    fetchReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kiteSlug]);

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('kite_slug', kiteSlug)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!rating) { setError('Please select a rating'); return; }
    if (!authorName.trim()) { setError('Please enter your name'); return; }
    if (!reviewText.trim()) { setError('Please write a review'); return; }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('reviews').insert({
      kite_slug: kiteSlug,
      author_name: authorName.trim(),
      rating,
      experience_level: experienceLevel || 'not specified',
      riding_style: ridingStyle || 'not specified',
      review_text: reviewText.trim(),
    });

    if (insertError) {
      setError('Failed to submit review. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    setShowForm(false);
    setAuthorName('');
    setRating(0);
    setExperienceLevel('');
    setRidingStyle('');
    setReviewText('');
    fetchReviews();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate">
          Rider Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h3>
        {!showForm && supabaseConfigured && (
          <button
            onClick={() => { setShowForm(true); setSubmitted(false); }}
            className="px-4 py-1.5 text-sm font-medium bg-sand text-white rounded-lg hover:bg-sand-dark transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {submitted && (
        <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg">
          Thanks for your review!
        </div>
      )}

      {/* Review Form */}
      {showForm && supabaseConfigured && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-lg p-5 border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate mb-1">Your Rating</label>
            <StarInput value={rating} onChange={setRating} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Name</label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={e => setExperienceLevel(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                <option value="">Select...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate mb-1">Riding Style</label>
            <select
              value={ridingStyle}
              onChange={e => setRidingStyle(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="">Select...</option>
              <option value="freeride">Freeride</option>
              <option value="freestyle">Freestyle</option>
              <option value="big air">Big Air</option>
              <option value="wave">Wave</option>
              <option value="foiling">Foiling</option>
              <option value="wakestyle">Wakestyle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate mb-1">Your Review</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              placeholder="What do you think of this kite? How does it fly, what conditions did you ride it in?"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-ocean text-white text-sm font-medium rounded-lg hover:bg-ocean-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Existing Reviews */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading reviews...</p>
      ) : !supabaseConfigured ? (
        <p className="text-sm text-gray-400 italic">
          User reviews will be available once the database is connected.
        </p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">No rider reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-surface rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate">{review.author_name}</span>
                  <span className="text-xs text-gray-400 capitalize">{review.experience_level} &middot; {review.riding_style}</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-sand' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">{review.review_text}</p>
              {review.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
