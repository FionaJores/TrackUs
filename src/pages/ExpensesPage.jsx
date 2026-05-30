import React, { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useSearch } from '../hooks/useSearch';
import { PageHeader, Card, Button, Badge, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import SearchFilter from '../components/common/SearchFilter';
import ExpenseForm from '../components/forms/ExpenseForm';
import { formatCurrency, EXPENSE_CATEGORIES } from '../utils/constants';
import { formatDisplayDate } from '../utils/dateHelpers';

export default function ExpensesPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { searchTerm, setSearchTerm, filterMonth, setFilterMonth, filterCategory, setFilterCategory, filteredItems } =
    useSearch(state.expenses, ['notes', 'category', 'amount', 'paymentMethod']);

  const handleAdd = (data) => {
    dispatch({ type: 'ADD_EXPENSE', payload: data });
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: { ...editItem, ...data } });
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    }
  };

  const catColors = { Food: 'orange', Travel: 'blue', Rent: 'purple', Shopping: 'red', Bills: 'gray', Entertainment: 'green', Healthcare: 'blue', Education: 'purple', EMI: 'indigo', Other: 'gray' };

  // Split expenses into EMI and Daily Usage
  const emiExpenses = filteredItems.filter(item => item.category === 'EMI');
  const dailyExpenses = filteredItems.filter(item => item.category !== 'EMI');
  const emiTotal = emiExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const dailyTotal = dailyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Track and manage your spending"
        action={
          <Button variant="danger" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Expense
          </Button>
        }
      />

      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={EXPENSE_CATEGORIES}
        placeholder="Search expenses..."
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="No expenses recorded"
          description="Add your first expense to start tracking."
          action={<Button variant="danger" onClick={() => setShowForm(true)}><Plus size={16} /> Add Expense</Button>}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(emiTotal + dailyTotal)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">EMI Payments</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(emiTotal)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Daily Usage</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(dailyTotal)}</p>
            </Card>
          </div>

          {/* EMI Expenses Table */}
          {emiExpenses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-2 px-1">EMI Payments</h3>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-indigo-50 dark:bg-indigo-900/20">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {emiExpenses.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{formatDisplayDate(item.date)}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 text-right">{formatCurrency(item.amount)}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{item.notes || '-'}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Daily Usage Table */}
          {dailyExpenses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 px-1">Daily Usage</h3>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Category</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Payment</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {dailyExpenses.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{formatDisplayDate(item.date)}</td>
                          <td className="px-5 py-3.5"><Badge color={catColors[item.category] || 'gray'}>{item.category}</Badge></td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-red-600 dark:text-red-400 text-right">{formatCurrency(item.amount)}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.paymentMethod}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{item.notes || '-'}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setEditItem(item)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Expense">
        <ExpenseForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Expense">
        {editItem && <ExpenseForm onSubmit={handleUpdate} initialData={editItem} onCancel={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
