import { useCurrencyStore } from '@/store/useCurrencyStore';

/**
 * Formats a number or string amount as a currency string with commas and decimal points.
 * Automatically translates the database base currency (GBP / £) to the visitor's detected local currency.
 * @param amount - The amount in British Pounds (GBP)
 * @param defaultSymbol - Fallback symbol if store is not loaded
 * @returns Formatted currency string
 */
export const formatPrice = (amount: number | string, defaultSymbol: string = '£'): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return `${defaultSymbol}0.00`;

  try {
    const store = useCurrencyStore.getState();
    if (store && store.initialized) {
      const converted = numericAmount * store.exchangeRate;
      return `${store.activeSymbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  } catch (e) {
    // Fallback if store is not available
  }

  // Default fallback is GBP (£)
  const fallbackSymbol = defaultSymbol === '₦' ? '£' : defaultSymbol;
  return `${fallbackSymbol}${numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
