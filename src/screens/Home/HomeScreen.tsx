import React from 'react'
import { View, Text, StyleSheet, StatusBar, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '../../constants/colors'

const USERNAME = "Alex";

const summary = {
  currentBalance: 12540.75,
  totalIncome: 18500,
  totalExpenses: 5959.25,
  monthlyBudget: 8000,
  monthlySpent: 4250
}

const recentTransactions = [
  {
    id: '1',
    title: 'Grocery Shopping',
    category: 'Food & Dining',
    date: 'Today, 10:30 AM',
    amount: -86.4,
    icon: '🛒',
    iconBackground: '#EEF2FF'
  },
  {
    id: '2',
    title: 'Salary Deposit',
    category: 'Income',
    date: 'Yesterday, 9:00 AM',
    amount: 3500,
    icon: '💼',
    iconBackground: '#ECFDF3'
  },
  {
    id: '3',
    title: 'Netflix',
    category: 'Entertainment',
    date: 'May 18, 2026',
    amount: -15.99,
    icon: '🎬',
    iconBackground: '#F5F3FF'
  },
  {
    id: '4',
    title: 'Online Cab Ride',
    category: 'Transport',
    date: 'May 17, 2026',
    amount: -22.5,
    icon: '🚗',
    iconBackground: '#FFF7ED'
  },
]

const formatCurrency = (amount: number) => 
  `$${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  }

  if (hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}

const HomeScreen = () => {

  const spendingProgress = (summary.monthlySpent / summary.monthlyBudget) * 100;

  const renderTransaction = ({ item }) => {
    const isIncome = item.amount > 0;

    return (
      <View style={styles.transactionItem}>
        <View style={[ styles.transactionIconContainer, { backgroundColor: item.iconBackground}]}>
          <Text style={styles.transactionIcon}>{item.icon}</Text>
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionMeta}>{item.category} • {item.date}</Text>
        </View>

        <Text style={[styles.transactionAmount, { color: isIncome ? COLORS.SUCCESS : COLORS.SECONDARY}]}>
          {isIncome ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>
      </View>

    )
  }

  const renderHeader = () => {
    return (
      <>
        <View style={styles.greetingContainer}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.username}>{USERNAME}!</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {USERNAME.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(summary.currentBalance)}
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
                  {formatCurrency(summary.totalIncome)}
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
                  {formatCurrency(summary.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          <Text style={styles.monthLabel}>May 2026</Text>
        </View>

        <View style={styles.spendingCard}>
          <View style={styles.spendingTopRow}>
            <View>
              <Text style={styles.spendingAmount}>
                {formatCurrency(summary.monthlySpent)}
              </Text>
              <Text style={styles.budgetText}>
                of {formatCurrency(summary.monthlyBudget)} budget
              </Text>
            </View>

            <View style={styles.progressPercentage}>
              <Text style={styles.progressPercentageText}>
                {Math.round(spendingProgress)}%
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[
              styles.progressBar,
              { width: `${Math.min(spendingProgress, 100)}%` }
            ]} />
          </View>

          <Text style={styles.remainingText}>
            {formatCurrency(summary.monthlyBudget - summary.monthlySpent)}{' '}
            remaining this month
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>
      </>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={"dark-content"} backgroundColor="#F8FAFC" />

      <FlatList data={recentTransactions} renderItem={renderTransaction} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} ListHeaderComponent={renderHeader} ListFooterComponent={<View style={styles.footerSpacing} />} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  greeting: {
    color: COLORS.SECONDARY,
    fontSize: 16,
    fontWeight: '500'
  },
  username: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 2
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY_LIGHT
  },
  avatarText: {
    color: COLORS.PRIMARY_DARK,
    fontSize: 19,
    fontWeight: '800'
  },
  balanceCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY_DARK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  balanceLabel: {
    color: '#E0E7FF',
    fontSize: 15,
    fontWeight: '500'
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 5
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginVertical: 22
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  balanceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9
  },
  incomeIcon: {
    backgroundColor: 'rgba(34,197,94,0.25)'
  },
  expenseIcon: {
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  detailIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800'
  },
  detailLabel: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '500'
  },
  detailAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 13
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800'
  },
  monthLabel: {
    color: COLORS.SECONDARY,
    fontSize: 13,
    fontWeight: '600'
  },
  spendingCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  spendingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  spendingAmount: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800'
  },
  budgetText: {
    color: COLORS.SECONDARY,
    fontSize: 13,
    marginTop: 4
  },
  progressPercentage: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.PRIMARY_GLOW
  },
  progressPercentageText: {
     color: COLORS.PRIMARY_DARK,
    fontSize: 13,
    fontWeight: '800'
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginTop: 18
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.AIACCENT
  },
  remainingText: {
    color: COLORS.SUCCESS,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10
  },
  seeAll: {
    color: COLORS.PRIMARY,
    fontSize: 14,
    fontWeight: '700'
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  transactionIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  transactionIcon: {
    fontSize: 21
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  transactionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700'
  },
  transactionMeta: {
    color: COLORS.SECONDARY,
    fontSize: 12,
    marginTop: 4
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800'
  },
  footerSpacing: {
    height: 110
  }
})

export default HomeScreen