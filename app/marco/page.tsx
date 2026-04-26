import { BusinessDashboard } from '@/components/business-dashboard';
import { YearSelectorWrapper } from '@/components/year-selector-wrapper';
import { getCurrentYear } from '@/lib/utils';

export default function MarcoPage({ searchParams }: { searchParams: { year?: string } }) {
  const year = searchParams.year ? parseInt(searchParams.year) : getCurrentYear();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Marco Wang Co.</h1>
          <p className="text-sm text-stone-500 mt-1">Photography flagship · Film flagship · Studio Associates · Photobox</p>
        </div>
        <YearSelectorWrapper initialYear={year} />
      </div>

      <BusinessDashboard businessId="marco" selectedYear={year} />
    </div>
  );
}
