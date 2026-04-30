<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { stockService } from '../api/stockService';
import { invoiceService } from '../api/invoiceService';
import { useAuthStore } from '../stores/auth';
import type { Stock, Location } from '../types';
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
const locations = ref<Location[]>([]);
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

const newLocation = ref({
    warehouseId: null as any,
    rowCode: '',
    rackCode: '',
    shelfCode: ''
});

const moveData = ref({
    productId: null as any,
    fromLocationId: null as any,
    toLocationId: null as any,
    quantity: 1
});

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
    const payload = {
        ...newLocation.value,
        name: `${newLocation.value.rowCode}-${newLocation.value.rackCode}-${newLocation.value.shelfCode}`
    };
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
                toast.add({ 
                    severity: 'error', 
                    summary: 'Помилка видалення', 
                    detail: e.response?.data?.message || 'Не вдалося видалити локацію' 
                });
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
        const fromStock = stocks.value.find(s => s.locationId === moveData.value.fromLocationId && s.productId === moveData.value.productId);
        const toLoc = locations.value.find(l => l.id === moveData.value.toLocationId);
        const description = `Переміщення: ${fromStock?.location?.warehouse?.name} (${fromStock?.location?.rowCode}-${fromStock?.location?.rackCode}-${fromStock?.location?.shelfCode}) → ${toLoc?.warehouse?.name} (${toLoc?.rowCode}-${toLoc?.rackCode}-${toLoc?.shelfCode})`;
        const response = await stockService.moveStock(
            moveData.value.productId, 
            moveData.value.fromLocationId, 
            moveData.value.toLocationId, 
            moveData.value.quantity,
            description
        );
        toast.add({ severity: 'success', summary: 'Успішно', detail: 'Товар переміщено' });
        moveDialog.value = false;
        await loadData();
        if (response.data && response.data.transactionId) {
            lastTransactionId.value = response.data.transactionId;
            showSuccessDialog.value = true;
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: e.response?.data?.message || 'Помилка переміщення' });
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

onMounted(loadData);

const getStockSeverity = (quantity: number, threshold: number) => {
    if (quantity <= 0) return 'danger';
    if (quantity < threshold) return 'warn';
    return 'success';
};
</script>

