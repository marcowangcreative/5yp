import { createClient } from '@/lib/supabase/server';
import { IncomeChart } from '@/components/income-chart';
import { buildMonthlyData } from '@/lib/chart-data';
import { IncomeEntryForm } from '@/components/income-entry-form';
import { MilestoneCard } from '@/components/milestone-card';
import { ProgressRing } from '@/components/progress-ring';
import { formatCurrency, getCurrentYear, calculateProgress } from '@/lib/utils';
import type { Business, IncomeStream, IncomeTarget, IncomeActual, Milestone, MilestoneSubtask, MilestoneWithSubtasks } from '@/lib/types';

interface BusinessDashboardProps {
  businessId: 'marco' | 'flowe';
  selectedYear?: number;
}

export async function BusinessDashboard({ businessId, selectedYear }: BusinessDashboardProps) {
  const supabase = createClient();
  const year = selectedYear || getCurrentYear();

  const [
    { data: business },
    { data: streams },
    { data: targets },
    { data: actuals },
    { data: milestones },
    { data: subtasks },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('income_streams').select('*').eq('business_id', businessId).eq('active', true).order('display_order'),
    supabase.from('income_targets').select('*').eq('year', year),
    supabase.from('income_actuals').select('*').eq('year', year),
    supabase.from('milestones').select('*').eq('business_id', businessId).order('display_order'),
    supabase.from('milestone_subtasks').select('*').order('display_order'),
    supabase.auth.getUser(),
  ]);

  if (!business || !streams) return <div className="p-8 text-stone-500">Loading...</div>;

  // Filter targets and actuals to this business
  const businessStreamIds = new Set(streams.map(s => s.id));
  const businessTargets = (targets || []).filter(t => businessStreamIds.has(t.stream_id));
  const businessActuals = (actuals || []).filter(a => businessStreamIds.has(a.stream_id));

  // Aggregate totals
  const yearTarget = businessTargets.reduce((sum, t) => sum + Number(t.target_amount), 0);
  const yearActual = businessActuals.reduce((sum, a) => sum + Number(a.amount), 0);
  const progress = calculateProgress(yearActual, yearTarget);

  // Build chart data — aggregate across all streams by month
  const chartData = buildMonthlyData(
    yearTarget,
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      amount: businessActuals.filter(a => a.month === i + 1).reduce((sum, a) => sum + Number(a.amount), 0),
    }))
  );

  // Attach subtasks to milestones
  const milestonesWithSubtasks: MilestoneWithSubtasks[] = (milestones || []).map(m => ({
    ...m,
    subtasks: (subtasks || []).filter(s => s.milestone_id === m.id),
  }));

  // Per-stream breakdown
  const streamBreakdown = streams.map(stream => {
    const target = businessTargets.find(t => t.stream_id === stream.id);
    const streamActuals = businessActuals.filter(a => a.stream_id === stream.id);
    const ytd = streamActuals.reduce((sum, a) => sum + Number(a.amount), 0);
    return {
      stream,
      target: target ? Number(target.target_amount) : 0,
      ytd,
      progress: calculateProgress(ytd, target ? Number(target.target_amount) : 0),
    };
  });

  return (
    <div className="space-y-8">
      {/* Header with totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">Year Target</div>
          <div className="text-3xl font-light tracking-tight">{formatCurrency(yearTarget)}</div>
          <div className="text-xs text-stone-500 mt-1">{year}</div>
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
            <div className="text-xs text-stone-500">Toward year target</div>
          </div>
          <ProgressRing value={progress} size={70} />
        </div>
      </div>

      {/* Income chart */}
      <IncomeChart data={chartData} title={`${business.name} — Monthly performance ${year}`} />

      {/* Stream breakdown */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200">
          <h3 className="text-sm font-medium text-stone-700">Income streams</h3>
        </div>
        <div className="divide-y divide-stone-100">
          {streamBreakdown.map(({ stream, target, ytd, progress }) => (
            <div key={stream.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-stone-900">{stream.name}</div>
                {stream.description && <div className="text-xs text-stone-500 mt-0.5">{stream.description}</div>}
              </div>
              <div className="text-right ml-6">
                <div className="text-sm">
                  <span className="font-medium">{formatCurrency(ytd, { compact: true })}</span>
                  <span className="text-stone-400 mx-1">/</span>
                  <span className="text-stone-500">{formatCurrency(target, { compact: true })}</span>
                </div>
                <div className="mt-1.5 w-32 h-1 bg-stone-100 rounded-full overflow-hidden ml-auto">
                  <div className="h-full bg-stone-700 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Income entry form */}
      <IncomeEntryForm
        streams={streams}
        actuals={businessActuals}
        year={year}
        userEmail={user?.email || ''}
      />

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-medium text-stone-700 mb-4">Milestones</h3>
        <div className="space-y-3">
          {milestonesWithSubtasks.map(m => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
