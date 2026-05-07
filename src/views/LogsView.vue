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
  <div class="view-container">
    <Toast />
    <div class="main-card">
      <div class="header-section">
        <h2 class="title">Журнал дій</h2>
        <p class="subtitle">Історія операцій користувачів у системі</p>
      </div>

      <div class="filters-bar">
        <IconField iconPosition="left" class="search-field">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filters.global.value" placeholder="Пошук..." class="full-width" />
        </IconField>
        
        <DatePicker 
          v-model="filters.dateRange.value" 
          selectionMode="range" 
          :manualInput="false" 
          placeholder="Період дат" 
          showIcon 
          iconDisplay="input"
          class="date-field"
        />

        <Select 
          v-model="filters.username.value" 
          :options="uniqueUsers" 
          placeholder="Користувач" 
          showClear 
          class="user-select" 
        />
        
        <MultiSelect 
          v-model="filters.actionType.value" 
          :options="actionOptions" 
          optionLabel="name" 
          optionValue="value" 
          placeholder="Типи дій" 
          :maxSelectedLabels="1" 
          class="type-select" 
        />
      </div>

      <div class="table-wrapper">
        <DataTable 
          :value="filteredLogs" 
          :loading="loading" 
          paginator 
          :rows="15" 
          class="p-datatable-sm" 
          sortField="timestamp" 
          :sortOrder="-1"
          tableStyle="min-width: 50rem"
          stripedRows
        >
          <Column field="timestamp" header="Час" sortable>
            <template #body="s">
              <span class="timestamp-text">{{ formatDate(s.data.timestamp) }}</span>
            </template>
          </Column>
          <Column field="username" header="Користувач" sortable>
            <template #body="s">
              <span class="user-badge">@{{ s.data.username }}</span>
            </template>
          </Column>
          <Column field="action" header="Деталі дії">
            <template #body="s">
              <div class="action-cell">
                <Tag :value="s.data.action" :severity="getActionSeverity(s.data.action)" class="action-tag" />
                <Button 
                  v-if="s.data.action.toLowerCase().includes('транзакція') || s.data.action.includes('ID:') || s.data.action.toLowerCase().includes('переміщення')" 
                  icon="pi pi-print" 
                  text 
                  rounded 
                  severity="secondary"
                  class="print-btn"
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
.view-container {
  padding: 1.5rem;
}

.main-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
}

.header-section {
  margin-bottom: 1.5rem;
  text-align: left;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.subtitle {
  color: #64748b;
  font-size: 0.875rem;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.search-field { width: 260px; }
.date-field { width: 260px; }
.user-select { width: 180px; }
.type-select { width: 220px; }
.full-width { width: 100%; }

.table-wrapper {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.timestamp-text { font-size: 0.875rem; font-weight: 500; }
.user-badge { font-weight: 700; color: #334155; font-size: 0.875rem; }

.action-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.action-tag { padding: 0.25rem 0.5rem; font-size: 0.65rem; }

:deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
}

:deep(.p-inputtext), :deep(.p-select), :deep(.p-multiselect) {
  background-color: #ffffff !important;
  border: 1px solid #cbd5e1 !important;
}

@media (max-width: 768px) {
  .view-container { padding: 1rem; }
  .filters-bar { flex-direction: column; align-items: stretch; }
  .search-field, .date-field, .user-select, .type-select { width: 100%; }
}
</style>