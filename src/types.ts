export interface Settings {
  id: number;
  language: string;
  company_name: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  address: string | null;
  email: string | null;
  phone_number: string | null;
}

export interface Project {
  id: number;
  name: string;
  date: string;
  client: string | undefined;
  budget: number | null;
  description?: string;
  total_spent: number;
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

export type ExpenseCategory = {
  id: number;
  fr_name: string;
  ar_name: string;
}