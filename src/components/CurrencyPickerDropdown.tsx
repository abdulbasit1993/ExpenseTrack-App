import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { COLORS, getThemeColors } from '../constants/colors';
import type { ThemeColors } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { CURRENCY_SYMBOLS, getCurrencySymbol } from '../utils/helpers';

// Source list. Kept inline so the picker works offline without any API call,
// but it could be replaced with a server-side list if needed.

export const CURRENCY_OPTIONS: { code: string; name: string }[] = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
];

// Re-export the symbol map for consumers that want to keep using
// the same lookup helper that lives in utils/helpers.ts
export { CURRENCY_SYMBOLS };

type Props = {
  value: string;
  onChange: (code: string) => void;
};

const CurrencyPickerDropdown = ({ value, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { isDarkMode } = useTheme();
  const theme = getThemeColors(isDarkMode);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const selectedSymbol = getCurrencySymbol(value);
  const selectedName =
    CURRENCY_OPTIONS.find(option => option.code === value)?.name ?? value;

  const filtered = CURRENCY_OPTIONS.filter(option => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return (
      option.code.toLowerCase().includes(q) ||
      option.name.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Select currency"
      >
        <View style={styles.triggerContent}>
          <Text style={styles.triggerSymbol}>{selectedSymbol}</Text>
          <View style={styles.triggerTextWrap}>
            <Text style={styles.triggerCode}>{value}</Text>
            <Text style={styles.triggerName} numberOfLines={1}>
              {selectedName}
            </Text>
          </View>
        </View>
        <Icon name="chevron-down" size={18} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Currency</Text>

            <View style={styles.searchWrap}>
              <Icon
                name="search"
                size={16}
                color={theme.textTertiary}
                style={styles.searchIcon}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by code or name"
                placeholderTextColor={theme.inputPlaceholder}
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="characters"
              />
            </View>

            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No currencies match.</Text>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filtered.map(option => {
                  const isSelected = option.code === value;
                  const symbol = getCurrencySymbol(option.code);

                  return (
                    <TouchableOpacity
                      key={option.code}
                      style={[
                        styles.option,
                        isSelected && styles.selectedOption,
                      ]}
                      onPress={() => handleSelect(option.code)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.optionSymbol}>{symbol}</Text>
                      <View style={styles.optionTextWrap}>
                        <Text style={styles.optionCode}>{option.code}</Text>
                        <Text style={styles.optionName} numberOfLines={1}>
                          {option.name}
                        </Text>
                      </View>
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
    </>
  );
};

const makeStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    trigger: {
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
    triggerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    triggerSymbol: {
      color: COLORS.PRIMARY_DARK,
      fontSize: 22,
      fontWeight: '800',
      width: 36,
    },
    triggerTextWrap: {
      flex: 1,
    },
    triggerCode: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    triggerName: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.modalOverlay,
    },
    sheet: {
      maxHeight: '75%',
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
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      backgroundColor: theme.inputBg,
      marginBottom: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      color: theme.textPrimary,
      fontSize: 14,
      padding: 0,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingHorizontal: 14,
      borderRadius: 14,
      marginTop: 6,
    },
    selectedOption: {
      backgroundColor: theme.selectedBg,
    },
    optionSymbol: {
      color: COLORS.PRIMARY_DARK,
      fontSize: 18,
      fontWeight: '800',
      width: 36,
    },
    optionTextWrap: {
      flex: 1,
    },
    optionCode: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    optionName: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 24,
    },
  });

export default CurrencyPickerDropdown;
