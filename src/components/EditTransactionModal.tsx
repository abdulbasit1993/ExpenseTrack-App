import React, { useState, useEffect, useMemo } from 'react';
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
import { Category } from '../store/categoriesSlice';
import { COLORS } from '../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './Header';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from '@react-native-vector-icons/ionicons';
import CustomButton from './CustomButton';

const EXPENSE_COLOR = '#EF4444';

const EditTransactionModal = ({
  visible,
  transaction,
  categories,
  categoriesStatus,
  onClose,
  onSaved,
  onDeleted,
  handleDelete,
  handleSave,
}: EditTransactionModalProps) => {
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
                title={'Save Changes'}
                onPress={handleSave}
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

const styles = StyleSheet.create({});

export default EditTransactionModal;
