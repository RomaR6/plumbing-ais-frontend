<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../api/axiosInstance';
import { invoiceService } from '../api/invoiceService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import { FilterMatchMode } from '@primevue/core/api';

interface Log {
  id: number;
  action: string;
  timestamp: string;
  username: string;
}

interface LogFilters {
  global: { value: string | null; matchMode: any };
  username: { value: string | null; matchMode: any };
  actionType: { value: string[] | null; matchMode: any };
  dateRange: { value: Date[] | null; matchMode: any };
}

const logs = ref<Log[]>([]);
const loading = ref(true);
const toast = useToast();

const filters = ref<LogFilters>({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  username: { value: null, matchMode: FilterMatchMode.EQUALS },
  actionType: { value: [], matchMode: FilterMatchMode.IN },
  dateRange: { value: null, matchMode: FilterMatchMode.BETWEEN }
});

const actionOptions = ref([
  { name: 'Видалення', value: 'видалення' },
  { name: 'Оновлення/Зміна', value: 'оновлено' },
  { name: 'Створення', value: 'створення' },
  { name: 'Вхід', value: 'вхід' },
  { name: 'Транзакція', value: 'транзакція' },
  { name: 'Переміщення', value: 'переміщення' }
]);

const uniqueUsers = computed(() => {
  return [...new Set(logs.value.map(l => l.username))].sort();
});

const filteredLogs = computed(() => {
  let result = logs.value;

  const selectedTypes = filters.value.actionType.value;
  if (Array.isArray(selectedTypes) && selectedTypes.length > 0) {
    result = result.filter(log => {
      const actionText = log.action.toLowerCase();
      return selectedTypes.some(type => actionText.includes(type.toLowerCase()));
    });
  }

  if (filters.value.username.value) {
    result = result.filter(log => log.username === filters.value.username.value);
  }

  if (filters.value.dateRange.value && filters.value.dateRange.value[0] && filters.value.dateRange.value[1]) {
    const start = new Date(filters.value.dateRange.value[0]).getTime();
    const end = new Date(filters.value.dateRange.value[1]).getTime() + 86399999;
    
    result = result.filter(log => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start && logTime <= end;
    });
  }

  if (filters.value.global.value) {
    const searchTerm = filters.value.global.value.toLowerCase();
    result = result.filter(log => 
      log.username.toLowerCase().includes(searchTerm) || 
      log.action.toLowerCase().includes(searchTerm)
    );
  }

  return result;
});

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
      toast.add({ severity: 'error', summary: 'Помилка', detail: 'Файл не знайдено' });
    }
  }
};

const formatDate = (d: string) => new Date(d).toLocaleString('uk-UA');

const getActionSeverity = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('видалення')) return 'danger';
  if (a.includes('оновлено') || a.includes('зміна')) return 'warn';
  if (a.includes('створення') || a.includes('реєстрація')) return 'success';
  if (a.includes('вхід')) return 'secondary';
  return 'info';
};

onMounted(loadLogs);
</script>

<template>
  <div class="p-3 md:p-6">
    <Toast />
    <div class="card bg-white p-4 md:p-6 rounded-lg shadow border border-slate-200">
      <div class="mb-6 text-left">
        <h2 class="text-xl md:text-2xl font-bold text-slate-800">Журнал дій</h2>
        <p class="text-slate-500 text-sm">Історія операцій користувачів у системі</p>
      </div>

      <div class="flex flex-col md:flex-row flex-wrap gap-3 mb-6 items-center">
        <IconField iconPosition="left" class="w-full md:w-64">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filters.global.value" placeholder="Пошук..." class="w-full" />
        </IconField>
        
        <DatePicker 
          v-model="filters.dateRange.value" 
          selectionMode="range" 
          :manualInput="false" 
          placeholder="Період дат" 
          showIcon 
          iconDisplay="input"
          class="w-full md:w-64"
        />

        <Select 
          v-model="filters.username.value" 
          :options="uniqueUsers" 
          placeholder="Користувач" 
          showClear 
          class="w-full md:w-44" 
        />
        
        <MultiSelect 
          v-model="filters.actionType.value" 
          :options="actionOptions" 
          optionLabel="name" 
          optionValue="value" 
          placeholder="Типи дій" 
          :maxSelectedLabels="1" 
          class="w-full md:w-56" 
        />
      </div>

      <div class="overflow-x-auto">
        <DataTable 
          :value="filteredLogs" 
          :loading="loading" 
          paginator 
          :rows="15" 
          class="p-datatable-sm" 
          sortField="timestamp" 
          :sortOrder="-1"
          tableStyle="min-width: 50rem"
        >
          <Column field="timestamp" header="Час" sortable>
            <template #body="s">
              <span class="text-xs md:text-sm">{{ formatDate(s.data.timestamp) }}</span>
            </template>
          </Column>
          <Column field="username" header="Користувач" sortable>
            <template #body="s">
              <span class="font-bold text-slate-700 text-xs md:text-sm">{{ s.data.username }}</span>
            </template>
          </Column>
          <Column field="action" header="Дія">
            <template #body="s">
              <div class="flex justify-between items-center text-left gap-2">
                <Tag :value="s.data.action" :severity="getActionSeverity(s.data.action)" class="text-[10px] md:text-xs" />
                <Button 
                  v-if="s.data.action.toLowerCase().includes('транзакція') || s.data.action.includes('ID:') || s.data.action.toLowerCase().includes('переміщення')" 
                  icon="pi pi-print" 
                  text 
                  rounded 
                  class="p-button-sm flex-shrink-0"
                  @click="printInvoiceFromLog(s.data.action)" 
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
}

:deep(.p-inputtext), :deep(.p-select), :deep(.p-multiselect), :deep(.p-datepicker-input) {
    background-color: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
}

.overflow-x-auto {
  width: 100%;
}
</style>