<template>
    <div class="p-3 md:p-6 text-left">
        <Toast />
        <ConfirmDialog />

        <Dialog v-model:visible="showSuccessDialog" modal header="Переміщення завершено" :style="{ width: '90vw', maxWidth: '25rem' }">
            <p class="mb-4">Бажаєте завантажити PDF акт внутрішнього переміщення?</p>
            <div class="flex justify-end gap-2">
                <Button label="Пізніше" severity="secondary" @click="showSuccessDialog = false" />
                <Button label="Завантажити" icon="pi pi-file-pdf" @click="downloadLastInvoice" />
            </div>
        </Dialog>
        
        <div class="mb-6">
            <h1 class="text-2xl md:text-3xl font-bold text-slate-800 text-left">Управління складом</h1>
            <p class="text-slate-500 text-xs md:text-sm">Облік залишків, керування локаціями та переміщеннями</p>
        </div>

        <div class="card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Tabs value="0">
                <TabList class="overflow-x-auto">
                    <Tab value="0" class="text-sm"><i class="pi pi-box mr-2"></i> Залишки</Tab>
                    <Tab v-if="canManageStructure" value="1" class="text-sm"><i class="pi pi-map-marker mr-2"></i> Локації</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel value="0">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h3 class="text-lg font-bold text-slate-700">Товари на складах</h3>
                            <div class="flex gap-2 w-full md:w-auto">
                                <Button label="Транзакція" icon="pi pi-sync" severity="primary" size="small" class="flex-1 md:flex-initial" @click="$router.push('/transactions')" />
                                <Button v-if="canMoveStock" label="Перемістити" icon="pi pi-directions" severity="secondary" size="small" class="flex-1 md:flex-initial" @click="openMoveDialog" />
                            </div>
                        </div>

                        <div class="flex flex-col lg:flex-row flex-wrap gap-3 mb-4">
                            <IconField iconPosition="left" class="w-full lg:w-64">
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Пошук..." class="w-full" />
                            </IconField>
                            <div class="grid grid-cols-2 md:flex md:flex-wrap gap-3 w-full lg:w-auto">
                                <Select v-model="filters['location.warehouse.name'].value" :options="warehouses" optionLabel="name" optionValue="name" placeholder="Склад" showClear class="w-full md:w-48" />
                                <Select v-model="filters['location.rowCode'].value" :options="uniqueRows" placeholder="Ряд" showClear class="w-full md:w-24" />
                                <Select v-model="filters['location.rackCode'].value" :options="uniqueRacks" placeholder="Стел." showClear class="w-full md:w-24" />
                                <ToggleButton v-model="showOnlyLowStock" onLabel="Дефіцит" offLabel="Усі" onIcon="pi pi-exclamation-triangle" offIcon="pi pi-filter" class="w-full md:w-36" />
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <DataTable 
                                :value="filteredStocks" 
                                :loading="loading" 
                                v-model:filters="filters"
                                :globalFilterFields="['product.sku', 'product.name']"
                                paginator :rows="10" 
                                class="p-datatable-sm"
                                tableStyle="min-width: 50rem"
                            >
                                <Column field="product.sku" header="Арт." sortable class="font-mono text-[10px] md:text-xs"></Column>
                                <Column field="product.name" header="Товар" sortable class="text-sm"></Column>
                                <Column header="Локація">
                                    <template #body="s">
                                        <div v-if="s.data.location" class="flex flex-col text-left">
                                            <span class="font-bold text-blue-600 text-[10px] uppercase">{{ s.data.location.warehouse?.name }}</span>
                                            <span class="text-slate-500 text-xs font-medium uppercase">
                                                {{ s.data.location.rowCode }}-{{ s.data.location.rackCode }}-{{ s.data.location.shelfCode }}
                                            </span>
                                        </div>
                                    </template>
                                </Column>
                                <Column field="quantity" header="Залишок" sortable>
                                    <template #body="s">
                                        <div class="flex items-center gap-2">
                                            <Tag :value="s.data.quantity" :severity="getStockSeverity(s.data.quantity, s.data.product?.minThreshold || 0)" class="text-xs" />
                                            <span class="text-[10px] text-slate-400">/ {{ s.data.product?.minThreshold || 0 }}</span>
                                        </div>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </TabPanel>

                    <TabPanel v-if="canManageStructure" value="1">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-slate-700">Адреси</h3>
                            <Button v-if="isAdmin" label="Додати" icon="pi pi-plus" severity="success" size="small" @click="openNewLocation" />
                        </div>
                        <div class="overflow-x-auto">
                            <DataTable :value="locations" :loading="loading" class="p-datatable-sm" paginator :rows="10" tableStyle="min-width: 40rem">
                                <Column field="warehouse.name" header="Склад" class="text-sm"></Column>
                                <Column field="rowCode" header="Ряд" class="text-sm"></Column>
                                <Column field="rackCode" header="Стел." class="text-sm"></Column>
                                <Column field="shelfCode" header="Пол." class="text-sm"></Column>
                                <Column v-if="isAdmin" header="Дії" class="w-20">
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

        <Dialog v-model:visible="locationDialog" header="Нова локація" modal class="p-fluid w-[95vw] md:w-[450px]">
            <div class="flex flex-col gap-4 py-2">
                <div class="field">
                    <label class="font-bold text-xs text-slate-700 mb-1 block">Склад</label>
                    <Select v-model="newLocation.warehouseId" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Оберіть склад" />
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div class="field">
                        <label class="font-bold text-xs text-slate-700 mb-1 block">Ряд</label>
                        <InputText v-model="newLocation.rowCode" placeholder="A" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-xs text-slate-700 mb-1 block">Стел.</label>
                        <InputText v-model="newLocation.rackCode" placeholder="1" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-xs text-slate-700 mb-1 block">Пол.</label>
                        <InputText v-model="newLocation.shelfCode" placeholder="1" />
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Скасувати" text @click="locationDialog = false" />
                    <Button label="Зберегти" severity="success" :loading="submitting" @click="saveLocation" />
                </div>
            </template>
        </Dialog>

        <Dialog v-model:visible="moveDialog" header="Переміщення" modal class="p-fluid w-[95vw] md:w-[550px]">
            <div class="flex flex-col gap-4 py-2">
                <div class="field">
                    <label class="font-bold text-xs text-slate-700 mb-1 block">Товар</label>
                    <Select v-model="moveData.productId" :options="stocks" optionLabel="product.name" optionValue="productId" placeholder="Оберіть товар" filter />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="field">
                        <label class="font-bold text-xs text-slate-700 mb-1 block">Звідки</label>
                        <Select v-model="moveData.fromLocationId" :options="stocks.filter(s => s.productId === moveData.productId)" optionValue="locationId" :disabled="!moveData.productId">
                            <template #option="s">
                                <span class="text-xs">{{ s.option.location?.rowCode }}-{{ s.option.location?.rackCode }}-{{ s.option.location?.shelfCode }}</span>
                            </template>
                        </Select>
                    </div>
                    <div class="field">
                        <label class="font-bold text-xs text-slate-700 mb-1 block">Куди</label>
                        <Select v-model="moveData.toLocationId" :options="locations" optionValue="id" filter :disabled="!moveData.productId">
                            <template #option="l">
                                <span class="text-xs">{{ l.option.rowCode }}-{{ l.option.rackCode }}-{{ l.option.shelfCode }}</span>
                            </template>
                        </Select>
                    </div>
                </div>
                <div class="field">
                    <label class="font-bold text-xs text-slate-700 mb-1 block">Кількість</label>
                    <InputNumber v-model="moveData.quantity" :min="1" showButtons :disabled="!moveData.productId" />
                </div>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Скасувати" text @click="moveDialog = false" />
                    <Button label="Виконати" severity="warning" :loading="submitting" @click="executeMove" :disabled="!moveData.fromLocationId || !moveData.toLocationId" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-tablist-tab-list) { border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; }
:deep(.p-tabpanels) { padding: 1rem; }
@media (min-width: 768px) { :deep(.p-tabpanels) { padding: 1.5rem; } }
:deep(.p-datatable-thead > tr > th) { background-color: #f8fafc; color: #64748b; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.025em; }
:deep(.p-dialog-content) { padding: 1rem !important; overflow-y: visible !important; }
</style>```