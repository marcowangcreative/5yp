import { getMonthName } from './utils';

export interface DataPoint {
  month: number;
  monthName: string;
  target: number;
  actual: number;
}

export function buildMonthlyData(
  yearTarget: number,
  actuals: { month: number; amount: number }[]
): DataPoint[] {
  const monthlyTarget = yearTarget / 12;
  const actualsMap = new Map(actuals.map((a) => [a.month, a.amount]));

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      month,
      monthName: getMonthName(month),
      target: Math.round(monthlyTarget),
      actual: actualsMap.get(month) || 0,
    };
  });
}
