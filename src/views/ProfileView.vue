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
        month: 'long',
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
    <div class="p-6 flex justify-center">
        <Card class="w-full max-w-xl shadow-xl border border-slate-200 ml-12">
            <template #content>
                <div class="text-left">
                    <h2 class="text-3xl font-black text-slate-800">
                        {{ user?.firstName }} {{ user?.lastName }}
                    </h2>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="text-slate-500 font-medium text-lg">@{{ user?.username }}</span>
                        <Tag :value="roleName" :severity="getRoleSeverity(roleName)" class="px-3 py-1" />
                    </div>
                </div>

                <Divider class="my-8" />

                <div class="flex flex-col gap-6 px-2">
                    <div class="flex justify-between items-center p-5 bg-slate-50 rounded-xl border border-slate-100 gap-4">
                        <div class="flex flex-col text-left">
                            <span class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Статус акаунта</span>
                            <span class="text-emerald-600 font-bold flex items-center gap-2.5 text-base text-left">
                                <span class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Активний
                            </span>
                        </div>
                        <div class="flex flex-col text-right">
                            <span class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1 text-right">Дата реєстрації</span>
                            <span class="text-slate-700 font-bold text-base text-right">
                                {{ formatDate(user?.createdAt) }}
                            </span>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="p-5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                            <span class="text-slate-400 text-sm font-bold uppercase block tracking-wider mb-1.5 text-left">ID користувача</span>
                            <span class="text-slate-700 font-mono font-bold text-lg text-left">
                                # {{ user?.id }}
                            </span>
                        </div>
                        <div class="p-5 bg-slate-50 rounded-xl border border-slate-100 text-left">
                            <span class="text-slate-400 text-sm font-bold uppercase block tracking-wider mb-1.5 text-left">Активність</span>
                            <span class="text-slate-700 font-bold text-base text-left">
                                Сьогодні
                            </span>
                        </div>
                    </div>
                </div>
            </template>

            <template #footer>
                <Divider class="mt-8 mb-4" />
                <div class="text-center pb-3 text-slate-400 italic text-sm">
                    Дані профілю синхронізовано з сервером
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-card-body) {
    padding: 2rem;
}
</style>