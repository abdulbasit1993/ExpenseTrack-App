const formatDisplayDate = (value: Date) =>
  value.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const DEFAULT_CURRENCY_SYMBOL = '$';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  PKR: 'PKR ',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  AED: 'د.إ',
  SAR: '﷼',
  NGN: '₦',
};

// Resolves a currency code ("USD") or symbol ("$") to a display symbol.
const getCurrencySymbol = (currency?: string | null): string => {
  if (!currency) {
    return DEFAULT_CURRENCY_SYMBOL;
  }

  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
};

const formatCurrency = (
  amount: number,
  currencySymbol: string = DEFAULT_CURRENCY_SYMBOL,
) =>
  `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export {
  formatDisplayDate,
  getCurrencySymbol,
  formatCurrency,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY_SYMBOL,
};
