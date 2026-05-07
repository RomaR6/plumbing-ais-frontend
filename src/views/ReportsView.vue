<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { reportService } from '../api/reportService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const router = useRouter();
const toast = useToast();

const stats = ref({
    totalValue: 0,
    criticalCount: 0,
    reportDate: ''
});

const criticalItems = ref<any[]>([]);
const loading = ref(true);
const downloadLoading = ref(false);

const loadReports = async () => {
    loading.value = true;
    try {
        const [valRes, invRes] = await Promise.all([
            reportService.getTotalValue(),
            reportService.getInventoryReport()
        ]);
        
        stats.value.totalValue = valRes.data.totalValue;
        stats.value.criticalCount = invRes.data.criticalItemsCount;
        stats.value.reportDate = invRes.data.reportDate;
        criticalItems.value = invRes.data.items || [];
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const handleDownload = async (format: 'csv' | 'pdf') => {
    downloadLoading.value = true;
    try {
        const response = format === 'csv' ? await reportService.exportCsv() : await reportService.exportPdf();
        const blob = new Blob([response.data], { type: format === 'csv' ? 'text/csv' : 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `inventory_report_${new Date().toISOString().slice(0, 10)}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.add({ severity: 'success', summary: 'Успішно', detail: `Звіт ${format.toUpperCase()} завантажено`, life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося завантажити звіт', life: 3000 });
    } finally {
        downloadLoading.value = false;
    }
};

const orderProduct = (product: any) => {
    const amountNeeded = Math.max(0, (product.minThreshold || 0) - product.quantity);
    router.push({ 
        path: '/transactions', 
        query: { 
            productId: product.id, 
            type: 'In',
            amount: amountNeeded > 0 ? amountNeeded : 1
        } 
    });
};

onMounted(loadReports);
</script>

<template>
    <div class="view-container">
        <Toast />
        
        <div class="header-bar">
            <div class="title-section">
                <h1 class="main-title">Аналітика та звіти</h1>
                <p class="subtitle">Стан складських запасів на {{ new Date().toLocaleDateString('uk-UA') }}</p>
            </div>
            <div class="export-actions">
                <Button label="Експорт PDF" icon="pi pi-file-pdf" severity="danger" outlined :loading="downloadLoading" @click="handleDownload('pdf')" />
                <Button label="Експорт CSV" icon="pi pi-file-excel" severity="success" outlined :loading="downloadLoading" @click="handleDownload('csv')" />
            </div>
        </div>

        <div v-if="loading" class="spinner-container">
            <ProgressSpinner />
        </div>

        <div v-else class="reports-content">
            <div class="stats-grid">
                <div class="stat-card value-card">
                    <div class="stat-icon">
                        <i class="pi pi-wallet"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Загальна вартість товарів</span>
                        <div class="stat-value">{{ stats.totalValue.toLocaleString('uk-UA') }} ₴</div>
                    </div>
                </div>

                <div class="stat-card alert-card">
                    <div class="stat-icon">
                        <i class="pi pi-exclamation-circle"></i>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Товари в дефіциті</span>
                        <div class="stat-value">{{ stats.criticalCount }}</div>
                    </div>
                </div>
            </div>

            <div class="table-card">
                <div class="table-header">
                    <h3 class="table-title">Відомість критичних залишків</h3>
                    <Tag value="Потребують закупівлі" severity="warn" rounded />
                </div>

                <div class="table-wrapper">
                    <DataTable :value="criticalItems" class="p-datatable-sm custom-table" :rows="5" paginator stripedRows responsiveLayout="stack" breakpoint="640px">
                        <Column field="name" header="Найменування товару" class="font-bold"></Column>
                        <Column field="sku" header="Артикул" class="font-mono text-xs text-slate-500"></Column>
                        <Column field="quantity" header="Залишок" class="text-center">
                            <template #body="slotProps">
                                <span class="critical-qty">{{ slotProps.data.quantity }}</span>
                            </template>
                        </Column>
                        <Column header="Дія" class="text-right">
                            <template #body="slotProps">
                                <Button label="Замовити" icon="pi pi-shopping-cart" severity="secondary" text size="small" @click="orderProduct(slotProps.data)" />
                            </template>
                        </Column>
                        <template #empty>
                            <div class="empty-state">
                                <i class="pi pi-check-circle"></i>
                                <p>Дефіцитних товарів не виявлено. Склад укомплектований.</p>
                            </div>
                        </template>
                    </DataTable>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.view-container {
    padding: 2rem;
    text-align: left;
    background-color: #f8fafc;
    min-height: 100vh;
}

.header-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2.5rem;
    gap: 1.5rem;
}

.main-title {
    font-size: 2rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
    letter-spacing: -0.025em;
}

.subtitle {
    color: #64748b;
    font-size: 0.95rem;
    margin-top: 0.5rem;
}

.export-actions {
    display: flex;
    gap: 0.75rem;
}

.spinner-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5rem;
}

.stats-grid {
    display: grid;
    grid-template-cols: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-icon {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
}

.value-card .stat-icon { background: #ecfdf5; color: #10b981; }
.alert-card .stat-icon { background: #fff7ed; color: #f59e0b; }

.stat-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.05em;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 900;
    color: #1e293b;
    line-height: 1.2;
}

.table-card {
    background: white;
    border-radius: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.table-header {
    padding: 1.5rem;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #334155;
    margin: 0;
}

.table-wrapper {
    padding: 0.5rem;
}

.critical-qty {
    background: #fef2f2;
    color: #dc2626;
    font-weight: 800;
    padding: 0.25rem 0.75rem;
    border-radius: 2rem;
    font-size: 0.9rem;
}

.empty-state {
    padding: 4rem 2rem;
    text-align: center;
    color: #94a3b8;
}

.empty-state i {
    font-size: 3rem;
    color: #10b981;
    margin-bottom: 1rem;
}

:deep(.p-datatable-thead > tr > th) {
    background-color: #f8fafc !important;
    color: #64748b !important;
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
    font-weight: 700 !important;
    padding: 1rem !important;
}

@media (max-width: 768px) {
    .view-container { padding: 1rem; }
    .header-bar { flex-direction: column; align-items: stretch; }
    .export-actions { justify-content: stretch; }
    .export-actions button { flex: 1; }
}
</style>