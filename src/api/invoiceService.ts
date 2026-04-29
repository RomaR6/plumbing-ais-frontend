import api from './axiosInstance';

export const invoiceService = {
    downloadInvoice: async (transactionId: number) => {
        const response = await api.get(`Invoices/download/${transactionId}`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_${transactionId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};