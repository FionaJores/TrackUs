import React, { useState } from 'react';
import { Plus, Trash2, Calculator, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Card, Button, ProgressBar, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { formatCurrency, EXPENSE_CATEGORIES } from '../utils/constants';
import { getCurrentMonth, filterByMonth, sumAmounts, groupByCategory } from '../utils/dateHelpers';

export default function BudgetPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const monthBudgets = state.budgets.filter(b => b.month === selectedMonth);
  const monthExpenses = filterByMonth(state.expenses, selectedMonth);
  const expensesByCategory = groupByCategory(monthExpenses, 'category');

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const category = formData.get('category');
    const exists = monthBudgets.find(b => b.category === category);
    if (exists) {
      dispatch({ type: 'UPDATE_BUDGET', payload: { id: exists.id, budgetAmount: formData.get('budgetAmount') } });
    } else {
      dispatch({
        type: 'ADD_BUDGET',
        payload: { month: selectedMonth, category, budgetAmount: formData.get('budgetAmount') }
      });
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  };

  const totalBudget = monthBudgets.reduce((s, b) => s + Number(b.budgetAmount), 0);
  const totalSpent = sumAmounts(monthExpenses);
  const overBudgetItems = monthBudgets.filter(b => {
    const spent = sumAmounts(expensesByCategory[b.category] || []);
    return spent > Number(b.budgetAmount);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Planning"
        subtitle="Set and track monthly category budgets"
        action={
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
            />
            <Button onClick={() => setShowForm(true)}><Plus size={16} /> Set Budget</Button>
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalBudget)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalSpent)}</p>
        </Card>
        <Card className={`p-4 ${totalSpent > totalBudget ? 'ring-2 ring-red-500/20' : ''}`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
          <p className={`text-xl font-bold mt-1 ${totalBudget - totalSpent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totalBudget - totalSpent)}
          </p>
        </Card>
      </div>

      {/* Over budget warnings */}
      {overBudgetItems.length > 0 && (
        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Over Budget Warning</span>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {overBudgetItems.map(b => b.category).join(', ')} {overBudgetItems.length === 1 ? 'is' : 'are'} over budget this month.
          </p>
        </Card>
      )}

      {/* Budget items */}
      {monthBudgets.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No budgets set"
          description={`Set budgets for ${selectedMonth} to track spending limits.`}
          action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Set Budget</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthBudgets.map(budget => {
            const spent = sumAmounts(expensesByCategory[budget.category] || []);
            const budgetAmt = Number(budget.budgetAmount);
            const remaining = budgetAmt - spent;
            const isOver = spent > budgetAmt;

            return (
              <Card key={budget.id} className={`p-4 ${isOver ? 'ring-1 ring-red-200 dark:ring-red-900/50' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{budget.category}</h4>
                  <button onClick={() => handleDelete(budget.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Spent: {formatCurrency(spent)}</span>
                    <span className="text-gray-500">Budget: {formatCurrency(budgetAmt)}</span>
                  </div>
                  <ProgressBar value={spent} max={budgetAmt} color={isOver ? 'red' : spent / budgetAmt > 0.8 ? 'orange' : 'green'} />
                  <p className={`text-xs font-medium ${isOver ? 'text-red-500' : 'text-emerald-500'}`}>
                    {isOver ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} remaining`}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Set Budget">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select name="category" required
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100">
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Amount (₹)</label>
            <input name="budgetAmount" type="number" required min="0" placeholder="Enter budget amount"
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100" />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save Budget</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
