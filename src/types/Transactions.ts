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

export type EditTransactionModalProps = {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  categoriesStatus: string;
  onClose: () => void;
  onSaved: (transaction: Transaction) => void;
  onDeleted: (id: string) => void;
  handleDelete: () => void;
  handleSave: (transaction: Transaction) => void;
};
