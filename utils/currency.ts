import { useCurrencyStore } from '@/store/currency';

export const formatCurrency = (amount: number): string => {
  const { currency } = useCurrencyStore.getState();
  return `${currency.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCurrencyWithoutSymbol = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}; 