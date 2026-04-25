<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { stockService } from '../api/stockService';
import { productService } from '../api/productService';
import { useToast } from 'primevue/usetoast';
import type { Location, Product } from '../types';

import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import Card from 'primevue/card';

const toast = useToast();
const loading = ref(false);
const products = ref<Product[]>([]);
const locations = ref<Location[]>([]);

const transaction = ref({
    productId: null as number | null,
    locationId: null as number | null,
    quantity: 1,
    type: 'In',
    contractorId: null as number | null
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
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося завантажити дані' });
    }
};

const submitTransaction = async () => {
    if (!transaction.value.productId || !transaction.value.locationId) {
        toast.add({ severity: 'warn', summary: 'Увага', detail: 'Заповніть усі обов’язкові поля' });
        return;
    }

    loading.value = true;
    try {
        await stockService.createTransaction(
            transaction.value.productId,
            transaction.value.locationId,
            transaction.value.quantity,
            transaction.value.type,
            transaction.value.contractorId || undefined
        );
        toast.add({ severity: 'success', summary: 'Успішно', detail: 'Операцію проведено' });
        transaction.value.quantity = 1;
        transaction.value.productId = null;
        transaction.value.locationId = null;
    } catch (e: any) {
        toast.add({ 
            severity: 'error', 
            summary: 'Помилка', 
            detail: e.response?.data?.message || 'Помилка виконання транзакції' 
        });
    } finally {
        loading.value = false;
    }
};

onMounted(loadData);
</script>

<template>
    <div class="p-6 max-w-4xl mx-auto text-left">
        <Toast />
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800">Складська транзакція</h1>
            <p class="text-slate-500">Реєстрація руху товарів на складі</p>
        </div>

        <Card class="border border-slate-200 shadow-sm">
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-slate-700 text-sm">Тип операції</label>
                        <Select v-model="transaction.type" :options="transactionTypes" optionLabel="label" optionValue="value" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-slate-700 text-sm">Товар</label>
                        <Select v-model="transaction.productId" :options="products" optionLabel="name" optionValue="id" filter placeholder="Оберіть товар" class="w-full" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-slate-700 text-sm">Локація</label>
                        <Select v-model="transaction.locationId" :options="locations" optionValue="id" filter placeholder="Оберіть місце" class="w-full">
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="text-slate-800">
                                    Комірка #{{ slotProps.value }}
                                </div>
                                <span v-else>{{ slotProps.placeholder }}</span>
                            </template>
                            <template #option="s">
                                <div class="flex flex-col text-sm">
                                    <span class="font-bold text-blue-600">{{ s.option.warehouse?.name || 'Склад' }}</span>
                                    <span class="text-slate-600">Ряд: {{ s.option.rowCode }}, Стел: {{ s.option.rackCode }}, Пол: {{ s.option.shelfCode }}</span>
                                </div>
                            </template>
                        </Select>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-slate-700 text-sm">Кількість</label>
                        <InputNumber v-model="transaction.quantity" :min="1" showButtons class="w-full" />
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <Button label="Скасувати" severity="secondary" variant="text" @click="transaction.productId = null" />
                    <Button label="Підтвердити" icon="pi pi-check" :loading="loading" @click="submitTransaction" class="px-6" />
                </div>
            </template>
        </Card>

        <div class="mt-6">
            <Message severity="secondary" icon="pi pi-info-circle" :closable="false">
                Операція автоматично оновить залишки та буде зафіксована в журналі дій.
            </Message>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-select) { background: #ffffff !important; border: 1px solid #cbd5e1; }
:deep(.p-inputnumber-input) { background: #ffffff !important; border: 1px solid #cbd5e1; color: #1e293b !important; }
:deep(.p-select-label) { color: #1e293b !important; }
</style>