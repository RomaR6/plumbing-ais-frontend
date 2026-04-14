<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { productService } from '../api/productService';
import type { Product } from '../types';

const products = ref<Product[]>([]);
const loading = ref(true);

onMounted(async () => {
    try {
        const response = await productService.getAll();
        products.value = response.data;
    } catch (error) {
        console.error("Помилка завантаження:", error);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
  <div class="card">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold">Каталог товарів</h2>
      <Button label="Додати товар" icon="pi pi-plus" severity="success" />
    </div>

    <DataTable :value="products" :loading="loading" paginator :rows="10" 
               class="p-datatable-sm" tableStyle="min-width: 50rem">
      <Column field="sku" header="SKU" sortable></Column>
      <Column field="name" header="Назва" sortable></Column>
      <Column field="categoryName" header="Категорія" sortable></Column>
      <Column field="price" header="Ціна" sortable>
        <template #body="slotProps">
          {{ slotProps.data.price }} грн
        </template>
      </Column>
      <Column field="brandName" header="Бренд"></Column>
      <Column header="Дії">
        <template #body>
          <Button icon="pi pi-pencil" text rounded severity="info" />
          <Button icon="pi pi-trash" text rounded severity="danger" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>