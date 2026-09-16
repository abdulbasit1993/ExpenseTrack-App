export type AnalyticsCategory = {
  categoryId: string;
  name: string;
  total: number;
  transactionCount: number;
  color: string;
  icon: string;
};

export type MonthlyTrendItem = {
  key: string;
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
};

export type AnalyticsData = {
  range: {
    fromDate: string;
    toDate: string;
  };
  expensesByCategory: AnalyticsCategory[];
  monthlyTrend: MonthlyTrendItem[];
  incomeVsExpense: {
    income: number;
    expense: number;
    net: number;
  };
};

export type AnalyticsResponse = {
  success: boolean;
  data: AnalyticsData;
};
