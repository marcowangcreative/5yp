import { BusinessDashboard } from '@/components/business-dashboard';
import { YearSelectorWrapper } from '@/components/year-selector-wrapper';
import { getCurrentYear } from '@/lib/utils';

export default function FlowePage({ searchParams }: { searchParams: { year?: string } }) {
  const year = searchParams.year ? parseInt(searchParams.year) : getCurrentYear();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Flowe</h1>
          <p className="text-sm text-stone-500 mt-1">Butterfly wefts · Salon services · Booth rental</p>
        </div>
        <YearSelectorWrapper initialYear={year} />
      </div>

      <BusinessDashboard businessId="flowe" selectedYear={year} />
    </div>
  );
}
