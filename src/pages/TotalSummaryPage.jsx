import React from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Calendar, Award } from 'lucide-react';
import { useFinancialData } from '../hooks/useFinancialData';
import { PageHeader, StatCard, Card } from '../components/common/Card';
import TrendChart from '../components/charts/TrendChart';
import HealthScoreGauge from '../components/charts/HealthScoreGauge';
import { formatCurrency } from '../utils/constants';
import { formatMonth } from '../utils/dateHelpers';

export default function TotalSummaryPage() {
  const {
    totalIncome, totalExpenses, totalSavings, currentBalance,
    avgMonthlyIncome, avgMonthlyExpenses, avgMonthlySavings,
    bestSavingMonth, worstSpendingMonth, maxSaving, maxSpending,
    healthScore, forecast, monthlyTrend,
  } = useFinancialData();

  return (
    <div className="space-y-6">
      <PageHeader title="Total Summary" subtitle="Lifetime financial overview" />

      {/* Lifetime Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Lifetime Income" value={formatCurrency(totalIncome)} icon={TrendingUp} color="blue" />
        <StatCard title="Lifetime Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="red" />
        <StatCard title="Lifetime Savings" value={formatCurrency(totalSavings)} icon={PiggyBank} color="green" />
        <StatCard title="Net Balance" value={formatCurrency(currentBalance)} icon={Wallet} color="purple" />
      </div>

      {/* Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Monthly Income</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(avgMonthlyIncome)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Monthly Spending</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(avgMonthlyExpenses)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Monthly Savings</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(avgMonthlySavings)}</p>
        </Card>
      </div>

      {/* Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <Award size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Best Saving Month</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {bestSavingMonth ? formatMonth(bestSavingMonth + '-01') : 'N/A'}
              </p>
              <p className="text-xs text-emerald-600">{formatCurrency(maxSaving)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30">
              <Calendar size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Highest Spending Month</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {worstSpendingMonth ? formatMonth(worstSpendingMonth + '-01') : 'N/A'}
              </p>
              <p className="text-xs text-red-600">{formatCurrency(maxSpending)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart data={monthlyTrend} title="Overall Trend" />
        </div>
        <HealthScoreGauge score={healthScore} />
      </div>

      {/* Forecast */}
      {forecast && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Future Forecast</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Based on avg monthly savings of {formatCurrency(forecast.avgMonthlySavings)}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.projections.map(p => (
              <div key={p.period} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">{p.period}</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
