import { Category } from '../store/categoriesSlice';

export type TransactionType = 'income' | 'expense';
export type Transaction = {
  _id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  title: string;
  description: string;
  amount: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionsListResponse = {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type TransactionRowProps = {
  transaction: Transaction;
  category?: Category;
  onPress: () => void;
};

export type EditTransactionModalProps = {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  categoriesStatus: string;
  onClose: () => void;

  handleSave: (data: {
    title: string;
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    categoryId: string;
  }) => Promise<void>;

  handleDelete: () => void;
};

export type UpdateTransactionPayload = {
  title: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: string;
};
