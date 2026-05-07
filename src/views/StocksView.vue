<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { stockService } from '../api/stockService';
import { invoiceService } from '../api/invoiceService';
import { useAuthStore } from '../stores/auth';
import type { Stock, Location as StockLocation } from '../types';
import { FilterMatchMode } from '@primevue/core/api';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ToggleButton from 'primevue/togglebutton';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const stocks = ref<Stock[]>([]);
const locations = ref<StockLocation[]>([]);
const warehouses = ref<any[]>([]);
const loading = ref(true);
const locationDialog = ref(false);
const moveDialog = ref(false);
const submitting = ref(false);
const showSuccessDialog = ref(false);
const lastTransactionId = ref<number | null>(null);
const showOnlyLowStock = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'location.warehouse.name': { value: null, matchMode: FilterMatchMode.EQUALS },
    'location.rowCode': { value: null, matchMode: FilterMatchMode.EQUALS },
    'location.rackCode': { value: null, matchMode: FilterMatchMode.EQUALS }
});

const isAdmin = computed(() => authStore.role === 'Admin');
const isManager = computed(() => authStore.role === 'Manager');
const canManageStructure = computed(() => isAdmin.value);
const canMoveStock = computed(() => isAdmin.value || isManager.value);

const uniqueRows = computed(() => [...new Set(locations.value.map(l => l.rowCode))].sort());
const uniqueRacks = computed(() => [...new Set(locations.value.map(l => l.rackCode))].sort());

const filteredStocks = computed(() => {
    let result = stocks.value;
    if (showOnlyLowStock.value) {
        result = result.filter(s => s.quantity < (s.product?.minThreshold || 0));
    }
    return result;
});

const newLocation = ref({ warehouseId: null as any, rowCode: '', rackCode: '', shelfCode: '' });
const moveData = ref({ productId: null as any, fromLocationId: null as any, toLocationId: null as any, quantity: 1 });

const loadData = async () => {
    loading.value = true;
    try {
        const [sResponse, lResponse, wResponse] = await Promise.all([
            stockService.getAllStocks(),
            stockService.getLocations(),
            stockService.getWarehouses()
        ]);
        stocks.value = sResponse.data;
        locations.value = lResponse.data;
        warehouses.value = wResponse.data;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося завантажити дані' });
    } finally {
        loading.value = false;
    }
};

const openNewLocation = async () => {
    newLocation.value = { warehouseId: null, rowCode: '', rackCode: '', shelfCode: '' };
    locationDialog.value = true;
};

const saveLocation = async () => {
    if (!newLocation.value.warehouseId || !newLocation.value.rowCode) return;
    submitting.value = true;
    const payload = { ...newLocation.value, name: `${newLocation.value.rowCode}-${newLocation.value.rackCode}-${newLocation.value.shelfCode}` };
    try {
        await stockService.createLocation(payload as any);
        toast.add({ severity: 'success', summary: 'Успішно', detail: 'Локацію створено' });
        locationDialog.value = false;
        await loadData();
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Помилка при створенні' });
    } finally {
        submitting.value = false;
    }
};

const confirmDeleteLocation = (id: number) => {
    confirm.require({
        message: 'Ви впевнені, що хочете видалити цю локацію?',
        header: 'Підтвердження',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await stockService.deleteLocation(id);
                toast.add({ severity: 'success', summary: 'Успішно', detail: 'Локацію видалено' });
                await loadData();
            } catch (e: any) {
                toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося видалити локацію' });
            }
        }
    });
};

const openMoveDialog = () => {
    moveData.value = { productId: null, fromLocationId: null, toLocationId: null, quantity: 1 };
    moveDialog.value = true;
};

