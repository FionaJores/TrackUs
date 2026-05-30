import React, { useState } from 'react';
import { Plus, Edit2, Trash2, PiggyBank } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useSearch } from '../hooks/useSearch';
import { PageHeader, Card, Button, Badge, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import SearchFilter from '../components/common/SearchFilter';
import SavingsForm from '../components/forms/SavingsForm';
import SavingsGrowthChart from '../components/charts/SavingsGrowthChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import { formatCurrency, SAVINGS_TYPES } from '../utils/constants';
import { formatDisplayDate, groupByCategory } from '../utils/dateHelpers';
import { useFinancialData } from '../hooks/useFinancialData';

export default function SavingsPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { monthlyTrend } = useFinancialData();

  const { searchTerm, setSearchTerm, filterMonth, setFilterMonth, filterCategory, setFilterCategory, filteredItems } =
    useSearch(state.savings, ['notes', 'type', 'amount']);

  const handleAdd = (data) => {
    dispatch({ type: 'ADD_SAVINGS', payload: data });
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    dispatch({ type: 'UPDATE_SAVINGS', payload: { ...editItem, ...data } });
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this savings entry?')) {
      dispatch({ type: 'DELETE_SAVINGS', payload: id });
    }
  };

  const savingsByType = groupByCategory(state.savings, 'type');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings"
        subtitle="Track your savings and investments"
        action={
          <Button variant="success" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Savings
          </Button>
        }
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SavingsGrowthChart data={monthlyTrend} />
        <CategoryPieChart data={savingsByType} title="Savings Distribution" />
      </div>

      {/* List */}
      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterMonth={filterMonth}
        setFilterMonth={setFilterMonth}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={SAVINGS_TYPES}
        placeholder="Search savings..."
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings recorded"
          description="Start building your savings today."
          action={<Button variant="success" onClick={() => setShowForm(true)}><Plus size={16} /> Add Savings</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{formatDisplayDate(item.date)}</td>
                    <td className="px-5 py-3.5"><Badge color="green">{item.type}</Badge></td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(item.amount)}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{item.notes || '-'}</td>
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
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Savings">
        <SavingsForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Savings">
        {editItem && <SavingsForm onSubmit={handleUpdate} initialData={editItem} onCancel={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
