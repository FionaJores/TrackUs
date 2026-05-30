import { GOOGLE_CONFIG } from '../config/google';

export const googleSheetsService = {
  getUrl() {
    return GOOGLE_CONFIG.APPS_SCRIPT_URL;
  },

  isConfigured() {
    return !!GOOGLE_CONFIG.APPS_SCRIPT_URL && GOOGLE_CONFIG.APPS_SCRIPT_URL.length > 10;
  },

  async loadAllData() {
    if (!this.isConfigured()) throw new Error('Apps Script URL not configured');
    const response = await fetch(this.getUrl() + '?action=load');
    if (!response.ok) throw new Error('Failed to load data');
    return await response.json();
  },

  async syncAllData(data) {
    if (!this.isConfigured()) throw new Error('Apps Script URL not configured');
    const response = await fetch(this.getUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'sync', payload: data }),
    });
    if (!response.ok) throw new Error('Failed to sync data');
    return await response.json();
  },

  async appendRow(sheetName, row) {
    if (!this.isConfigured()) return;
    await fetch(this.getUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'append', sheet: sheetName, row }),
    });
  },

  async updateRow(sheetName, id, row) {
    if (!this.isConfigured()) return;
    await fetch(this.getUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'update', sheet: sheetName, id, row }),
    });
  },

  async deleteRow(sheetName, id) {
    if (!this.isConfigured()) return;
    await fetch(this.getUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'delete', sheet: sheetName, id }),
    });
  },
};

export default googleSheetsService;
