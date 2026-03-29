import type { CollectionConfig } from 'payload'

export const Kites: CollectionConfig = {
  slug: 'kites',
  admin: {
    useAsTitle: 'model',
    defaultColumns: ['brand', 'model', 'year', 'style_spectrum', 'discontinued'],
    listSearchableFields: ['brand', 'model', 'slug'],
  },
  fields: [
    // Identity
    {
      name: 'kiteId',
      type: 'text',
      required: true,
      label: 'Kite ID',
      admin: { description: 'e.g. duotone-rebel-sls-2026' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'brand',
      type: 'text',
      required: true,
    },
    {
      name: 'model',
      type: 'text',
      required: true,
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'image',
      type: 'text',
      required: true,
      admin: { description: 'Path relative to /public, e.g. /kites/duotone-rebel-sls-2026.jpg' },
    },

    // Style matching
    {
      type: 'row',
      fields: [
        {
          name: 'style_spectrum',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
          admin: { description: 'Foil(0-20) Surf(21-40) Freestyle(41-60) Freeride(61-80) BigAir(81-100)' },
        },
        {
          name: 'shape_spectrum',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
        },
        {
          name: 'wave_spectrum',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
        },
      ],
    },
    {
      name: 'style_tags',
      type: 'select',
      hasMany: true,
      options: [
        'C-kite', 'King of the Air', 'all-around', 'beginner-friendly', 'best-value',
        'big air', 'boosting', 'brainchild', 'closed-cell', 'crossover', 'drift',
        'efficiency', 'foil', 'foil-friendly', 'freeride', 'freestyle', 'hangtime',
        'hybrid', 'kiteloop', 'light wind', 'lightwind', 'megaloops', 'old school',
        'open-C', 'performance', 'premium', 'race', 'ram-air', 'strapless', 'travel',
        'ultralight', 'unhooked', 'versatile', 'wakestyle', 'wave', 'zero-strut',
      ],
    },
    {
      name: 'skill_level',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },

    // Flags
    {
      type: 'row',
      fields: [
        { name: 'discontinued', type: 'checkbox', defaultValue: false },
        { name: 'snow_kite', type: 'checkbox', defaultValue: false },
        { name: 'teds_pick', type: 'checkbox', defaultValue: false },
        { name: 'aluula', type: 'checkbox', defaultValue: false },
        { name: 'brainchild', type: 'checkbox', defaultValue: false },
      ],
    },

    // Specs
    {
      name: 'aspect_ratio',
      type: 'select',
      required: true,
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'Medium-High', value: 'medium-high' },
        { label: 'High', value: 'high' },
        { label: 'Very High', value: 'very-high' },
      ],
    },
    {
      name: 'strut_count',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'bar_type',
      type: 'select',
      required: true,
      options: [
        { label: 'High-Y', value: 'high-y' },
        { label: 'Low-V', value: 'low-v' },
        { label: 'Both', value: 'both' },
      ],
    },
    {
      name: 'turning_speed',
      type: 'select',
      required: true,
      options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Medium-Fast', value: 'medium-fast' },
        { label: 'Fast', value: 'fast' },
        { label: 'Very Fast', value: 'very-fast' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'low_end_power', type: 'number', required: true, min: 0, max: 10 },
        { name: 'depower_range', type: 'number', required: true, min: 0, max: 10 },
      ],
    },
    {
      name: 'relaunch',
      type: 'select',
      required: true,
      options: [
        { label: 'Easy', value: 'easy' },
        { label: 'Medium', value: 'medium' },
        { label: 'Hard', value: 'hard' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'wind_range_low', type: 'number', required: true },
        { name: 'wind_range_high', type: 'number', required: true },
      ],
    },
    {
      name: 'sizes',
      type: 'json',
      admin: { description: 'Array of numbers, e.g. [7, 9, 10, 12, 14]' },
    },
    {
      type: 'row',
      fields: [
        { name: 'price_new', type: 'number', required: true },
        { name: 'price_new_aluula', type: 'number' },
      ],
    },

    // Content
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'best_for',
      type: 'text',
      required: true,
    },

    // Reviews (JSON — complex discriminated union managed by pipeline scripts)
    {
      name: 'reviews',
      type: 'json',
      admin: {
        description: 'Array of review entries (youtube or aggregate_placeholder). Managed by pipeline scripts.',
      },
    },

    // Structured review
    {
      name: 'structured_review',
      type: 'group',
      admin: { description: 'AI-generated structured review from YouTube transcripts' },
      fields: [
        { name: 'rating', type: 'number', min: 0, max: 5 },
        { name: 'summary', type: 'textarea' },
        { name: 'pros', type: 'json', admin: { description: 'Array of strings' } },
        { name: 'cons', type: 'json', admin: { description: 'Array of strings' } },
        { name: 'best_for', type: 'text' },
        { name: 'not_for', type: 'text' },
        { name: 'rec_blurb', type: 'text' },
        { name: 'sources', type: 'json', admin: { description: 'Array of source names' } },
      ],
    },

    // Buy links
    {
      name: 'buy_links',
      type: 'group',
      fields: [
        {
          name: 'new',
          type: 'array',
          fields: [
            { name: 'retailer', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
            { name: 'price', type: 'number', required: true },
          ],
        },
        {
          name: 'used',
          type: 'array',
          fields: [
            { name: 'source', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
  ],
}
