<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { stockService } from '../api/stockService';
import { productService } from '../api/productService';
import { invoiceService } from '../api/invoiceService';
import { useToast } from 'primevue/usetoast';
import type { Location, Product, TransactionItem } from '../types';

import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';

const route = useRoute();
const toast = useToast();
const loading = ref(false);
const showSuccessDialog = ref(false);
const lastTransactionId = ref<number | null>(null);

const products = ref<Product[]>([]);
const locations = ref<Location[]>([]);
const transactionType = ref('In');
const cart = ref<TransactionItem[]>([]);

const currentItem = ref({
    productId: null as number | null,
    locationId: null as number | null,
    quantity: 1
});

const transactionTypes = ref([
    { label: 'Прихід (In)', value: 'In' },
    { label: 'Видаток (Out)', value: 'Out' }
]);

const loadData = async () => {
    try {
        const [pRes, lRes] = await Promise.all([
            productService.getAll(),
            stockService.getLocations()
        ]);
        products.value = pRes.data;
        locations.value = lRes.data;

        if (route.query.productId) {
            const pId = parseInt(route.query.productId as string);
            const qty = parseInt(route.query.amount as string) || 1;
            const type = (route.query.type as string) || 'In';
            
            transactionType.value = type;
            currentItem.value.productId = pId;
            currentItem.value.quantity = qty;
        }
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Дані не завантажено' });
    }
};

const addToCart = () => {
    if (!currentItem.value.productId || !currentItem.value.locationId) {
        toast.add({ severity: 'warn', summary: 'Увага', detail: 'Оберіть товар та локацію' });
        return;
    }
    const product = products.value.find(p => p.id === currentItem.value.productId);
    const location = locations.value.find(l => l.id === currentItem.value.locationId);

    cart.value.push({
        productId: currentItem.value.productId,
        locationId: currentItem.value.locationId,
        quantity: currentItem.value.quantity,
        price: product?.price || 0,
        product: product,
        location: location
    });
    currentItem.value.productId = null;
    currentItem.value.quantity = 1;
};

const removeFromCart = (index: number) => {
    cart.value.splice(index, 1);
};

const totalAmount = computed(() => cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0));

const submitTransaction = async () => {
    if (cart.value.length === 0) return;
    loading.value = true;
    try {
        const payload = {
            type: transactionType.value,
            items: cart.value.map(item => ({
                productId: item.productId,
                locationId: item.locationId,
                quantity: item.quantity,
                price: item.price
            }))
        };
        const response = await stockService.createTransaction(payload);
        
        toast.add({ severity: 'success', summary: 'Успішно', detail: 'Накладну проведено' });
        cart.value = [];
        
        if (response.data && response.data.transactionId) {
            lastTransactionId.value = response.data.transactionId;
            showSuccessDialog.value = true;
        }
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: e.response?.data?.message || 'Операція відхилена' });
    } finally {
        loading.value = false;
    }
};

const downloadLastInvoice = async () => {
    if (lastTransactionId.value) {
        await invoiceService.downloadInvoice(lastTransactionId.value);
        showSuccessDialog.value = false;
    }
};

onMounted(loadData);
</script>

