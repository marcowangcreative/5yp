import { createClient } from '@/lib/supabase/server';
import { MilestoneCard } from '@/components/milestone-card';
import type { MilestoneWithSubtasks } from '@/lib/types';

export default async function MilestonesPage() {
  const supabase = createClient();

  const [
    { data: businesses },
    { data: milestones },
    { data: subtasks },
  ] = await Promise.all([
    supabase.from('businesses').select('*').order('display_order'),
    supabase.from('milestones').select('*').order('display_order'),
    supabase.from('milestone_subtasks').select('*').order('display_order'),
  ]);

  const milestonesWithSubtasks: MilestoneWithSubtasks[] = (milestones || []).map(m => ({
    ...m,
    subtasks: (subtasks || []).filter(s => s.milestone_id === m.id),
  }));

  // Stats
  const total = milestonesWithSubtasks.length;
  const done = milestonesWithSubtasks.filter(m => m.status === 'done').length;
  const inProgress = milestonesWithSubtasks.filter(m => m.status === 'in_progress').length;
  const blocked = milestonesWithSubtasks.filter(m => m.status === 'blocked').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight">Milestones</h1>
        <p className="text-sm text-stone-500 mt-1">All milestones across both businesses</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <div className="text-xs uppercase tracking-wider text-stone-500">Total</div>
          <div className="text-2xl font-light tracking-tight mt-1">{total}</div>
        </div>
        <div className="bg-emerald-50/50 rounded-lg border border-emerald-200 p-4">
          <div className="text-xs uppercase tracking-wider text-emerald-700">Done</div>
          <div className="text-2xl font-light tracking-tight mt-1 text-emerald-900">{done}</div>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <div className="text-xs uppercase tracking-wider text-amber-700">In Progress</div>
          <div className="text-2xl font-light tracking-tight mt-1 text-amber-900">{inProgress}</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-xs uppercase tracking-wider text-red-700">Blocked</div>
          <div className="text-2xl font-light tracking-tight mt-1 text-red-900">{blocked}</div>
        </div>
      </div>

      {/* Two-column milestone view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(businesses || []).map(business => {
          const businessMilestones = milestonesWithSubtasks.filter(m => m.business_id === business.id);
          const businessDone = businessMilestones.filter(m => m.status === 'done').length;
          const progress = businessMilestones.length > 0 ? Math.round((businessDone / businessMilestones.length) * 100) : 0;

          return (
            <div key={business.id}>
              <div className="mb-4 pb-3 border-b border-stone-200">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-xl font-light tracking-tight">{business.name}</h2>
                  <span className="text-sm text-stone-500 font-mono">{progress}%</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">{business.subtitle}</p>
                <div className="mt-3 h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-700 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="space-y-3">
                {businessMilestones.map(m => (
                  <MilestoneCard key={m.id} milestone={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
