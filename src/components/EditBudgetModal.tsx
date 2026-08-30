import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '@react-native-vector-icons/ionicons';
import type { AppDispatch, RootState } from '../store/store';
import { updateUserPreferences } from '../store/userSlice';
import { getCurrencySymbol } from '../utils/helpers';
import { COLORS } from '../constants/colors';
import CustomButton from './CustomButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const EditBudgetModal = ({ visible, onClose, onSaved }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);
  const currencySymbol = getCurrencySymbol(user?.currency);

  const [budgetInput, setBudgetInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && user) {
      setBudgetInput(String(user.monthlyBudget ?? 0));
      setError(null);
    }
  }, [visible, user]);

  const handleSave = async () => {
    setError(null);

    const parsed = Number(budgetInput.replace(/,/g, ''));

    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updateUserPreferences({ monthlyBudget: parsed })).unwrap();

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.iconButtonPlaceholder} />

          <View style={styles.titleWrap}>
            <Text style={styles.title} numberOfLines={1}>
              Monthly Budget
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Update how much you plan to spend each month
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.iconButton}
            accessibilityLabel="Close"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close" size={20} color={'#FFFFFF'} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            <Text style={styles.label}>Budget amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                value={budgetInput}
                onChangeText={setBudgetInput}
                placeholder="0.00"
                placeholderTextColor={'#94A3B8'}
                keyboardType="decimal-pad"
                style={styles.amountInput}
                autoFocus
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonContainer}>
              <CustomButton
                title="Save Budget"
                onPress={handleSave}
                loading={isSubmitting}
              />
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Backrop press to dismiss, kept on top of KeyboardAvoidingView */}
        <Pressable style={styles.hiddenPressable} onPress={onClose} />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: COLORS.PRIMARY,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.PRIMARY_LIGHT,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  iconButtonPlaceholder: {
    width: 38,
    height: 38,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
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
    color: COLORS.PRIMARY_DARK,
    fontSize: 30,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '700',
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 24,
  },
  hiddenPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default EditBudgetModal;
