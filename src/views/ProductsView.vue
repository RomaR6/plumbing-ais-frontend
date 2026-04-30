<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from '../stores/auth';
import { productService } from '../api/productService';
import { categoryService } from '../api/categoryService';
import { brandService } from '../api/brandService';
import { unitService } from '../api/unitService';
import type { Product, Category, Brand, Unit } from '../types';
import { FilterMatchMode } from '@primevue/core/api';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

const authStore = useAuthStore();
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);
const units = ref<Unit[]>([]);
const loading = ref(true);
const productDialog = ref(false);
const confirm = useConfirm();
const toast = useToast();
const product = ref<Partial<Product>>({});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    categoryName: { value: null, matchMode: FilterMatchMode.EQUALS },
    brandName: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const canEdit = computed(() => authStore.role === 'Admin' || authStore.role === 'Manager');
const canDelete = computed(() => authStore.role === 'Admin');
const canAdd = computed(() => authStore.role === 'Admin' || authStore.role === 'Manager');

const loadData = async () => {
    loading.value = true;
    try {
        const [p, c, b, u] = await Promise.all([
            productService.getAll(),
            categoryService.getAll(),
            brandService.getAll(),
            unitService.getAll()
        ]);
        products.value = p.data;
        categories.value = c.data;
        brands.value = b.data;
        units.value = u.data;
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: 'Дані не завантажено' });
    } finally {
        loading.value = false;
    }
};

onMounted(loadData);

const openNew = () => {
    product.value = { price: 0, minThreshold: 5 };
    productDialog.value = true;
};

const editProduct = (data: Product) => {
    product.value = { ...data };
    productDialog.value = true;
};

const saveProduct = async () => {
    if (!product.value.name || !product.value.sku || !product.value.categoryId) {
        toast.add({ severity: 'warn', summary: 'Увага', detail: 'Заповніть назву, Артикул та категорію' });
        return;
    }
    try {
        if (product.value.id) {
            await productService.update(product.value.id, product.value as Product);
            toast.add({ severity: 'success', summary: 'Успішно', detail: 'Товар оновлено' });
        } else {
            await productService.create(product.value);
            toast.add({ severity: 'success', summary: 'Успішно', detail: 'Товар створено' });
        }
        productDialog.value = false;
        await loadData();
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Помилка збереження' });
    }
};

const confirmDelete = (id: number) => {
    confirm.require({
        message: 'Ви впевнені, що хочете видалити цей товар?',
        header: 'Підтвердження',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Так, видалити',
        acceptClass: 'p-button-danger',
        rejectLabel: 'Ні',
        accept: async () => {
            try {
                await productService.delete(id);
                toast.add({ severity: 'success', summary: 'Видалено' });
                await loadData();
            } catch (e) {
                toast.add({ severity: 'error', summary: 'Помилка видалення' });
            }
        }
    });
};
</script>

