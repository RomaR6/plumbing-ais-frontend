<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { stockService } from '../api/stockService';
import { productService } from '../api/productService';
import { invoiceService } from '../api/invoiceService';
import { useToast } from 'primevue/usetoast';
import type { Location, Product, TransactionItem } from '../types';

import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';

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
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Дані не завантажено' });
    }
};

const addToCart = () => {
    if (!currentItem.value.productId || !currentItem.value.locationId) return;
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
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Операція відхилена' });
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
    <div class="p-6 max-w-6xl mx-auto text-left">
        <Toast />
        
        <Dialog v-model:visible="showSuccessDialog" modal header="Транзакція завершена" :style="{ width: '25rem' }">
            <p class="mb-4">Бажаєте завантажити PDF накладну для цієї операції?</p>
            <div class="flex justify-end gap-2">
                <Button label="Пізніше" severity="secondary" @click="showSuccessDialog = false" />
                <Button label="Завантажити PDF" icon="pi pi-file-pdf" @click="downloadLastInvoice" />
            </div>
        </Dialog>

        <div class="mb-6 flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-bold text-slate-800">Нова накладна</h1>
                <p class="text-slate-500 text-sm">Групова реєстрація руху товарів</p>
            </div>
            <Select v-model="transactionType" :options="transactionTypes" optionLabel="label" optionValue="value" class="w-48" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card class="lg:col-span-1 border border-slate-200 shadow-sm h-fit text-left">
                <template #title><span class="text-lg">Додати товар</span></template>
                <template #content>
                    <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="font-bold text-slate-700 text-sm">Товар</label>
                            <Select v-model="currentItem.productId" :options="products" optionLabel="name" optionValue="id" filter placeholder="Оберіть товар" class="w-full" />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="font-bold text-slate-700 text-sm">Локація</label>
                            <Select v-model="currentItem.locationId" :options="locations" optionValue="id" filter placeholder="Оберіть місце" class="w-full">
                                <template #value="slotProps">
                                    <div v-if="slotProps.value" class="flex items-center">
                                        <span class="text-sm">Комірка #{{ slotProps.value }}</span>
                                    </div>
                                    <span v-else>{{ slotProps.placeholder }}</span>
                                </template>
                                <template #option="s">
                                    <div class="flex flex-col text-sm py-1 text-left">
                                        <span class="font-bold text-blue-600 mb-1">{{ s.option.warehouse?.name }}</span>
                                        <span class="text-slate-600">
                                            Ряд: <span class="font-medium text-slate-900">{{ s.option.rowCode }}</span> | 
                                            Стел: <span class="font-medium text-slate-900">{{ s.option.rackCode }}</span> | 
                                            Пол: <span class="font-medium text-slate-900">{{ s.option.shelfCode }}</span>
                                        </span>
                                    </div>
                                </template>
                            </Select>
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="font-bold text-slate-700 text-sm">Кількість</label>
                            <InputNumber v-model="currentItem.quantity" :min="1" showButtons class="w-full" />
                        </div>
                        <Button label="Додати до списку" icon="pi pi-plus" severity="secondary" @click="addToCart" class="mt-2" />
                    </div>
                </template>
            </Card>

            <div class="lg:col-span-2">
                <Card class="border border-slate-200 shadow-sm text-left">
                    <template #content>
                        <DataTable :value="cart" class="p-datatable-sm" responsiveLayout="scroll">
                            <template #empty><div class="p-4 text-center text-slate-400">Список порожній</div></template>
                            <Column header="Товар">
                                <template #body="slotProps">
                                    {{ slotProps.data.product?.name }}
                                </template>
                            </Column>
                            <Column field="quantity" header="К-сть" />
                            <Column header="Сума">
                                <template #body="slotProps">
                                    {{ (slotProps.data.price * slotProps.data.quantity).toFixed(2) }} грн
                                </template>
                            </Column>
                            <Column style="width: 3rem">
                                <template #body="slotProps">
                                    <Button icon="pi pi-times" severity="danger" text rounded @click="removeFromCart(slotProps.index)" />
                                </template>
                            </Column>
                        </DataTable>
                        <div v-if="cart.length > 0" class="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                            <span class="text-xl font-bold text-slate-800">{{ totalAmount.toFixed(2) }} грн</span>
                            <Button label="Провести накладну" icon="pi pi-check" severity="success" :loading="loading" @click="submitTransaction" class="px-6" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>