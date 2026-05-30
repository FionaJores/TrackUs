import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { filterByMonth, sumAmounts, groupByCategory, groupByMonth, getLast12Months } from '../utils/dateHelpers';
import { getCurrentMonth } from '../utils/dateHelpers';
import { calculateFinancialHealth, generateInsights, calculateForecast, getMonthlyTrend } from '../utils/analytics';

export function useFinancialData(month = null) {
  const { state } = useApp();
  const currentMonth = month || getCurrentMonth();

  return useMemo(() => {
    const monthIncome = filterByMonth(state.income, currentMonth);
    const monthExpenses = filterByMonth(state.expenses, currentMonth);
    const monthSavings = filterByMonth(state.savings, currentMonth);

    const totalIncome = sumAmounts(state.income);
    const totalExpenses = sumAmounts(state.expenses);
    const totalSavings = sumAmounts(state.savings);

    const monthTotalIncome = sumAmounts(monthIncome);
    const monthTotalExpenses = sumAmounts(monthExpenses);
    const monthTotalSavings = sumAmounts(monthSavings);

    const currentBalance = totalIncome - totalExpenses - totalSavings;
    const monthSavingsRate = monthTotalIncome > 0 ? Math.round((monthTotalSavings / monthTotalIncome) * 100) : 0;

    const expensesByCategory = groupByCategory(monthExpenses, 'category');
    const incomeBySource = groupByCategory(monthIncome, 'source');

    const healthScore = calculateFinancialHealth(
      state.income, state.expenses, state.savings, state.goals, state.budgets, currentMonth
    );

    const insights = generateInsights(state.income, state.expenses, state.savings, currentMonth);
    const forecast = calculateForecast(state.savings);
    const monthlyTrend = getMonthlyTrend(state.income, state.expenses, state.savings);

    // Lifetime stats
    const monthlyIncomeData = groupByMonth(state.income);
    const monthlyExpenseData = groupByMonth(state.expenses);
    const monthlySavingsData = groupByMonth(state.savings);

    const allMonths = Object.keys({ ...monthlyIncomeData, ...monthlyExpenseData, ...monthlySavingsData }).sort();
    const avgMonthlyIncome = allMonths.length > 0 ? totalIncome / allMonths.length : 0;
    const avgMonthlyExpenses = allMonths.length > 0 ? totalExpenses / allMonths.length : 0;
    const avgMonthlySavings = allMonths.length > 0 ? totalSavings / allMonths.length : 0;

    // Best/worst months
    let bestSavingMonth = null;
    let worstSpendingMonth = null;
    let maxSaving = 0;
    let maxSpending = 0;

    Object.entries(monthlySavingsData).forEach(([m, items]) => {
      const total = sumAmounts(items);
      if (total > maxSaving) { maxSaving = total; bestSavingMonth = m; }
    });

    Object.entries(monthlyExpenseData).forEach(([m, items]) => {
      const total = sumAmounts(items);
      if (total > maxSpending) { maxSpending = total; worstSpendingMonth = m; }
    });

    return {
      // Current month
      monthIncome, monthExpenses, monthSavings,
      monthTotalIncome, monthTotalExpenses, monthTotalSavings,
      monthSavingsRate,
      expensesByCategory, incomeBySource,
      // Lifetime
      totalIncome, totalExpenses, totalSavings, currentBalance,
      avgMonthlyIncome, avgMonthlyExpenses, avgMonthlySavings,
      bestSavingMonth, worstSpendingMonth, maxSaving, maxSpending,
      // Analytics
      healthScore, insights, forecast, monthlyTrend,
    };
  }, [state.income, state.expenses, state.savings, state.goals, state.budgets, currentMonth]);
}
