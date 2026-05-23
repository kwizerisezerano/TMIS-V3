/**
 * Formats large numbers into human-readable strings (e.g., 1k, 1M, 1B, 1T)
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places to show
 * @returns {string} - Formatted string
 */
export const formatCompactNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  if (num === 0) return '0';

  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item) {
    return num >= item.value;
  });
  
  return item ? (num / item.value).toFixed(decimals).replace(rx, "$1") + item.symbol : "0";
};

/**
 * Standard currency formatter for RWF
 * @param {number|string} value 
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 RWF';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US').format(num) + ' RWF';
};
