<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
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
const windowWidth = ref(window.innerWidth);

const updateWidth = () => {
  windowWidth.value = window.innerWidth;
};

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
  return new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getRoleSeverity = (r: string) => {
  if (r === 'Admin') return 'danger';
  if (r === 'Manager') return 'warn';
  return 'info';
};

onMounted(() => {
  loadUsers();
  window.addEventListener('resize', updateWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});
</script>

<template>
  <div class="view-container">
    <Toast />
    <ConfirmDialog />
    
    <div class="header-bar">
      <div class="title-section">
        <h1 class="main-title">Персонал</h1>
        <p class="subtitle">Управління доступом та налаштування прав користувачів</p>
      </div>
      <Button 
        icon="pi pi-user-plus" 
        :label="windowWidth > 768 ? 'Додати співробітника' : ''" 
        severity="success" 
        @click="userDialog = true" 
        class="add-user-btn"
      />
    </div>

    <div class="content-card">
      <div class="toolbar">
        <IconField iconPosition="left" class="search-field">
          <InputIcon class="pi pi-search" />
          <InputText v-model="filters['global'].value" placeholder="Пошук за іменем або логіном..." />
        </IconField>
        
        <Select 
          v-model="filters['role'].value" 
          :options="roles" 
          placeholder="Всі ролі" 
          showClear 
          class="role-filter"
        />
      </div>

      <div class="table-wrapper">
        <DataTable 
          :value="users" 
          :loading="loading" 
          v-model:filters="filters"
          :globalFilterFields="['username', 'firstName', 'lastName']"
          paginator :rows="10" 
          class="p-datatable-sm custom-users-table"
          stripedRows
        >
          <Column header="Співробітник" sortable sortField="firstName">
            <template #body="s">
              <div class="user-cell">
                <div class="user-avatar-text">{{ s.data.firstName[0] }}{{ s.data.lastName[0] }}</div>
                <div class="user-info">
                  <span class="full-name">{{ s.data.firstName }} {{ s.data.lastName }}</span>
                  <span class="username">@{{ s.data.username }}</span>
                </div>
              </div>
            </template>
          </Column>
          
          <Column field="createdAt" header="Реєстрація" sortable>
            <template #body="s">
              <span class="date-text">{{ formatDate(s.data.createdAt) }}</span>
            </template>
          </Column>
          
          <Column field="role" header="Статус">
            <template #body="s">
              <Tag :value="s.data.role" :severity="getRoleSeverity(s.data.role)" class="role-tag" />
            </template>
          </Column>
          
          <Column header="Управління роллю" style="min-width: 14rem">
            <template #body="s">
              <Select v-model="s.data.role" :options="roles" @change="updateRole(s.data)" class="role-switcher" size="small" />
            </template>
          </Column>
          
          <Column header="Дії" class="text-right">
            <template #body="s">
              <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteUser(s.data.id)" class="delete-btn" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="userDialog" header="Реєстрація нового співробітника" modal class="p-fluid user-modal">
      <div class="modal-form">
        <div class="form-row">
          <div class="field-group">
            <label class="form-label">Логін</label>
            <InputText v-model="newUser.username" placeholder="Логін для входу" />
          </div>
          <div class="field-group">
            <label class="form-label">Пароль</label>
            <InputText v-model="newUser.password" type="password" placeholder="********" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="field-group">
            <label class="form-label">Ім'я</label>
            <InputText v-model="newUser.firstName" placeholder="Ім'я" />
          </div>
          <div class="field-group">
            <label class="form-label">Прізвище</label>
            <InputText v-model="newUser.lastName" placeholder="Прізвище" />
          </div>
        </div>
        
        <div class="field-group full-width">
          <label class="form-label">Системна роль</label>
          <Select v-model="newUser.role" :options="roles" placeholder="Оберіть роль" />
        </div>
      </div>
      <template #footer>
        <div class="modal-actions">
          <Button label="Скасувати" text severity="secondary" @click="userDialog = false" />
          <Button label="Створити акаунт" severity="success" icon="pi pi-check" @click="registerUser" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.view-container {
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
  text-align: left;
}

.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.main-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.content-card {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  overflow: hidden;
}

.toolbar {
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid #f1f5f9;
  background-color: white;
}

.search-field { flex: 1; max-width: 400px; }
.search-field :deep(.p-inputtext) { width: 100%; border-radius: 0.5rem; }
.role-filter { width: 200px; border-radius: 0.5rem; }

.table-wrapper { padding: 0.5rem; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar-text {
  width: 2.5rem;
  height: 2.5rem;
  background: #ecfdf5;
  color: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  border: 1px solid #d1fae5;
}

.user-info { display: flex; flex-direction: column; }
.full-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
.username { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

.date-text { font-size: 0.85rem; color: #64748b; }
.role-tag { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 0.5rem; }
.role-switcher { border-radius: 0.5rem; }

.user-modal { width: 500px; }
.modal-form { display: flex; flex-direction: column; gap: 1.5rem; padding: 1rem 0; }
.form-row { display: flex; gap: 1rem; }
.field-group { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.form-label { font-weight: 700; font-size: 0.85rem; color: #475569; text-transform: uppercase; letter-spacing: 0.025em; }
.modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }

:deep(.p-datatable-thead > tr > th) {
  background-color: #f8fafc !important;
  color: #64748b !important;
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
  font-weight: 700 !important;
  padding: 1rem !important;
  border-bottom: 2px solid #f1f5f9 !important;
}

@media (max-width: 768px) {
  .view-container { padding: 1rem; }
  .header-bar { flex-direction: column; align-items: stretch; gap: 1rem; }
  .toolbar { flex-direction: column; }
  .search-field, .role-filter { max-width: 100%; width: 100%; }
  .form-row { flex-direction: column; }
}
</style>