export type Status = 'not_started' | 'in_progress' | 'done' | 'blocked';

export interface AllowedUser {
  email: string;
  display_name: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  subtitle: string | null;
  color_theme: string;
  display_order: number;
}

export interface IncomeStream {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  display_order: number;
  active: boolean;
}

export interface IncomeTarget {
  id: string;
  stream_id: string;
  year: number;
  target_amount: number;
  notes: string | null;
}

export interface IncomeActual {
  id: string;
  stream_id: string;
  year: number;
  month: number;
  amount: number;
  notes: string | null;
  entered_by: string | null;
}

export interface Milestone {
  id: string;
  business_id: string;
  title: string;
  phase: string | null;
  status: Status;
  due_date: string | null;
  notes: string | null;
  display_order: number;
  target_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneSubtask {
  id: string;
  milestone_id: string;
  title: string;
  done: boolean;
  display_order: number;
}

export interface StrategicNote {
  id: string;
  year: number;
  quarter: number;
  business_id: string | null;
  title: string | null;
  content: string;
  authored_by: string | null;
  created_at: string;
}

// Composite types for views
export interface MilestoneWithSubtasks extends Milestone {
  subtasks: MilestoneSubtask[];
}

export interface StreamWithProgress {
  stream: IncomeStream;
  target: number;
  actual_ytd: number;
  monthly_actuals: IncomeActual[];
}
