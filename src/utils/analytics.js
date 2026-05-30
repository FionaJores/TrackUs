import { sumAmounts, groupByMonth, groupByCategory, getLast12Months, filterByMonth, getPreviousMonth } from './dateHelpers';
import { formatCurrency } from './constants';

export const calculateFinancialHealth = (income, expenses, savings, goals, budgets, currentMonth) => {
  const monthIncome = sumAmounts(filterByMonth(income, currentMonth));
  const monthExpenses = sumAmounts(filterByMonth(expenses, currentMonth));
  const monthSavings = sumAmounts(filterByMonth(savings, currentMonth));

  let score = 50;

  // Savings rate (max 30 pts)
  const savingsRate = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : 0;
  if (savingsRate >= 30) score += 30;
  else if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;
  else score += savingsRate;

  // Expense control (max 20 pts)
  const expenseRatio = monthIncome > 0 ? (monthExpenses / monthIncome) * 100 : 100;
  if (expenseRatio <= 50) score += 20;
  else if (expenseRatio <= 70) score += 15;
  else if (expenseRatio <= 90) score += 5;
  else score -= 10;

  // Budget adherence (max 10 pts)
  const monthBudgets = budgets.filter(b => b.month === currentMonth);
  if (monthBudgets.length > 0) {
    const monthExpensesByCategory = groupByCategory(filterByMonth(expenses, currentMonth));
    let adherentCount = 0;
    monthBudgets.forEach(b => {
      const spent = sumAmounts(monthExpensesByCategory[b.category] || []);
      if (spent <= Number(b.budgetAmount)) adherentCount++;
    });
    score += Math.round((adherentCount / monthBudgets.length) * 10);
  }

  // Emergency fund (max 10 pts)
  const emergencyFund = savings.filter(s => s.type === 'Emergency Fund');
  const emergencyTotal = sumAmounts(emergencyFund);
  const monthlyExpenseAvg = sumAmounts(expenses) / Math.max(Object.keys(groupByMonth(expenses)).length, 1);
  const emergencyMonths = monthlyExpenseAvg > 0 ? emergencyTotal / monthlyExpenseAvg : 0;
  if (emergencyMonths >= 6) score += 10;
  else if (emergencyMonths >= 3) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
};

export const generateInsights = (income, expenses, savings, currentMonth) => {
  const insights = [];
  const monthIncome = sumAmounts(filterByMonth(income, currentMonth));
  const monthExpenses = sumAmounts(filterByMonth(expenses, currentMonth));
  const monthSavings = sumAmounts(filterByMonth(savings, currentMonth));

  const prevMonth = getPreviousMonth(currentMonth);
  const prevIncome = sumAmounts(filterByMonth(income, prevMonth));
  const prevExpenses = sumAmounts(filterByMonth(expenses, prevMonth));
  const prevSavings = sumAmounts(filterByMonth(savings, prevMonth));

  // Savings rate insight
  if (monthIncome > 0) {
    const savingsRate = Math.round((monthSavings / monthIncome) * 100);
    insights.push({
      type: savingsRate >= 20 ? 'positive' : savingsRate >= 10 ? 'neutral' : 'negative',
      message: `You saved ${savingsRate}% of your income this month.`
    });
  }

  // Expense comparison
  if (prevExpenses > 0 && monthExpenses > 0) {
    const changePercent = Math.round(((monthExpenses - prevExpenses) / prevExpenses) * 100);
    if (changePercent > 10) {
      insights.push({
        type: 'negative',
        message: `Spending increased by ${changePercent}% compared to last month.`
      });
    } else if (changePercent < -10) {
      insights.push({
        type: 'positive',
        message: `Great! Spending decreased by ${Math.abs(changePercent)}% compared to last month.`
      });
    }
  }

  // Category analysis
  const categoryExpenses = groupByCategory(filterByMonth(expenses, currentMonth));
  const prevCategoryExpenses = groupByCategory(filterByMonth(expenses, prevMonth));
  Object.entries(categoryExpenses).forEach(([cat, items]) => {
    const catTotal = sumAmounts(items);
    const prevCatTotal = sumAmounts(prevCategoryExpenses[cat] || []);
    if (prevCatTotal > 0) {
      const change = Math.round(((catTotal - prevCatTotal) / prevCatTotal) * 100);
      if (change > 20) {
        insights.push({
          type: 'warning',
          message: `${cat} spending increased by ${change}% compared to last month.`
        });
      }
    }
  });

  // Income growth
  if (prevIncome > 0 && monthIncome > prevIncome) {
    const growth = Math.round(((monthIncome - prevIncome) / prevIncome) * 100);
    if (growth > 5) {
      insights.push({
        type: 'positive',
        message: `Income grew by ${growth}% this month. Keep it up!`
      });
    }
  }

  return insights;
};

export const calculateForecast = (savings, months = 6) => {
  const grouped = groupByMonth(savings);
  const monthlyTotals = Object.values(grouped).map(items => sumAmounts(items));
  if (monthlyTotals.length < 2) return null;

  const avgMonthlySavings = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;
  const currentTotal = sumAmounts(savings);

  return {
    avgMonthlySavings,
    projections: [
      { period: '6 months', amount: currentTotal + avgMonthlySavings * 6 },
      { period: '1 year', amount: currentTotal + avgMonthlySavings * 12 },
      { period: '5 years', amount: currentTotal + avgMonthlySavings * 60 },
    ]
  };
};

export const getTopCategories = (expenses, limit = 5) => {
  const grouped = groupByCategory(expenses);
  return Object.entries(grouped)
    .map(([category, items]) => ({ category, total: sumAmounts(items), count: items.length }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

export const getMonthlyTrend = (income, expenses, savings) => {
  const months = getLast12Months();
  return months.map(month => {
    const monthIncome = sumAmounts(filterByMonth(income, month));
    const monthExpenses = sumAmounts(filterByMonth(expenses, month));
    const monthSavings = sumAmounts(filterByMonth(savings, month));
    return {
      month,
      income: monthIncome,
      expenses: monthExpenses,
      savings: monthSavings,
      net: monthIncome - monthExpenses,
    };
  });
};
