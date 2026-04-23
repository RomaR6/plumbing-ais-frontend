<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { stockService } from '../api/stockService';
import { useAuthStore } from '../stores/auth';
import type { Stock, Location } from '../types';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const authStore = useAuthStore();
const toast = useToast();
const stocks = ref<Stock[]>([]);
const locations = ref<Location[]>([]);
const loading = ref(true);

const isAdmin = computed(() => authStore.role === 'Admin');

const loadData = async () => {
  loading.value = true;
  try {
    const [sResponse, lResponse] = await Promise.all([
      stockService.getAllStocks(),
      stockService.getLocations()
    ]);
    stocks.value = sResponse.data;
    locations.value = lResponse.data;
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося завантажити дані складу' });
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const getStockSeverity = (quantity: number, threshold: number = 5) => {
  if (quantity <= 0) return 'danger';
  if (quantity <= threshold) return 'warn';
  return 'success';
};
</script>

<template>
  <div class="p-6 text-left">
    <Toast />
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-slate-800 text-left">Управління складом</h1>
      <p class="text-slate-500">Облік залишків, керування локаціями та переміщеннями</p>
    </div>

    <div class="card bg-white rounded-lg shadow border border-slate-200">
      <Tabs value="0">
        <TabList>
          <Tab value="0">
            <i class="pi pi-box mr-2"></i> Поточні залишки
          </Tab>
          <Tab value="1">
            <i class="pi pi-map-marker mr-2"></i> Адресне зберігання (Локації)
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="0">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-slate-700">Товари на складах</h3>
              <div class="flex gap-2">
                <Button label="Прихід/Видаток" icon="pi pi-sync" severity="primary" size="small" />
                <Button label="Перемістити" icon="pi pi-directions" severity="secondary" size="small" />
              </div>
            </div>

            <DataTable :value="stocks" :loading="loading" paginator :rows="10" class="p-datatable-sm">
              <Column field="product.sku" header="Артикул" sortable>
                <template #body="s">
                  <span class="font-mono text-xs">{{ s.data.product?.sku || 'N/A' }}</span>
                </template>
              </Column>
              <Column field="product.name" header="Товар" sortable></Column>
              <Column header="Локація">
                <template #body="s">
                  <div v-if="s.data.location" class="text-sm">
                    <span class="font-bold text-blue-600">{{ s.data.location.warehouse?.name }}</span>
                    <span class="ml-2 text-slate-500">[{{ s.data.location.rowCode }}-{{ s.data.location.rackCode }}-{{ s.data.location.shelfCode }}]</span>
                  </div>
                </template>
              </Column>
              <Column field="quantity" header="Кількість" sortable>
                <template #body="s">
                  <Tag :value="s.data.quantity" :severity="getStockSeverity(s.data.quantity)" />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="1">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold text-slate-700">Список адрес зберігання</h3>
              <Button v-if="isAdmin" label="Додати локацію" icon="pi pi-plus" severity="success" size="small" />
            </div>

            <DataTable :value="locations" :loading="loading" class="p-datatable-sm">
              <Column field="warehouse.name" header="Склад"></Column>
              <Column field="rowCode" header="Ряд"></Column>
              <Column field="rackCode" header="Стелаж"></Column>
              <Column field="shelfCode" header="Полиця"></Column>
              <Column header="Повна адреса">
                <template #body="s">
                  <span class="p-1 px-2 bg-slate-100 rounded text-xs font-bold text-slate-600">
                    {{ s.data.rowCode }}{{ s.data.rackCode }}{{ s.data.shelfCode }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-tablist-tab-list) {
  border-bottom: 1px solid #e2e8f0;
}
:deep(.p-tabpanels) {
  padding: 1.5rem;
}
</style>