/**
 * Currency Formatting Composable
 * Handles formatting for RWF and compact notation for large numbers (k, M, B, T)
 */

export const useCurrency = () => {
  /**
   * Formats a number as currency
   * @param {number|string} amount - The amount to format
   * @param {boolean} compact - Whether to use compact notation (k, M, B, T)
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, compact = false) => {
    const value = parseFloat(amount || 0);
    
    if (compact) {
      if (value < 1000) return value.toString() + ' RWF';
      
      const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" }
      ];
      const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
      var item = lookup.slice().reverse().find(function(item) {
        return value >= item.value;
      });
      return item ? (value / item.value).toFixed(1).replace(rx, "$1") + item.symbol + ' RWF' : "0 RWF";
    }
    
    return value.toLocaleString() + ' RWF';
  };

  /**
   * Specifically formats large dashboard numbers
   * Always uses compact notation for numbers >= 10,000
   */
  const formatDashboardAmount = (amount) => {
    const value = parseFloat(amount || 0);
    // Use compact notation for numbers 10k or more
    return formatCurrency(value, value >= 10000);
  };

  return {
    formatCurrency,
    formatDashboardAmount
  };
};

