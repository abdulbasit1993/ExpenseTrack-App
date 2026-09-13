export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  inputBg: string;
  inputPlaceholder: string;
  modalOverlay: string;
  selectedBg: string;
};

export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputPlaceholder: '#94A3B8',
  modalOverlay: 'rgba(15, 23, 42, 0.42)',
  selectedBg: '#EEF2FF',
};

export const darkTheme: ThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  border: '#334155',
  inputBg: '#1E293B',
  inputPlaceholder: '#94A3B8',
  modalOverlay: 'rgba(0, 0, 0, 0.6)',
  selectedBg: '#312E81',
};
