<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axiosInstance';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
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

const formatDate = (d: string) => {
  return new Date(d).toLocaleString('uk-UA');
};

const getActionSeverity = (action: string) => {
  if (action.includes('Видалення') || action.includes('Delete')) return 'danger';
  if (action.includes('Оновлення') || action.includes('Update') || action.includes('Зміна')) return 'warn';
  if (action.includes('Створення') || action.includes('Create') || action.includes('реєстрація')) return 'success';
  if (action.includes('Вхід')) return 'secondary';
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

      <DataTable :value="logs" :loading="loading" paginator :rows="15" class="p-datatable-sm">
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
            <Tag :value="s.data.action" :severity="getActionSeverity(s.data.action)" />
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