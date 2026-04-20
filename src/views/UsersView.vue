<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../api/axiosInstance';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

interface User {
  id: number;
  username: string;
  role: string;
}

const users = ref<User[]>([]);
const loading = ref(true);
const userDialog = ref(false);
const toast = useToast();
const roles = ref(['Admin', 'Manager', 'User']);

const newUser = ref({
  username: '',
  password: '',
  role: 'User'
});

const loadUsers = async () => {
  loading.value = true;
  try {
    const response = await api.get('Users');
    users.value = response.data;
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load' });
  } finally {
    loading.value = false;
  }
};

const registerUser = async () => {
  try {
    await api.post('Auth/register', newUser.value);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Registered' });
    userDialog.value = false;
    newUser.value = { username: '', password: '', role: 'User' };
    await loadUsers();
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Registration failed' });
  }
};

const updateRole = async (user: User) => {
  try {
    await api.put(`Users/${user.id}/role`, { role: user.role });
    toast.add({ severity: 'success', summary: 'Updated', detail: 'Role changed' });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Update failed' });
    await loadUsers();
  }
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
    <div class="card bg-white p-6 rounded shadow border">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Персонал</h2>
        <Button label="Додати" icon="pi pi-user-plus" severity="success" @click="userDialog = true" />
      </div>

      <DataTable :value="users" :loading="loading" class="p-datatable-sm">
        <Column field="username" header="Логін"></Column>
        <Column field="role" header="Роль">
          <template #body="s">
            <Tag :value="s.data.role" :severity="getRoleSeverity(s.data.role)" />
          </template>
        </Column>
        <Column header="Змінити роль">
          <template #body="s">
            <Select v-model="s.data.role" :options="roles" @change="updateRole(s.data)" class="w-full" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="userDialog" header="Реєстрація" modal style="width: 400px">
      <div class="flex flex-col gap-4">
        <InputText v-model="newUser.username" placeholder="Логін" />
        <InputText v-model="newUser.password" type="password" placeholder="Пароль" />
        <Select v-model="newUser.role" :options="roles" placeholder="Роль" />
      </div>
      <template #footer>
        <Button label="Створити" @click="registerUser" />
      </template>
    </Dialog>
  </div>
</template>