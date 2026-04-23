<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportService } from '../api/reportService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';

const stats = ref({
    totalValue: 0,
    criticalCount: 0,
    reportDate: ''
});

const criticalItems = ref<any[]>([]);
const loading = ref(true);

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
        console.error("Помилка завантаження звітів", e);
    } finally {
        loading.value = false;
    }
};

onMounted(loadReports);
</script>

<template>
    <div class="p-6 text-left">
        <div class="mb-6 flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-bold text-slate-800">Аналітика</h1>
                <p class="text-slate-500 text-sm">Звіт про стан складу на {{ new Date().toLocaleDateString('uk-UA') }}</p>
            </div>
        </div>

        <div v-if="loading" class="flex justify-center py-20">
            <ProgressSpinner />
        </div>

        <div v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div class="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                            <i class="pi pi-money-bill text-xl"></i>
                        </div>
                        <div>
                            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Вартість активів</span>
                            <div class="text-3xl font-black text-slate-800">{{ stats.totalValue.toLocaleString('uk-UA') }} грн</div>
                        </div>
                    </div>
                </div>

                <div class="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                            <i class="pi pi-exclamation-triangle text-xl"></i>
                        </div>
                        <div>
                            <span class="text-slate-500 text-sm font-medium uppercase tracking-wider">Дефіцитні позиції</span>
                            <div class="text-3xl font-black text-slate-800">{{ stats.criticalCount }} тов.</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800">Товари, що закінчуються</h3>
                    <Tag value="Потребують закупівлі" severity="warn" />
                </div>

                <DataTable :value="criticalItems" class="p-datatable-sm" :rows="5" paginator>
                    <Column field="name" header="Назва товару"></Column>
                    <Column field="sku" header="Артикул"></Column>
                    <Column field="quantity" header="Залишок">
                        <template #body="s">
                            <span class="text-red-600 font-bold">{{ s.data.quantity }}</span>
                        </template>
                    </Column>
                    <Column header="Дія">
                        <template #body>
                            <Tag value="Замовити" severity="info" class="cursor-pointer" />
                        </template>
                    </Column>
                    <template #empty>
                        <div class="py-4 text-slate-400">Всі товари в достатній кількості.</div>
                    </template>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-datatable-thead > tr > th) {
    background-color: #f8fafc;
    color: #64748b;
    font-size: 0.75rem;
    text-transform: uppercase;
}
</style>