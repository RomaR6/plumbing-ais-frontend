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
    <div class="view-container">
        <Toast />
        <ConfirmDialog />
        
        <div class="main-card">
            <div class="top-bar">
                <div class="title-block">
                    <h2 class="title">Каталог товарів</h2>
                    <p class="subtitle">Управління номенклатурою та характеристиками</p>
                </div>
                <Button v-if="canAdd" label="Додати товар" icon="pi pi-plus" severity="success" @click="openNew" class="add-button" />
            </div>

            <div class="toolbar">
                <IconField iconPosition="left" class="search-box">
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="filters['global'].value" placeholder="Пошук..." class="full-width" />
                </IconField>
                
                <div class="filter-group">
                    <Select v-model="filters['categoryName'].value" :options="categories" optionLabel="name" optionValue="name" placeholder="Всі категорії" showClear class="select-field" />
                    <Select v-model="filters['brandName'].value" :options="brands" optionLabel="name" optionValue="name" placeholder="Всі бренди" showClear class="select-field" />
                </div>
            </div>

            <div class="table-wrapper">
                <DataTable :value="products" :loading="loading" v-model:filters="filters" :globalFilterFields="['sku', 'name']" paginator :rows="10" class="p-datatable-sm" tableStyle="min-width: 100rem" stripedRows>
                    <Column field="sku" header="Артикул" sortable class="sku-cell"></Column>
                    <Column field="name" header="Назва" sortable class="name-cell"></Column>
                    <Column field="categoryName" header="Категорія" sortable>
                        <template #body="s"><Tag :value="s.data.categoryName" severity="secondary" class="tag-text" /></template>
                    </Column>
                    <Column field="brandName" header="Бренд" sortable></Column>
                    <Column field="material" header="Матеріал" sortable></Column>
                    <Column field="diameter" header="Діаметр" sortable></Column>
                    <Column field="threadType" header="Різьба" sortable></Column>
                    <Column field="unitName" header="Од. вим."></Column>
                    <Column field="price" header="Ціна" sortable>
                        <template #body="s"><span class="price-text">{{ s.data.price }} грн</span></template>
                    </Column>
                    <Column header="Дії" class="actions-column" frozen alignFrozen="right">
                        <template #body="s">
                            <div class="button-gap">
                                <template v-if="canEdit">
                                    <Button icon="pi pi-pencil" text rounded severity="info" size="small" @click="editProduct(s.data)" />
                                    <Button v-if="canDelete" icon="pi pi-trash" text rounded severity="danger" size="small" @click="confirmDelete(s.data.id)" />
                                </template>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <Dialog v-model:visible="productDialog" :header="product.id ? 'Редагувати товар' : 'Новий товар'" modal class="p-fluid wide-dialog">
            <div class="form-grid">
                <div class="field">
                    <label class="form-label">Назва товару *</label>
                    <InputText v-model="product.name" />
                </div>
                <div class="row-grid">
                    <div class="field">
                        <label class="form-label">Артикул *</label>
                        <InputText v-model="product.sku" />
                    </div>
                    <div class="field">
                        <label class="form-label">Ціна *</label>
                        <InputNumber v-model="product.price" mode="currency" currency="UAH" locale="uk-UA" />
                    </div>
                </div>
                <div class="row-grid-three">
                    <div class="field">
                        <label class="form-label">Категорія *</label>
                        <Select v-model="product.categoryId" :options="categories" optionLabel="name" optionValue="id" filter placeholder="Оберіть..." />
                    </div>
                    <div class="field">
                        <label class="form-label">Бренд</label>
                        <Select v-model="product.brandId" :options="brands" optionLabel="name" optionValue="id" filter placeholder="Оберіть..." />
                    </div>
                    <div class="field">
                        <label class="form-label">Од. виміру</label>
                        <Select v-model="product.unitId" :options="units" optionLabel="name" optionValue="id" placeholder="Оберіть..." />
                    </div>
                </div>
                <div class="row-grid-three">
                    <div class="field">
                        <label class="form-label">Матеріал</label>
                        <InputText v-model="product.material" />
                    </div>
                    <div class="field">
                        <label class="form-label">Діаметр</label>
                        <InputText v-model="product.diameter" />
                    </div>
                    <div class="field">
                        <label class="form-label">Різьба</label>
                        <InputText v-model="product.threadType" />
                    </div>
                </div>
                <div class="field">
                    <label class="form-label">Мінімальний поріг залишку</label>
                    <InputNumber v-model="product.minThreshold" suffix=" од." />
                </div>
                <div class="footer-actions">
                    <Button label="Скасувати" icon="pi pi-times" text severity="secondary" @click="productDialog = false" />
                    <Button label="Зберегти" icon="pi pi-check" severity="success" @click="saveProduct" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.view-container { padding: 1.5rem; }
.main-card { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
}

.title { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; text-align: left; }
.subtitle { color: #64748b; font-size: 0.875rem; text-align: left; }

.toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.search-box { width: 320px; }
.filter-group { display: flex; gap: 1rem; }
.select-field { width: 220px; }
.full-width { width: 100%; }

.table-wrapper { border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }

.sku-cell { font-family: monospace; font-size: 0.75rem; }
.name-cell { font-weight: 700; color: #334155; }
.price-text { font-weight: 700; color: #065f46; }
.button-gap { display: flex; gap: 0.5rem; justify-content: flex-end; }

.form-grid { display: flex; flex-direction: column; gap: 1.25rem; padding: 1rem 0; }
.row-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 1rem; }
.row-grid-three { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 1rem; }
.form-label { font-weight: 700; font-size: 0.875rem; margin-bottom: 0.25rem; display: block; text-align: left; }
.footer-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }

.wide-dialog { width: 650px; }

:deep(.p-datatable-thead > tr > th) { background-color: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }

@media (max-width: 768px) {
    .top-bar, .toolbar, .filter-group { flex-direction: column; align-items: stretch; }
    .search-box, .select-field { width: 100%; }
    .row-grid, .row-grid-three { grid-template-cols: 1fr; }
    .wide-dialog { width: 95vw !important; }
}
</style>