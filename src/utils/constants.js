export const INCOME_SOURCES = [
  'Salary', 'Freelancing', 'Bonus', 'Investment Return', 'Gift', 'Other'
];

export const EXPENSE_CATEGORIES = [
  'Food', 'Travel', 'Rent', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'
];

export const SAVINGS_TYPES = [
  'Emergency Fund', 'Fixed Deposit', 'Mutual Fund', 'Stocks', 'Gold', 'Cash Savings', 'Other'
];

export const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'
];

export const RECURRING_FREQUENCIES = [
  'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'
];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CHART_COLORS = {
  income: '#3b82f6',
  expense: '#ef4444',
  savings: '#10b981',
  goals: '#f59e0b',
  categories: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316']
};

export const CURRENCY_SYMBOL = '₹';

export const formatCurrency = (amount) => {
  return `${CURRENCY_SYMBOL}${Number(amount || 0).toLocaleString('en-IN')}`;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
