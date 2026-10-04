export type AIInsight = {
  id?: string;
  text: string;
};

export type AISummaryData = {
  income: number;
  expense: number;
  net: number;
  monthlyBudget: number;
  budgetRemaining: number;
  budgetStatus: string;
  highestExpenseCategory: string;
  highestExpenseAmount: number;
  transactionCount: number;
  currency: string;
};

export type AIMonthlySummary = {
  month: string;
  summary: string;
  data: AISummaryData;
};

export type AIInsightResponse = {
  success: boolean;
  data: {
    period: string;
    insights: string[];
  };
};

export type AISummaryResponse = {
  success: boolean;
  data: AIMonthlySummary;
};
