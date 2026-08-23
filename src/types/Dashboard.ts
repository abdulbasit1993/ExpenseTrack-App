import { Category } from '../store/categoriesSlice';

export type DashboardSummary = {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget: number;
  monthlySpent: number;
};

export type RecentTransaction = {
  id: string;
  title: string;
  amount: number;
  date: string;
  category?: Pick<Category, 'name' | 'icon' | 'color'>;
};

export type DashboardData = {
  summary: DashboardSummary;
  month: { label: string };
  recentTransactions: RecentTransaction[];
};

export type DashboardResponse = {
  success: boolean;
  data?: DashboardData;
};
