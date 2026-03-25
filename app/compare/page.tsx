'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import kiteData from '@/data/kites.json';
import { Kite } from '@/lib/types';
import SpectrumBar from '@/components/SpectrumBar';

const allKites = kiteData as unknown as Kite[];

function CompareContent() {
  const searchParams = useSearchParams();
  const slugs = (searchParams.get('kites') ?? '').split(',').filter(Boolean);
  const kites = slugs.map(s => allKites.find(k => k.slug === s)).filter(Boolean) as Kite[];

  if (kites.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate mb-4">Compare Kites</h1>
        <p className="text-gray-500 mb-6">Add kites to compare by clicking the &ldquo;Compare&rdquo; button on any kite card.</p>
        <Link href="/kites" className="text-ocean hover:underline">Browse all kites</Link>
      </div>
    );
  }

  type SpecRow = { label: string; values: string[]; highlight: boolean };
  const getVal = (k: Kite, field: string): string => {
    switch (field) {
      case 'brand': return k.brand;
      case 'year': return k.year.toString();
      case 'style_spectrum': return k.style_spectrum.toString();
      case 'shape_spectrum': return k.shape_spectrum.toString();
      case 'aspect_ratio': return k.aspect_ratio.replace('-', ' ');
      case 'strut_count': return k.strut_count === 0 ? 'Strutless' : k.strut_count.toString();
      case 'bar_type': return k.bar_type === 'high-y' ? 'High-Y' : k.bar_type === 'low-v' ? 'Low-V' : 'Both';
      case 'turning_speed': return k.turning_speed;
      case 'low_end_power': return `${k.low_end_power}/10`;
      case 'depower_range': return `${k.depower_range}/10`;
      case 'relaunch': return k.relaunch;
      case 'wind_range': return `${k.wind_range_low}–${k.wind_range_high} kts`;
      case 'sizes': return k.sizes.join(', ') + 'm';
      case 'price': return `$${k.price_new.toLocaleString()}`;
      case 'aluula': return k.aluula ? 'Yes' : 'No';
      case 'brainchild': return k.brainchild ? 'Yes' : 'No';
      case 'review_score': return (k.structured_review?.rating ?? 0).toFixed(1);
      default: return '';
    }
  };

  const fields = [
    'brand', 'year', 'style_spectrum', 'shape_spectrum', 'aspect_ratio',
    'strut_count', 'bar_type', 'turning_speed', 'low_end_power', 'depower_range',
    'relaunch', 'wind_range', 'sizes', 'price', 'aluula', 'brainchild', 'review_score',
  ];
  const labels: Record<string, string> = {
    brand: 'Brand', year: 'Year', style_spectrum: 'Style Spectrum', shape_spectrum: 'Shape Spectrum',
    aspect_ratio: 'Aspect Ratio', strut_count: 'Struts', bar_type: 'Bar Type',
    turning_speed: 'Turning Speed', low_end_power: 'Low-End Power', depower_range: 'Depower Range',
    relaunch: 'Relaunch', wind_range: 'Wind Range', sizes: 'Sizes', price: 'Price (New)',
    aluula: 'Aluula', brainchild: 'Brainchild', review_score: 'Review Score',
  };

  const rows: SpecRow[] = fields.map(f => {
    const values = kites.map(k => getVal(k, f));
    const unique = new Set(values);
    return { label: labels[f], values, highlight: unique.size > 1 };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate mb-6">Compare Kites</h1>

      {/* Kite headers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 w-40 text-sm font-medium text-gray-500">Spec</th>
                {kites.map(k => (
                  <th key={k.id} className="p-4 text-center">
                    <Link href={`/kite/${k.slug}`} className="hover:text-ocean">
                      <p className="font-bold text-slate">{k.model}</p>
                      <p className="text-xs text-gray-500">{k.brand} {k.year}</p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className={`border-b border-gray-50 ${row.highlight ? 'bg-sand/5' : ''}`}>
                  <td className="p-4 text-sm text-gray-500 font-medium">{row.label}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className={`p-4 text-center text-sm capitalize ${row.highlight ? 'font-semibold text-slate' : 'text-gray-700'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Style spectrum visual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8 space-y-4">
        <h2 className="text-lg font-bold text-slate">Style Comparison</h2>
        {kites.map(k => (
          <div key={k.id}>
            <p className="text-sm font-medium text-gray-600 mb-1">{k.brand} {k.model}</p>
            <SpectrumBar label="" value={k.style_spectrum} leftLabel="Foiling" rightLabel="Big Air" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
