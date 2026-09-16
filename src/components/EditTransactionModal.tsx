import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import {
  EditTransactionModalProps,
  TransactionType,
} from '../types/Transactions';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { Category } from '../store/categoriesSlice';
import { COLORS, getThemeColors } from '../constants/colors';
import type { ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './Header';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from '@react-native-vector-icons/ionicons';
import CustomButton from './CustomButton';
import { formatDisplayDate, getCurrencySymbol } from '../utils/helpers';
import { BASE_URL } from '../config/apiUrl';
import { getJwtToken } from '../utils/storeToken';

const EXPENSE_COLOR = '#EF4444';

type AICategorySuggestionResponse = {
  success: boolean;
  message?: string;
  data?: {
    categoryId: string;
    categoryName: string;
    confidence: number;
  };
};

const EditTransactionModal = ({
  visible,
  transaction,
  categories,
  categoriesStatus,
  onClose,
  handleDelete,
  handleSave,
}: EditTransactionModalProps) => {
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const user = useSelector((state: RootState) => state.user.user);
  const currencySymbol = getCurrencySymbol(user?.currency);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    categoryId: string;
    categoryName: string;
    confidence: number;
  } | null>(null);

  useEffect(() => {
    if (!transaction) {
      return;
    }

    setTitle(transaction.title);
    setDescription(transaction.description ?? '');
    setAmount(String(transaction.amount));
    setDate(new Date(transaction.date));
    setType(transaction.type);
    setSelectedCategory(
      categories.find(category => category._id === transaction.categoryId) ??
        null,
    );
  }, [transaction, categories]);

  const visibleCategories = useMemo(() => {
    const typedCategories = categories.filter(
      category =>
        !category.type ||
        category.type.toLowerCase() === type ||
        category.type.toLowerCase() === 'both',
    );

    return typedCategories.length > 0 ? typedCategories : categories;
  }, [categories, type]);

  const accentColor = type === 'expense' ? EXPENSE_COLOR : COLORS.SUCCESS;

  const handleAISuggestCategory = useCallback(async () => {
    if (!title.trim() && !description.trim()) {
      return;
    }

    setIsAISuggesting(true);
    setAiSuggestion(null);

    try {
      const token = await getJwtToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${BASE_URL}/ai/suggest-category`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: title.trim(), description: description.trim(), type }),
      });
      let data: any = null;
      try { data = await response.json(); } catch { data = null; }
      if (!response.ok) throw new Error(data?.message ?? 'Failed to get suggestion');
      if (data?.success && data.data) {
        const cat = categories.find(c => c._id === data.data.categoryId);
        if (cat) {
          setAiSuggestion({ categoryId: cat._id, categoryName: cat.name, confidence: data.data.confidence });
        }
      }
    } catch (error: any) {
      console.error('AI Suggestion Error:', error);
    } finally {
      setIsAISuggesting(false);
    }
  }, [title, description, type, categories]);

  const handleApplyAISuggestion = useCallback(() => {
    if (aiSuggestion) {
      const cat = categories.find(c => c._id === aiSuggestion.categoryId);
      if (cat) { setSelectedCategory(cat); setAiSuggestion(null); }
    }
  }, [aiSuggestion, categories]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <Header
          title={'Edit Transaction'}
          subtitle={
            type === 'expense' ? 'Editing an expense' : 'Editing an income'
          }
          onBack={onClose}
          rightAction={{
            icon: 'trash-outline',
            onPress: handleDelete,
            accessibilityLabel: 'Delete transaction',
          }}
        />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <SegmentedControlTab
              values={['Expense', 'Income']}
              selectedIndex={type === 'expense' ? 0 : 1}
              onTabPress={index => setType(index === 0 ? 'expense' : 'income')}
              borderRadius={12}
              tabsContainerStyle={styles.segmentContainer}
              tabStyle={styles.segmentTab}
              activeTabStyle={[
                styles.segmentActiveTab,
                { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              tabTextStyle={styles.segmentTabText}
              activeTabTextStyle={styles.segmentActiveTabText}
            />

            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={[styles.currencySymbol, { color: accentColor }]}>
                {currencySymbol}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: accentColor }]}
              />
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Groceries"
              placeholderTextColor={theme.inputPlaceholder}
              style={styles.input}
              maxLength={80}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => setCategoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <View style={styles.categoryContent}>
                  {selectedCategory && (
                    <View
                      style={[
                        styles.categoryColor,
                        {
                          backgroundColor:
                            selectedCategory.color || COLORS.PRIMARY,
                        },
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.selectText,
                      !selectedCategory && styles.placeholderText,
                    ]}
                  >
                    {selectedCategory?.name ?? 'Select a category'}
                  </Text>
                </View>
                <Icon name="chevron-down" size={18} color={theme.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiSuggestButton, isAISuggesting && styles.aiSuggestButtonLoading]}
                onPress={handleAISuggestCategory}
                disabled={isAISuggesting || (!title.trim() && !description.trim())}
                activeOpacity={0.8}
              >
                {isAISuggesting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Icon name="sparkles" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {aiSuggestion && (
              <View style={styles.aiSuggestionBanner}>
                <View style={styles.aiSuggestionContent}>
                  <Icon name="sparkles" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.aiSuggestionText}>
                    AI: <Text style={styles.aiSuggestionCategory}>{aiSuggestion.categoryName}</Text>
                    {' '}<Text style={styles.aiSuggestionConfidence}>({Math.round(aiSuggestion.confidence * 100)}%)</Text>
                  </Text>
                </View>
                <TouchableOpacity style={styles.aiSuggestionApplyButton} onPress={handleApplyAISuggestion} activeOpacity={0.8}>
                  <Text style={styles.aiSuggestionApplyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setDatePickerVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.categoryContent}>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color={COLORS.PRIMARY}
                  style={styles.dateIcon}
                />
                <Text style={styles.selectText}>{formatDisplayDate(date)}</Text>
              </View>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={date}
              maximumDate={new Date()}
              onConfirm={selected => {
                setDate(selected);
                setDatePickerVisible(false);
              }}
              onCancel={() => setDatePickerVisible(false)}
            />

            <Text style={styles.label}>
              Description <Text style={styles.optional}>(optional)</Text>
            </Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note about this transaction"
              placeholderTextColor={theme.inputPlaceholder}
              style={[styles.input, styles.descriptionInput]}
              multiline
              textAlignVertical="top"
              maxLength={250}
            />

            <View style={styles.buttonContainer}>
              <CustomButton
                title={'Save Changes'}
                onPress={async () => {
                  if (!transaction || !selectedCategory) {
                    return;
                  }

                  const numericAmount = Number(amount);

                  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                    return;
                  }

                  setSubmitting(true);

                  try {
                    await handleSave({
                      title: title.trim(),
                      description: description.trim(),
                      amount: numericAmount,
                      date: date.toISOString(),
                      type,
                      categoryId: selectedCategory._id,
                    });
                  } finally {
                    setSubmitting(false);
                  }
                }}
                loading={isSubmitting || isDeleting}
              />
            </View>

            <TouchableOpacity
              style={styles.deleteLink}
              onPress={handleDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color={EXPENSE_COLOR} size="small" />
              ) : (
                <>
                  <Icon name="trash-outline" size={18} color={EXPENSE_COLOR} />
                  <Text style={styles.deleteLinkText}>Delete transaction</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal
          transparent
          visible={isCategoryModalVisible}
          animationType="slide"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setCategoryModalVisible(false)}
            />

            <View style={styles.categorySheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Select category</Text>

              {categoriesStatus === 'loading' ? (
                <Text style={styles.emptyText}>Loading categories...</Text>
              ) : visibleCategories.length === 0 ? (
                <Text style={styles.emptyText}>No categories available.</Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {visibleCategories.map(category => {
                    const isSelected = selectedCategory?._id === category._id;

                    return (
                      <TouchableOpacity
                        key={category._id}
                        style={[
                          styles.categoryOption,
                          isSelected && styles.selectedCategoryOption,
                        ]}
                        onPress={() => {
                          setSelectedCategory(category);
                          setCategoryModalVisible(false);
                        }}
                      >
                        <View
                          style={[
                            styles.categoryColor,
                            {
                              backgroundColor: category.color || COLORS.PRIMARY,
                            },
                          ]}
                        />
                        <Text style={styles.categoryName}>{category.name}</Text>
                        {isSelected && (
                          <Icon
                            name="checkmark"
                            size={18}
                            color={COLORS.PRIMARY}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const makeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
    },
    segmentContainer: {
      height: 46,
      marginBottom: 8,
    },
    segmentTab: {
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    segmentActiveTab: {},
    segmentTabText: {
      color: theme.textSecondary,
      fontWeight: '700',
      fontSize: 14,
    },
    segmentActiveTabText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    label: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 8,
      marginTop: 18,
    },
    optional: {
      color: theme.textTertiary,
      fontWeight: '500',
    },
    amountInputContainer: {
      height: 78,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    currencySymbol: {
      fontSize: 30,
      fontWeight: '800',
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 30,
      fontWeight: '700',
      padding: 0,
    },
    input: {
      minHeight: 54,
      borderRadius: 14,
      paddingHorizontal: 16,
      color: theme.textPrimary,
      fontSize: 15,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    descriptionInput: {
      minHeight: 110,
      paddingTop: 15,
    },
    selectInput: {
      height: 54,
      borderRadius: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    dateIcon: {
      marginRight: 10,
    },
    selectText: {
      color: theme.textPrimary,
      fontSize: 15,
    },
    placeholderText: {
      color: theme.textTertiary,
    },
    buttonContainer: {
      marginTop: 32,
    },
    deleteLink: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
    },
    deleteLinkText: {
      color: EXPENSE_COLOR,
      fontSize: 14,
      fontWeight: '700',
      marginLeft: 6,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.modalOverlay,
    },
    categorySheet: {
      maxHeight: '70%',
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      padding: 20,
      paddingBottom: 34,
      backgroundColor: theme.card,
    },
    sheetHandle: {
      width: 42,
      height: 5,
      borderRadius: 3,
      alignSelf: 'center',
      backgroundColor: theme.border,
      marginBottom: 20,
    },
    sheetTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 14,
    },
    categoryOption: {
      minHeight: 56,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      marginTop: 6,
    },
    categoryName: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      paddingVertical: 28,
    },
    selectedCategoryOption: {
      backgroundColor: theme.selectedBg,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    aiSuggestButton: {
      height: 54,
      width: 54,
      borderRadius: 14,
      backgroundColor: COLORS.PRIMARY,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiSuggestButtonLoading: { opacity: 0.7 },
    aiSuggestionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      padding: 12,
      backgroundColor: theme.selectedBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    aiSuggestionContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aiSuggestionText: { color: theme.textPrimary, fontSize: 13, fontWeight: '500' },
    aiSuggestionCategory: { fontWeight: '700', color: theme.textPrimary },
    aiSuggestionConfidence: { color: COLORS.PRIMARY, fontSize: 12 },
    aiSuggestionApplyButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: COLORS.PRIMARY,
      borderRadius: 8,
    },
    aiSuggestionApplyText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  });

export default EditTransactionModal;
