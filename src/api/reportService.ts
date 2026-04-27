import api from './axiosInstance';

export const reportService = {
    getTotalValue: () => api.get<{ totalValue: number, currency: string }>('Reports/total-value'),
    getInventoryReport: () => api.get<{ reportDate: string, criticalItemsCount: number, items: any[] }>('Reports/inventory-check'),
    exportCsv: () => api.get('Reports/export-csv', { responseType: 'blob' }),
    exportPdf: () => api.get('Reports/export-pdf', { responseType: 'blob' })
};