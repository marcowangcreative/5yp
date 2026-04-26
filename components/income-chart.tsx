'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { DataPoint } from '@/lib/chart-data';

interface IncomeChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

export function IncomeChart({ data, title, height = 280 }: IncomeChartProps) {
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-6">
      {title && <h3 className="text-sm font-medium text-stone-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="monthName"
            stroke="#78716c"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#78716c"
            fontSize={11}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value, { compact: true })}
          />
          <Tooltip
            contentStyle={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 8 }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="target" fill="#d6d3d1" name="Target" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" fill="#1c1917" name="Actual" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

