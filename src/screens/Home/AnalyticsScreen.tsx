import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useFocusEffect } from '@react-navigation/native';
import { VictoryAxis, VictoryChart, VictoryLine } from 'victory-native';
import Svg, { Circle, Path } from 'react-native-svg';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { COLORS, getThemeColors } from '../../constants/colors';
import type { ThemeColors } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, getCurrencySymbol } from '../../utils/helpers';
import { api } from '../../services/apiService';
import type { AnalyticsData, AnalyticsResponse } from '../../types/Analytics';
import Header from '../../components/Header';

const EXPENSE_COLOR = '#EF4444';
const DONUT_RADIUS = 78;
const DONUT_INNER_RADIUS = 58;
const DONUT_SIZE = 220;

type PieDatum = {
  x: string;
  y: number;
  color: string;
};

type DateRange = {
  fromDate: Date;
  toDate: Date;
};

const getDefaultRange = (): DateRange => {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setMonth(fromDate.getMonth() - 5);
  fromDate.setDate(1);

  return { fromDate, toDate };
};

const formatApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildAnalyticsEndpoint = ({ fromDate, toDate }: DateRange) => {
  const params = new URLSearchParams({
    fromDate: formatApiDate(fromDate),
    toDate: formatApiDate(toDate),
  });
  return `/analytics?${params.toString()}`;
};

const formatRange = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  return `${from.toLocaleDateString(
    undefined,
    options,
  )} – ${to.toLocaleDateString(undefined, { ...options, year: 'numeric' })}`;
};

const toCartesian = (angle: number, radius: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  const center = DONUT_SIZE / 2;

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
};

