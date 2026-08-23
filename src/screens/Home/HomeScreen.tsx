import React, { useCallback, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import type { RootState } from '../../store/store';
import Icon from '@react-native-vector-icons/ionicons';
import { COLORS } from '../../constants/colors';
import { formatCurrency, getCurrencySymbol } from '../../utils/helpers';
import { api } from '../../services/apiService';
import type {
  DashboardData,
  DashboardResponse,
  DashboardSummary,
  RecentTransaction,
} from '../../types/Dashboard';

const RECENT_TRANSACTIONS_LIMIT = 5;

type IconName = ComponentProps<typeof Icon>['name'];

// Fallback values for the summary when the request fails
const EMPTY_SUMMARY: DashboardSummary = {
  currentBalance: 0,
  totalIncome: 0,
  totalExpenses: 0,
  monthlyBudget: 0,
  monthlySpent: 0,
};

const buildDashboardEndpoint = ({
  limit,
  month,
  year,
}: {
  limit?: number;
  month?: number;
  year?: number;
}) => {
  const params = new URLSearchParams();

  if (limit !== undefined) {
    params.set('limit', String(limit));
  }

  if (month !== undefined) {
    params.set('month', String(month));
  }

  if (year !== undefined) {
    params.set('year', String(year));
  }

  const queryString = params.toString();

  return queryString ? `/dashboard?${queryString}` : '/dashboard';
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  }

  if (hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
};

const formatTransactionDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

const HomeScreen = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const currencySymbol = getCurrencySymbol(user?.currency);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);

  const loadDashboard = useCallback(async (mode: 'initial' | 'refresh') => {
    try {
      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await api.get<DashboardResponse>(
        buildDashboardEndpoint({ limit: RECENT_TRANSACTIONS_LIMIT }),
      );

      if (!response.success || !response.data) {
        throw new Error('Unable to load dashboard data.');
      }

      setDashboard(response.data);
    } catch (error: any) {
      Alert.alert(
        'Unable to load dashboard.',
        error?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard(hasLoadedOnce.current ? 'refresh' : 'initial');
      hasLoadedOnce.current = true;
    }, [loadDashboard]),
  );

  const summary = dashboard?.summary ?? EMPTY_SUMMARY;
  const recentTransactions = dashboard?.recentTransactions ?? [];

  const spendingProgress =
    summary.monthlyBudget > 0
      ? (summary.monthlySpent / summary.monthlyBudget) * 100
      : 0;

  const remainingBudget = summary.monthlyBudget - summary.monthlySpent;

  const renderTransaction = ({ item }: { item: RecentTransaction }) => {
    const isIncome = item.amount > 0;

    const categoryIcon = item.category?.icon ?? (isIncome ? '💼' : '🧾');

    const iconBackground = item.category?.color
      ? `${item.category.color}1F`
      : '#EEF2FF';

    return (
      <View style={styles.transactionItem}>
        <View
          style={[
            styles.transactionIconContainer,
            { backgroundColor: iconBackground },
          ]}
        >
          {/* <Text style={styles.transactionIcon}>{categoryIcon}</Text> */}
          <Icon name={categoryIcon as IconName} size={18} color="#000000" />
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionMeta}>
            {item.category?.name ?? 'Uncategorized'} •{' '}
            {formatTransactionDate(item.date)}
          </Text>
        </View>

        <Text
          style={[
            styles.transactionAmount,
            { color: isIncome ? COLORS.SUCCESS : COLORS.SECONDARY },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(item.amount, currencySymbol)}
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    return (
      <>
        <View style={styles.greetingContainer}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.username}>
              {user?.firstName} {user?.lastName}!
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(summary.currentBalance, currencySymbol)}
          </Text>

          <View style={styles.balanceDivider} />

          <View style={styles.incomeExpenseRow}>
            <View style={styles.balanceDetail}>
              <View style={[styles.detailIcon, styles.incomeIcon]}>
                <Text style={styles.detailIconText}>↓</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Total Income</Text>
                <Text style={styles.detailAmount}>
                  {formatCurrency(summary.totalIncome, currencySymbol)}
                </Text>
              </View>
            </View>

            <View style={styles.balanceDetail}>
              <View style={[styles.detailIcon, styles.expenseIcon]}>
                <Text style={styles.detailIconText}>↑</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Total Expenses</Text>
                <Text style={styles.detailAmount}>
                  {formatCurrency(summary.totalExpenses, currencySymbol)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          <Text style={styles.monthLabel}>
            {dashboard?.month.label ?? 'This Month'}
          </Text>
        </View>

        <View style={styles.spendingCard}>
          <View style={styles.spendingTopRow}>
            <View>
              <Text style={styles.spendingAmount}>
                {formatCurrency(summary.monthlySpent, currencySymbol)}
              </Text>
              <Text style={styles.budgetText}>
                of {formatCurrency(summary.monthlyBudget, currencySymbol)}{' '}
                budget
              </Text>
            </View>

            <View style={styles.progressPercentage}>
              <Text style={styles.progressPercentageText}>
                {Math.round(spendingProgress)}%
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(spendingProgress, 100)}%` },
              ]}
            />
          </View>

          {summary.monthlyBudget > 0 && (
            <Text
              style={[
                styles.remainingText,
                remainingBudget < 0 && styles.overBudgetText,
              ]}
            >
              {formatCurrency(Math.abs(remainingBudget), currencySymbol)}{' '}
              {remainingBudget >= 0
                ? 'remaining this month'
                : 'over budget this month'}
            </Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={'dark-content'} backgroundColor="#F8FAFC" />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlashList
          data={recentTransactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={<View style={styles.footerSpacing} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadDashboard('refresh')}
              tintColor={COLORS.PRIMARY}
              colors={[COLORS.PRIMARY]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: {
    color: COLORS.SECONDARY,
    fontSize: 16,
    fontWeight: '500',
  },
  username: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY_LIGHT,
  },
  avatarText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 19,
    fontWeight: '800',
  },
  balanceCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    color: '#E0E7FF',
    fontSize: 15,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 5,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: 22,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  incomeIcon: {
    backgroundColor: 'rgba(34,197,94,0.25)',
  },
  expenseIcon: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  detailIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  detailLabel: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '500',
  },
  detailAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 13,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },
  monthLabel: {
    color: COLORS.SECONDARY,
    fontSize: 13,
    fontWeight: '600',
  },
  spendingCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  spendingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spendingAmount: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  budgetText: {
    color: COLORS.SECONDARY,
    fontSize: 13,
    marginTop: 4,
  },
  progressPercentage: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.PRIMARY_GLOW,
  },
  progressPercentageText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginTop: 18,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.AIACCENT,
  },
  remainingText: {
    color: COLORS.SUCCESS,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  overBudgetText: {
    color: '#EF4444',
  },
  seeAll: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  transactionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIcon: {
    fontSize: 21,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  transactionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  transactionMeta: {
    color: COLORS.SECONDARY,
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerSpacing: {
    height: 110,
  },
});

export default HomeScreen;
