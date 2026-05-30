import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Card, Button, ProgressBar, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { formatCurrency } from '../utils/constants';
import { differenceInDays, format } from 'date-fns';

export default function GoalsPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    dispatch({
      type: 'ADD_GOAL',
      payload: {
        name: formData.get('name'),
        targetAmount: formData.get('targetAmount'),
        currentAmount: formData.get('currentAmount') || '0',
        targetDate: formData.get('targetDate'),
        category: formData.get('category'),
        notes: formData.get('notes'),
      }
    });
    setShowForm(false);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    dispatch({
      type: 'UPDATE_GOAL',
      payload: {
        id: editItem.id,
        name: formData.get('name'),
        targetAmount: formData.get('targetAmount'),
        currentAmount: formData.get('currentAmount'),
        targetDate: formData.get('targetDate'),
        category: formData.get('category'),
        notes: formData.get('notes'),
      }
    });
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this goal?')) {
      dispatch({ type: 'DELETE_GOAL', payload: id });
    }
  };

  const GoalForm = ({ onSubmit, initialData = null, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
          <input name="name" defaultValue={initialData?.name} required placeholder="e.g., Buy a Car"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount (₹)</label>
          <input name="targetAmount" type="number" defaultValue={initialData?.targetAmount} required min="0"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Progress (₹)</label>
          <input name="currentAmount" type="number" defaultValue={initialData?.currentAmount || 0} min="0"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date</label>
          <input name="targetDate" type="date" defaultValue={initialData?.targetDate} required
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select name="category" defaultValue={initialData?.category || 'General'}
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100">
            {['Emergency Fund', 'House Down Payment', 'Car', 'Vacation', 'Education', 'Retirement', 'General'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <input name="notes" defaultValue={initialData?.notes} placeholder="Optional notes"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{initialData ? 'Update Goal' : 'Create Goal'}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        subtitle="Track progress toward your financial goals"
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> New Goal</Button>}
      />

      {state.goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals set"
          description="Create a savings goal to start tracking your progress."
          action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Create Goal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.goals.map(goal => {
            const target = Number(goal.targetAmount);
            const current = Number(goal.currentAmount);
            const remaining = Math.max(0, target - current);
            const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
            const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
            const monthlyNeeded = remaining / monthsLeft;

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-5 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{goal.category}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditItem(goal)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(goal.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{formatCurrency(current)}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(target)}</span>
                    </div>
                    <ProgressBar value={current} max={target} color="orange" />

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-400">Remaining</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(remaining)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Days Left</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{daysLeft > 0 ? daysLeft : 'Overdue'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">Monthly Needed</p>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{formatCurrency(monthlyNeeded)}/mo</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Create Goal">
        <GoalForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Goal">
        {editItem && <GoalForm onSubmit={handleUpdate} initialData={editItem} onCancel={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
