/**
 * Currency Formatting Composable
 * Handles formatting for RWF and compact notation for large numbers (K, M, B, T)
 */

export const useCurrency = () => {
  /**
   * Formats a number as currency
   * @param {number|string} amount - The amount to format
   * @param {boolean} compact - Whether to use compact notation (K, M, B, T)
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, compact = false) => {
    const value = parseFloat(amount || 0);
    
    if (compact) {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value) + ' RWF';
    }
    
    return value.toLocaleString() + ' RWF';
  };

  /**
   * Specifically formats large dashboard numbers
   */
  const formatDashboardAmount = (amount) => {
    const value = parseFloat(amount || 0);
    // Use compact notation if amount is 100k or more
    return formatCurrency(value, value >= 100000);
  };

  return {
    formatCurrency,
    formatDashboardAmount
  };
};
