export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  // Return original if not 10 digits
  return phoneNumber;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('en-US').format(number);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const formatDateRange = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return `${formatDate(dateObj)} ${formatTime(dateObj)}`;
};

export const formatNumberWithSign = (number: number): string => {
  return number >= 0 ? `+${formatNumber(number)}` : formatNumber(number);
};

export const formatPercentageWithSign = (value: number): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value) / 100);
  
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

export const getRelativeDateLabel = (dateRange: string): string => {
  switch (dateRange) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'this_week':
      return 'This Week';
    case 'this_month':
      return 'This Month';
    case 'this_quarter':
      return 'This Quarter';
    case 'this_year':
      return 'This Year';
    default:
      return 'Custom Range';
  }
};

export const getDateRangeFromOption = (option: string): { from: Date; to: Date } => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  switch (option) {
    case 'today': {
      const from = new Date(today);
      from.setHours(0, 0, 0, 0);
      return { from, to: today };
    }
    case 'yesterday': {
      const from = new Date(today);
      from.setDate(from.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      
      const to = new Date(from);
      to.setHours(23, 59, 59, 999);
      
      return { from, to };
    }
    case 'this_week': {
      const from = new Date(today);
      from.setDate(from.getDate() - from.getDay());
      from.setHours(0, 0, 0, 0);
      
      return { from, to: today };
    }
    case 'this_month': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      
      return { from, to: today };
    }
    case 'this_quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const from = new Date(today.getFullYear(), quarter * 3, 1);
      from.setHours(0, 0, 0, 0);
      
      return { from, to: today };
    }
    case 'this_year': {
      const from = new Date(today.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      
      return { from, to: today };
    }
    default: {
      // Default to this month
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
      
      return { from, to: today };
    }
  }
};

export const getPreviousPeriodDateRange = (
  currentRange: { from: Date; to: Date }
): { from: Date; to: Date } => {
  const { from: currentFrom, to: currentTo } = currentRange;
  
  // Calculate the duration of the current period in milliseconds
  const durationMs = currentTo.getTime() - currentFrom.getTime();
  
  // Calculate the start and end of the previous period
  const previousTo = new Date(currentFrom.getTime() - 1); // 1ms before current period starts
  const previousFrom = new Date(previousTo.getTime() - durationMs);
  
  return { from: previousFrom, to: previousTo };
};