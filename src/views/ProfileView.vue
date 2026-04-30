<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const roleName = computed(() => authStore.role || 'Гість');

const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const getRoleSeverity = (role: string) => {
    switch (role) {
        case 'Admin': return 'danger';
        case 'Manager': return 'warn';
        case 'User': return 'info';
        default: return 'secondary';
    }
};

onMounted(() => {
    if (!authStore.user) {
        authStore.fetchProfile();
    }
});
</script>

<template>
    <div class="p-4 md:p-6 flex justify-center">
        <Card class="w-full max-w-xl shadow-lg border border-slate-200">
            <template #content>
                <div class="text-center md:text-left">
                    <h2 class="text-2xl md:text-3xl font-black text-slate-800 break-words">
                        {{ user?.firstName }} {{ user?.lastName }}
                    </h2>
                    <div class="flex flex-col md:flex-row items-center gap-2 md:gap-3 mt-2">
                        <span class="text-slate-500 font-medium text-base md:text-lg">@{{ user?.username }}</span>
                        <Tag :value="roleName" :severity="getRoleSeverity(roleName)" class="px-3 py-0.5" />
                    </div>
                </div>

                <Divider class="my-6 md:my-8" />

                <div class="flex flex-col gap-4">
                    <div class="flex flex-col md:flex-row justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 gap-3">
                        <div class="flex flex-col items-center md:items-start">
                            <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Статус акаунта</span>
                            <span class="text-emerald-600 font-bold flex items-center gap-2 text-sm">
                                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Активний
                            </span>
                        </div>
                        <div class="flex flex-col items-center md:items-end">
                            <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Реєстрація</span>
                            <span class="text-slate-700 font-bold text-sm">{{ formatDate(user?.createdAt) }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center md:text-left">
                            <span class="text-slate-400 text-[10px] font-bold uppercase block mb-1">ID Користувача</span>
                            <span class="text-slate-700 font-mono font-bold text-base">#{{ user?.id }}</span>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center md:text-left">
                            <span class="text-slate-400 text-[10px] font-bold uppercase block mb-1">Остання активність</span>
                            <span class="text-slate-700 font-bold text-sm">Сьогодні</span>
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <Divider class="mt-6 mb-2" />
                <div class="text-center text-slate-400 italic text-[10px] uppercase tracking-wider">AIS Plumbing Cloud v1.0</div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-card-body) { padding: 1.5rem; }
@media (min-width: 768px) { :deep(.p-card-body) { padding: 2rem; } }
</style>