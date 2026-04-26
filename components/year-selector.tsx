'use client';

import { cn } from '@/lib/utils';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
  years?: number[];
}

export function YearSelector({ selectedYear, onYearChange, years = [2026, 2027, 2028, 2029, 2030] }: YearSelectorProps) {
  return (
    <div className="inline-flex items-center bg-stone-100 rounded-lg p-1">
      {years.map((year, index) => (
        <button
          key={year}
          onClick={() => onYearChange(year)}
          className={cn(
            'px-4 py-1.5 text-sm rounded-md transition-all',
            selectedYear === year
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-900'
          )}
        >
          Y{index + 1} <span className="text-stone-400 ml-1">{year}</span>
        </button>
      ))}
    </div>
  );
}
