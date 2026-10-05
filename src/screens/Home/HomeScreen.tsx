import React, { useCallback, useRef, useState, useMemo } from 'react';
import type { ComponentProps } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootState } from '../../store/store';
import type { RootStackParamList } from '../../navigation/RootStack';
import Icon from '@react-native-vector-icons/ionicons';
import { COLORS, getThemeColors } from '../../constants/colors';
import type { ThemeColors } from '../../constants/theme';
import { formatCurrency, getCurrencySymbol } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/apiService';
import {
  buildInsightsEndpoint,
  buildMonthlySummaryEndpoint,
  fetchAIInsights,
  fetchMonthlySummary,
} from '../../services/apiService';
import type {
  DashboardData,
  DashboardResponse,
  DashboardSummary,
  RecentTransaction,
} from '../../types/Dashboard';
import type {
  AIInsightResponse,
  AIMonthlySummary,
  AISummaryData,
} from '../../types/AI';
import EditBudgetModal from '../../components/EditBudgetModal';

const RECENT_TRANSACTIONS_LIMIT = 5;

const STALE_MS = 30_000;

type IconName = ComponentProps<typeof Icon>['name'];

// Fallback values for the summary when the request fails
const EMPTY_SUMMARY: DashboardSummary = {
  currentBalance: 0,
  totalIncome: 0,
  totalExpenses: 0,
  monthlyBudget: 0,
  monthlySpent: 0,
};

const EMPTY_AI_SUMMARY: AISummaryData = {
  income: 0,
  expense: 0,
  net: 0,
  monthlyBudget: 0,
  budgetRemaining: 0,
  budgetStatus: '—',
  highestExpenseCategory: '—',
  highestExpenseAmount: 0,
  transactionCount: 0,
  currency: '',
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

type Styles = ReturnType<typeof themeStyles>;

const SummaryStat = React.memo(
  ({
    label,
    value,
    color,
    styles,
  }: {
    label: string;
    value: string;
    color: string;
    styles: Styles;
  }) => (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryStatLabel}>{label}</Text>
      <Text style={[styles.summaryStatValue, { color }]}>{value}</Text>
    </View>
  ),
);

const InsightChip = React.memo(
  ({ text, styles }: { text: string; styles: Styles }) => (
    <View style={styles.insightChip}>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  ),
);

const AISkeleton = ({
  isDarkMode,
  styles,
}: {
  isDarkMode: boolean;
  styles: Styles;
}) => {
  const bg = isDarkMode ? '#334155' : '#E2E8F0';
  return (
    <View style={styles.aiCard}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: bg,
          }}
        />
        <View
          style={{
            width: 100,
            height: 14,
            borderRadius: 6,
            backgroundColor: bg,
          }}
        />
      </View>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            height: 12,
            borderRadius: 6,
            backgroundColor: bg,
            marginBottom: 8,
            width: i === 1 ? '80%' : '100%',
          }}
        />
      ))}
    </View>
  );
};

const SummarySkeleton = ({
  isDarkMode,
  styles,
}: {
  isDarkMode: boolean;
  styles: Styles;
}) => {
  const bg = isDarkMode ? '#334155' : '#E2E8F0';
  return (
    <View style={styles.aiCard}>
      <View
        style={{
          width: 140,
          height: 14,
          borderRadius: 6,
          backgroundColor: bg,
          marginBottom: 10,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={{
              width: 70,
              height: 52,
              borderRadius: 12,
              backgroundColor: bg,
            }}
          />
        ))}
      </View>
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: bg,
          width: '60%',
        }}
      />
    </View>
  );
};

