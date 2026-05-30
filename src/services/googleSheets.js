import { GOOGLE_CONFIG } from '../config/google';

export const googleSheetsService = {
  getUrl() {
    return GOOGLE_CONFIG.APPS_SCRIPT_URL;
  },

  isConfigured() {
    return !!GOOGLE_CONFIG.APPS_SCRIPT_URL && GOOGLE_CONFIG.APPS_SCRIPT_URL.length > 10;
  },

  // Google Apps Script returns a redirect (302) which some browsers handle differently.
  // This helper ensures we always get parseable JSON back.
  async _fetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
    });
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      // Google sometimes wraps response in HTML after redirect - extract JSON
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Invalid response from Google Sheets: ' + text.substring(0, 200));
    }
  },

  async loadAllData() {
    if (!this.isConfigured()) throw new Error('Apps Script URL not configured');
    return await this._fetch(this.getUrl() + '?action=load');
  },

  async syncAllData(data) {
    if (!this.isConfigured()) throw new Error('Apps Script URL not configured');
    return await this._fetch(this.getUrl(), {
      method: 'POST',
      body: JSON.stringify({ action: 'sync', payload: data }),
    });
  },

  async appendRow(sheetName, row) {
    if (!this.isConfigured()) return;
    await this._fetch(this.getUrl(), {
      method: 'POST',
      body: JSON.stringify({ action: 'append', sheet: sheetName, row }),
    });
  },

  async updateRow(sheetName, id, row) {
    if (!this.isConfigured()) return;
    await this._fetch(this.getUrl(), {
      method: 'POST',
      body: JSON.stringify({ action: 'update', sheet: sheetName, id, row }),
    });
  },

  async deleteRow(sheetName, id) {
    if (!this.isConfigured()) return;
    await this._fetch(this.getUrl(), {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', sheet: sheetName, id }),
    });
  },
};

export default googleSheetsService;
