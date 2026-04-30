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
    <div class="p-6 text-left">
        <Toast />
        <ConfirmDialog />

        <Dialog v-model:visible="showSuccessDialog" modal header="Переміщення завершено" :style="{ width: '25rem' }">
            <p class="mb-4">Бажаєте завантажити PDF акт внутрішнього переміщення?</p>
            <div class="flex justify-end gap-2">
                <Button label="Пізніше" severity="secondary" @click="showSuccessDialog = false" />
                <Button label="Завантажити PDF" icon="pi pi-file-pdf" @click="downloadLastInvoice" />
            </div>
        </Dialog>
        
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800 text-left">Управління складом</h1>
            <p class="text-slate-500 text-sm">Облік залишків, керування локаціями та переміщеннями</p>
        </div>

        <div class="card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Tabs value="0">
                <TabList>
                    <Tab value="0"><i class="pi pi-box mr-2"></i> Поточні залишки</Tab>
                    <Tab value="1"><i class="pi pi-map-marker mr-2"></i> Адресне зберігання (Локації)</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel value="0">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-slate-700">Товари на складах</h3>
                            <div class="flex gap-2">
                                <Button label="Прихід/Видаток" icon="pi pi-sync" severity="primary" size="small" @click="$router.push('/transactions')" />
                                <Button label="Перемістити" icon="pi pi-directions" severity="secondary" size="small" @click="openMoveDialog" />
                            </div>
                        </div>

                        <div class="flex flex-wrap gap-3 mb-4 items-center">
                            <IconField iconPosition="left" style="width: 250px;">
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Пошук..." class="w-full" />
                            </IconField>
                            <Select v-model="filters['location.warehouse.name'].value" :options="warehouses" optionLabel="name" optionValue="name" placeholder="Склад" showClear class="w-48" />
                            <Select v-model="filters['location.rowCode'].value" :options="uniqueRows" placeholder="Ряд" showClear class="w-24" />
                            <Select v-model="filters['location.rackCode'].value" :options="uniqueRacks" placeholder="Стел." showClear class="w-24" />
                            <ToggleButton v-model="showOnlyLowStock" onLabel="Тільки дефіцит" offLabel="Усі залишки" onIcon="pi pi-exclamation-triangle" offIcon="pi pi-filter" class="w-48" />
                        </div>

                        <DataTable 
                            :value="filteredStocks" 
                            :loading="loading" 
                            v-model:filters="filters"
                            :globalFilterFields="['product.sku', 'product.name']"
                            paginator :rows="10" 
                            class="p-datatable-sm"
                        >
                            <Column field="product.sku" header="Артикул" sortable>
                                <template #body="s">
                                    <span class="font-mono text-xs font-bold text-slate-600">{{ s.data.product?.sku || 'N/A' }}</span>
                                </template>
                            </Column>
                            <Column field="product.name" header="Товар" sortable>
                                <template #body="s">
                                    <span class="font-semibold text-slate-700">{{ s.data.product?.name || 'N/A' }}</span>
                                </template>
                            </Column>
                            <Column header="Локація">
                                <template #body="s">
                                    <div v-if="s.data.location" class="flex flex-col text-left">
                                        <span class="font-bold text-blue-600 text-xs uppercase">{{ s.data.location.warehouse?.name || 'Склад' }}</span>
                                        <span class="text-slate-500 text-sm font-medium uppercase">
                                            Ряд: {{ s.data.location.rowCode }} | Стел: {{ s.data.location.rackCode }} | Пол: {{ s.data.location.shelfCode }}
                                        </span>
                                    </div>
                                    <span v-else class="text-slate-400">Не вказано</span>
                                </template>
                            </Column>
                            <Column field="quantity" header="Залишок / Поріг" sortable>
                                <template #body="s">
                                    <div class="flex items-center gap-3">
                                        <div class="flex flex-col min-w-[70px]">
                                            <div class="flex items-baseline gap-1">
                                                <span class="text-lg font-black text-slate-800">{{ s.data.quantity }}</span>
                                                <span class="text-slate-400 text-xs font-medium">/ {{ s.data.product?.minThreshold || 0 }}</span>
                                            </div>
                                            <div class="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    class="h-full transition-all duration-500" 
                                                    :class="s.data.quantity < (s.data.product?.minThreshold || 0) ? 'bg-orange-500' : 'bg-emerald-500'"
                                                    :style="{ width: Math.min((s.data.quantity / (s.data.product?.minThreshold || 1)) * 100, 100) + '%' }"
                                                ></div>
                                            </div>
                                        </div>
                                        <Tag :value="s.data.quantity < (s.data.product?.minThreshold || 0) ? 'Low' : 'OK'" :severity="getStockSeverity(s.data.quantity, s.data.product?.minThreshold || 0)" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>

                    <TabPanel value="1">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-slate-700">Список адрес зберігання</h3>
                            <Button v-if="isAdmin" label="Додати локацію" icon="pi pi-plus" severity="success" size="small" @click="openNewLocation" />
                        </div>
                        <DataTable :value="locations" :loading="loading" class="p-datatable-sm" paginator :rows="10">
                            <Column field="warehouse.name" header="Склад">
                                <template #body="s">
                                    <span class="font-bold text-slate-700">{{ s.data.warehouse?.name || 'Головний' }}</span>
                                </template>
                            </Column>
                            <Column field="rowCode" header="Ряд"></Column>
                            <Column field="rackCode" header="Стелаж"></Column>
                            <Column field="shelfCode" header="Полиця"></Column>
                            <Column header="Адресний код">
                                <template #body="s">
                                    <span class="p-1.5 px-3 bg-slate-100 rounded-md text-xs font-black text-slate-600 border border-slate-200 uppercase">
                                        Ряд: {{ s.data.rowCode }} | Стел: {{ s.data.rackCode }} | Пол: {{ s.data.shelfCode }}
                                    </span>
                                </template>
                            </Column>
                            <Column v-if="isAdmin" header="Дії" style="width: 50px">
                                <template #body="s">
                                    <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDeleteLocation(s.data.id)" />
                                </template>
                            </Column>
                        </DataTable>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <Dialog v-model:visible="locationDialog" header="Нова локація" modal class="p-fluid" style="width: 450px">
            <div class="field mb-4 text-left">
                <label class="font-bold block mb-2 text-slate-700">Склад</label>
                <Select v-model="newLocation.warehouseId" :options="warehouses" optionLabel="name" optionValue="id" placeholder="Оберіть склад" />
            </div>
            <div class="grid grid-cols-3 gap-4 text-left">
                <div class="field">
                    <label class="font-bold block mb-2 text-slate-700">Ряд</label>
                    <InputText v-model="newLocation.rowCode" placeholder="A" />
                </div>
                <div class="field">
                    <label class="font-bold block mb-2 text-slate-700">Стел.</label>
                    <InputText v-model="newLocation.rackCode" placeholder="1" />
                </div>
                <div class="field">
                    <label class="font-bold block mb-2 text-slate-700">Пол.</label>
                    <InputText v-model="newLocation.shelfCode" placeholder="1" />
                </div>
            </div>
            <template #footer>
                <Button label="Скасувати" icon="pi pi-times" text @click="locationDialog = false" />
                <Button label="Зберегти" icon="pi pi-check" :loading="submitting" @click="saveLocation" />
            </template>
        </Dialog>

        <Dialog v-model:visible="moveDialog" header="Переміщення товару" modal class="p-fluid" style="width: 550px">
            <div class="flex flex-col gap-4 text-left">
                <div class="field">
                    <label class="font-bold block mb-2 text-slate-700">Товар</label>
                    <Select v-model="moveData.productId" :options="stocks" optionLabel="product.name" optionValue="productId" placeholder="Оберіть товар" filter>
                        <template #option="slotProps">
                            <div class="flex flex-col">
                                <span class="font-bold">{{ slotProps.option.product?.name }}</span>
                                <small class="text-slate-500">Залишок: {{ slotProps.option.quantity }}</small>
                            </div>
                        </template>
                    </Select>
                </div>
                <div class="grid grid-cols-2 gap-4 text-left">
                    <div class="field">
                        <label class="font-bold block mb-2 text-slate-700">З локації</label>
                        <Select v-model="moveData.fromLocationId" :options="stocks.filter(s => s.productId === moveData.productId)" optionValue="locationId" :placeholder="moveData.productId ? 'Звідки' : 'Оберіть товар'" :disabled="!moveData.productId">
                            <template #option="s">
                                <span>Ряд: {{ s.option.location?.rowCode }} | Стел: {{ s.option.location?.rackCode }} | Пол: {{ s.option.location?.shelfCode }}</span>
                            </template>
                        </Select>
                    </div>
                    <div class="field">
                        <label class="font-bold block mb-2 text-slate-700">В локацію</label>
                        <Select v-model="moveData.toLocationId" :options="locations" optionValue="id" placeholder="Куди" filter :disabled="!moveData.productId">
                            <template #option="l">
                                <span>Ряд: {{ l.option.rowCode }} | Стел: {{ l.option.rackCode }} | Пол: {{ l.option.shelfCode }}</span>
                            </template>
                        </Select>
                    </div>
                </div>
                <div class="field">
                    <label class="font-bold block mb-2 text-slate-700">Кількість</label>
                    <InputNumber v-model="moveData.quantity" :min="1" showButtons :disabled="!moveData.productId" />
                </div>
            </div>
            <template #footer>
                <Button label="Скасувати" icon="pi pi-times" text @click="moveDialog = false" />
                <Button label="Виконати" icon="pi pi-directions" severity="warning" :loading="submitting" @click="executeMove" :disabled="!moveData.fromLocationId || !moveData.toLocationId" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-tablist-tab-list) { border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; }
:deep(.p-tabpanels) { padding: 1.5rem; }
:deep(.p-datatable-thead > tr > th) { background-color: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.025em; }
:deep(.p-dialog-content) { padding-top: 1rem !important; overflow-y: visible !important; }
</style>