import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Target, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Card, Button, ProgressBar, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { formatCurrency } from '../utils/constants';
import { format, addMonths, parseISO } from 'date-fns';

export default function GoalsPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedGoal, setExpandedGoal] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const totalAmount = Number(formData.get('totalAmount'));
    const emiAmount = Number(formData.get('emiAmount'));
    const totalMonths = Math.ceil(totalAmount / emiAmount);
    dispatch({
      type: 'ADD_GOAL',
      payload: {
        name: formData.get('name'),
        totalAmount: totalAmount,
        emiAmount: emiAmount,
        totalMonths: totalMonths,
        startDate: formData.get('startDate'),
        notes: formData.get('notes'),
      }
    });
    setShowForm(false);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const totalAmount = Number(formData.get('totalAmount'));
    const emiAmount = Number(formData.get('emiAmount'));
    const totalMonths = Math.ceil(totalAmount / emiAmount);
    dispatch({
      type: 'UPDATE_GOAL',
      payload: {
        id: editItem.id,
        name: formData.get('name'),
        totalAmount: totalAmount,
        emiAmount: emiAmount,
        totalMonths: totalMonths,
        startDate: formData.get('startDate'),
        notes: formData.get('notes'),
      }
    });
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this EMI?')) {
      dispatch({ type: 'DELETE_GOAL', payload: id });
    }
  };

  const toggleMonthPaid = (goal, monthIndex) => {
    const paidMonths = parsePaidMonths(goal.paidMonths);
    const alreadyPaid = paidMonths.includes(monthIndex);

    if (alreadyPaid) {
      // Uncheck - remove from paid and remove the expense
      const updated = paidMonths.filter(m => m !== monthIndex);
      dispatch({ type: 'UPDATE_GOAL', payload: { id: goal.id, paidMonths: updated } });
      // Remove corresponding expense
      const expenseTag = `EMI:${goal.id}:${monthIndex}`;
      const expense = state.expenses.find(ex => ex.notes === expenseTag);
      if (expense) dispatch({ type: 'DELETE_EXPENSE', payload: expense.id });
    } else {
      // Check - add to paid and create an expense entry
      const updated = [...paidMonths, monthIndex].sort((a, b) => a - b);
      dispatch({ type: 'UPDATE_GOAL', payload: { id: goal.id, paidMonths: updated } });
      // Add as expense (reduces from salary/income)
      const monthDate = format(addMonths(parseISO(goal.startDate), monthIndex), 'yyyy-MM-dd');
      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          date: monthDate,
          amount: goal.emiAmount,
          category: 'EMI',
          paymentMethod: 'Net Banking',
          notes: `EMI:${goal.id}:${monthIndex}`,
        }
      });
    }
  };

  // Parse paidMonths from sheet (stored as JSON string or already array)
  const parsePaidMonths = (val) => {
    if (Array.isArray(val)) return val;
    if (!val || val === '') return [];
    try { return JSON.parse(val); } catch { return []; }
  };

  const getMonthLabel = (startDate, monthIndex) => {
    try {
      return format(addMonths(parseISO(startDate), monthIndex), 'MMM yyyy');
    } catch {
      return `Month ${monthIndex + 1}`;
    }
  };

  const GoalForm = ({ onSubmit, initialData = null, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMI Name</label>
          <input name="name" defaultValue={initialData?.name} required placeholder="e.g., Car Loan, Home Loan"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Amount (₹)</label>
          <input name="totalAmount" type="number" defaultValue={initialData?.totalAmount} required min="1"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMI Per Month (₹)</label>
          <input name="emiAmount" type="number" defaultValue={initialData?.emiAmount} required min="1"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
          <input name="startDate" type="date" defaultValue={initialData?.startDate} required
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <input name="notes" defaultValue={initialData?.notes} placeholder="Optional"
            className="w-full px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-gray-100" />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{initialData ? 'Update EMI' : 'Add EMI'}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="EMI Tracker"
        subtitle="Track your EMI payments month by month"
        action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> New EMI</Button>}
      />

      {state.goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No EMIs added"
          description="Add an EMI to track monthly payments."
          action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add EMI</Button>}
        />
      ) : (
        <div className="space-y-4">
          {state.goals.map(goal => {
            const totalAmount = Number(goal.totalAmount) || 0;
            const emiAmount = Number(goal.emiAmount) || 0;
            const totalMonths = Number(goal.totalMonths) || (emiAmount > 0 ? Math.ceil(totalAmount / emiAmount) : 1);
            const paidMonths = parsePaidMonths(goal.paidMonths);
            const paidCount = paidMonths.length;
            const paidAmount = paidCount * emiAmount;
            const remainingAmount = Math.max(0, totalAmount - paidAmount);
            const isExpanded = expandedGoal === goal.id;
            const isCompleted = paidAmount >= totalAmount;

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={`p-5 ${isCompleted ? 'ring-2 ring-green-400 dark:ring-green-600' : ''}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="cursor-pointer flex-1" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                        {isCompleted && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Completed</span>}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatCurrency(emiAmount)}/month · {totalMonths} months · Started {goal.startDate ? format(parseISO(goal.startDate), 'MMM yyyy') : 'N/A'}
                      </p>
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

                  {/* Progress */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Paid: {formatCurrency(paidAmount)}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Total: {formatCurrency(totalAmount)}</span>
                    </div>
                    <ProgressBar value={paidAmount} max={totalAmount} color={isCompleted ? 'green' : 'blue'} />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{paidCount}/{totalMonths} months paid</span>
                      <span>Remaining: {formatCurrency(remainingAmount)}</span>
                    </div>
                  </div>

                  {/* Monthly Checkboxes */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3"
                    >
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Tap a month to mark as paid (adds to expenses, reduces from salary)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {Array.from({ length: totalMonths }, (_, i) => {
                          const isPaid = paidMonths.includes(i);
                          return (
                            <button
                              key={i}
                              onClick={() => toggleMonthPaid(goal, i)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                isPaid
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                              }`}
                            >
                              {isPaid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                              {getMonthLabel(goal.startDate, i)}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {!isExpanded && (
                    <button
                      onClick={() => setExpandedGoal(goal.id)}
                      className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 mt-1"
                    >
                      Show monthly payments →
                    </button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add EMI">
        <GoalForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit EMI">
        {editItem && <GoalForm onSubmit={handleUpdate} initialData={editItem} onCancel={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
