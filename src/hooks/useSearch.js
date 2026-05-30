import { useState, useMemo } from 'react';

export function useSearch(items, searchFields = ['notes']) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => String(item[field] || '').toLowerCase().includes(term))
      );
    }

    // Filter by month
    if (filterMonth) {
      result = result.filter(item => item.date && item.date.startsWith(filterMonth));
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter(item =>
        (item.category || item.source || item.type) === filterCategory
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
      }
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return result;
  }, [items, searchTerm, sortField, sortOrder, filterMonth, filterCategory, searchFields]);

  return {
    searchTerm, setSearchTerm,
    sortField, setSortField,
    sortOrder, setSortOrder,
    filterMonth, setFilterMonth,
    filterCategory, setFilterCategory,
    filteredItems,
  };
}
