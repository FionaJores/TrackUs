import React, { useState } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Pause, Play } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Card, Button, Badge, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { formatCurrency, INCOME_SOURCES, EXPENSE_CATEGORIES, SAVINGS_TYPES, RECURRING_FREQUENCIES } from '../utils/constants';

export default function RecurringPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    dispatch({
      type: 'ADD_RECURRING',
      payload: {
        type: formData.get('type'),
        category: formData.get('category'),
        amount: formData.get('amount'),
        frequency: formData.get('frequency'),
        nextDate: formData.get('nextDate'),
        description: formData.get('description'),
      }
    });
    setShowForm(false);
  };

  const toggleActive = (item) => {
    dispatch({ type: 'UPDATE_RECURRING', payload: { id: item.id, active: !item.active } });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this recurring transaction?')) {
      dispatch({ type: 'DELETE_RECURRING', payload: id });
    }
  };

  const typeColors = { income: 'blue', expense: 'red', savings: 'green' };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Transactions"
        subtitle="Manage automated recurring entries"
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Recurring</Button>}
      />

      {state.recurring.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No recurring transactions"
          description="Set up recurring entries for salary, rent, SIPs, etc."
          action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Recurring</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.recurring.map(item => (
            <Card key={item.id} className={`p-4 ${!item.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.description}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge color={typeColors[item.type]}>{item.type}</Badge>
                    <Badge color="gray">{item.frequency}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(item)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    {item.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatCurrency(item.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Next Date</span>
                  <span className="text-gray-700 dark:text-gray-300">{item.nextDate}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Recurring Transaction">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select name="type" required id="rec-type"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input name="category" required placeholder="e.g., Salary, Rent, SIP"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
              <input name="amount" type="number" required min="0"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
              <select name="frequency" required
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                {RECURRING_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Date</label>
              <input name="nextDate" type="date" required
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input name="description" required placeholder="Monthly Salary"
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Add Recurring</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
