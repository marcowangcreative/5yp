'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getMonthName, formatCurrency } from '@/lib/utils';
import { Check, Edit2, X } from 'lucide-react';
import type { IncomeStream, IncomeActual } from '@/lib/types';

interface IncomeEntryFormProps {
  streams: IncomeStream[];
  actuals: IncomeActual[];
  year: number;
  userEmail: string;
}

export function IncomeEntryForm({ streams, actuals, year, userEmail }: IncomeEntryFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editingCell, setEditingCell] = useState<{ streamId: string; month: number } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [saving, setSaving] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const getActual = (streamId: string, month: number): number => {
    const found = actuals.find(a => a.stream_id === streamId && a.month === month);
    return found?.amount || 0;
  };

  const handleSave = async (streamId: string, month: number) => {
    setSaving(true);
    const amount = parseFloat(tempValue) || 0;

    const existing = actuals.find(a => a.stream_id === streamId && a.month === month);

    if (existing) {
      await supabase
        .from('income_actuals')
        .update({ amount, entered_by: userEmail })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('income_actuals')
        .insert({
          stream_id: streamId,
          year,
          month,
          amount,
          entered_by: userEmail,
        });
    }

    setEditingCell(null);
    setTempValue('');
    setSaving(false);
    router.refresh();
  };

  const startEdit = (streamId: string, month: number) => {
    const current = getActual(streamId, month);
    setEditingCell({ streamId, month });
    setTempValue(current > 0 ? current.toString() : '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTempValue('');
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      <div className="p-4 border-b border-stone-200">
        <h3 className="text-sm font-medium text-stone-700">Monthly actuals — {year}</h3>
        <p className="text-xs text-stone-500 mt-1">Click any cell to edit. Saves automatically.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left p-3 font-medium text-stone-600 sticky left-0 bg-stone-50 min-w-[180px]">Stream</th>
              {months.map(m => (
                <th key={m} className="text-right p-3 font-normal text-stone-500 min-w-[80px]">
                  {getMonthName(m)}
                </th>
              ))}
              <th className="text-right p-3 font-medium text-stone-700 min-w-[100px] bg-stone-100">YTD</th>
            </tr>
          </thead>
          <tbody>
            {streams.map(stream => {
              const ytd = months.reduce((sum, m) => sum + getActual(stream.id, m), 0);
              return (
                <tr key={stream.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="p-3 sticky left-0 bg-white text-stone-900 font-medium">
                    {stream.name}
                  </td>
                  {months.map(month => {
                    const value = getActual(stream.id, month);
                    const isEditing = editingCell?.streamId === stream.id && editingCell?.month === month;

                    return (
                      <td key={month} className="p-1 text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="w-20 px-2 py-1 text-right border border-stone-400 rounded text-sm focus:outline-none focus:border-stone-700"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave(stream.id, month);
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <button
                              onClick={() => handleSave(stream.id, month)}
                              disabled={saving}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <Check size={14} />
                            </button>
                            <button onClick={cancelEdit} className="text-stone-400 hover:text-stone-700">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(stream.id, month)}
                            className={`w-full px-2 py-1 rounded hover:bg-stone-100 transition text-right ${value > 0 ? 'text-stone-900' : 'text-stone-300'}`}
                          >
                            {value > 0 ? formatCurrency(value, { compact: true }) : '—'}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right font-medium text-stone-900 bg-stone-50">
                    {ytd > 0 ? formatCurrency(ytd, { compact: true }) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
