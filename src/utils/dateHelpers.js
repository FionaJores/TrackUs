import { format, parse, startOfMonth, endOfMonth, subMonths, addMonths, differenceInMonths, isWithinInterval } from 'date-fns';

export const formatDate = (date) => format(new Date(date), 'yyyy-MM-dd');
export const formatDisplayDate = (date) => format(new Date(date), 'dd MMM yyyy');
export const formatMonthYear = (date) => format(new Date(date), 'MMM yyyy');
export const formatMonth = (date) => format(new Date(date), 'MMMM yyyy');

export const getCurrentMonth = () => format(new Date(), 'yyyy-MM');
export const getCurrentYear = () => new Date().getFullYear();

export const getMonthRange = (monthStr) => {
  const date = parse(monthStr + '-01', 'yyyy-MM-dd', new Date());
  return { start: startOfMonth(date), end: endOfMonth(date) };
};

export const getPreviousMonth = (monthStr) => {
  const date = parse(monthStr + '-01', 'yyyy-MM-dd', new Date());
  return format(subMonths(date, 1), 'yyyy-MM');
};

export const getNextMonth = (monthStr) => {
  const date = parse(monthStr + '-01', 'yyyy-MM-dd', new Date());
  return format(addMonths(date, 1), 'yyyy-MM');
};

export const getMonthsInRange = (startDate, endDate) => {
  const months = [];
  let current = startOfMonth(new Date(startDate));
  const end = endOfMonth(new Date(endDate));
  while (current <= end) {
    months.push(format(current, 'yyyy-MM'));
    current = addMonths(current, 1);
  }
  return months;
};

export const filterByMonth = (items, monthStr) => {
  const { start, end } = getMonthRange(monthStr);
  return items.filter(item => {
    const date = new Date(item.date);
    return isWithinInterval(date, { start, end });
  });
};

export const filterByYear = (items, year) => {
  return items.filter(item => new Date(item.date).getFullYear() === year);
};

export const groupByMonth = (items) => {
  const grouped = {};
  items.forEach(item => {
    const month = format(new Date(item.date), 'yyyy-MM');
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(item);
  });
  return grouped;
};

export const groupByCategory = (items, key = 'category') => {
  const grouped = {};
  items.forEach(item => {
    const cat = item[key] || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });
  return grouped;
};

export const sumAmounts = (items) => items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

export const getMonthsBetween = (date1, date2) => {
  return Math.abs(differenceInMonths(new Date(date1), new Date(date2)));
};

export const getLast12Months = () => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    months.push(format(subMonths(new Date(), i), 'yyyy-MM'));
  }
  return months;
};
