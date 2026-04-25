'use client';

import Link from 'next/link';
import { useCompare } from './CompareContext';

interface CompareNavLinkProps {
  className?: string;
  onClick?: () => void;
}

export default function CompareNavLink({ className = '', onClick }: CompareNavLinkProps) {
  const { compareKites } = useCompare();
  const count = compareKites.length;

  return (
    <Link
      href="/compare"
      className={`relative inline-flex items-center gap-2 ${className}`}
      onClick={onClick}
    >
      <span>Compare</span>
      {count > 0 && (
        <span
          key={count}
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-ocean text-[#080D16] animate-[badgePop_220ms_ease-out]"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
