'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Kite, SkillLevel } from '@/lib/types';
import {
  FlightFeel,
  getAdvisorMatches,
  KiteConstruction,
  RidingGoal,
  WindProfile,
} from '@/lib/matcher';

type Answers = {
  goal: RidingGoal;
  level: SkillLevel;
  feel: FlightFeel;
  wind: WindProfile;
  budget: number;
  construction: KiteConstruction;
};

const defaults: Answers = {
  goal: 'freeride',
  level: 'intermediate',
  feel: 'balanced',
  wind: 'mixed',
  budget: 5000,
  construction: 'all',
};

const questions = [
  {
    eyebrow: 'Your session',
    title: 'What do you want to do most?',
    hint: 'Choose the thing you want this kite to make better.',
    field: 'goal' as const,
    options: [
      ['freeride', 'Freeride', 'Comfort, range, and easy progression'],
      ['big-air', 'Big air', 'Boosting, hangtime, and confident loops'],
      ['wave', 'Waves', 'Drift, control, and quick response'],
      ['freestyle', 'Freestyle', 'Pop, slack, and direct handling'],
      ['foil', 'Foiling', 'Light feel and efficient flying'],
    ],
  },
  {
    eyebrow: 'Your experience',
    title: 'Where are you in your riding?',
    hint: 'This is about what feels comfortable now, not where you want to be next year.',
    field: 'level' as const,
    options: [
      ['beginner', 'Beginner', 'Building confidence and staying upwind'],
      ['intermediate', 'Intermediate', 'Independent and expanding your riding'],
      ['advanced', 'Advanced', 'Comfortable with demanding equipment'],
    ],
  },
  {
    eyebrow: 'Flight character',
    title: 'How should the kite feel?',
    hint: 'There is no universally best answer. Pick the character you enjoy.',
    field: 'feel' as const,
    options: [
      ['forgiving', 'Calm & forgiving', 'Easy relaunch, control, fewer surprises'],
      ['balanced', 'Balanced', 'A useful mix of comfort and response'],
      ['performance', 'Fast & performance', 'Quick steering and a more demanding feel'],
    ],
  },
  {
    eyebrow: 'Home conditions',
    title: 'What wind do you ride most?',
    hint: 'We will favor low-end power, usable range, or top-end control.',
    field: 'wind' as const,
    options: [
      ['light', 'Mostly light', 'You are often trying to make marginal wind work'],
      ['mixed', 'A bit of everything', 'Your spot changes and range matters most'],
      ['strong', 'Mostly strong', 'Control and a dependable top end matter'],
    ],
  },
];

const budgetOptions = [1500, 2000, 2500, 5000];

export default function AdvisorMatcher({ kites }: { kites: Kite[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(defaults);
  const router = useRouter();

  const preview = useMemo(() => getAdvisorMatches(kites, {
    version: 2,
    ...answers,
    budget: answers.budget < 5000 ? answers.budget : undefined,
  }).slice(0, 3), [answers, kites]);

  const submit = () => {
    const params = new URLSearchParams({
      advisor: '1',
      goal: answers.goal,
      level: answers.level,
      feel: answers.feel,
      wind: answers.wind,
      budget: String(answers.budget),
      construction: answers.construction,
    });
    router.push(`/results?${params.toString()}`);
  };

  const currentQuestion = questions[step];
  const isFinalStep = step === questions.length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1420]/95 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-ocean transition-all duration-500"
          style={{ width: `${((step + 1) / (questions.length + 1)) * 100}%` }}
        />
      </div>

      <div className="p-6 sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
            Kite fitting · {step + 1}/{questions.length + 1}
          </span>
          <Link href="/?legacy=1" className="text-[11px] text-gray-400 hover:text-ocean transition-colors">
            Use classic sliders
          </Link>
        </div>

        {!isFinalStep && currentQuestion ? (
          <div key={currentQuestion.field} className="animate-[fadeIn_.25s_ease-out]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ocean">{currentQuestion.eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-black italic uppercase leading-none text-white sm:text-4xl">
              {currentQuestion.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">{currentQuestion.hint}</p>

            <div className="mt-6 grid gap-2">
              {currentQuestion.options.map(([value, label, description]) => {
                const selected = answers[currentQuestion.field] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers(previous => ({ ...previous, [currentQuestion.field]: value }))}
                    className={`group flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? 'border-ocean/60 bg-ocean/10 shadow-[inset_3px_0_0_#00E5FF]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>
                      <span className={`block text-sm font-bold ${selected ? 'text-white' : 'text-gray-700'}`}>{label}</span>
                      <span className="mt-0.5 block text-xs text-gray-400">{description}</span>
                    </span>
                    <span className={`h-2.5 w-2.5 rounded-full border ${selected ? 'border-ocean bg-ocean shadow-[0_0_10px_#00E5FF]' : 'border-gray-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ocean">The practical stuff</p>
            <h2 className="mt-2 font-display text-3xl font-black italic uppercase leading-none text-white sm:text-4xl">
              Set your guardrails.
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">These are hard limits. A kite outside them will not appear in your results.</p>

            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Maximum new price</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {budgetOptions.map(value => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={answers.budget === value}
                    onClick={() => setAnswers(previous => ({ ...previous, budget: value }))}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${answers.budget === value ? 'border-ocean bg-ocean text-[#08101A]' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                  >
                    {value === 5000 ? 'No limit' : `$${value.toLocaleString()}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">Construction</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['all', 'dacron', 'aluula', 'brainchild'] as const).map(value => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={answers.construction === value}
                    onClick={() => setAnswers(previous => ({ ...previous, construction: value }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${answers.construction === value ? 'border-ocean bg-ocean/10 text-ocean' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                  >
                    {value === 'all' ? 'Any construction' : value}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Current shortlist · {preview.length} shown</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {preview.map(match => (
                  <div key={match.slug} className="rounded-lg bg-white/[0.03] p-3 text-center">
                    <p className="font-display text-xl font-black italic text-ocean">{match.score}%</p>
                    <p className="truncate text-[10px] font-bold text-gray-700">{match.brand}</p>
                    <p className="truncate text-[10px] text-gray-400">{match.model}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(value => value - 1)} className="px-3 py-3 text-xs font-semibold text-gray-500 hover:text-white">
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={isFinalStep ? submit : () => setStep(value => value + 1)}
            className="flex-1 rounded-xl bg-ocean px-6 py-3 font-display text-xl font-black italic uppercase tracking-wide text-[#08101A] shadow-[0_0_24px_rgba(0,229,255,0.3)] transition-all hover:bg-ocean-light hover:shadow-[0_0_32px_rgba(0,229,255,0.45)]"
          >
            {isFinalStep ? `See ${preview.length ? 'my matches' : 'results'} →` : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
