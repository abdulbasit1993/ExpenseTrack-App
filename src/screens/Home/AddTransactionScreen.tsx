import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
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

type RootStackParamList = {
  Home: undefined;
  AddTransaction: { type?: 'income' | 'expense' };
};

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

type TransactionType = 'income' | 'expense';

type AddTransactionResponse = {
  success: boolean;
  message?: string;
};

const EXPENSE_COLOR = '#EF4444';

const formatDisplayDate = (value: Date) =>
  value.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const AddTransactionScreen = ({ navigation, route }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, status } = useSelector(
    (state: RootState) => state.categories,
  );

  const initialType: TransactionType = route.params?.type ?? 'expense';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [type, setType] = useState<TransactionType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  console.log('date ===> ', date.toISOString());

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCategories());
    }
  }, [dispatch, status]);

  useEffect(() => {
    setSelectedCategory(null);
  }, [type]);

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

  const handleSubmit = async () => {
    const parsedAmount = Number(amount.replace(/,/g, ''));

    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a transaction title.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Category required', 'Please select a category.');
      return;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter an amount greater than zero.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId: selectedCategory._id,
        type,
        amount: parsedAmount,
        date: toIsoDate(date),
      };

      console.log('payload ====> ', payload);

      await api.post<AddTransactionResponse>('/transactions/add', payload);

      ToastAndroid.show(
        'Your transaction was saved successfully.',
        ToastAndroid.SHORT,
      );

      navigation.goBack();

      //   Alert.alert(
      //     'Transaction added',
      //     'Your transaction was saved successfully.',
      //     [
      //       {
      //         text: 'Done',
      //         onPress: () => navigation.goBack(),
      //       },
      //     ],
      //   );
    } catch (error: any) {
      Alert.alert(
        'Unable to add transaction',
        error?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Add Transaction"
        subtitle={type === 'expense' ? 'Logging an expense' : 'Logging income'}
        onBack={() => navigation.goBack()}
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
              $
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={'#94A3B8'}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: accentColor }]}
            />
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Groceries"
            placeholderTextColor={'#94A3B8'}
            style={styles.input}
            maxLength={80}
          />

          <Text style={styles.label}>Category</Text>
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
                      backgroundColor: selectedCategory.color || COLORS.PRIMARY,
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
            <Icon name="chevron-down" size={18} color="#64748B" />
          </TouchableOpacity>

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
            placeholderTextColor={'#94A3B8'}
            style={[styles.input, styles.descriptionInput]}
            multiline
            textAlignVertical="top"
            maxLength={250}
          />

          <View style={styles.buttonContainer}>
            <CustomButton
              title={`Add ${type === 'expense' ? 'Expense' : 'Income'}`}
              onPress={handleSubmit}
              loading={isSubmitting}
            />
          </View>
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

            {status === 'loading' ? (
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  segmentActiveTab: {
    // backgroundColor: COLORS.PRIMARY,
  },
  segmentTabText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  segmentActiveTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
  },
  optional: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  amountInputContainer: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 10,
  },
  selectText: {
    color: '#0F172A',
    fontSize: 15,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  buttonContainer: {
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  categorySheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    marginBottom: 20,
  },
  sheetTitle: {
    color: '#0F172A',
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
  selectedCategoryOption: {
    backgroundColor: '#EEF2FF',
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 28,
  },
});

export default AddTransactionScreen;
