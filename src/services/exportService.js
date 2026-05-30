import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from '../utils/constants';
import { formatDisplayDate, formatMonth } from '../utils/dateHelpers';

export const exportService = {
  exportToCSV(data, filename, headers) {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const key = h.toLowerCase().replace(/\s+/g, '');
        const value = row[key] || row[h] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  },

  exportToExcel(data, filename, sheetName = 'Sheet1') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  },

  exportToPDF(title, headers, rows, summary = null) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text(title, 14, 22);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    let startY = 38;

    // Summary section
    if (summary) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      summary.forEach((line, i) => {
        doc.text(line, 14, startY + (i * 7));
      });
      startY += summary.length * 7 + 10;
    }

    // Table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  },

  generateMonthlyReport(income, expenses, savings, month) {
    const title = `Monthly Report - ${formatMonth(month + '-01')}`;
    const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
    const totalExpenses = expenses.reduce((s, i) => s + Number(i.amount), 0);
    const totalSavings = savings.reduce((s, i) => s + Number(i.amount), 0);

    const summary = [
      `Total Income: ${formatCurrency(totalIncome)}`,
      `Total Expenses: ${formatCurrency(totalExpenses)}`,
      `Total Savings: ${formatCurrency(totalSavings)}`,
      `Net: ${formatCurrency(totalIncome - totalExpenses)}`,
      `Savings Rate: ${totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0}%`,
    ];

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Notes'];
    const rows = [
      ...income.map(i => [formatDisplayDate(i.date), 'Income', i.source, formatCurrency(i.amount), i.notes || '']),
      ...expenses.map(e => [formatDisplayDate(e.date), 'Expense', e.category, formatCurrency(e.amount), e.notes || '']),
      ...savings.map(s => [formatDisplayDate(s.date), 'Savings', s.type, formatCurrency(s.amount), s.notes || '']),
    ].sort((a, b) => new Date(a[0]) - new Date(b[0]));

    this.exportToPDF(title, headers, rows, summary);
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(l => l.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^,]+)/g) || [];
            const obj = {};
            headers.forEach((h, i) => {
              obj[h.toLowerCase()] = (values[i] || '').replace(/^"|"$/g, '').trim();
            });
            return obj;
          });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
};

export default exportService;