const executeMove = async () => {
    if (!moveData.value.productId || !moveData.value.fromLocationId || !moveData.value.toLocationId) return;
    submitting.value = true;
    try {
        const response = await stockService.moveStock(
            moveData.value.productId, 
            moveData.value.fromLocationId, 
            moveData.value.toLocationId, 
            moveData.value.quantity,
            "Внутрішнє переміщення"
        );
        toast.add({ severity: 'success', summary: 'Успішно', detail: 'Товар переміщено' });
        moveDialog.value = false;
        await loadData();
        if (response.data && response.data.transactionId) {
            lastTransactionId.value = response.data.transactionId;
            showSuccessDialog.value = true;
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Неможливо виконати', detail: e.response?.data?.message || 'Помилка переміщення', life: 5000 });
    } finally {
        submitting.value = false;
    }
};

const downloadLastInvoice = async () => {
    if (lastTransactionId.value) {
        await invoiceService.downloadInvoice(lastTransactionId.value);
        showSuccessDialog.value = false;
    }
};

const getStockSeverity = (quantity: number, threshold: number) => {
    if (quantity <= 0) return 'danger';
    if (quantity < threshold) return 'warn';
    return 'success';
};

const getFromLocationLabel = (id: number) => {
    const s = stocks.value.find(st => st.locationId === id);
    if (!s || !s.location) return 'Невідома локація';
    const whName = s.location.warehouse?.name || 'Склад';
    return `${whName}: ${s.location.rowCode}-${s.location.rackCode}-${s.location.shelfCode}`;
};

const getToLocationLabel = (id: number) => {
    const l = locations.value.find(loc => loc.id === id);
    if (!l) return 'Невідома локація';
    const whName = l.warehouse?.name || 'Склад';
    return `${whName}: ${l.rowCode}-${l.rackCode}-${l.shelfCode}`;
};

onMounted(loadData);
</script>

<template>
    <div class="view-container">
        <Toast />
        <ConfirmDialog />

        <Dialog v-model:visible="showSuccessDialog" modal header="Переміщення завершено" class="success-dialog">
            <p class="dialog-text">Бажаєте завантажити PDF акт внутрішнього переміщення?</p>
            <div class="dialog-actions">
                <Button label="Пізніше" severity="secondary" @click="showSuccessDialog = false" />
                <Button label="Завантажити" icon="pi pi-file-pdf" @click="downloadLastInvoice" />
            </div>
        </Dialog>
        
        <div class="header-section">
            <h1 class="title">Управління складом</h1>
            <p class="subtitle">Облік залишків, керування локаціями та переміщеннями</p>
        </div>

        <div class="main-card">
            <Tabs value="0">
                <TabList>
                    <Tab value="0"><i class="pi pi-box mr-2"></i> Залишки</Tab>
                    <Tab v-if="canManageStructure" value="1"><i class="pi pi-map-marker mr-2"></i> Локації</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel value="0">
                        <div class="toolbar-header">
                            <h3 class="panel-title">Товари на складах</h3>
                            <div class="action-group">
                                <Button label="Транзакція" icon="pi pi-sync" severity="primary" size="small" @click="$router.push('/transactions')" />
                                <Button v-if="canMoveStock" label="Перемістити" icon="pi pi-directions" severity="secondary" size="small" @click="openMoveDialog" />
                            </div>
                        </div>

                        <div class="filters-row">
                            <IconField iconPosition="left" class="search-box">
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Пошук за назвою..." />
                            </IconField>
                            <div class="select-group">
                                <Select v-model="filters['location.warehouse.name'].value" :options="warehouses" optionLabel="name" optionValue="name" placeholder="Склад" showClear class="wh-select" />
                                <Select v-model="filters['location.rowCode'].value" :options="uniqueRows" placeholder="Ряд" showClear class="row-select" />
                                <Select v-model="filters['location.rackCode'].value" :options="uniqueRacks" placeholder="Стел." showClear class="rack-select" />
                                <ToggleButton v-model="showOnlyLowStock" onLabel="Дефіцит" offLabel="Усі" class="toggle-filter" />
                            </div>
                        </div>

                        <div class="table-container">
                            <DataTable :value="filteredStocks" :loading="loading" v-model:filters="filters" paginator :rows="10" stripedRows class="p-datatable-sm">
                                <Column field="product.sku" header="Арт." sortable class="font-mono text-xs"></Column>
                                <Column field="product.name" header="Товар" sortable class="font-bold"></Column>
                                <Column header="Локація">
                                    <template #body="s">
                                        <div v-if="s.data.location" class="location-badge">
                                            <span class="wh-name">{{ s.data.location.warehouse?.name }}</span>
                                            <span class="loc-coords">{{ s.data.location.rowCode }}-{{ s.data.location.rackCode }}-{{ s.data.location.shelfCode }}</span>
                                        </div>
                                        <span v-else class="text-slate-400">--</span>
                                    </template>
                                </Column>
                                <Column field="quantity" header="Залишок" sortable>
                                    <template #body="s">
                                        <div class="stock-cell">
                                            <Tag :value="s.data.quantity" :severity="getStockSeverity(s.data.quantity, s.data.product?.minThreshold || 0)" />
                                            <span class="threshold-text">/ {{ s.data.product?.minThreshold || 0 }}</span>
                                        </div>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </TabPanel>

                    <TabPanel v-if="canManageStructure" value="1">
                        <div class="toolbar-header">
                            <h3 class="panel-title">Адреси зберігання</h3>
                            <Button v-if="isAdmin" label="Додати локацію" icon="pi pi-plus" severity="success" size="small" @click="openNewLocation" />
                        </div>
                        <div class="table-container">
                            <DataTable :value="locations" :loading="loading" class="p-datatable-sm" paginator :rows="10" stripedRows>
                                <Column field="warehouse.name" header="Склад"></Column>
                                <Column field="rowCode" header="Ряд"></Column>
                                <Column field="rackCode" header="Стелаж"></Column>
                                <Column field="shelfCode" header="Полиця"></Column>
                                <Column v-if="isAdmin" header="Дії" class="actions-col">
                                    <template #body="s">
                                        <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDeleteLocation(s.data.id)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <Dialog v-model:visible="locationDialog" header="Нова локація" modal class="p-fluid medium-dialog">
            <div class="form-content">
                <div class="field-block">
                    <label class="field-label">Склад</label>
                    <Select v-model="newLocation.warehouseId" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Оберіть склад" />
                </div>
                <div class="coords-row">
                    <div class="field-block"><label class="field-label">Ряд</label><InputText v-model="newLocation.rowCode" placeholder="напр. А" /></div>
                    <div class="field-block"><label class="field-label">Стелаж</label><InputText v-model="newLocation.rackCode" placeholder="напр. 1" /></div>
                    <div class="field-block"><label class="field-label">Полиця</label><InputText v-model="newLocation.shelfCode" placeholder="напр. 1" /></div>
                </div>
            </div>
            <template #footer>
                <div class="form-actions">
                    <Button label="Скасувати" text severity="secondary" @click="locationDialog = false" />
                    <Button label="Зберегти" severity="success" :loading="submitting" @click="saveLocation" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="moveDialog" header="Переміщення товару" modal class="p-fluid large-dialog">
            <div class="form-content">
                <div class="field-block">
                    <label class="field-label">Товар</label>
                    <Select v-model="moveData.productId" :options="stocks" optionLabel="product.name" optionValue="productId" placeholder="Оберіть товар" filter />
                </div>
                <div class="coords-row">
                    <div class="field-block">
                        <label class="field-label">Звідки</label>
                        <Select v-model="moveData.fromLocationId" :options="stocks.filter(s => s.productId === moveData.productId)" optionValue="locationId" :disabled="!moveData.productId" placeholder="Оберіть локацію">
                            <template #option="slotProps">
                                <span class="text-sm">
                                    {{ slotProps.option.location?.warehouse?.name }}: {{ slotProps.option.location?.rowCode }}-{{ slotProps.option.location?.rackCode }} ({{ slotProps.option.quantity }} од.)
                                </span>
                            </template>
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="text-sm">{{ getFromLocationLabel(slotProps.value) }}</div>
                                <span v-else>Оберіть локацію</span>
                            </template>
                        </Select>
                    </div>
                    <div class="field-block">
                        <label class="field-label">Куди</label>
                        <Select v-model="moveData.toLocationId" :options="locations" optionValue="id" filter :disabled="!moveData.productId" placeholder="Оберіть локацію">
                            <template #option="slotProps">
                                <span class="text-sm">{{ slotProps.option.warehouse?.name }}: {{ slotProps.option.rowCode }}-{{ slotProps.option.rackCode }}</span>
                            </template>
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="text-sm">{{ getToLocationLabel(slotProps.value) }}</div>
                                <span v-else>Оберіть нову локацію</span>
                            </template>
                        </Select>
                    </div>
                </div>
                <div class="field-block">
                    <label class="field-label">Кількість</label>
                    <InputNumber v-model="moveData.quantity" :min="1" showButtons :disabled="!moveData.productId" />
                </div>
            </div>
            <template #footer>
                <div class="form-actions">
                    <Button label="Скасувати" text severity="secondary" @click="moveDialog = false" />
                    <Button label="Виконати" severity="warning" :loading="submitting" @click="executeMove" :disabled="!moveData.fromLocationId || !moveData.toLocationId" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.view-container { padding: 1.5rem; text-align: left; }
.header-section { margin-bottom: 2rem; }
.title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; }
.subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
.main-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
.toolbar-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 1.5rem; }
.panel-title { font-size: 1.125rem; font-weight: 700; color: #334155; margin: 0; }
.action-group { display: flex; gap: 0.75rem; }
.filters-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; align-items: center; }
.search-box { width: 300px; }
.select-group { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.wh-select { width: 180px; }
.row-select, .rack-select { width: 100px; }
.toggle-filter { width: 120px; }
.table-container { border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
.location-badge { display: flex; flex-direction: column; }
.wh-name { font-size: 0.65rem; font-weight: 800; color: #2563eb; text-transform: uppercase; }
.loc-coords { font-size: 0.875rem; font-weight: 600; color: #475569; }
.stock-cell { display: flex; align-items: center; gap: 0.5rem; }
.threshold-text { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
.form-content { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem 0; }
.coords-row { display: grid; grid-template-cols: repeat(2, 1fr); gap: 1rem; }
.field-block { display: flex; flex-direction: column; gap: 0.5rem; }
.field-label { font-weight: 700; font-size: 0.875rem; color: #334155; }
.form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
.success-dialog { width: 400px; }
.dialog-text { margin-bottom: 1.5rem; line-height: 1.5; color: #475569; }
.dialog-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
:deep(.p-tablist-tab-list) { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
:deep(.p-tabpanels) { padding: 1.5rem; }
:deep(.p-datatable-thead > tr > th) { background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
@media (max-width: 768px) {
    .view-container { padding: 1rem; }
    .toolbar-header, .filters-row, .coords-row { flex-direction: column; align-items: stretch; }
    .search-box, .wh-select, .row-select, .rack-select, .toggle-filter { width: 100%; }
    .action-group { width: 100%; }
    .action-group button { flex: 1; }
    .coords-row { grid-template-cols: 1fr; }
}
</style>