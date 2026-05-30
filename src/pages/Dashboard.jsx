import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Percent, BarChart3, Lightbulb } from 'lucide-react';
import { StatCard, Card } from '../components/common/Card';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart';
import SavingsGrowthChart from '../components/charts/SavingsGrowthChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import TrendChart from '../components/charts/TrendChart';
import HealthScoreGauge from '../components/charts/HealthScoreGauge';
import { useFinancialData } from '../hooks/useFinancialData';
import { formatCurrency } from '../utils/constants';

export default function Dashboard() {
  const {
    monthTotalIncome, monthTotalExpenses, monthTotalSavings,
    currentBalance, monthSavingsRate, totalSavings,
    expensesByCategory, incomeBySource,
    healthScore, insights, monthlyTrend,
  } = useFinancialData();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Income" value={formatCurrency(monthTotalIncome)} icon={TrendingUp} color="blue" subtitle="This month" />
        <StatCard title="Total Expenses" value={formatCurrency(monthTotalExpenses)} icon={TrendingDown} color="red" subtitle="This month" />
        <StatCard title="Total Savings" value={formatCurrency(monthTotalSavings)} icon={PiggyBank} color="green" subtitle="This month" />
        <StatCard title="Current Balance" value={formatCurrency(currentBalance)} icon={Wallet} color="purple" subtitle="All time" />
        <StatCard title="Savings Rate" value={`${monthSavingsRate}%`} icon={Percent} color="orange" subtitle="This month" />
        <StatCard title="Net Worth" value={formatCurrency(totalSavings)} icon={BarChart3} color="green" subtitle="Total saved" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeExpenseChart data={monthlyTrend} />
        <SavingsGrowthChart data={monthlyTrend} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategoryPieChart data={expensesByCategory} title="Expense Breakdown" />
        <CategoryPieChart data={incomeBySource} title="Income Sources" />
        <HealthScoreGauge score={healthScore} />
      </div>

      {/* Trend & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={monthlyTrend} />
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Add transactions to get personalized insights.</p>
            ) : (
              insights.slice(0, 5).map((insight, i) => (
                <div key={i} className={`flex gap-2 p-3 rounded-xl text-sm ${
                  insight.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' :
                  insight.type === 'negative' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                  insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                }`}>
                  <span>{insight.type === 'positive' ? '✓' : insight.type === 'negative' ? '✗' : '!'}</span>
                  <span>{insight.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
