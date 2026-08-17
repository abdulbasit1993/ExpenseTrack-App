import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ToastAndroid,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from '@react-native-vector-icons/ionicons';
import type { AppDispatch, RootState } from '../../store/store';
import { fetchCategories, type Category } from '../../store/categoriesSlice';
import { api } from '../../services/apiService';
import { COLORS } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import Header from '../../components/Header';
import EditTransactionModal from '../../components/EditTransactionModal';

type RootStackParamList = {
  Transactions: undefined;
  AddTransaction: { type?: 'income' | 'expense' };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

type TransactionType = 'income' | 'expense';

type Transaction = {
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

type TransactionsListResponse = {
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

type MutationResponse = {
  success: boolean;
  message?: string;
  data?: { transaction: Transaction };
};

type TypeFilter = 'all' | TransactionType;

const EXPENSE_COLOR = '#EF4444';
const PAGE_LIMIT = 20;

const formatDisplayDate = (value: Date) =>
  value.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatListDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const formatAmount = (value: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

type TransactionRowProps = {
  transaction: Transaction;
  category?: Category;
  onPress: () => void;
};

const TransactionRow = ({
  transaction,
  category,
  onPress,
}: TransactionRowProps) => {
  const isExpense = transaction.type === 'expense';
  const amountColor = isExpense ? EXPENSE_COLOR : COLORS.SUCCESS;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          styles.rowIconWrap,
          { backgroundColor: `${category?.color} || COLORS.PRIMARY}1F` },
        ]}
      >
        <View
          style={[
            styles.rowIconDot,
            { backgroundColor: category?.color || COLORS.PRIMARY },
          ]}
        />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {transaction.title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {category?.name ?? 'Uncategorized'} ·
          {formatListDate(transaction.date)}
        </Text>
      </View>

      <Text style={[styles.rowAmount, { color: amountColor }]}>
        {isExpense ? '-' : '+'}${formatAmount(transaction.amount)}
      </Text>

      <Icon
        name="chevron-forward"
        size={16}
        color="#CBD5E1"
        style={styles.rowChevron}
      />
    </TouchableOpacity>
  );
};

const TransactionsScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, status: categoriesStatus } = useSelector(
    (state: RootState) => state.categories,
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  useEffect(() => {
    if (categoriesStatus === 'idle') {
      dispatch(fetchCategories());
    }
  }, [dispatch, categoriesStatus]);

  const categoryMap = useMemo(
    () => new Map(categories.map(category => [category._id, category])),
    [categories],
  );

  const loadTransactions = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      try {
        if (mode === 'initial') {
          setLoading(true);
        } else if (mode === 'refresh') {
          setRefreshing(true);
        } else {
          setLoadingMore(true);
        }

        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(PAGE_LIMIT),
        });

        if (typeFilter !== 'all') {
          params.set('type', typeFilter);
        }

        const response = await api.get<TransactionsListResponse>(
          `/transactions?${params.toString()}`,
        );

        const { transactions: items, pagination } = response.data;

        setTransactions(prev =>
          targetPage === 1 ? items : [...prev, ...items],
        );
        setPage(pagination.page);
        setTotalPages(pagination.totalPages);
        setTotal(pagination.total);
      } catch (error: any) {
        Alert.alert(
          'Unable to load transactions',
          error?.message ?? 'Something went wrong. Please try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [typeFilter],
  );

  useEffect(() => {
    loadTransactions(1, 'initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const handleRefresh = () => {
    loadTransactions(1, 'refresh');
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && !isLoading && page < totalPages) {
      loadTransactions(page + 1, 'more');
    }
  };

  const handleSaved = (updated: Transaction) => {
    setTransactions(prev =>
      prev.map(item => (item._id === updated._id ? updated : item)),
    );
  };

  const handleDeleted = (id: string) => {
    setTransactions(prev => prev.filter(item => item._id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  };

  const typeFilterIndex =
    typeFilter === 'all' ? 0 : typeFilter === 'expense' ? 1 : 2;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Transactions"
        rightAction={{
          icon: 'add',
          onPress: () => navigation.navigate('AddTransaction', {}),
          accessibilityLabel: 'Add transaction',
        }}
      />

      <View style={styles.filterWrap}>
        <SegmentedControlTab
          values={['All', 'Expense', 'Income']}
          selectedIndex={typeFilterIndex}
          onTabPress={index =>
            setTypeFilter(
              index === 0 ? 'all' : index === 1 ? 'expense' : 'income',
            )
          }
          borderRadius={12}
          tabsContainerStyle={styles.segmentContainer}
          tabStyle={styles.segmentTab}
          activeTabStyle={[
            styles.segmentActiveTab,
            { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
          ]}
          tabTextStyle={styles.segmentTabText}
          activeTabTextStyle={styles.segmentActiveTabText}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.PRIMARY} size="large" />
        </View>
      ) : (
        <FlashList
          data={transactions}
          keyExtractor={item => item._id}
          estimatedItemSize={78}
          contentContainerStyle={
            transactions.length === 0
              ? styles.listEmptyContent
              : styles.listContent
          }
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              category={categoryMap.get(item.categoryId)}
              onPress={() => setEditingTransaction(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.PRIMARY}
              colors={[COLORS.PRIMARY]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={COLORS.PRIMARY} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="receipt-outline" size={40} color={'#CBD5E1'} />
              <Text style={styles.emptyStateTitle}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Transactions you add will show up here.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('AddTransaction', {})}
              >
                <Icon name="add" size={16} color="#FFFFFF" />
                <Text style={styles.emptyStateButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <EditTransactionModal
        visible={!!editingTransaction}
        transaction={editingTransaction}
        categories={categories}
        categoriesStatus={categoriesStatus}
        onClose={() => setEditingTransaction(null)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        handleDelete={handleDeleteTransaction}
        handleSave={handleUpdateTransaction}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  filterWrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  segmentContainer: {
    height: 46,
    marginBottom: 8,
  },
  segmentTab: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  segmentActiveTab: {},
  segmentTabText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  segmentActiveTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  listEmptyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  separator: {
    height: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rowBody: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowChevron: {
    marginLeft: 6,
  },
  footerLoading: {
    paddingVertical: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },
  emptyStateSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY,
    gap: 6,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default TransactionsScreen;
