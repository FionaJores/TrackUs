import React, { useState } from 'react';
import { FileText, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PageHeader, Card, Button } from '../components/common/Card';
import exportService from '../services/exportService';
import storage from '../utils/storage';
import { getCurrentMonth, filterByMonth } from '../utils/dateHelpers';
import { formatCurrency } from '../utils/constants';

export default function ReportsPage() {
  const { state, dispatch } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const handleMonthlyReport = (format) => {
    const monthIncome = filterByMonth(state.income, selectedMonth);
    const monthExpenses = filterByMonth(state.expenses, selectedMonth);
    const monthSavings = filterByMonth(state.savings, selectedMonth);

    if (format === 'pdf') {
      exportService.generateMonthlyReport(monthIncome, monthExpenses, monthSavings, selectedMonth);
    } else if (format === 'csv') {
      const allTransactions = [
        ...monthIncome.map(i => ({ date: i.date, type: 'Income', category: i.source, amount: i.amount, notes: i.notes })),
        ...monthExpenses.map(e => ({ date: e.date, type: 'Expense', category: e.category, amount: e.amount, notes: e.notes })),
        ...monthSavings.map(s => ({ date: s.date, type: 'Savings', category: s.type, amount: s.amount, notes: s.notes })),
      ];
      exportService.exportToExcel(allTransactions, `report_${selectedMonth}`, 'Transactions');
    }
  };

  const handleExportAll = async (format) => {
    if (format === 'json') {
      const data = storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salary-savings-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const XLSX = await import('xlsx');
      const data = {
        Income: state.income.map(i => ({ Date: i.date, Amount: i.amount, Source: i.source, Notes: i.notes })),
        Expenses: state.expenses.map(e => ({ Date: e.date, Amount: e.amount, Category: e.category, Payment: e.paymentMethod, Notes: e.notes })),
        Savings: state.savings.map(s => ({ Date: s.date, Amount: s.amount, Type: s.type, Notes: s.notes })),
      };
      const wb = XLSX.utils.book_new();
      Object.entries(data).forEach(([name, sheetData]) => {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, name);
      });
      XLSX.writeFile(wb, `salary-savings-tracker-all-data.xlsx`);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const data = JSON.parse(text);
        if (window.confirm('This will merge imported data with existing data. Continue?')) {
          storage.importAll(data);
          dispatch({ type: 'LOAD_ALL', payload: data });
        }
      } else if (file.name.endsWith('.csv')) {
        const data = await exportService.importCSV(file);
        console.log('Imported CSV data:', data);
        alert(`Imported ${data.length} rows. Check console for data preview.`);
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Export" subtitle="Generate reports and manage data" />

      {/* Monthly Reports */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Report</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => handleMonthlyReport('pdf')}>
              <FileText size={16} /> PDF
            </Button>
            <Button variant="secondary" onClick={() => handleMonthlyReport('csv')}>
              <FileSpreadsheet size={16} /> Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup & Restore */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Backup & Restore</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export JSON Backup</h4>
            <p className="text-xs text-gray-500 mb-3">Download all data as JSON file</p>
            <Button variant="secondary" size="sm" onClick={() => handleExportAll('json')}>
              <Download size={14} /> Export JSON
            </Button>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Excel</h4>
            <p className="text-xs text-gray-500 mb-3">Download all data as Excel workbook</p>
            <Button variant="secondary" size="sm" onClick={() => handleExportAll('excel')}>
              <Download size={14} /> Export Excel
            </Button>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Data</h4>
            <p className="text-xs text-gray-500 mb-3">Import from JSON backup or CSV</p>
            <label className="cursor-pointer">
              <Button variant="secondary" size="sm" as="span">
                <Upload size={14} /> Import
              </Button>
              <input type="file" accept=".json,.csv" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </Card>

      {/* Data Summary */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Data Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{state.income.length}</p>
            <p className="text-xs text-gray-500">Income Entries</p>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{state.expenses.length}</p>
            <p className="text-xs text-gray-500">Expense Entries</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{state.savings.length}</p>
            <p className="text-xs text-gray-500">Savings Entries</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{state.goals.length}</p>
            <p className="text-xs text-gray-500">Active Goals</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
