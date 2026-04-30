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
        toast.add({ severity: 'success', summary: 'Успішно', detail: `Звіт завантажено`, life: 3000 });
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
        query: { productId: product.id, type: 'In', amount: amountNeeded > 0 ? amountNeeded : 1 } 
    });
};

onMounted(loadReports);
</script>

<template>
    <div class="p-3 md:p-6 text-left">
        <Toast />
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h1 class="text-2xl md:text-3xl font-bold text-slate-800">Аналітика</h1>
                <p class="text-slate-500 text-sm">Звіт на {{ new Date().toLocaleDateString('uk-UA') }}</p>
            </div>
            <div class="flex gap-2 w-full md:w-auto">
                <Button label="PDF" icon="pi pi-file-pdf" severity="danger" size="small" :loading="downloadLoading" @click="handleDownload('pdf')" class="flex-1 md:flex-initial" />
                <Button label="CSV" icon="pi pi-file-excel" severity="success" size="small" :loading="downloadLoading" @click="handleDownload('csv')" class="flex-1 md:flex-initial" />
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-20"><ProgressSpinner /></div>

        <div v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div class="p-4 md:p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
                    <div class="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-money-bill text-lg md:text-xl"></i>
                    </div>
                    <div class="min-width-0">
                        <span class="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Цінність складу</span>
                        <div class="text-xl md:text-2xl font-black text-slate-800 truncate">{{ stats.totalValue.toLocaleString('uk-UA') }} ₴</div>
                    </div>
                </div>

                <div class="p-4 md:p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
                    <div class="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-exclamation-triangle text-lg md:text-xl"></i>
                    </div>
                    <div>
                        <span class="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Дефіцит</span>
                        <div class="text-xl md:text-2xl font-black text-slate-800">{{ stats.criticalCount }} од.</div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-slate-800">Відомість дефіциту</h3>
                    <Tag value="Low Stock" severity="warn" class="text-[10px]" />
                </div>
                <DataTable :value="criticalItems" class="p-datatable-sm" :rows="5" paginator>
                    <Column field="name" header="Назва" class="text-sm"></Column>
                    <Column field="quantity" header="Зал." class="w-16">
                        <template #body="s"><span class="text-red-600 font-bold text-sm">{{ s.data.quantity }}</span></template>
                    </Column>
                    <Column header="Дія" class="w-16">
                        <template #body="s"><Button icon="pi pi-shopping-cart" size="small" text @click="orderProduct(s.data)" /></template>
                    </Column>
                    <template #empty>
                        <div class="text-center p-4 text-slate-400 text-sm">Дефіциту не виявлено</div>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>
</template>