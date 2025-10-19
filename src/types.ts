export interface Project {
  id: number;
  name: string;
  date: string;
  client: string | undefined;
  budget: number | undefined;
  description?: string;
}

export type Expense = {
  id: number;
  category_id: number;
  description: string;
  date: string;
  amount_total: number;
  amount_paid: number;
  amount_remaining: number;
  status: string;
};

export type ProjectStats = {
  total: number;
  paid: number;
  remaining: number;
};

export type Payment = {
  id: number;
  amount: number;
  date: string;
  note: string;
}