const ErrorState = ({
  message,
  onRetry,
  styles,
}: {
  message: string;
  onRetry: () => void;
  styles: Styles;
}) => (
  <View style={styles.centerState}>
    <Icon
      name="cloud-offline-circle"
      size={40}
      color={styles.centerStateText.color as string}
    />
    <Text style={styles.centerStateText}>{message}</Text>
    <Pressable
      onPress={onRetry}
      style={styles.retryButton}
      accessibilityRole="button"
    >
      <Text style={styles.retryText}>Try again</Text>
    </Pressable>
  </View>
);

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useSelector((state: RootState) => state.user.user);
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => themeStyles(theme), [theme]);
  const currencySymbol = getCurrencySymbol(user?.currency);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  // const hasLoadedOnce = useRef(false);
  const hasDataRef = useRef(false);
  const lastFetchRef = useRef(0);
  const [error, setError] = useState<string | null>(null);

  const [isBudgetModalVisible, setBudgetModalVisible] = useState(false);

  const [insights, setInsights] = useState<string[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<AIMonthlySummary | null>(
    null,
  );
  const [isAILoading, setIsAILoading] = useState(true);
  const [aiError, setAIError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
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
        setError(null);
        hasDataRef.current = true;
        lastFetchRef.current = Date.now();
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Something went wrong. Please try again.';
        if (!hasDataRef.current) {
          setError(message);
        } else if (mode === 'refresh') {
          Alert.alert('Unable to refresh.', message);
        }
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const aiLastFetchRef = useRef(0);

  const loadAIInsights = useCallback(async () => {
    try {
      setAIError(null);
      const [insightsRes, summaryRes] = await Promise.all([
        fetchAIInsights('month'),
        fetchMonthlySummary(),
      ]);

      if (!insightsRes.success || !insightsRes.data) {
        throw new Error('Unable to load AI insights.');
      }

      setInsights(insightsRes.data.insights);

      if (summaryRes.success && summaryRes.data) {
        setMonthlySummary(summaryRes.data);
      }

      aiLastFetchRef.current = Date.now();
    } catch (error: any) {
      setAIError(error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsAILoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasDataRef.current) {
        loadDashboard('initial');
      } else if (Date.now() - lastFetchRef.current > STALE_MS) {
        loadDashboard('silent');
      }
    }, [loadDashboard]),
  );

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - aiLastFetchRef.current > STALE_MS) {
        loadAIInsights();
      }
    }, [loadAIInsights]),
  );

  const localBudget = user?.monthlyBudget ?? 0;
  const summary = dashboard?.summary ?? EMPTY_SUMMARY;
  const effectiveBudget =
    dashboard?.summary && localBudget > 0 ? localBudget : summary.monthlyBudget;

  const recentTransactions = dashboard?.recentTransactions ?? [];

  const spendingProgress =
    effectiveBudget > 0 ? (summary.monthlySpent / effectiveBudget) * 100 : 0;

  const remainingBudget = effectiveBudget - summary.monthlySpent;

  const aiSummary = monthlySummary?.data ?? EMPTY_AI_SUMMARY;

  const renderTransaction = ({ item }: { item: RecentTransaction }) => {
    const isIncome = item.amount > 0;

    const iconBackground = item.category?.color
      ? `${item.category.color}1F`
      : theme.selectedBg;

    return (
      <View style={styles.transactionItem}>
        <View
          style={[
            styles.transactionIconContainer,
            { backgroundColor: iconBackground },
          ]}
        >
          {item.category?.icon ? (
            <Icon
              name={item.category.icon as IconName}
              size={18}
              color={theme.textPrimary}
            />
          ) : (
            <Text style={styles.transactionIcon}>{isIncome ? '💼' : '🧾'}</Text>
          )}
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
            { color: isIncome ? COLORS.SUCCESS : theme.textSecondary },
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

          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Profile');
            }}
            activeOpacity={0.8}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
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

        {effectiveBudget > 0 ? (
          <View style={styles.spendingCard}>
            <View style={styles.spendingTopRow}>
              <View>
                <Text style={styles.spendingAmount}>
                  {formatCurrency(summary.monthlySpent, currencySymbol)}
                </Text>
                <Text style={styles.budgetText}>
                  of {formatCurrency(effectiveBudget, currencySymbol)} budget
                </Text>
              </View>

              <View style={styles.spendingRight}>
                <View style={styles.progressPercentage}>
                  <Text style={styles.progressPercentageText}>
                    {Math.round(spendingProgress)}%
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setBudgetModalVisible(true)}
                  style={styles.editBudgetButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Edit monthly budget"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="pencil" size={14} color={COLORS.PRIMARY_DARK} />
                  <Text style={styles.editBudgetText}>Edit</Text>
                </TouchableOpacity>
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
          </View>
        ) : (
          <Pressable
            onPress={() => setBudgetModalVisible(true)}
            style={({ pressed }) => [
              styles.setBudgetCard,
              pressed && styles.setBudgetCardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Set a monthly budget"
            accessibilityHint="Opens the budget editor"
          >
            <View style={styles.setBudgetIconWrap}>
              <Icon
                name="wallet-outline"
                size={22}
                color={COLORS.PRIMARY_DARK}
              />
            </View>

            <View style={styles.setBudgetTextWrap}>
              <Text style={styles.setBudgetTitle}>Set a monthly budget</Text>
              <Text style={styles.setBudgetSubtitle}>
                You've spent{' '}
                {formatCurrency(summary.monthlySpent, currencySymbol)} so far.
                Add a budget to track your progress.
              </Text>
            </View>

            <Icon
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        )}

        {/* ------- AI Summary Card -------- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Monthly Summary</Text>
        </View>

        {isAILoading ? (
          // renderSummarySkeleton(isDarkMode, styles)
          <SummarySkeleton isDarkMode={isDarkMode} styles={styles} />
        ) : aiError ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiErrorText}>⚠️ {aiError}</Text>
          </View>
        ) : (
          <View style={styles.aiCard}>
            <Text style={styles.aiSummaryText}>{monthlySummary?.summary}</Text>

            <View style={styles.aiStatsRow}>
              <SummaryStat
                label="Income"
                value={formatCurrency(
                  aiSummary.income,
                  getCurrencySymbol(aiSummary.currency as string),
                )}
                color={COLORS.SUCCESS}
                styles={styles}
              />
              <SummaryStat
                label="Expenses"
                value={formatCurrency(
                  aiSummary.expense,
                  getCurrencySymbol(aiSummary.currency as string),
                )}
                color={'#EF4444'}
                styles={styles}
              />
              <SummaryStat
                label="Net"
                value={formatCurrency(
                  aiSummary.net,
                  getCurrencySymbol(aiSummary.currency as string),
                )}
                color={COLORS.PRIMARY}
                styles={styles}
              />
            </View>

            <View style={styles.aiBudgetRow}>
              <Text style={styles.aiBudgetLabel}>Budget:</Text>
              <Text style={styles.aiBudgetValue}>
                {formatCurrency(
                  aiSummary.monthlyBudget,
                  getCurrencySymbol(aiSummary.currency as string),
                )}
              </Text>
              <Text style={styles.aiBudgetLabel}>Remaining:</Text>
              <Text
                style={[
                  styles.aiBudgetValue,
                  {
                    color:
                      aiSummary.budgetStatus === 'within budget'
                        ? COLORS.SUCCESS
                        : '#EF4444',
                  },
                ]}
              >
                {formatCurrency(
                  aiSummary.budgetRemaining,
                  getCurrencySymbol(aiSummary.currency as string),
                )}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                aiSummary.budgetStatus === 'within budget'
                  ? styles.badgeWithin
                  : styles.badgeOver,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  aiSummary.budgetStatus === 'within budget'
                    ? styles.badgeWithinText
                    : styles.badgeOverText,
                ]}
              >
                {aiSummary.budgetStatus}
              </Text>
            </View>
          </View>
        )}

        {/* ------- AI Insights Card -------- */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
        </View>

        {isAILoading ? (
          <AISkeleton isDarkMode={isDarkMode} styles={styles} />
        ) : aiError ? null : insights.length === 0 ? (
          <View style={styles.aiCard}>
            <Text style={styles.aiEmptyText}>No insights available</Text>
          </View>
        ) : (
          insights.map((text, index) => (
            <InsightChip key={`insight=${index}`} text={text} styles={styles} />
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
      </>
    );
  };

  const renderLoadingSkeleton = () => (
    <View
      style={styles.skeletonContent}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading dashboard"
    >
      <SkeletonPlaceholder
        backgroundColor={isDarkMode ? '#263449' : '#E2E8F0'}
        highlightColor={isDarkMode ? '#334155' : '#F1F5F9'}
      >
        <SkeletonPlaceholder.Item style={styles.skeletonGreeting}>
          <SkeletonPlaceholder.Item>
            <SkeletonPlaceholder.Item
              width={110}
              height={16}
              borderRadius={6}
            />
            <SkeletonPlaceholder.Item
              width={180}
              height={28}
              borderRadius={8}
              marginTop={8}
            />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item width={48} height={48} borderRadius={24} />
        </SkeletonPlaceholder.Item>

        <SkeletonPlaceholder.Item
          height={184}
          borderRadius={24}
          marginBottom={28}
        />

        <SkeletonPlaceholder.Item style={styles.skeletonSectionHeader}>
          <SkeletonPlaceholder.Item width={170} height={20} borderRadius={7} />
          <SkeletonPlaceholder.Item width={72} height={14} borderRadius={6} />
        </SkeletonPlaceholder.Item>
        <SkeletonPlaceholder.Item height={158} borderRadius={20} />

        {/* AI Skeleton placeholders */}
        <SkeletonPlaceholder.Item style={styles.skeletonSectionHeader}>
          <SkeletonPlaceholder.Item width={190} height={20} borderRadius={7} />
        </SkeletonPlaceholder.Item>
        <SkeletonPlaceholder.Item
          height={100}
          borderRadius={16}
          marginBottom={16}
        />

        <SkeletonPlaceholder.Item style={styles.skeletonSectionHeader}>
          <SkeletonPlaceholder.Item width={190} height={20} borderRadius={7} />
        </SkeletonPlaceholder.Item>
        <SkeletonPlaceholder.Item height={80} borderRadius={16} />

        {[0, 1, 2, 3, 4].map(item => (
          <SkeletonPlaceholder.Item
            key={item}
            style={styles.skeletonTransaction}
          >
            <SkeletonPlaceholder.Item
              width={46}
              height={46}
              borderRadius={15}
            />
            <SkeletonPlaceholder.Item marginLeft={12} flex={1}>
              <SkeletonPlaceholder.Item
                width="62%"
                height={15}
                borderRadius={6}
              />
              <SkeletonPlaceholder.Item
                width="42%"
                height={12}
                borderRadius={5}
                marginTop={8}
              />
            </SkeletonPlaceholder.Item>
            <SkeletonPlaceholder.Item
              width={58}
              height={14}
              borderRadius={6}
              marginLeft={8}
            />
          </SkeletonPlaceholder.Item>
        ))}
      </SkeletonPlaceholder>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {isLoading ? (
        renderLoadingSkeleton()
      ) : error && !dashboard ? (
        <ErrorState
          message={error}
          onRetry={() => loadDashboard('initial')}
          styles={styles}
        />
      ) : (
        <FlashList
          data={recentTransactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          ListHeaderComponent={renderHeader()}
          ListFooterComponent={<View style={styles.footerSpacing} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadDashboard('refresh')}
              tintColor={COLORS.PRIMARY}
              colors={[COLORS.PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyTransactions}>
              <Icon
                name="receipt-outline"
                size={32}
                color={theme.textSecondary}
              />
              <Text style={styles.aiEmptyText}>No transactions yet</Text>
            </View>
          }
        />
      )}

      {/* ======== EditBudgetModal ======== */}
      <EditBudgetModal
        visible={isBudgetModalVisible}
        onClose={() => setBudgetModalVisible(false)}
        onSaved={() => {
          loadDashboard('silent');
        }}
      />
    </SafeAreaView>
  );
};

const themeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 14,
    },
    skeletonContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 14,
    },
    skeletonGreeting: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    skeletonSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 28,
      marginBottom: 13,
    },
    skeletonTransaction: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
    },
    greetingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    greeting: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    username: {
      color: theme.textPrimary,
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
      color: '#FFFFFF',
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
    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 12,
    },
    centerStateText: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: COLORS.PRIMARY,
    },
    retryText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    emptyTransactions: {
      alignItems: 'center',
      paddingVertical: 32,
      gap: 8,
    },
    setBudgetCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 20,
      padding: 18,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.border,
    },
    setBudgetCardPressed: {
      opacity: 0.7,
    },
    setBudgetIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.PRIMARY_GLOW,
    },
    setBudgetTextWrap: {
      flex: 1,
    },
    setBudgetTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '800',
    },
    setBudgetSubtitle: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
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
      color: '#FFFFFF',
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
      color: theme.textPrimary,
      fontSize: 19,
      fontWeight: '800',
    },
    monthLabel: {
      color: theme.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    spendingCard: {
      borderRadius: 20,
      padding: 18,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    spendingTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    spendingRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    spendingAmount: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '800',
    },
    budgetText: {
      color: theme.textSecondary,
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
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '800',
    },
    editBudgetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.selectedBg,
    },
    editBudgetText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '800',
    },
    progressTrack: {
      height: 9,
      borderRadius: 5,
      overflow: 'hidden',
      backgroundColor: theme.border,
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
      borderBottomColor: theme.border,
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
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    transactionMeta: {
      color: theme.textSecondary,
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

    /* ---- AI Card ---- */
    aiCard: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: `${COLORS.AIACCENT}33`,
      marginBottom: 8,
    },
    aiSummaryText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 22,
      marginBottom: 14,
    },
    aiStatsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryStat: { alignItems: 'center' },
    summaryStatLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      marginBottom: 3,
    },
    summaryStatValue: { fontSize: 15, fontWeight: '800' },
    aiBudgetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 10,
    },
    aiBudgetLabel: { color: theme.textSecondary, fontSize: 13 },
    aiBudgetValue: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 10,
      marginTop: 4,
    },
    badgeWithin: { backgroundColor: 'rgba(34,197,94,0.15)' },
    badgeOver: { backgroundColor: 'rgba(239,68,68,0.15)' },
    badgeText: { fontSize: 12, fontWeight: '700' },
    badgeWithinText: { color: COLORS.SUCCESS },
    badgeOverText: { color: '#EF4444' },
    aiErrorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
    aiEmptyText: { color: theme.textSecondary, fontSize: 13 },
    insightChip: {
      backgroundColor: `${COLORS.AIACCENT}12`,
      borderWidth: 1,
      borderColor: `${COLORS.AIACCENT}28`,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    insightText: { color: theme.textPrimary, fontSize: 13, lineHeight: 20 },
  });

export default HomeScreen;
