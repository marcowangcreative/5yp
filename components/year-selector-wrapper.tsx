'use client';

import { useState } from 'react';
import { YearSelector } from './year-selector';
import { useRouter, useSearchParams } from 'next/navigation';

export function YearSelectorWrapper({ initialYear }: { initialYear: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [year, setYear] = useState(initialYear);

  const handleChange = (newYear: number) => {
    setYear(newYear);
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', newYear.toString());
    router.push(`?${params.toString()}`);
  };

  return <YearSelector selectedYear={year} onYearChange={handleChange} />;
}
