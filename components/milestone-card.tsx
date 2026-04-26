'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Check, Circle, Clock, ChevronDown, ChevronRight, Plus, X, Edit2, AlertCircle } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import type { MilestoneWithSubtasks, Status } from '@/lib/types';

const STATUS_CONFIG: Record<Status, { label: string; icon: typeof Circle; color: string; bg: string; border: string }> = {
  not_started: { label: 'Not Started', icon: Circle, color: 'text-stone-400', bg: 'bg-white', border: 'border-stone-200' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  done: { label: 'Done', icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-200' },
  blocked: { label: 'Blocked', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

const NEXT_STATUS: Record<Status, Status> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
  blocked: 'in_progress',
};

interface MilestoneCardProps {
  milestone: MilestoneWithSubtasks;
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNote, setTempNote] = useState(milestone.notes || '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  const config = STATUS_CONFIG[milestone.status];
  const StatusIcon = config.icon;
  const subtasksDone = milestone.subtasks.filter(s => s.done).length;
  const subtasksTotal = milestone.subtasks.length;
  const subtaskProgress = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

  const cycleStatus = async () => {
    const next = NEXT_STATUS[milestone.status];
    await supabase.from('milestones').update({ status: next }).eq('id', milestone.id);
    router.refresh();
  };

  const toggleSubtask = async (subtaskId: string, currentDone: boolean) => {
    await supabase.from('milestone_subtasks').update({ done: !currentDone }).eq('id', subtaskId);

    // Auto-update parent status based on subtasks
    const updatedDone = !currentDone ? subtasksDone + 1 : subtasksDone - 1;
    if (subtasksTotal > 0) {
      let newStatus: Status = milestone.status;
      if (updatedDone === subtasksTotal) newStatus = 'done';
      else if (updatedDone > 0 && milestone.status === 'not_started') newStatus = 'in_progress';
      if (newStatus !== milestone.status) {
        await supabase.from('milestones').update({ status: newStatus }).eq('id', milestone.id);
      }
    }
    router.refresh();
  };

  const saveNotes = async () => {
    await supabase.from('milestones').update({ notes: tempNote }).eq('id', milestone.id);
    setEditingNotes(false);
    router.refresh();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const maxOrder = Math.max(0, ...milestone.subtasks.map(s => s.display_order));
    await supabase.from('milestone_subtasks').insert({
      milestone_id: milestone.id,
      title: newSubtask,
      display_order: maxOrder + 1,
    });
    setNewSubtask('');
    setShowAddSubtask(false);
    router.refresh();
  };

  const deleteSubtask = async (id: string) => {
    await supabase.from('milestone_subtasks').delete().eq('id', id);
    router.refresh();
  };

  return (
    <div className={cn('rounded-lg border transition-all', config.bg, config.border)}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={cycleStatus}
            className={cn('mt-0.5 hover:opacity-70 transition', config.color)}
            title={`Status: ${config.label} — click to advance`}
          >
            <StatusIcon size={20} strokeWidth={2} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={cn('font-medium leading-tight', milestone.status === 'done' && 'line-through text-stone-500')}>
                  {milestone.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
                  {milestone.phase && <span className="font-mono">{milestone.phase}</span>}
                  {milestone.due_date && (
                    <>
                      <span>·</span>
                      <span>{formatDate(milestone.due_date)}</span>
                    </>
                  )}
                  {subtasksTotal > 0 && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{subtasksDone}/{subtasksTotal}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-stone-400 hover:text-stone-700 transition p-1 -m-1"
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {expanded && (
              <div className="mt-4 space-y-4">
                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Notes</span>
                    {!editingNotes && (
                      <button
                        onClick={() => { setEditingNotes(true); setTempNote(milestone.notes || ''); }}
                        className="text-stone-400 hover:text-stone-700 transition"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        className="w-full text-sm p-2 border border-stone-300 rounded bg-white focus:outline-none focus:border-stone-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveNotes}
                          className="text-xs px-3 py-1 bg-stone-800 text-white rounded hover:bg-stone-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotes(false)}
                          className="text-xs px-3 py-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-700 italic">
                      {milestone.notes || <span className="text-stone-400">No notes yet.</span>}
                    </p>
                  )}
                </div>

                {/* Subtasks */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Sub-tasks</span>
                    <button
                      onClick={() => setShowAddSubtask(!showAddSubtask)}
                      className="text-stone-400 hover:text-stone-700 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {milestone.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-start gap-2 group">
                        <button
                          onClick={() => toggleSubtask(subtask.id, subtask.done)}
                          className={cn('mt-0.5 transition', subtask.done ? 'text-emerald-600' : 'text-stone-300 hover:text-stone-600')}
                        >
                          {subtask.done ? <Check size={14} /> : <Circle size={14} />}
                        </button>
                        <span className={cn('flex-1 text-sm', subtask.done ? 'line-through text-stone-400' : 'text-stone-700')}>
                          {subtask.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(subtask.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {showAddSubtask && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={newSubtask}
                          onChange={(e) => setNewSubtask(e.target.value)}
                          placeholder="New sub-task..."
                          className="flex-1 text-sm px-2 py-1 border border-stone-300 rounded focus:outline-none focus:border-stone-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addSubtask();
                            if (e.key === 'Escape') { setShowAddSubtask(false); setNewSubtask(''); }
                          }}
                        />
                        <button onClick={addSubtask} className="text-xs px-3 py-1 bg-stone-800 text-white rounded">Add</button>
                      </div>
                    )}
                    {milestone.subtasks.length === 0 && !showAddSubtask && (
                      <p className="text-xs text-stone-400 italic">No sub-tasks. Click + to add.</p>
                    )}
                  </div>
                  {subtasksTotal > 0 && (
                    <div className="mt-2 h-0.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${subtaskProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
