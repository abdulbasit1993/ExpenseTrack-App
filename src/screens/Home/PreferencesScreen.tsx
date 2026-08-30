import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import CurrencyPickerDropdown from '../../components/CurrencyPickerDropdown';
import Icon from '@react-native-vector-icons/ionicons';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store/store';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { updateUserPreferences } from '../../store/userSlice';
import { COLORS } from '../../constants/colors';
import { getCurrencySymbol } from '../../utils/helpers';

type RootStackParamList = {
  Preferences: undefined;
  AddTransaction: { type?: 'income' | 'expense' };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Preferences'>;

const showSuccess = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
};

const PreferencesScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);

  const [currency, setCurrency] = useState<string>(user?.currency ?? 'USD');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (user?.currency) {
      setCurrency(user.currency);
    }
  }, [user?.currency]);

  const currencySymbol = getCurrencySymbol(currency);
  const hasChanges = currency !== user?.currency;

  const handleSave = async () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(updateUserPreferences({ currency })).unwrap();
      showSuccess('Currency updated.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Unable to update currency.',
        error?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
      <Header
        title="Preferences"
        subtitle="Customize how the app looks and works"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Currency</Text>
          <Text style={styles.sectionDescription}>
            All amounts across the app will be shown using this currency.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Default currency</Text>
            <CurrencyPickerDropdown value={currency} onChange={setCurrency} />

            <View style={styles.previewRow}>
              <View style={styles.previewIcon}>
                <Icon
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.PRIMARY}
                />
              </View>
              <Text>
                Amounts will be prefixed with{' '}
                <Text style={styles.previewHighlight}>{currencySymbol}</Text> (
                {currency}).
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly budget</Text>
          <Text style={styles.sectionDescription}>
            Your monthly budget can be updated quickly from the Home screen by
            tapping the edit icon on the spending card.
          </Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon
              name="wallet-outline"
              size={20}
              color={COLORS.PRIMARY}
              style={styles.linkIcon}
            />
            <Text style={styles.linkText}>
              Current budget: {currencySymbol}
              {user?.monthlyBudget?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? '0.00'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title={hasChanges ? 'Save Changes' : 'Done'}
            onPress={handleSave}
            loading={isSubmitting}
          />
        </View>
      </ScrollView>
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
    paddingTop: 20,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionDescription: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY_GLOW,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 10,
  },
  previewText: {
    flex: 1,
    color: COLORS.PRIMARY_DARK,
    fontSize: 13,
    fontWeight: '600',
  },
  previewHighlight: {
    fontWeight: '800',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linkIcon: {
    marginRight: 10,
  },
  linkText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: 8,
  },
});

export default PreferencesScreen;
