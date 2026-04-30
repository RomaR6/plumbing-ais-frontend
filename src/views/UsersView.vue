<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { userService } from '../api/userService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import ConfirmDialog from 'primevue/confirmdialog';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { FilterMatchMode } from '@primevue/core/api';
import api from '../api/axiosInstance';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const userDialog = ref(false);
const toast = useToast();
const confirm = useConfirm();
const roles = ref(['Admin', 'Manager', 'User']);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  role: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const newUser = ref({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'User'
});

const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await userService.getAll();
    users.value = response.data;
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Помилка', detail: 'Дані не завантажено' });
  } finally {
    loading.value = false;
  }
};

const registerUser = async () => {
  try {
    await api.post('Auth/register', newUser.value);
    toast.add({ severity: 'success', summary: 'Успішно', detail: 'Користувача створено' });
    userDialog.value = false;
    newUser.value = { username: '', password: '', firstName: '', lastName: '', role: 'User' };
    await loadUsers();
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Помилка', detail: 'Реєстрація не вдалася' });
  }
};

const updateRole = async (user: User) => {
  try {
    await userService.updateRole(user.id, user.role);
    toast.add({ severity: 'success', summary: 'Оновлено', detail: 'Роль змінено' });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Помилка', detail: 'Не вдалося оновити роль' });
    await loadUsers();
  }
};

const deleteUser = (id: number) => {
  confirm.require({
    message: 'Ви впевнені, що хочете видалити цього користувача?',
    header: 'Підтвердження',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Видалити',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Скасувати',
    accept: async () => {
      try {
        await userService.deleteUser(id);
        toast.add({ severity: 'success', summary: 'Видалено', detail: 'Користувача видалено' });
        await loadUsers();
      } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Помилка', detail: err.response?.data?.message || 'Помилка видалення' });
      }
    }
  });
};

const formatDate = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};

const getRoleSeverity = (r: string) => {
  if (r === 'Admin') return 'danger';
  if (r === 'Manager') return 'warn';
  return 'info';
};

onMounted(loadUsers);
</script>

<template>
  <div class="p-6">
    <Toast />
    <ConfirmDialog />
    
    <div class="card bg-white p-6 rounded-lg shadow border border-slate-200">
      <div class="flex flex-col gap-6 mb-6 text-left">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">Управління персоналом</h2>
            <p class="text-slate-500 text-sm">Список працівників та налаштування прав доступу</p>
          </div>
          <Button label="Додати" icon="pi pi-user-plus" severity="success" @click="userDialog = true" />
        </div>

        <div class="flex flex-wrap gap-3 items-center">
          <IconField iconPosition="left" style="width: 300px; min-width: 300px;">
            <InputIcon class="pi pi-search" />
            <InputText v-model="filters['global'].value" placeholder="Пошук працівника..." class="w-full" />
          </IconField>
          
          <Select 
            v-model="filters['role'].value" 
            :options="roles" 
            placeholder="Фільтр за роллю" 
            showClear 
            style="width: 200px; min-width: 200px;"
          />
        </div>
      </div>

      <DataTable 
        :value="users" 
        :loading="loading" 
        v-model:filters="filters"
        :globalFilterFields="['username', 'firstName', 'lastName']"
        paginator :rows="10" 
        class="p-datatable-sm"
      >
        <Column header="ПІБ" sortable>
          <template #body="s">
            <div class="flex flex-col text-left">
              <span class="font-bold text-slate-700">{{ s.data.firstName }} {{ s.data.lastName }}</span>
              <span class="text-xs text-slate-500">@{{ s.data.username }}</span>
            </div>
          </template>
        </Column>
        <Column field="createdAt" header="Дата реєстрації" sortable>
          <template #body="s">{{ formatDate(s.data.createdAt) }}</template>
        </Column>
        <Column field="role" header="Роль">
          <template #body="s">
            <Tag :value="s.data.role" :severity="getRoleSeverity(s.data.role)" />
          </template>
        </Column>
        <Column header="Змінити роль" style="min-width: 12rem">
          <template #body="s">
            <Select v-model="s.data.role" :options="roles" @change="updateRole(s.data)" class="w-full" />
          </template>
        </Column>
        <Column header="Дії" style="width: 5rem">
          <template #body="s">
            <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteUser(s.data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="userDialog" header="Реєстрація нового співробітника" modal style="width: 450px" class="p-fluid">
      <div class="flex flex-col gap-4 py-2 text-left">
        <div class="field">
          <label class="font-bold text-sm text-slate-600">Логін</label>
          <InputText v-model="newUser.username" />
        </div>
        <div class="field">
          <label class="font-bold text-sm text-slate-600">Пароль</label>
          <InputText v-model="newUser.password" type="password" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="field">
            <label class="font-bold text-sm text-slate-600">Ім'я</label>
            <InputText v-model="newUser.firstName" />
          </div>
          <div class="field">
            <label class="font-bold text-sm text-slate-600">Прізвище</label>
            <InputText v-model="newUser.lastName" />
          </div>
        </div>
        <div class="field">
          <label class="font-bold text-sm text-slate-600">Початкова роль</label>
          <Select v-model="newUser.role" :options="roles" />
        </div>
      </div>
      <template #footer>
        <Button label="Скасувати" text severity="secondary" @click="userDialog = false" />
        <Button label="Зареєструвати" severity="success" @click="registerUser" />
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
:deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.p-iconfield {
    display: inline-flex !important;
}
</style>