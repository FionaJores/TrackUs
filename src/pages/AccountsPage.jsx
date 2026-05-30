import React, { useState } from 'react';
import { useAccount } from '../contexts/AccountContext';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, Card, Button } from '../components/common/Card';
import Modal from '../components/common/Modal';
import { Plus, Trash2, Edit3, Users } from 'lucide-react';

const EMOJI_OPTIONS = ['👤', '💼', '🏠', '🎓', '💰', '🏦', '👨‍👩‍👧‍👦', '🛒', '✈️', '🎯', '📈', '🏢', '💳', '🎮', '🍕', '🚗'];
const COLOR_OPTIONS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

export default function AccountsPage() {
  const { accounts, activeAccount, switchAccount, createAccount, updateAccount, deleteAccount } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '💼', color: '#3b82f6' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const openCreate = () => {
    setEditingAccount(null);
    setForm({ name: '', emoji: '💼', color: COLOR_OPTIONS[accounts.length % COLOR_OPTIONS.length] });
    setShowModal(true);
  };

  const openEdit = (account) => {
    setEditingAccount(account);
    setForm({ name: account.name, emoji: account.emoji, color: account.color });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingAccount) {
      updateAccount(editingAccount.id, { name: form.name.trim(), emoji: form.emoji, color: form.color });
    } else {
      const newAcc = createAccount(form.name.trim(), form.emoji, form.color);
      switchAccount(newAcc.id);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    deleteAccount(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        subtitle="Manage multiple financial profiles"
        action={
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus size={18} /> New Account
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  account.id === activeAccount.id
                    ? 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950'
                    : 'hover:scale-[1.02]'
                }`}
                style={account.id === activeAccount.id ? { '--tw-ring-color': account.color } : {}}
                onClick={() => switchAccount(account.id)}
              >
                {account.id === activeAccount.id && (
                  <div
                    className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    Active
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: account.color + '20' }}
                  >
                    {account.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {account.name}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Created {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(account); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  {accounts.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(account.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}

          {/* Add New Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: accounts.length * 0.05 }}
          >
            <button
              onClick={openCreate}
              className="w-full h-full min-h-[160px] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-all hover:scale-[1.02]"
            >
              <Users size={32} />
              <span className="text-sm font-medium">Add New Account</span>
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAccount ? 'Edit Account' : 'Create New Account'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Personal, Business, Family..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, emoji })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all
                    ${form.emoji === emoji
                      ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 scale-110'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Preview</p>
            <div className="flex items-center gap-3">
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: form.color + '20' }}
              >
                {form.emoji}
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {form.name || 'Account Name'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {editingAccount ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this account? All data (income, expenses, savings, goals, budgets, recurring transactions) in this account will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