const createDonutSlicePath = (startAngle: number, endAngle: number) => {
  const outerStart = toCartesian(startAngle, DONUT_RADIUS);
  const outerEnd = toCartesian(endAngle, DONUT_RADIUS);
  const innerEnd = toCartesian(endAngle, DONUT_INNER_RADIUS);
  const innerStart = toCartesian(startAngle, DONUT_INNER_RADIUS);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${DONUT_RADIUS} ${DONUT_RADIUS} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${DONUT_INNER_RADIUS} ${DONUT_INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
};

const AnalyticsScreen = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => themeStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 56, 300);
  const currencySymbol = getCurrencySymbol(user?.currency);
  const hasLoadedOnce = useRef(false);
  const activeRangeRef = useRef<DateRange>(getDefaultRange());

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(activeRangeRef.current);
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);

  const loadAnalytics = useCallback(
    async (mode: 'initial' | 'refresh', range: DateRange) => {
      try {
        mode === 'initial' ? setIsLoading(true) : setIsRefreshing(true);

        const response = await api.get<AnalyticsResponse>(
          buildAnalyticsEndpoint(range),
        );

        if (!response.success || !response.data) {
          throw new Error('Unable to load analytics.');
        }

        setAnalytics(response.data);
      } catch (error: any) {
        Alert.alert(
          'Unable to load analytics',
          error?.message ?? 'Something went wrong. Please try again.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      loadAnalytics(
        hasLoadedOnce.current ? 'refresh' : 'initial',
        activeRangeRef.current,
      );
      hasLoadedOnce.current = true;
    }, [loadAnalytics]),
  );

  const applyDateRange = () => {
    if (dateRange.fromDate > dateRange.toDate) {
      Alert.alert(
        'Invalid date range',
        'The start date must be before the end date.',
      );
      return;
    }

    activeRangeRef.current = dateRange;
    loadAnalytics('initial', activeRangeRef.current);
  };

  const renderLoadingSkeleton = () => (
    <ScrollView contentContainerStyle={styles.skeletonContent}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Loading analytics"
      >
        <SkeletonPlaceholder
          backgroundColor={isDarkMode ? '#263449' : '#E2E8F0'}
          highlightColor={isDarkMode ? '#334155' : '#F1F5F9'}
        >
          <SkeletonPlaceholder.Item width="72%" height={14} borderRadius={6} />

          <SkeletonPlaceholder.Item style={styles.skeletonDateRange}>
            <SkeletonPlaceholder.Item style={styles.skeletonDateInputs}>
              <SkeletonPlaceholder.Item flex={1} height={58} borderRadius={10} />
              <SkeletonPlaceholder.Item
                flex={1}
                height={58}
                borderRadius={10}
                marginLeft={10}
              />
            </SkeletonPlaceholder.Item>
            <SkeletonPlaceholder.Item
              height={42}
              borderRadius={10}
              marginTop={10}
            />
          </SkeletonPlaceholder.Item>

          <SkeletonPlaceholder.Item
            width="48%"
            height={12}
            borderRadius={5}
            marginTop={12}
            marginBottom={8}
          />

          <SkeletonPlaceholder.Item style={styles.skeletonSummaryRow}>
            <SkeletonPlaceholder.Item flex={1} height={79} borderRadius={16} />
            <SkeletonPlaceholder.Item
              flex={1}
              height={79}
              borderRadius={16}
              marginLeft={12}
            />
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item
            height={72}
            borderRadius={16}
            marginTop={12}
          />

          <SkeletonPlaceholder.Item style={styles.skeletonCard}>
            <SkeletonPlaceholder.Item width={170} height={18} borderRadius={7} />
            <SkeletonPlaceholder.Item
              width={180}
              height={180}
              borderRadius={90}
              alignSelf="center"
              marginTop={20}
            />
            {[0, 1, 2].map(item => (
              <SkeletonPlaceholder.Item
                key={item}
                height={14}
                borderRadius={6}
                marginTop={item === 0 ? 20 : 12}
              />
            ))}
          </SkeletonPlaceholder.Item>

          <SkeletonPlaceholder.Item style={styles.skeletonCard}>
            <SkeletonPlaceholder.Item width={180} height={18} borderRadius={7} />
            <SkeletonPlaceholder.Item
              height={220}
              borderRadius={12}
              marginTop={20}
            />
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </View>
    </ScrollView>
  );

  if (isLoading || isRefreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header title="Analytics" subtitle="Explore your financial activity" />
        {renderLoadingSkeleton()}
      </SafeAreaView>
    );
  }

  const summary = analytics?.incomeVsExpense ?? {
    income: 0,
    expense: 0,
    net: 0,
  };
  const categories = analytics?.expensesByCategory ?? [];
  const trend = analytics?.monthlyTrend ?? [];
  const pieData = categories.reduce<PieDatum[]>((data, category) => {
    const total = Number(category.total);

    // SVG paths cannot be created from missing, negative, or non-numeric totals.
    if (Number.isFinite(total) && total > 0) {
      data.push({
        x: category.name,
        y: total,
        color: category.color || COLORS.SECONDARY,
      });
    }

    return data;
  }, []);
  const pieTotal = pieData.reduce((total, category) => total + category.y, 0);
  const incomeData = trend.map((item, index) => ({
    x: index + 1,
    y: item.income,
  }));
  const expenseData = trend.map((item, index) => ({
    x: index + 1,
    y: item.expense,
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header title="Analytics" subtitle="Explore your financial activity" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadAnalytics('refresh', activeRangeRef.current)}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        <Text style={styles.screenDescription}>
          Choose a date range to explore your activity.
        </Text>

        <View style={styles.dateRangeCard}>
          <View style={styles.dateInputs}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setActivePicker('from')}
              activeOpacity={0.8}
            >
              <Text style={styles.dateLabel}>From</Text>
              <Text style={styles.dateValue}>
                {dateRange.fromDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setActivePicker('to')}
              activeOpacity={0.8}
            >
              <Text style={styles.dateLabel}>To</Text>
              <Text style={styles.dateValue}>
                {dateRange.toDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={applyDateRange}
            activeOpacity={0.85}
          >
            <Text style={styles.applyButtonText}>Apply range</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.activeRange}>
          Showing{' '}
          {analytics
            ? formatRange(analytics.range.fromDate, analytics.range.toDate)
            : formatRange(
                formatApiDate(activeRangeRef.current.fromDate),
                formatApiDate(activeRangeRef.current.toDate),
              )}
        </Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: COLORS.SUCCESS }]}>
              {formatCurrency(summary.income, currencySymbol)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              {formatCurrency(summary.expense, currencySymbol)}
            </Text>
          </View>
        </View>

        <View style={styles.netCard}>
          <Text style={styles.netLabel}>Net balance</Text>
          <Text
            style={[
              styles.netValue,
              summary.net >= 0
                ? styles.positiveNetValue
                : styles.negativeNetValue,
            ]}
          >
            {summary.net < 0 ? '-' : ''}
            {formatCurrency(summary.net, currencySymbol)}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by category</Text>
          {pieTotal > 0 ? (
            <>
              <View style={styles.donutChart}>
                <Svg
                  width={DONUT_SIZE}
                  height={DONUT_SIZE}
                  viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
                >
                  {pieData.length === 1 ? (
                    <>
                      <Circle
                        cx={DONUT_SIZE / 2}
                        cy={DONUT_SIZE / 2}
                        r={DONUT_RADIUS}
                        fill={pieData[0].color}
                      />
                      <Circle
                        cx={DONUT_SIZE / 2}
                        cy={DONUT_SIZE / 2}
                        r={DONUT_INNER_RADIUS}
                        fill={theme.card}
                      />
                    </>
                  ) : (
                    pieData.map((category, index) => {
                      const previousTotal = pieData
                        .slice(0, index)
                        .reduce((total, item) => total + item.y, 0);
                      const gap = 1;
                      const startAngle = (previousTotal / pieTotal) * 360 + gap;
                      const endAngle =
                        ((previousTotal + category.y) / pieTotal) * 360 - gap;

                      return (
                        <Path
                          key={category.x}
                          d={createDonutSlicePath(startAngle, endAngle)}
                          fill={category.color}
                        />
                      );
                    })
                  )}
                </Svg>
              </View>
              <View style={styles.legend}>
                {categories.map(category => (
                  <View style={styles.legendRow} key={category.categoryId}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: category.color || COLORS.SECONDARY },
                      ]}
                    />
                    <Text style={styles.legendName} numberOfLines={1}>
                      {category.name}
                    </Text>
                    <Text style={styles.legendAmount}>
                      {formatCurrency(category.total, currencySymbol)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>
              No expenses in this date range.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardTitle}>Income vs expenses</Text>
            <View style={styles.chartLegend}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.SUCCESS }]}
              />
              <Text style={styles.chartLegendText}>Income</Text>
              <View style={styles.expenseLegendDot} />
              <Text style={styles.chartLegendText}>Expense</Text>
            </View>
          </View>
          {trend.length > 0 ? (
            <VictoryChart
              width={chartWidth}
              height={240}
              padding={{ top: 22, bottom: 44, left: 54, right: 18 }}
            >
              <VictoryAxis
                tickValues={trend.map((_, index) => index + 1)}
                tickFormat={value =>
                  trend[value - 1]?.label.split(' ')[0] ?? ''
                }
                style={{
                  axis: { stroke: theme.border },
                  tickLabels: { fill: theme.textSecondary, fontSize: 11 },
                  grid: { stroke: 'transparent' },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={value =>
                  `${currencySymbol}${Math.round(value / 1000)}k`
                }
                style={{
                  axis: { stroke: 'transparent' },
                  tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                  grid: { stroke: theme.border, strokeDasharray: '4,4' },
                }}
              />
              <VictoryLine
                data={incomeData}
                interpolation="monotoneX"
                style={{ data: { stroke: COLORS.SUCCESS, strokeWidth: 3 } }}
              />
              <VictoryLine
                data={expenseData}
                interpolation="monotoneX"
                style={{ data: { stroke: EXPENSE_COLOR, strokeWidth: 3 } }}
              />
            </VictoryChart>
          ) : (
            <Text style={styles.emptyText}>
              No monthly activity in this date range.
            </Text>
          )}
        </View>
      </ScrollView>
      <DateTimePickerModal
        isVisible={activePicker !== null}
        mode="date"
        date={activePicker === 'from' ? dateRange.fromDate : dateRange.toDate}
        onConfirm={selectedDate => {
          setDateRange(currentRange =>
            activePicker === 'from'
              ? { ...currentRange, fromDate: selectedDate }
              : { ...currentRange, toDate: selectedDate },
          );
          setActivePicker(null);
        }}
        onCancel={() => setActivePicker(null)}
      />
    </SafeAreaView>
  );
};

const themeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    content: { padding: 20, paddingBottom: 110 },
    skeletonContent: { padding: 20, paddingBottom: 110 },
    skeletonDateRange: { marginTop: 14 },
    skeletonDateInputs: { flexDirection: 'row' },
    skeletonSummaryRow: { flexDirection: 'row' },
    skeletonCard: { marginTop: 16 },
    screenDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 14,
    },
    dateRangeCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    dateInputs: { flexDirection: 'row', gap: 10 },
    dateInput: {
      flex: 1,
      backgroundColor: theme.inputBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 11,
    },
    dateLabel: { color: theme.textSecondary, fontSize: 12, marginBottom: 4 },
    dateValue: { color: theme.textPrimary, fontSize: 13, fontWeight: '600' },
    applyButton: {
      backgroundColor: COLORS.PRIMARY,
      borderRadius: 10,
      alignItems: 'center',
      paddingVertical: 11,
      marginTop: 10,
    },
    applyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    activeRange: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 12,
      marginBottom: 4,
    },
    summaryRow: { flexDirection: 'row', gap: 12 },
    summaryCard: { flex: 1, borderRadius: 16, padding: 16 },
    incomeCard: { backgroundColor: 'rgba(34,197,94,0.12)' },
    expenseCard: { backgroundColor: 'rgba(239,68,68,0.10)' },
    summaryLabel: { color: theme.textSecondary, fontSize: 13, marginBottom: 7 },
    summaryValue: { fontSize: 17, fontWeight: '700' },
    expenseValue: { color: EXPENSE_COLOR },
    netCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    netLabel: { color: theme.textSecondary, fontSize: 14 },
    netValue: { fontSize: 20, fontWeight: '700' },
    positiveNetValue: { color: COLORS.SUCCESS },
    negativeNetValue: { color: EXPENSE_COLOR },
    card: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: { color: theme.textPrimary, fontSize: 17, fontWeight: '700' },
    donutChart: { alignItems: 'center' },
    legend: { marginTop: 4, gap: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'center' },
    legendDot: { width: 9, height: 9, borderRadius: 5, marginRight: 7 },
    expenseLegendDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      marginRight: 7,
      backgroundColor: EXPENSE_COLOR,
    },
    legendName: { color: theme.textSecondary, fontSize: 14, flex: 1 },
    legendAmount: { color: theme.textPrimary, fontSize: 14, fontWeight: '600' },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    chartLegend: { flexDirection: 'row', alignItems: 'center' },
    chartLegendText: {
      color: theme.textSecondary,
      fontSize: 11,
      marginRight: 9,
    },
    emptyText: {
      color: theme.textSecondary,
      textAlign: 'center',
      paddingVertical: 42,
      fontSize: 14,
    },
  });

export default AnalyticsScreen;
