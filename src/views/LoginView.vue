<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/axiosInstance';
import { useAuthStore } from '../stores/auth';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';

const router = useRouter();
const authStore = useAuthStore();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        const response = await api.post('Auth/login', {
            username: username.value,
            password: password.value
        });
        
        await authStore.setToken(response.data.token);
        router.push('/');
    } catch (err: any) {
        error.value = 'Невірний логін або пароль';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <i class="pi pi-lock"></i>
                <h1>AIS Plumbing</h1>
                <p>Вхід для персоналу</p>
            </div>
            
            <form @submit.prevent="handleLogin" class="login-form">
                <div class="field">
                    <label>Логін</label>
                    <InputText v-model="username" placeholder="Введіть логін" class="w-full" />
                </div>
                <div class="field">
                    <label>Пароль</label>
                    <InputText v-model="password" type="password" placeholder="••••••••" class="w-full" @keyup.enter="handleLogin" />
                </div>
                
                <Message v-if="error" severity="error" variant="simple" size="small">{{ error }}</Message>
                
                <div class="actions">
                    <Button label="Увійти" icon="pi pi-sign-in" :loading="loading" type="submit" severity="success" class="w-full" />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f1f5f9;
}
.login-card {
    background: white;
    padding: 2.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
}
.login-header {
    text-align: center;
    margin-bottom: 2rem;
}
.login-header i {
    font-size: 2.5rem;
    color: #10b981;
    margin-bottom: 1rem;
}
.login-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}
.login-header p {
    color: #64748b;
    font-size: 0.9rem;
}
.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}
.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.field label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #475569;
}
.actions {
    margin-top: 1rem;
}
</style>