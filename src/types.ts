export interface Project {
  id: number;
  name: string;
  date: string;
  description?: string;
}

export type Expense = {
  id: number;
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