<template>
    <div class="p-6">
        <Toast />
        <ConfirmDialog />
        
        <div class="bg-white p-6 rounded-lg shadow border border-slate-200">
            <div class="flex flex-col gap-6 mb-6">
                <div class="flex justify-between items-center text-left">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800">Каталог товарів</h2>
                        <p class="text-slate-500 text-sm">Управління номенклатурою та технічними характеристиками</p>
                    </div>
                    <Button v-if="canAdd" label="Додати товар" icon="pi pi-plus" severity="success" @click="openNew" />
                </div>

                <div class="flex items-center gap-3 mb-4">
                    <IconField iconPosition="left" style="width: 300px; min-width: 300px;">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Пошук..." class="w-full" />
                    </IconField>
                    
                    <Select 
                        v-model="filters['categoryName'].value" 
                        :options="categories" 
                        optionLabel="name" 
                        optionValue="name" 
                        placeholder="Всі категорії" 
                        showClear 
                        style="width: 250px; min-width: 250px;"
                    />
                    
                    <Select 
                        v-model="filters['brandName'].value" 
                        :options="brands" 
                        optionLabel="name" 
                        optionValue="name" 
                        placeholder="Всі бренди" 
                        showClear 
                        style="width: 200px; min-width: 200px;"
                    />
                </div>
            </div>

            <DataTable 
                :value="products" 
                :loading="loading" 
                v-model:filters="filters"
                :globalFilterFields="['sku', 'name']"
                paginator 
                :rows="10" 
                class="p-datatable-sm" 
                tableStyle="min-width: 90rem"
            >
                <Column field="sku" header="Артикул" sortable class="font-mono text-xs"></Column>
                <Column field="name" header="Назва" sortable></Column>
                <Column field="categoryName" header="Категорія" sortable>
                    <template #body="s">
                        <Tag :value="s.data.categoryName" severity="secondary" />
                    </template>
                </Column>
                <Column field="brandName" header="Бренд" sortable></Column>
                <Column field="material" header="Матеріал"></Column>
                <Column field="diameter" header="Діаметр"></Column>
                <Column field="threadType" header="Різьба"></Column>
                <Column field="unitName" header="Од. вим."></Column>
                <Column field="price" header="Ціна" sortable>
                    <template #body="s">
                        <span class="font-bold text-emerald-700">{{ s.data.price }} грн</span>
                    </template>
                </Column>
                <Column header="Дії" headerStyle="width: 7rem">
                    <template #body="s">
                        <div class="flex gap-2 justify-center">
                            <Button v-if="canEdit" icon="pi pi-pencil" text rounded severity="info" @click="editProduct(s.data)" />
                            <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(s.data.id)" />
                            <span v-if="!canEdit" class="text-slate-400 text-xs italic">Тільки перегляд</span>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="productDialog" :header="product.id ? 'Редагувати товар' : 'Новий товар'" modal style="width: 650px" class="p-fluid">
            <div class="flex flex-col gap-4 py-2 text-left">
                <div class="field">
                    <label class="font-bold text-slate-700 mb-1 block">Назва товару *</label>
                    <InputText v-model="product.name" placeholder="напр. Змішувач Grohe для ванної" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label class="font-bold text-slate-700 mb-1 block">Артикул *</label>
                        <InputText v-model="product.sku" placeholder="напр. GR-100-WM" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-700 mb-1 block">Ціна *</label>
                        <InputNumber v-model="product.price" mode="currency" currency="UAH" locale="uk-UA" />
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div class="field">
                        <label class="font-bold text-slate-700 mb-1 block">Категорія *</label>
                        <Select v-model="product.categoryId" :options="categories" optionLabel="name" optionValue="id" filter placeholder="Оберіть..." />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-700 mb-1 block">Бренд</label>
                        <Select v-model="product.brandId" :options="brands" optionLabel="name" optionValue="id" filter placeholder="Оберіть..." />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-700 mb-1 block">Од. виміру</label>
                        <Select v-model="product.unitId" :options="units" optionLabel="name" optionValue="id" placeholder="Оберіть..." />
                    </div>
                </div>
                <div class="divider border-t border-slate-100 my-2"></div>
                <div class="grid grid-cols-3 gap-4">
                    <div class="field">
                        <label class="font-bold text-slate-600 mb-1 block">Матеріал</label>
                        <InputText v-model="product.material" placeholder="напр. Латунь" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-600 mb-1 block">Діаметр</label>
                        <InputText v-model="product.diameter" placeholder="напр. 1/2" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-600 mb-1 block">Різьба</label>
                        <InputText v-model="product.threadType" placeholder="напр. Зовнішня" />
                    </div>
                </div>
                <div class="field">
                    <label class="font-bold text-slate-700 mb-1 block">Мінімальний поріг</label>
                    <InputNumber v-model="product.minThreshold" suffix=" од." />
                </div>
            </div>
            <template #footer>
                <Button label="Скасувати" icon="pi pi-times" text severity="secondary" @click="productDialog = false" />
                <Button label="Зберегти" icon="pi pi-check" severity="success" @click="saveProduct" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-inputtext), :deep(.p-select), :deep(.p-inputnumber-input) {
    background-color: #ffffff !important;
    color: #1e293b !important;
    border: 1px solid #cbd5e1 !important;
}
:deep(.p-select-label) { color: #1e293b !important; }
:deep(.p-datatable-thead > tr > th) { background-color: #f8fafc !important; }

.p-iconfield {
    display: inline-flex !important;
}
</style>