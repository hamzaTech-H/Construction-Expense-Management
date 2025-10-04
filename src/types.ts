export interface Project {
  id: number;
  name: string;
  date: string;
  description?: string;
}

export type Expense = {
  id: number;
  project_id: number;
  description: string;
  date: string;
  amount_total: number;
  amount_paid: number;
  amount_remaining: number;
  status: string;
  created_at: string;
};

export type ProjectStats = {
  total: number;
  paid: number;
  remaining: number;
};