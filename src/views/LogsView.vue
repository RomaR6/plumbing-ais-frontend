<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axiosInstance';
import { invoiceService } from '../api/invoiceService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

interface Log {
  id: number;
  action: string;
  timestamp: string;
  username: string;
}

const logs = ref<Log[]>([]);
const loading = ref(true);
const toast = useToast();

const loadLogs = async () => {
  loading.value = true;
  try {
    const response = await api.get('Logs');
    logs.value = response.data;
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося завантажити логи' });
  } finally {
    loading.value = false;
  }
};

const printInvoiceFromLog = async (actionText: string) => {
  const match = actionText.match(/ID:?\s*(\d+)/i);
  
  if (match && match[1]) {
    try {
      await invoiceService.downloadInvoice(parseInt(match[1]));
      toast.add({ severity: 'success', summary: 'Успішно', detail: 'Завантаження розпочато' });
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Помилка', detail: 'Файл не знайдено на сервері' });
    }
  } else {
    toast.add({ severity: 'warn', summary: 'Увага', detail: 'ID транзакції не знайдено в описі' });
  }
};

const formatDate = (d: string) => {
  return new Date(d).toLocaleString('uk-UA');
};

const getActionSeverity = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('видалення') || a.includes('delete')) return 'danger';
  if (a.includes('оновлення') || a.includes('update') || a.includes('зміна')) return 'warn';
  if (a.includes('створення') || a.includes('create') || a.includes('реєстрація')) return 'success';
  if (a.includes('вхід')) return 'secondary';
  return 'info';
};

onMounted(loadLogs);
</script>

<template>
  <div class="p-6">
    <Toast />
    <div class="card bg-white p-6 rounded-lg shadow border border-slate-200">
      <div class="mb-6 text-left">
        <h2 class="text-2xl font-bold text-slate-800">Журнал дій</h2>
        <p class="text-slate-500 text-sm">Історія операцій користувачів у системі</p>
      </div>

      <DataTable :value="logs" :loading="loading" paginator :rows="15" class="p-datatable-sm" sortField="timestamp" :sortOrder="-1">
        <Column field="timestamp" header="Час" sortable>
          <template #body="s">{{ formatDate(s.data.timestamp) }}</template>
        </Column>
        <Column field="username" header="Користувач" sortable>
          <template #body="s">
            <span class="font-bold text-slate-700">{{ s.data.username }}</span>
          </template>
        </Column>
        <Column field="action" header="Дія">
          <template #body="s">
            <div class="flex justify-between items-center text-left">
              <Tag :value="s.data.action" :severity="getActionSeverity(s.data.action)" />
              <Button v-if="s.data.action.toLowerCase().includes('транзакція') || s.data.action.includes('ID:')" 
                      icon="pi pi-print" 
                      text rounded 
                      class="p-button-sm ml-2"
                      @click="printInvoiceFromLog(s.data.action)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
}
</style>