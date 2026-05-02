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
    product.value = { 
        price: 0, 
        minThreshold: 5,
        name: '',
        sku: '',
        material: '',
        diameter: '',
        threadType: '',
        categoryId: undefined,
        brandId: undefined,
        unitId: undefined
    };
    productDialog.value = true;
};

const editProduct = (data: Product) => {
    product.value = { 
        ...data,
        categoryId: data.categoryId || categories.value.find(c => c.name === data.categoryName)?.id,
        brandId: data.brandId || brands.value.find(b => b.name === data.brandName)?.id,
        unitId: data.unitId || units.value.find(u => u.name === data.unitName)?.id
    };
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
    <div class="p-3 md:p-6">
        <Toast />
        <ConfirmDialog />
        
        <div class="bg-white p-4 md:p-6 rounded-lg shadow border border-slate-200">
            <div class="flex flex-col gap-4 mb-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                    <div>
                        <h2 class="text-xl md:text-2xl font-bold text-slate-800">Каталог товарів</h2>
                        <p class="text-slate-500 text-sm">Управління номенклатурою та технічними характеристиками</p>
                    </div>
                    <Button v-if="canAdd" label="Додати товар" icon="pi pi-plus" severity="success" @click="openNew" class="w-full md:w-auto" />
                </div>

                <div class="flex flex-col lg:flex-row items-center gap-3">
                    <IconField iconPosition="left" class="w-full lg:w-80">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="filters['global'].value" placeholder="Пошук..." class="w-full" />
                    </IconField>
                    
                    <div class="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                        <Select 
                            v-model="filters['categoryName'].value" 
                            :options="categories" 
                            optionLabel="name" 
                            optionValue="name" 
                            placeholder="Всі категорії" 
                            showClear 
                            class="w-full md:w-60"
                        />
                        
                        <Select 
                            v-model="filters['brandName'].value" 
                            :options="brands" 
                            optionLabel="name" 
                            optionValue="name" 
                            placeholder="Всі бренди" 
                            showClear 
                            class="w-full md:w-48"
                        />
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto border rounded-lg">
                <DataTable 
                    :value="products" 
                    :loading="loading" 
                    v-model:filters="filters"
                    :globalFilterFields="['sku', 'name']"
                    paginator 
                    :rows="10" 
                    class="p-datatable-sm" 
                    tableStyle="min-width: 100rem"
                    stripedRows
                >
                    <Column field="sku" header="Артикул" sortable class="font-mono text-[10px] md:text-xs"></Column>
                    <Column field="name" header="Назва" sortable class="text-sm md:text-base font-bold text-slate-700"></Column>
                    <Column field="categoryName" header="Категорія" sortable>
                        <template #body="s">
                            <Tag :value="s.data.categoryName" severity="secondary" class="text-[10px]" />
                        </template>
                    </Column>
                    <Column field="brandName" header="Бренд" sortable></Column>
                    <Column field="material" header="Матеріал" sortable></Column>
                    <Column field="diameter" header="Діаметр" sortable></Column>
                    <Column field="threadType" header="Різьба" sortable></Column>
                    <Column field="unitName" header="Од. вим."></Column>
                    <Column field="price" header="Ціна" sortable>
                        <template #body="s">
                            <span class="font-bold text-emerald-700 text-sm md:text-base">{{ s.data.price }} грн</span>
                        </template>
                    </Column>

                    <Column header="Дії" class="w-24 md:w-32 text-right" frozen alignFrozen="right">
                        <template #body="s">
                            <div class="flex gap-1 md:gap-2 justify-end">
                                <template v-if="canEdit">
                                    <Button icon="pi pi-pencil" text rounded severity="info" size="small" @click="editProduct(s.data)" />
                                    <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" size="small" @click="confirmDelete(s.data.id)" />
                                </template>
                                <span v-else class="text-slate-400 text-[10px] italic">Перегляд</span>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <Dialog v-model:visible="productDialog" :header="product.id ? 'Редагувати товар' : 'Новий товар'" modal class="p-fluid w-[95vw] md:w-[650px]">
            <div class="flex flex-col gap-3 md:gap-4 py-2 text-left">
                <div class="field">
                    <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Назва товару *</label>
                    <InputText v-model="product.name" placeholder="напр. Змішувач Grohe для ванної" />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div class="field">
                        <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Артикул *</label>
                        <InputText v-model="product.sku" placeholder="напр. GR-100-WM" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Ціна *</label>
                        <InputNumber v-model="product.price" mode="currency" currency="UAH" locale="uk-UA" />
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div class="field">
                        <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Категорія *</label>
                        <Select v-model="product.categoryId" :options="categories" optionLabel="name" optionValue="id" filter placeholder="Оберіть..." />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Бренд</label>
                        <Select v-model="product.brandId" :options="brands" optionLabel="name" optionValue="id" filter placeholder="Оберіть..." />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Од. виміру</label>
                        <Select v-model="product.unitId" :options="units" optionLabel="name" optionValue="id" placeholder="Оберіть..." />
                    </div>
                </div>
                <div class="divider border-t border-slate-100 my-1 md:my-2"></div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <div class="field">
                        <label class="font-bold text-slate-600 text-xs md:text-sm mb-1 block">Матеріал</label>
                        <InputText v-model="product.material" placeholder="напр. Латунь" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-600 text-xs md:text-sm mb-1 block">Діаметр</label>
                        <InputText v-model="product.diameter" placeholder="напр. 1/2" />
                    </div>
                    <div class="field">
                        <label class="font-bold text-slate-600 text-xs md:text-sm mb-1 block">Різьба</label>
                        <InputText v-model="product.threadType" placeholder="напр. Зовнішня" />
                    </div>
                </div>
                <div class="field">
                    <label class="font-bold text-slate-700 text-xs md:text-sm mb-1 block">Мінімальний поріг</label>
                    <InputNumber v-model="product.minThreshold" suffix=" од." />
                </div>
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <Button label="Скасувати" icon="pi pi-times" text severity="secondary" @click="productDialog = false" />
                    <Button label="Зберегти" icon="pi pi-check" severity="success" @click="saveProduct" />
                </div>
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

/* Стилізація смуги прокрутки для зручності */
.overflow-x-auto::-webkit-scrollbar {
    height: 8px;
}
.overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
.overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

@media (max-width: 768px) {
    :deep(.p-dialog-content) {
        padding: 1rem !important;
    }
}
</style>