<template>
    <div class="view-container">
        <Toast />
        
        <Dialog v-model:visible="showSuccessDialog" modal header="Транзакція завершена" class="success-dialog">
            <p class="dialog-text">Бажаєте завантажити PDF накладну для цієї операції?</p>
            <div class="dialog-actions">
                <Button label="Пізніше" severity="secondary" @click="showSuccessDialog = false" />
                <Button label="Завантажити" icon="pi pi-file-pdf" @click="downloadLastInvoice" />
            </div>
        </Dialog>

        <div class="header-section">
            <h1 class="title">Нова накладна</h1>
            <p class="subtitle">Групова реєстрація руху товарів</p>
        </div>

        <div class="main-layout">
            <div class="form-panel">
                <Card class="input-card">
                    <template #title><span class="panel-title">Додати товар</span></template>
                    <template #content>
                        <div class="form-content-wrapper">
                            <div class="form-grid">
                                <div class="field-block">
                                    <label class="field-label">Тип операції</label>
                                    <Select v-model="transactionType" :options="transactionTypes" optionLabel="label" optionValue="value" class="fixed-width-input" />
                                </div>
                                <div class="field-block">
                                    <label class="field-label">Товар</label>
                                    <Select v-model="currentItem.productId" :options="products" optionLabel="name" optionValue="id" filter placeholder="Оберіть товар" class="fixed-width-input" />
                                </div>
                                <div class="field-block">
                                    <label class="field-label">Локація</label>
                                    <Select v-model="currentItem.locationId" :options="locations" optionValue="id" filter placeholder="Оберіть місце" class="fixed-width-input">
                                        <template #value="slotProps">
                                            <div v-if="slotProps.value" class="text-sm">Комірка #{{ slotProps.value }}</div>
                                            <span v-else>{{ slotProps.placeholder }}</span>
                                        </template>
                                        <template #option="s">
                                            <div class="location-option">
                                                <span class="wh-name">{{ s.option.warehouse?.name }}</span>
                                                <span class="loc-code">{{ s.option.rowCode }}-{{ s.option.rackCode }}-{{ s.option.shelfCode }}</span>
                                            </div>
                                        </template>
                                    </Select>
                                </div>
                                <div class="field-block">
                                    <label class="field-label">Кількість</label>
                                    <InputNumber v-model="currentItem.quantity" :min="1" showButtons class="fixed-width-input" />
                                </div>
                                <Button label="Додати до списку" icon="pi pi-plus" severity="secondary" @click="addToCart" class="add-btn" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <div class="table-panel">
                <Card class="cart-card">
                    <template #content>
                        <div class="table-container">
                            <DataTable :value="cart" class="p-datatable-sm" stripedRows>
                                <template #empty><div class="empty-msg">Список товарів порожній</div></template>
                                <Column header="Товар">
                                    <template #body="s"><span class="product-name">{{ s.data.product?.name }}</span></template>
                                </Column>
                                <Column field="quantity" header="К-сть" class="qty-col" />
                                <Column header="Сума">
                                    <template #body="s"><span class="amount-text">{{ (s.data.price * s.data.quantity).toFixed(0) }} ₴</span></template>
                                </Column>
                                <Column class="actions-col">
                                    <template #body="s"><Button icon="pi pi-times" severity="danger" text rounded @click="removeFromCart(s.index)" /></template>
                                </Column>
                            </DataTable>
                        </div>
                        <div v-if="cart.length > 0" class="footer-summary">
                            <div class="total-block">
                                <span class="total-label">Загальна сума</span>
                                <span class="total-value">{{ totalAmount.toFixed(0) }} ₴</span>
                            </div>
                            <Button label="Провести накладну" icon="pi pi-check" severity="success" :loading="loading" @click="submitTransaction" class="submit-btn" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.view-container { 
    padding: 1.5rem; 
    text-align: left; 
    width: 100%;
}

.header-section { margin-bottom: 2rem; }
.title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; }
.subtitle { color: #64748b; font-size: 0.875rem; }

.main-layout { 
    display: flex; 
    flex-direction: column; 
    gap: 1.5rem; 
    width: 100%;
}

.form-panel, .table-panel {
    width: 100%;
}

.form-content-wrapper { 
    width: 100%; 
    max-width: 600px; 
    margin: 0; 
}

.panel-title { font-size: 1.125rem; font-weight: 700; color: #334155; }
.form-grid { display: flex; flex-direction: column; gap: 1.25rem; }
.field-block { display: flex; flex-direction: column; gap: 0.5rem; }
.field-label { font-weight: 700; font-size: 0.875rem; color: #475569; }

.fixed-width-input { width: 100%; }

.add-btn { margin-top: 0.5rem; width: 100%; padding: 0.75rem; }

.location-option { display: flex; flex-direction: column; text-align: left; }
.wh-name { font-size: 0.7rem; font-weight: 800; color: #2563eb; text-transform: uppercase; }
.loc-code { font-size: 0.875rem; color: #475569; }

.input-card, .cart-card { border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); width: 100%; }

.table-container { border-radius: 8px; border: 1px solid #f1f5f9; overflow: hidden; }
.empty-msg { padding: 3rem; text-align: center; color: #94a3b8; font-style: italic; }
.product-name { font-weight: 600; color: #334155; }
.qty-col { width: 80px; text-align: center; }
.amount-text { font-weight: 700; color: #059669; }
.actions-col { width: 50px; }

.footer-summary { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px dashed #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.total-block { display: flex; flex-direction: column; }
.total-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.total-value { font-size: 2rem; font-weight: 900; color: #1e293b; }
.submit-btn { padding: 1rem 2rem; font-size: 1rem; width: auto; }

.success-dialog { width: 400px; }
.dialog-text { color: #475569; margin-bottom: 1.5rem; line-height: 1.5; }
.dialog-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

:deep(.p-datatable-thead > tr > th) { background-color: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }

@media (max-width: 768px) {
    .view-container { padding: 1rem; }
    .form-content-wrapper { max-width: 100%; }
    .footer-summary { flex-direction: column; align-items: stretch; gap: 1.5rem; text-align: center; }
    .submit-btn { width: 100%; }
}
</style>