const { 
  startOfMonth, endOfMonth, subMonths, 
  startOfYear, endOfYear, subYears,
  format, parseISO, isAfter, isBefore,
  addMonths
} = require('date-fns');

/**
 * Get date range based on timeframe
 * @param {string} timeframe - The timeframe (1month, 3months, 6months, 1year)
 * @returns {Object} - Object containing start and end dates
 */
exports.getDateRange = (timeframe) => {
  const now = new Date();
  
  switch (timeframe) {
    case '1month':
      return { start: subMonths(startOfMonth(now), 1), end: now };
    case '3months':
      return { start: subMonths(now, 3), end: now };
    case '6months':
      return { start: subMonths(now, 6), end: now };
    case '1year':
      return { start: subYears(now, 1), end: now };
    default:
      // Default: 6 months
      return { start: subMonths(now, 6), end: now };
  }
};

/**
 * Format date to string
 * @param {Date} date - The date to format
 * @param {string} formatString - The format string (default: 'yyyy-MM-dd')
 * @returns {string} - Formatted date string
 */
exports.formatDate = (date, formatString = 'yyyy-MM-dd') => {
  return format(date, formatString);
};

/**
 * Parse ISO date string to Date object
 * @param {string} dateString - The date string to parse
 * @returns {Date} - Parsed Date object
 */
exports.parseDate = (dateString) => {
  return parseISO(dateString);
};