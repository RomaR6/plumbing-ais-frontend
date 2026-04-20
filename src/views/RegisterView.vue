<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axiosInstance';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const username = ref('');
const password = ref('');
const firstName = ref('');
const lastName = ref('');
const success = ref(false);
const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
    loading.value = true;
    error.value = '';
    try {
        await api.post('Auth/register', {
            username: username.value,
            password: password.value,
            firstName: firstName.value,
            lastName: lastName.value,
            role: "User"
        });
        success.value = true;
        setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
        error.value = err.response?.data?.message || 'Помилка реєстрації';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <i class="pi pi-user-plus"></i>
                <h1>Реєстрація</h1>
            </div>
            
            <form v-if="!success" @submit.prevent="handleRegister" class="login-form">
                <div class="field">
                    <label>Логін</label>
                    <InputText v-model="username" class="w-full" required />
                </div>
                <div class="field">
                    <label>Пароль</label>
                    <InputText v-model="password" type="password" class="w-full" required />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="field">
                        <label>Ім'я</label>
                        <InputText v-model="firstName" class="w-full" required />
                    </div>
                    <div class="field">
                        <label>Прізвище</label>
                        <InputText v-model="lastName" class="w-full" required />
                    </div>
                </div>

                <Message v-if="error" severity="error" variant="simple" size="small">{{ error }}</Message>

                <div class="actions">
                    <Button label="Зареєструватися" :loading="loading" type="submit" severity="primary" class="w-full" />
                    <Button label="Вже є аккаунт?" text @click="router.push('/login')" class="w-full" />
                </div>
            </form>

            <div v-else class="text-center py-4">
                <Message severity="success">Успішно! Перенаправлення на вхід...</Message>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f1f5f9; }
.login-card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; }
.login-header { text-align: center; margin-bottom: 2rem; }
.login-header i { font-size: 2.5rem; color: #3b82f6; }
.login-form { display: flex; flex-direction: column; gap: 1.25rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field label { font-weight: 600; font-size: 0.875rem; color: #475569; }
</style>