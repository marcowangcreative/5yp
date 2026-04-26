import { createClient } from '@/lib/supabase/server';
import { IncomeChart } from '@/components/income-chart';
import { buildMonthlyData } from '@/lib/chart-data';
import { ProgressRing } from '@/components/progress-ring';
import { YearSelectorWrapper } from '@/components/year-selector-wrapper';
import { formatCurrency, getCurrentYear, calculateProgress } from '@/lib/utils';
import Link from 'next/link';

export default async function CombinedDashboard({ searchParams }: { searchParams: { year?: string } }) {
  const supabase = createClient();
  const year = searchParams.year ? parseInt(searchParams.year) : getCurrentYear();

  const [
    { data: businesses },
    { data: streams },
    { data: targets },
    { data: actuals },
    { data: milestones },
  ] = await Promise.all([
    supabase.from('businesses').select('*').order('display_order'),
    supabase.from('income_streams').select('*').eq('active', true),
    supabase.from('income_targets').select('*').eq('year', year),
    supabase.from('income_actuals').select('*').eq('year', year),
    supabase.from('milestones').select('*'),
  ]);

  // Combined household totals
  const yearTarget = (targets || []).reduce((sum, t) => sum + Number(t.target_amount), 0);
  const yearActual = (actuals || []).reduce((sum, a) => sum + Number(a.amount), 0);
  const progress = calculateProgress(yearActual, yearTarget);

  // Per-business breakdown
  const businessBreakdown = (businesses || []).map(business => {
    const businessStreams = (streams || []).filter(s => s.business_id === business.id);
    const streamIds = new Set(businessStreams.map(s => s.id));
    const businessTargetSum = (targets || [])
      .filter(t => streamIds.has(t.stream_id))
      .reduce((sum, t) => sum + Number(t.target_amount), 0);
    const businessActualSum = (actuals || [])
      .filter(a => streamIds.has(a.stream_id))
      .reduce((sum, a) => sum + Number(a.amount), 0);
    const businessMilestones = (milestones || []).filter(m => m.business_id === business.id);
    const milestonesDone = businessMilestones.filter(m => m.status === 'done').length;

    return {
      business,
      target: businessTargetSum,
      actual: businessActualSum,
      progress: calculateProgress(businessActualSum, businessTargetSum),
      milestonesDone,
      milestonesTotal: businessMilestones.length,
    };
  });

  // Combined chart data
  const chartData = buildMonthlyData(
    yearTarget,
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: (actuals || []).filter(a => a.month === i + 1).reduce((sum, a) => sum + Number(a.amount), 0),
    }))
  );

  // 5-year projection
  const allYears = [2026, 2027, 2028, 2029, 2030];
  const fiveYearData = await Promise.all(
    allYears.map(async (y) => {
      const { data: yt } = await supabase.from('income_targets').select('target_amount').eq('year', y);
      const total = (yt || []).reduce((sum, t) => sum + Number(t.target_amount), 0);
      return { year: y, target: total };
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Combined household</h1>
          <p className="text-sm text-stone-500 mt-1">Marco + Flowe · {year}</p>
        </div>
        <YearSelectorWrapper initialYear={year} />
      </div>

      {/* Top-level totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">Household Target</div>
          <div className="text-3xl font-light tracking-tight">{formatCurrency(yearTarget)}</div>
          <div className="text-xs text-stone-500 mt-1">{year} combined</div>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">YTD Actual</div>
          <div className="text-3xl font-light tracking-tight">{formatCurrency(yearActual)}</div>
          <div className="text-xs text-stone-500 mt-1">
            {yearActual >= yearTarget ? 'Above target' : `${formatCurrency(yearTarget - yearActual)} to go`}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-6 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">Progress</div>
            <div className="text-xs text-stone-500">Toward {year} target</div>
          </div>
          <ProgressRing value={progress} size={70} />
        </div>
      </div>

      {/* Combined chart */}
      <div className="mb-8">
        <IncomeChart data={chartData} title={`Combined household — ${year}`} height={320} />
      </div>

      {/* Business breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {businessBreakdown.map(({ business, target, actual, progress, milestonesDone, milestonesTotal }) => (
          <Link
            key={business.id}
            href={`/${business.id}?year=${year}`}
            className="bg-white rounded-lg border border-stone-200 p-6 hover:border-stone-400 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium tracking-tight group-hover:text-stone-700 transition">{business.name}</h3>
                <p className="text-xs text-stone-500 mt-1">{business.subtitle}</p>
              </div>
              <ProgressRing value={progress} size={56} strokeWidth={5} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">YTD</span>
                <span className="font-medium">{formatCurrency(actual)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Target</span>
                <span>{formatCurrency(target)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
                <span className="text-stone-500">Milestones</span>
                <span className="font-mono">{milestonesDone}/{milestonesTotal}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 5-year horizon */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="text-sm font-medium text-stone-700 mb-4">5-year horizon</h3>
        <div className="grid grid-cols-5 gap-2">
          {fiveYearData.map(({ year: y, target }, idx) => (
            <Link
              key={y}
              href={`/?year=${y}`}
              className={`p-4 rounded-lg border transition hover:border-stone-400 ${
                y === year ? 'border-stone-900 bg-stone-50' : 'border-stone-200'
              }`}
            >
              <div className="text-xs uppercase tracking-wider text-stone-500">Y{idx + 1}</div>
              <div className="text-xs text-stone-400 mt-0.5">{y}</div>
              <div className="text-lg font-light tracking-tight mt-2">{formatCurrency(target, { compact: true })}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
