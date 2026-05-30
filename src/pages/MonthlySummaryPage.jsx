import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Lightbulb } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useFinancialData } from '../hooks/useFinancialData';
import { PageHeader, Card, StatCard } from '../components/common/Card';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { formatCurrency } from '../utils/constants';
import { getCurrentMonth, getPreviousMonth, getNextMonth, formatMonth, filterByMonth, sumAmounts, groupByCategory } from '../utils/dateHelpers';
import { generateInsights } from '../utils/analytics';

export default function MonthlySummaryPage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const { state } = useApp();

  const monthIncome = filterByMonth(state.income, currentMonth);
  const monthExpenses = filterByMonth(state.expenses, currentMonth);
  const monthSavings = filterByMonth(state.savings, currentMonth);

  const totalIncome = sumAmounts(monthIncome);
  const totalExpenses = sumAmounts(monthExpenses);
  const totalSavings = sumAmounts(monthSavings);
  const netSavings = totalIncome - totalExpenses;
  const savingsPercent = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  const expensesByCategory = groupByCategory(monthExpenses, 'category');
  const incomeBySource = groupByCategory(monthIncome, 'source');

  // Find biggest expense category and highest income source
  let biggestExpenseCat = '-';
  let highestIncomeSource = '-';
  let maxExpense = 0;
  let maxIncome = 0;

  Object.entries(expensesByCategory).forEach(([cat, items]) => {
    const total = sumAmounts(items);
    if (total > maxExpense) { maxExpense = total; biggestExpenseCat = cat; }
  });

  Object.entries(incomeBySource).forEach(([source, items]) => {
    const total = sumAmounts(items);
    if (total > maxIncome) { maxIncome = total; highestIncomeSource = source; }
  });

  const insights = generateInsights(state.income, state.expenses, state.savings, currentMonth);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Summary"
        subtitle={formatMonth(currentMonth + '-01')}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(getPreviousMonth(currentMonth))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
              {formatMonth(currentMonth + '-01')}
            </span>
            <button onClick={() => setCurrentMonth(getNextMonth(currentMonth))} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ChevronRight size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={formatCurrency(totalIncome)} icon={TrendingUp} color="blue" />
        <StatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="red" />
        <StatCard title="Total Saved" value={formatCurrency(totalSavings)} icon={PiggyBank} color="green" />
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Savings Rate</p>
          <p className={`text-2xl font-bold mt-2 ${savingsPercent >= 20 ? 'text-emerald-600' : savingsPercent >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
            {savingsPercent}%
          </p>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={expensesByCategory} title="Expense Breakdown" />
        <CategoryPieChart data={incomeBySource} title="Income Sources" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net Savings</p>
          <p className={`text-xl font-bold mt-1 ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netSavings)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Biggest Expense Category</p>
          <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{biggestExpenseCat}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(maxExpense)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Top Income Source</p>
          <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">{highestIncomeSource}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(maxIncome)}</p>
        </Card>
      </div>

      {/* Insights */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-amber-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Insights</h3>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-gray-400">No insights available for this month. Add more transactions.</p>
        ) : (
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm ${
                insight.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' :
                insight.type === 'negative' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
              }`}>
                {insight.message}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
