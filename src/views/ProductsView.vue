<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { productService } from '../api/productService';
import { categoryService } from '../api/categoryService';
import { brandService } from '../api/brandService';
import { unitService } from '../api/unitService';
import type { Product, Category, Brand, Unit } from '../types';

import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';


const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const brands = ref<Brand[]>([]);
const units = ref<Unit[]>([]);

const loading = ref(true);
const productDialog = ref(false);


const product = ref<Partial<Product>>({
    name: '',
    sku: '',
    price: 0,
    material: '',
    diameter: '',
    threadType: '',
    categoryId: undefined,
    brandId: undefined,
    unitId: undefined
});


const loadAllData = async () => {
    loading.value = true;
    try {
        const [prodRes, catRes, brandRes, unitRes] = await Promise.all([
            productService.getAll(),
            categoryService.getAll(),
            brandService.getAll(),
            unitService.getAll()
        ]);
        
        products.value = prodRes.data;
        categories.value = catRes.data;
        brands.value = brandRes.data;
        units.value = unitRes.data;
    } catch (error) {
        console.error("Помилка завантаження даних:", error);
    } finally {
        loading.value = false;
    }
};

onMounted(loadAllData);

const openNew = () => {
    product.value = { 
        name: '', 
        sku: '', 
        price: 0, 
        material: '', 
        diameter: '', 
        threadType: '', 
        categoryId: undefined, 
        brandId: undefined, 
        unitId: undefined 
    };
    productDialog.value = true;
};

const hideDialog = () => {
    productDialog.value = false;
};

const saveProduct = async () => {
    try {
        if (product.value.name?.trim() && product.value.categoryId) {
            await productService.create(product.value);
            productDialog.value = false;
            await loadAllData(); 
        } else {
            alert("Заповніть назву та оберіть категорію!");
        }
    } catch (error) {
        console.error("Помилка при збереженні:", error);
    }
};
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold">Каталог товарів</h2>
            <Button label="Додати товар" icon="pi pi-plus" severity="success" @click="openNew" />
        </div>

        <DataTable :value="products" :loading="loading" paginator :rows="10" class="p-datatable-sm shadow-md">
            <Column field="sku" header="SKU" sortable></Column>
            <Column field="name" header="Назва" sortable></Column>
            <Column field="categoryName" header="Категорія" sortable></Column>
            <Column field="price" header="Ціна" sortable>
                <template #body="slotProps">
                    {{ slotProps.data.price }} грн
                </template>
            </Column>
            <Column header="Дії">
                <template #body>
                    <Button icon="pi pi-pencil" text rounded severity="info" />
                    <Button icon="pi pi-trash" text rounded severity="danger" />
                </template>
            </Column>
        </DataTable>

        <Dialog v-model:visible="productDialog" :style="{width: '650px'}" header="Деталі товару" :modal="true" class="p-fluid">
            <div class="grid">
                <div class="field col-12 md:col-6 mb-4">
                    <label for="name" class="font-bold block mb-2">Назва</label>
                    <InputText id="name" v-model.trim="product.name" required="true" autofocus />
                </div>
                <div class="field col-12 md:col-6 mb-4">
                    <label for="sku" class="font-bold block mb-2">SKU (Артикул)</label>
                    <InputText id="sku" v-model.trim="product.sku" required="true" />
                </div>

                <div class="field col-12 md:col-4 mb-4">
                    <label class="font-bold block mb-2">Категорія</label>
                    <Dropdown v-model="product.categoryId" :options="categories" optionLabel="name" optionValue="id" placeholder="Оберіть категорію" />
                </div>
                <div class="field col-12 md:col-4 mb-4">
                    <label class="font-bold block mb-2">Бренд</label>
                    <Dropdown v-model="product.brandId" :options="brands" optionLabel="name" optionValue="id" placeholder="Оберіть бренд" />
                </div>
                <div class="field col-12 md:col-4 mb-4">
                    <label class="font-bold block mb-2">Од. виміру</label>
                    <Dropdown v-model="product.unitId" :options="units" optionLabel="name" optionValue="id" placeholder="Од." />
                </div>

                <div class="field col-12 md:col-4 mb-4">
                    <label class="font-bold block mb-2">Матеріал</label>
                    <InputText v-model="product.material" placeholder="напр. Латунь" />
                </div>
                <div class="field col-12 md:col-4 mb-4">
                    <label class="font-bold block mb-2">Діаметр</label>
                    <InputText v-model="product.diameter" placeholder="напр. 1/2" />
                </div>
                <div class="field col-12 md:col-4 mb-4">
                    <label class="font-bold block mb-2">Тип різьби</label>
                    <InputText v-model="product.threadType" placeholder="напр. Зовнішня" />
                </div>

                <div class="field col-12 mb-4">
                    <label for="price" class="font-bold block mb-2">Ціна</label>
                    <InputNumber id="price" v-model="product.price" mode="currency" currency="UAH" locale="uk-UA" />
                </div>
            </div>

            <template #footer>
                <Button label="Скасувати" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Зберегти" icon="pi pi-check" @click="saveProduct" />
            </template>
        </Dialog>
    </div>
</template>