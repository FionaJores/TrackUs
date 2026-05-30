import React, { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useSearch } from '../hooks/useSearch';
import { PageHeader, Card, Button, Badge, EmptyState } from '../components/common/Card';
import Modal from '../components/common/Modal';
import SearchFilter from '../components/common/SearchFilter';
import IncomeForm from '../components/forms/IncomeForm';
import { formatCurrency, INCOME_SOURCES } from '../utils/constants';
import { formatDisplayDate } from '../utils/dateHelpers';

export default function IncomePage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { searchTerm, setSearchTerm, filterMonth, setFilterMonth, filterCategory, setFilterCategory, filteredItems } =
    useSearch(state.income, ['notes', 'source', 'amount']);

  const handleAdd = (data) => {
    dispatch({ type: 'ADD_INCOME', payload: data });
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    dispatch({ type: 'UPDATE_INCOME', payload: { ...editItem, ...data } });
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this income entry?')) {
      dispatch({ type: 'DELETE_INCOME', payload: id });
    }
  };

  const sourceColors = { Salary: 'blue', Freelancing: 'purple', Bonus: 'green', 'Investment Return': 'orange', Gift: 'red', Other: 'gray' };

  return (
    <div>
      <PageHeader
        title="Income"
        subtitle="Track all your income sources"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Income
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
        categories={INCOME_SOURCES}
        placeholder="Search income..."
      />

      {filteredItems.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No income entries"
          description="Start tracking your income by adding your first entry."
          action={<Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Income</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Source</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Notes</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{formatDisplayDate(item.date)}</td>
                    <td className="px-5 py-3.5"><Badge color={sourceColors[item.source] || 'gray'}>{item.source}</Badge></td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-blue-600 dark:text-blue-400 text-right">{formatCurrency(item.amount)}</td>
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

      {/* Add Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Income">
        <IncomeForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Income">
        {editItem && <IncomeForm onSubmit={handleUpdate} initialData={editItem} onCancel={() => setEditItem(null)} />}
      </Modal>
    </div>
  );
}
